import { countTokens } from "@/lib/embeddings/token-counter";
import type { SimilarChunk } from "@/lib/rag/similarity-search";

/**
 * Maximum input tokens (reserve 8K from 128K context window for output + safety)
 */
export const MAX_INPUT_TOKENS = 120_000;

/**
 * Format RAG chunks into a readable context string
 * @param chunks - Similar chunks from pgvector search
 * @returns Formatted context string with document titles and section headings
 */
export function formatRagContext(chunks: SimilarChunk[]): string {
	if (chunks.length === 0) {
		return "No relevant knowledge base content found.";
	}

	return chunks
		.map((chunk) => {
			const header = `[${chunk.documentTitle} - ${chunk.sectionHeading}]`;
			return `${header}\n${chunk.content}`;
		})
		.join("\n\n---\n\n");
}

/**
 * Calculate available token budget for conversation history
 * @param systemPromptTokens - Token count of system prompt
 * @param ragContextTokens - Token count of RAG context
 * @returns Remaining tokens available for conversation history
 */
export function calculateAvailableBudget(
	systemPromptTokens: number,
	ragContextTokens: number,
): number {
	return MAX_INPUT_TOKENS - systemPromptTokens - ragContextTokens;
}

/**
 * Select conversation history messages within token budget
 * Takes last 10 messages (5 user + 5 assistant pairs) and truncates if over budget
 * @param messages - Full conversation history
 * @param budgetTokens - Maximum tokens allowed for history
 * @returns Selected messages within budget (minimum 2 messages)
 */
export function selectHistoryMessages(
	messages: Array<{ role: string; content: string }>,
	budgetTokens: number,
): Array<{ role: string; content: string }> {
	// Take last 10 messages per locked decision
	const recentMessages = messages.slice(-10);

	if (recentMessages.length === 0) {
		return [];
	}

	// Calculate total token count
	const totalTokens = recentMessages.reduce((sum, msg) => {
		return sum + countTokens(msg.content);
	}, 0);

	// If within budget, return all recent messages
	if (totalTokens <= budgetTokens) {
		return recentMessages;
	}

	// Over budget - drop oldest messages until within budget (keep minimum 2)
	console.warn(
		`Conversation history (${totalTokens} tokens) exceeds budget (${budgetTokens} tokens). Truncating older messages.`,
	);

	const selectedMessages = [...recentMessages];
	let currentTokens = totalTokens;

	while (selectedMessages.length > 2 && currentTokens > budgetTokens) {
		// Remove oldest message
		const removed = selectedMessages.shift();
		if (removed) {
			currentTokens -= countTokens(removed.content);
		}
	}

	console.warn(
		`Kept ${selectedMessages.length} of ${recentMessages.length} recent messages (${currentTokens} tokens)`,
	);

	return selectedMessages;
}
