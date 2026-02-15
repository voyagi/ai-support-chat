import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { chunkMarkdown } from "./chunker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadFixture(name: string): string {
	return readFileSync(
		resolve(__dirname, "../../../test/fixtures", name),
		"utf-8",
	);
}

/** Generate content that exceeds a token target */
function padContent(text: string, wordCount: number): string {
	return `${text}\n\n${"Lorem ipsum dolor sit amet. ".repeat(wordCount)}`;
}

describe("chunkMarkdown", () => {
	describe("empty and minimal input", () => {
		it("returns empty array for empty content", () => {
			expect(chunkMarkdown({ title: "Test", content: "" })).toEqual([]);
		});

		it("returns empty array for whitespace-only content", () => {
			expect(chunkMarkdown({ title: "Test", content: "   \n\n  " })).toEqual(
				[],
			);
		});

		it("returns single chunk for small document", () => {
			const content = padContent("## Intro\nThis is about testing.", 20);
			const chunks = chunkMarkdown({ title: "Test", content });
			expect(chunks).toHaveLength(1);
			expect(chunks[0].documentTitle).toBe("Test");
			expect(chunks[0].sectionHeading).toBe("Intro");
			expect(chunks[0].position).toBe(1);
			expect(chunks[0].totalChunks).toBe(1);
		});
	});

	describe("section splitting", () => {
		it("splits on ## headings", () => {
			const content = [
				`## Section A\n${padContent("Content A", 20)}`,
				`## Section B\n${padContent("Content B", 20)}`,
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			expect(chunks.length).toBeGreaterThanOrEqual(2);
			const headings = chunks.map((c) => c.sectionHeading);
			expect(headings).toContain("Section A");
			expect(headings).toContain("Section B");
		});

		it("does not split on ## inside code blocks", () => {
			const content = padContent(
				[
					"## Real Section",
					"Some text before code.",
					"```",
					"## Fake Heading Inside Code",
					"console.log('hello');",
					"```",
					"More text after code.",
				].join("\n"),
				20,
			);
			const chunks = chunkMarkdown({ title: "Test", content });
			const headings = chunks.map((c) => c.sectionHeading);
			expect(headings).not.toContain("Fake Heading Inside Code");
		});

		it("assigns 'General' heading to content before first ##", () => {
			const content = [
				padContent("Preamble text here", 20),
				`## First Section\n${padContent("Content", 20)}`,
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			expect(chunks[0].sectionHeading).toBe("General");
		});
	});

	describe("FAQ detection and splitting", () => {
		it("detects FAQ sections with 2+ ### sub-headings", () => {
			const content = [
				"## FAQ",
				padContent("### Question 1\nAnswer 1", 20),
				padContent("### Question 2\nAnswer 2", 20),
				padContent("### Question 3\nAnswer 3", 20),
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			expect(chunks.length).toBeGreaterThanOrEqual(3);
		});

		it("preserves parent section heading on each FAQ chunk", () => {
			const content = [
				"## FAQ",
				padContent("### Q1\nAnswer 1", 20),
				padContent("### Q2\nAnswer 2", 20),
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			for (const chunk of chunks) {
				expect(chunk.sectionHeading).toBe("FAQ");
			}
		});
	});

	describe("oversized section subdivision", () => {
		it("subdivides sections exceeding targetTokens", () => {
			// Needs paragraph breaks (\n\n) for the subdivider to split on
			const paragraphs = Array.from(
				{ length: 12 },
				(_, i) =>
					`Paragraph ${i}. ${"The quick brown fox jumps over the lazy dog. ".repeat(10)}`,
			);
			const content = `## Big\n${paragraphs.join("\n\n")}`;
			const chunks = chunkMarkdown({ title: "Test", content });
			expect(chunks.length).toBeGreaterThan(1);
		});

		it("respects custom targetTokens option", () => {
			const paragraphs = Array.from(
				{ length: 8 },
				(_, i) =>
					`Paragraph ${i}. ${"The quick brown fox jumps over the lazy dog. ".repeat(8)}`,
			);
			const content = `## Big\n${paragraphs.join("\n\n")}`;
			const chunks = chunkMarkdown(
				{ title: "Test", content },
				{ targetTokens: 100 },
			);
			expect(chunks.length).toBeGreaterThan(1);
		});
	});

	describe("chunk metadata", () => {
		it("sets position as 1-indexed sequential", () => {
			const content = [
				`## A\n${padContent("Content A", 20)}`,
				`## B\n${padContent("Content B", 20)}`,
				`## C\n${padContent("Content C", 20)}`,
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			for (let i = 0; i < chunks.length; i++) {
				expect(chunks[i].position).toBe(i + 1);
			}
		});

		it("sets totalChunks to same value on every chunk", () => {
			const content = [
				`## A\n${padContent("Content A", 20)}`,
				`## B\n${padContent("Content B", 20)}`,
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			const totalChunks = chunks[0].totalChunks;
			expect(totalChunks).toBe(chunks.length);
			for (const chunk of chunks) {
				expect(chunk.totalChunks).toBe(totalChunks);
			}
		});

		it("includes positive tokenCount on every chunk", () => {
			const content = [
				`## A\n${padContent("Content A", 20)}`,
				`## B\n${padContent("Content B", 20)}`,
			].join("\n\n");
			const chunks = chunkMarkdown({ title: "Test", content });
			for (const chunk of chunks) {
				expect(chunk.tokenCount).toBeGreaterThan(0);
			}
		});
	});

	describe("minChunkTokens filtering", () => {
		it("drops chunks below minChunkTokens threshold", () => {
			const content = [
				"## Tiny\nHi",
				`## Normal\n${padContent("Real content here", 30)}`,
			].join("\n\n");
			const chunks = chunkMarkdown(
				{ title: "Test", content },
				{ minChunkTokens: 50 },
			);
			const headings = chunks.map((c) => c.sectionHeading);
			expect(headings).not.toContain("Tiny");
			expect(headings).toContain("Normal");
		});
	});

	describe("integration: real fixture files", () => {
		it("chunks flowboard-faq.md into individual Q&A entries", () => {
			const content = loadFixture("flowboard-faq.md");
			const chunks = chunkMarkdown({ title: "FAQ", content });
			expect(chunks.length).toBeGreaterThan(3);
			// Every chunk should have non-empty content
			for (const chunk of chunks) {
				expect(chunk.content.trim().length).toBeGreaterThan(0);
			}
		});

		it("chunks flowboard-pricing.md into reasonable pieces", () => {
			const content = loadFixture("flowboard-pricing.md");
			const chunks = chunkMarkdown({ title: "Pricing", content });
			expect(chunks.length).toBeGreaterThan(0);
			expect(chunks.length).toBeLessThan(30);
			for (const chunk of chunks) {
				expect(chunk.content.trim().length).toBeGreaterThan(0);
				expect(chunk.tokenCount).toBeGreaterThan(0);
			}
		});

		it("chunks flowboard-features.md without error", () => {
			const content = loadFixture("flowboard-features.md");
			const chunks = chunkMarkdown({ title: "Features", content });
			expect(chunks.length).toBeGreaterThan(0);
		});
	});
});
