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
 * Take a screenshot using raw CDP WebSocket. Use this instead of page.screenshot()
 * which hangs in extension mode due to a Chromium bug (#377715191).
 *
 * This bypasses Playwright entirely — Playwright's focus emulation triggers a
 * deadlock in Chrome when multiple tabs/connections exist. The raw CDP approach
 * disables focus emulation before capturing.
 *
 * First argument can be a Playwright Page (extracts URL for target matching)
 * or a string URL to match against.
 *
 * Options:
 * - fullPage: capture the entire scrollable page (default: viewport only)
 * - format: "png" (default) or "jpeg"
 * - quality: 0-100, only for jpeg (default: 80)
 * - serverUrl: relay server URL (default: http://localhost:9222)
 */
export async function cdpScreenshot(
  pageOrUrl: Page | string,
  path?: string,
  options?: { fullPage?: boolean; format?: "png" | "jpeg"; quality?: number; serverUrl?: string }
): Promise<Buffer> {
  const format = options?.format ?? "png";
  const serverUrl = options?.serverUrl ?? "http://localhost:9222";
  const matchUrl = typeof pageOrUrl === "string" ? pageOrUrl : pageOrUrl.url();

  // Use a SEPARATE raw WebSocket that doesn't go through Playwright.
  // Playwright's connectOverCDP enables setFocusEmulationEnabled which causes the deadlock.
  const wsUrl = serverUrl.replace("http://", "ws://") + "/cdp/screenshot-" + Date.now();
  const ws = new WebSocket(wsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", () => reject(new Error("WebSocket connection failed")));
  });

  let msgId = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<any> {
    const id = ++msgId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg: any = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    ws.send(JSON.stringify(msg));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Screenshot CDP timeout: ${method}`)), 60000);
      const handler = (event: MessageEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        try { data = JSON.parse(String(event.data)); } catch { return; }
        if (data.id === id) {
          ws.removeEventListener("message", handler);
          clearTimeout(timeout);
          if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
      ws.addEventListener("message", handler);
    });
  }

  try {
    // Find target matching the page URL
    const { targetInfos } = await send("Target.getTargets");
    type TI = { type: string; targetId: string; url: string };
    let target = (targetInfos as TI[]).find((t) => t.type === "page" && t.url === matchUrl);
    if (!target) {
      target = (targetInfos as TI[]).find((t) => t.type === "page");
    }
    if (!target) {
      throw new Error("No page target found for screenshot");
    }

    const { sessionId } = await send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: true,
    });

    // KEY FIX: disable focus emulation to prevent Chromium deadlock (#377715191)
    await send("Emulation.setFocusEmulationEnabled", { enabled: false }, sessionId).catch(() => {});

    if (options?.fullPage) {
      const metrics = await send("Page.getLayoutMetrics", {}, sessionId);
      const size = metrics.cssContentSize || metrics.contentSize;
      if (size) {
        await send("Emulation.setDeviceMetricsOverride", {
          width: Math.ceil(size.width),
          height: Math.ceil(size.height),
          deviceScaleFactor: 1,
          mobile: false,
        }, sessionId);
      }
    }

    const result = await send("Page.captureScreenshot", {
      format,
      ...(format === "jpeg" ? { quality: options?.quality ?? 80 } : {}),
      ...(options?.fullPage ? { captureBeyondViewport: true } : {}),
    }, sessionId);

    if (options?.fullPage) {
      await send("Emulation.clearDeviceMetricsOverride", {}, sessionId).catch(() => {});
    }

    const buffer = Buffer.from(result.data, "base64");
    if (path) writeFileSync(path, buffer);
    return buffer;
  } finally {
    ws.close();
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
    const matches = (targets.targetInfos as Array<{ type: string; targetId: string; url: string; title: string }>)
      .filter((t) => t.type === "iframe" && t.url.includes(urlPattern));

    if (matches.length === 0) {
      const available = (targets.targetInfos as Array<{ type: string; url: string }>)
        .filter((t) => t.type === "iframe")
        .map((t) => t.url);
      throw new Error(
        `No iframe matching "${urlPattern}". Available iframes:\n${available.map((u) => `  - ${u}`).join("\n") || "  (none)"}`
      );
    }

    // Use the last match — when pages reload, stale iframes linger and
    // the freshest (working) one is appended last by the extension.
    const iframe = matches[matches.length - 1];

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
    const matches = (targets.targetInfos as Array<{ type: string; targetId: string; url: string }>)
      .filter((t) => t.type === "iframe" && t.url.includes(urlPattern));

    if (matches.length === 0) {
      throw new Error(`No iframe matching "${urlPattern}"`);
    }

    // Use the last match — freshest iframe when stale ones linger after reload
    const iframe = matches[matches.length - 1];

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
 * Note: Page.captureScreenshot only works on top-level targets.
 * To screenshot an iframe's content, use cdpScreenshot(page) on the parent page.
 * The iframe is rendered within the page, so it will be visible in the screenshot.
 */
