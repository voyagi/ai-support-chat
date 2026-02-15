import { describe, expect, it } from "vitest";
import { countTokens, isWithinTokenLimit } from "./token-counter";

describe("countTokens", () => {
	it("returns 0 for empty string", () => {
		expect(countTokens("")).toBe(0);
	});

	it("counts tokens for simple text", () => {
		const result = countTokens("Hello, world!");
		expect(result).toBeGreaterThan(0);
		expect(result).toBeLessThan(10);
	});

	it("counts tokens for longer text", () => {
		const result = countTokens("The quick brown fox jumps over the lazy dog.");
		expect(result).toBeGreaterThan(5);
		expect(result).toBeLessThan(20);
	});

	it("handles unicode text", () => {
		expect(countTokens("Hello 🌍")).toBeGreaterThan(0);
	});

	it("handles multi-line text", () => {
		expect(countTokens("Line one\nLine two\nLine three")).toBeGreaterThan(0);
	});
});

describe("isWithinTokenLimit", () => {
	it("returns true when text is within limit", () => {
		expect(isWithinTokenLimit("Hello", 100)).toBe(true);
	});

	it("returns false when text exceeds limit", () => {
		const longText = "word ".repeat(200);
		expect(isWithinTokenLimit(longText, 10)).toBe(false);
	});

	it("returns true when exactly at limit", () => {
		const text = "Hello";
		const tokens = countTokens(text);
		expect(isWithinTokenLimit(text, tokens)).toBe(true);
	});

	it("returns false when limit is 0", () => {
		expect(isWithinTokenLimit("Hello", 0)).toBe(false);
	});
});
