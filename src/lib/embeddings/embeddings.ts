import { openai } from "@/lib/openai";
import { countTokens, isWithinTokenLimit } from "./token-counter";

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_INPUT_TOKENS = 8191;
const MAX_BATCH_SIZE = 2048;

/**
 * Generate embedding for a single text string
 * Returns 1536-dimensional vector from OpenAI text-embedding-3-small
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	// Truncate if exceeds token limit
	let processedText = text;
	if (!isWithinTokenLimit(text, MAX_INPUT_TOKENS)) {
		console.warn(
			`Text exceeds ${MAX_INPUT_TOKENS} tokens (${countTokens(text)} tokens), truncating...`,
		);
		// Approximate truncation - this is conservative
		const ratio = MAX_INPUT_TOKENS / countTokens(text);
		const charLimit = Math.floor(text.length * ratio * 0.9); // 90% safety margin
		processedText = text.slice(0, charLimit);
	}

	try {
		const response = await openai.embeddings.create({
			model: EMBEDDING_MODEL,
			input: processedText,
			encoding_format: "float",
		});

		return response.data[0].embedding;
	} catch (error) {
		throw new Error(
			`Failed to generate embedding for text (${countTokens(processedText)} tokens): ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Generate embeddings for multiple texts in batch
 * Automatically splits into multiple API calls if input exceeds 2048 items
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
	if (texts.length === 0) {
		return [];
	}

	// Check for oversized texts
	for (let i = 0; i < texts.length; i++) {
		if (!isWithinTokenLimit(texts[i], MAX_INPUT_TOKENS)) {
			console.warn(
				`Text at index ${i} exceeds ${MAX_INPUT_TOKENS} tokens (${countTokens(texts[i])} tokens), truncating...`,
			);
			const ratio = MAX_INPUT_TOKENS / countTokens(texts[i]);
			const charLimit = Math.floor(texts[i].length * ratio * 0.9);
			texts[i] = texts[i].slice(0, charLimit);
		}
	}

	// Split into batches if needed
	const batches: string[][] = [];
	for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
		batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
	}

	try {
		const allEmbeddings: number[][] = [];

		for (const batch of batches) {
			const response = await openai.embeddings.create({
				model: EMBEDDING_MODEL,
				input: batch,
				encoding_format: "float",
			});

			// Ensure embeddings are in the same order as input
			const embeddings = response.data
				.sort((a, b) => a.index - b.index)
				.map((item) => item.embedding);

			allEmbeddings.push(...embeddings);
		}

		return allEmbeddings;
	} catch (error) {
		throw new Error(
			`Failed to generate embeddings for ${texts.length} texts: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
