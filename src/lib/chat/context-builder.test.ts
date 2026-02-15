import { describe, expect, it, vi } from "vitest";
import type { SimilarChunk } from "@/lib/rag/similarity-search";
import {
	calculateAvailableBudget,
	formatRagContext,
	MAX_INPUT_TOKENS,
	selectHistoryMessages,
} from "./context-builder";

function makeChunk(overrides: Partial<SimilarChunk> = {}): SimilarChunk {
	return {
		id: "chunk-1",
		documentId: "doc-1",
		documentTitle: "FAQ",
		sectionHeading: "Pricing",
		content: "FlowBoard costs $12/mo",
		chunkPosition: 1,
		totalChunks: 5,
		similarity: 0.9,
		...overrides,
	};
}

describe("formatRagContext", () => {
	it("returns fallback message for empty chunks array", () => {
		expect(formatRagContext([])).toBe(
			"No relevant knowledge base content found.",
		);
	});

	it("formats single chunk with header", () => {
		const result = formatRagContext([makeChunk()]);
		expect(result).toContain("[FAQ - Pricing]");
		expect(result).toContain("FlowBoard costs $12/mo");
	});

	it("joins multiple chunks with separator", () => {
		const chunks = [
			makeChunk({ content: "Chunk 1" }),
			makeChunk({
				sectionHeading: "Features",
				content: "Chunk 2",
			}),
		];
		const result = formatRagContext(chunks);
		expect(result).toContain("---");
		expect(result).toContain("Chunk 1");
		expect(result).toContain("Chunk 2");
	});
});

describe("calculateAvailableBudget", () => {
	it("subtracts system + rag tokens from MAX_INPUT_TOKENS", () => {
		expect(calculateAvailableBudget(1000, 2000)).toBe(
			MAX_INPUT_TOKENS - 1000 - 2000,
		);
	});

	it("returns negative when over budget", () => {
		expect(calculateAvailableBudget(100_000, 30_000)).toBeLessThan(0);
	});

	it("returns MAX_INPUT_TOKENS when both inputs are 0", () => {
		expect(calculateAvailableBudget(0, 0)).toBe(MAX_INPUT_TOKENS);
	});
});

describe("selectHistoryMessages", () => {
	it("returns empty array for empty input", () => {
		expect(selectHistoryMessages([], 1000)).toEqual([]);
	});

	it("returns all messages when within budget", () => {
		const messages = [
			{ role: "user" as const, content: "Hello" },
			{ role: "assistant" as const, content: "Hi there!" },
		];
		const result = selectHistoryMessages(messages, 100_000);
		expect(result).toHaveLength(2);
	});

	it("takes only last 10 messages from long history", () => {
		const messages = Array.from({ length: 20 }, (_, i) => ({
			role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
			content: `Message ${i}`,
		}));
		const result = selectHistoryMessages(messages, 100_000);
		expect(result).toHaveLength(10);
		expect(result[0].content).toBe("Message 10");
	});

	it("drops oldest messages when over budget", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const messages = [
			{ role: "user" as const, content: "A ".repeat(200) },
			{ role: "assistant" as const, content: "B ".repeat(200) },
			{ role: "user" as const, content: "Short" },
			{ role: "assistant" as const, content: "Also short" },
		];
		const result = selectHistoryMessages(messages, 20);
		// Budget is tiny (20 tokens) so all but the minimum 2 messages get dropped
		expect(result).toHaveLength(2);
		expect(result[0].content).toBe("Short");
		expect(result[1].content).toBe("Also short");
		expect(warnSpy).toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it("keeps minimum 2 messages even if over budget", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const messages = [
			{ role: "user" as const, content: "A ".repeat(500) },
			{ role: "assistant" as const, content: "B ".repeat(500) },
		];
		const result = selectHistoryMessages(messages, 1);
		expect(result).toHaveLength(2);

		warnSpy.mockRestore();
	});
});
