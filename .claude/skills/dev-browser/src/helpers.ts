/**
 * Dev-browser helpers for common pain points:
 * - cdpScreenshot: reliable screenshots that bypass Playwright's font-loading deadlock
 * - listIframes / getIframeContent / evaluateInIframe / screenshotIframe:
 *   access cross-origin iframe content via raw CDP through the relay
 */

import type { Page } from "playwright";
import { writeFileSync } from "fs";

// ============================================================================
// CDP Screenshot — bypasses Playwright's font-loading deadlock in extension mode
// ============================================================================

/**
 * Take a screenshot using CDP directly. Use this instead of page.screenshot()
 * which hangs in extension mode due to a Chromium font-loading bug.
 *
 * Automatically retries once if the page object is stale (e.g. after a
 * redirect destroyed the original CDP target). On stale-page errors, grabs
 * the last page from the browser context and retries.
 */
export async function cdpScreenshot(
  page: Page,
  path?: string,
  options?: { fullPage?: boolean }
): Promise<Buffer> {
  async function attemptScreenshot(targetPage: Page): Promise<Buffer> {
    const cdpSession = await targetPage.context().newCDPSession(targetPage);
    try {
      if (options?.fullPage) {
        const metrics = (await cdpSession.send("Page.getLayoutMetrics")) as {
          cssContentSize?: { width: number; height: number };
          contentSize?: { width: number; height: number };
        };
        const size = metrics.cssContentSize || metrics.contentSize;
        if (size) {
          await cdpSession.send("Emulation.setDeviceMetricsOverride", {
            width: Math.ceil(size.width),
            height: Math.ceil(size.height),
            deviceScaleFactor: 1,
            mobile: false,
          });
        }
      }

      const result = (await cdpSession.send("Page.captureScreenshot", {
        format: "png",
        ...(options?.fullPage ? { captureBeyondViewport: true } : {}),
      })) as { data: string };

      if (options?.fullPage) {
        await cdpSession.send("Emulation.clearDeviceMetricsOverride").catch(() => {});
      }

      const buffer = Buffer.from(result.data, "base64");
      if (path) writeFileSync(path, buffer);
      return buffer;
    } finally {
      await cdpSession.detach().catch(() => {});
    }
  }

  try {
    return await attemptScreenshot(page);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isStalePage =
      message.includes("no object with guid") ||
      message.includes("Target closed") ||
      message.includes("Session closed") ||
      message.includes("Target page, context or browser has been closed");

    if (!isStalePage) {
      throw error;
    }

    // Page is stale — try to grab the most recent page from the context
    console.log(`[cdpScreenshot] Page stale, retrying with latest page...`);
    const allPages = page.context().pages();
    const freshPage = allPages[allPages.length - 1];
    if (!freshPage || freshPage === page) {
      throw error;
    }

    return await attemptScreenshot(freshPage);
  }
}

// ============================================================================
// Cross-origin Iframe Access — raw CDP through the relay server
// ============================================================================

export interface IframeTarget {
  targetId: string;
  url: string;
  title: string;
}

export interface IframeContent {
  url: string;
  title: string;
  text: string;
  html: string;
}

/**
 * Minimal CDP client over WebSocket for sending commands with custom sessionIds.
 * Playwright's CDPSession can't do this — it's locked to one target's session.
 */
