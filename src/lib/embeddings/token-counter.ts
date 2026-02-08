import { encode } from "gpt-tokenizer";

/**
 * Count tokens in text using OpenAI's tokenizer (o200k_base encoding, used by GPT-4o)
 */
export function countTokens(text: string): number {
	return encode(text).length;
}

/**
 * Check if text is within a token limit
 */
export function isWithinTokenLimit(text: string, limit: number): boolean {
	return countTokens(text) <= limit;
}
