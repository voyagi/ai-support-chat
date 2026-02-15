import OpenAI from "openai";

let _openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
	if (!_openaiClient) {
		_openaiClient = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}
	return _openaiClient;
}

/** Lazy-initialized OpenAI client singleton. */
export const openai = new Proxy({} as OpenAI, {
	get(_target, prop) {
		return getClient()[prop as keyof OpenAI];
	},
});