class RawCDP {
  private ws: WebSocket;
  private msgId = 0;
  private pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener("message", (event) => {
      let msg: { id?: number; result?: unknown; error?: { message: string } };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result);
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(method: string, params?: Record<string, unknown>, sessionId?: string): Promise<any> {
    const id = ++this.msgId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg: any = { id, method, params: params || {} };
    if (sessionId) msg.sessionId = sessionId;
    this.ws.send(JSON.stringify(msg));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout (30s): ${method}`));
      }, 30000);

      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });
    });
  }

  close() {
    this.ws.close();
  }
}

async function connectRawCDP(serverUrl: string): Promise<RawCDP> {
  const wsUrl = serverUrl.replace("http://", "ws://").replace("https://", "wss://") + "/cdp";
  const ws = new WebSocket(wsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", () => reject(new Error(`WebSocket connection failed: ${wsUrl}`)));
  });
  return new RawCDP(ws);
}

/**
 * List all cross-origin iframe targets visible to the relay server.
 */
export async function listIframes(serverUrl = "http://localhost:9222"): Promise<IframeTarget[]> {
  const cdp = await connectRawCDP(serverUrl);
  try {
    const result = await cdp.send("Target.getTargets");
    return (result.targetInfos as Array<{ type: string; targetId: string; url: string; title: string }>)
      .filter((t) => t.type === "iframe")
      .map((t) => ({ targetId: t.targetId, url: t.url, title: t.title }));
  } finally {
    cdp.close();
  }
}

/**
 * Get text and HTML content from a cross-origin iframe.
 * Matches the first iframe whose URL contains `urlPattern`.
 */
export async function getIframeContent(
  urlPattern: string,
  serverUrl = "http://localhost:9222"
): Promise<IframeContent> {
  const cdp = await connectRawCDP(serverUrl);
  try {
    const targets = await cdp.send("Target.getTargets");
    const iframe = (targets.targetInfos as Array<{ type: string; targetId: string; url: string; title: string }>)
      .find((t) => t.type === "iframe" && t.url.includes(urlPattern));

    if (!iframe) {
      const available = (targets.targetInfos as Array<{ type: string; url: string }>)
        .filter((t) => t.type === "iframe")
        .map((t) => t.url);
      throw new Error(
        `No iframe matching "${urlPattern}". Available iframes:\n${available.map((u) => `  - ${u}`).join("\n") || "  (none)"}`
      );
    }

    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId: iframe.targetId,
      flatten: true,
    });

    await cdp.send("Runtime.enable", {}, sessionId);

    const [titleRes, textRes, htmlRes] = await Promise.all([
      cdp.send("Runtime.evaluate", { expression: "document.title", returnByValue: true }, sessionId),
      cdp.send("Runtime.evaluate", { expression: "document.body?.innerText || ''", returnByValue: true }, sessionId),
      cdp.send("Runtime.evaluate", { expression: "document.body?.innerHTML || ''", returnByValue: true }, sessionId),
    ]);

    return {
      url: iframe.url,
      title: titleRes.result?.value ?? "",
      text: textRes.result?.value ?? "",
      html: htmlRes.result?.value ?? "",
    };
  } finally {
    cdp.close();
  }
}

/**
 * Evaluate JavaScript in a cross-origin iframe and return the result.
 * The expression runs in the iframe's context with full DOM access.
 */
export async function evaluateInIframe(
  urlPattern: string,
  expression: string,
  serverUrl = "http://localhost:9222"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const cdp = await connectRawCDP(serverUrl);
  try {
    const targets = await cdp.send("Target.getTargets");
    const iframe = (targets.targetInfos as Array<{ type: string; targetId: string; url: string }>)
      .find((t) => t.type === "iframe" && t.url.includes(urlPattern));

    if (!iframe) {
      throw new Error(`No iframe matching "${urlPattern}"`);
    }

    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId: iframe.targetId,
      flatten: true,
    });

    await cdp.send("Runtime.enable", {}, sessionId);

    const result = await cdp.send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );

    if (result.exceptionDetails) {
      throw new Error(`Iframe eval error: ${result.exceptionDetails.text}`);
    }

    return result.result?.value;
  } finally {
    cdp.close();
  }
}

/**
 * Take a screenshot of a cross-origin iframe's content.
 */
export async function screenshotIframe(
  urlPattern: string,
  path: string,
  serverUrl = "http://localhost:9222"
): Promise<Buffer> {
  const cdp = await connectRawCDP(serverUrl);
  try {
    const targets = await cdp.send("Target.getTargets");
    const iframe = (targets.targetInfos as Array<{ type: string; targetId: string; url: string }>)
      .find((t) => t.type === "iframe" && t.url.includes(urlPattern));

    if (!iframe) {
      throw new Error(`No iframe matching "${urlPattern}"`);
    }

    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId: iframe.targetId,
      flatten: true,
    });

    const result = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    const buffer = Buffer.from(result.data, "base64");
    writeFileSync(path, buffer);
    return buffer;
  } finally {
    cdp.close();
  }
}
