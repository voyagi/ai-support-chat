import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./prompt";

describe("buildSystemPrompt", () => {
	it("includes the RAG context in the output", () => {
		const ragContext = "FlowBoard costs $12/month for Pro tier.";
		const prompt = buildSystemPrompt(ragContext);
		expect(prompt).toContain(ragContext);
	});

	it("includes the assistant identity (Flo)", () => {
		const prompt = buildSystemPrompt("any context");
		expect(prompt).toContain("Flo");
		expect(prompt).toContain("FlowBoard");
	});

	it("includes the grounding instruction", () => {
		const prompt = buildSystemPrompt("any context");
		expect(prompt).toContain("ONLY use information from the Context");
	});

	it("includes the fallback support email", () => {
		const prompt = buildSystemPrompt("any context");
		expect(prompt).toContain("support@flowboard.io");
	});

	it("handles empty RAG context", () => {
		const prompt = buildSystemPrompt("");
		expect(prompt).toContain("## Context (Knowledge Base)");
		expect(prompt).toContain("Flo");
	});
});
