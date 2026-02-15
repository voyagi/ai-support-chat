interface MessageLike {
	content?: string;
	parts?: Array<{ type: string; text?: string }>;
}

/**
 * Extract text content from a message.
 * Handles both plain `content` strings and AI SDK v6 `parts` format.
 */
export function extractMessageText(message: MessageLike): string {
	if (message.content) {
		return message.content;
	}
	if (message.parts) {
		return message.parts
			.filter((part) => part.type === "text" && part.text)
			.map((part) => part.text as string)
			.join("");
	}
	return "";
}
