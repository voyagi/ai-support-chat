import OpenAI from "openai";

let _openaiClient: OpenAI | null = null;

/**
 * Get OpenAI client instance (lazy-loaded)
 */
export function getOpenAIClient(): OpenAI {
	if (!_openaiClient) {
		_openaiClient = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}
	return _openaiClient;
}

// Export as named constant for backward compatibility
export const openai = new Proxy({} as OpenAI, {
	get(_target, prop) {
		return getOpenAIClient()[prop as keyof OpenAI];
	},
});
