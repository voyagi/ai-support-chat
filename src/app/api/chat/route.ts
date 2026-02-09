import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
	calculateAvailableBudget,
	formatRagContext,
	selectHistoryMessages,
} from "@/lib/chat/context-builder";
import {
	createConversation,
	getMessageCount,
	MAX_MESSAGES_PER_CONVERSATION,
	saveMessages,
} from "@/lib/chat/conversation";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import { countTokens } from "@/lib/embeddings/token-counter";
import { searchSimilarChunks } from "@/lib/rag/similarity-search";

interface MessagePart {
	type: string;
	text?: string;
}

interface ChatMessage {
	role: "user" | "assistant";
	content?: string;
	parts?: MessagePart[];
}

interface RequestBody {
	messages: ChatMessage[];
	conversationId: string | null;
}

/** Extract text content from a message (handles both plain content and AI SDK v6 parts format) */
function extractMessageText(message: ChatMessage): string {
	if (message.content) {
		return message.content;
	}
	if (message.parts) {
		return message.parts
			.filter((part) => part.type === "text" && part.text)
			.map((part) => part.text)
			.join("");
	}
	return "";
}

export async function POST(req: Request) {
	try {
		// 1. Parse request body
		const body = (await req.json()) as RequestBody;
		const { messages, conversationId: incomingConversationId } = body;

		// 2. Validate input
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return Response.json(
				{ error: "Messages array is required and must not be empty" },
				{ status: 400 },
			);
		}

		const lastMessage = messages[messages.length - 1];
		if (!lastMessage || lastMessage.role !== "user") {
			return Response.json(
				{ error: "Last message must have role 'user'" },
				{ status: 400 },
			);
		}

		const userMessage = extractMessageText(lastMessage);
		if (!userMessage) {
			return Response.json(
				{ error: "Last message must contain text content" },
				{ status: 400 },
			);
		}

		// 3. Check message cap
		if (incomingConversationId) {
			const messageCount = await getMessageCount(incomingConversationId);
			if (messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
				return Response.json(
					{
						error:
							"Conversation limit reached. Please start a new conversation.",
					},
					{ status: 400 },
				);
			}
		}

		// 4. Create conversation if needed (BEFORE streaming to prevent race condition)
		const conversationId =
			incomingConversationId || (await createConversation());

		// 5. RAG retrieval
		const chunks = await searchSimilarChunks(userMessage, {
			threshold: 0.7,
			count: 5,
		});

		// Select top 1-2 chunks for citation sources
		const citationSources = chunks.slice(0, 2).map((chunk) => ({
			title: chunk.documentTitle,
			heading: chunk.sectionHeading,
			snippet: chunk.content.substring(0, 200),
			similarity: chunk.similarity,
		}));

		// Format all chunks for RAG context
		const ragContext = formatRagContext(chunks);

		// 6. Build context
		const systemPrompt = buildSystemPrompt(ragContext);
		const systemTokens = countTokens(systemPrompt);
		const ragTokens = countTokens(ragContext);
		const availableBudget = calculateAvailableBudget(systemTokens, ragTokens);

		// Normalize messages to {role, content} before downstream processing
		const normalizedMessages = messages.map((msg) => ({
			role: msg.role,
			content: extractMessageText(msg),
		}));
		const selectedHistory = selectHistoryMessages(
			normalizedMessages,
			availableBudget,
		);
		const coreMessages = selectedHistory.map((msg) => ({
			role: msg.role as "user" | "assistant",
			content: msg.content,
		}));

		// 7. Stream response
		const openaiProvider = createOpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const result = streamText({
			model: openaiProvider("gpt-4.1-mini"),
			system: systemPrompt,
			messages: coreMessages,
			abortSignal: req.signal,
			maxOutputTokens: 1024,
			temperature: 0.7,
			// 8. Fire-and-forget persistence
			onFinish: async ({ text }) => {
				saveMessages(conversationId, userMessage, text).catch((err) => {
					console.error("Failed to persist conversation:", err);
				});
			},
		});

		// 9. Return streaming response with citation metadata
		// Use toUIMessageStreamResponse for proper AI SDK v6 streaming
		const headers: Record<string, string> = {
			"X-Conversation-Id": conversationId,
		};

		if (citationSources.length > 0) {
			headers["X-Sources"] = JSON.stringify(citationSources);
		}

		return result.toUIMessageStreamResponse({ headers });
	} catch (error) {
		// Pre-stream error handling
		console.error("Chat API error:", error);
		return Response.json(
			{ error: "Failed to generate response. Please try again." },
			{ status: 500 },
		);
	}
}
