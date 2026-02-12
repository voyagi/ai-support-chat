import { createOpenAI } from "@ai-sdk/openai";
import {
	createUIMessageStream,
	createUIMessageStreamResponse,
	streamText,
} from "ai";
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
import { checkBudgetRemaining, trackChatCost } from "@/lib/cost-tracking";
import { countTokens } from "@/lib/embeddings/token-counter";
import { searchSimilarChunks } from "@/lib/rag/similarity-search";
import { getIpFromRequest, getTenantIdFromIp } from "@/lib/sandbox/tenant-id";

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
		// 1. Check budget before processing any requests
		const budgetCheck = await checkBudgetRemaining();
		if (!budgetCheck.allowed) {
			return Response.json(
				{
					error:
						"Demo temporarily unavailable due to high usage. Please try again tomorrow.",
					budgetExceeded: true,
				},
				{ status: 503 },
			);
		}

		// 2. Parse request body
		const body = (await req.json()) as RequestBody;
		const { messages, conversationId: incomingConversationId } = body;

		// 3. Validate input
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

		// 4. Check message cap
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

		// 5. Create conversation if needed (BEFORE streaming to prevent race condition)
		const conversationId =
			incomingConversationId || (await createConversation());

		// 6. Get tenant ID if sandbox mode is enabled
		let tenantId: string | undefined;
		if (process.env.NEXT_PUBLIC_SANDBOX_ENABLED === "true") {
			const ip = getIpFromRequest(req);
			tenantId = getTenantIdFromIp(ip);
		}

		// 6. RAG retrieval
		const chunks = await searchSimilarChunks(userMessage, {
			threshold: 0.7,
			count: 5,
			tenantId,
		});

		// Check if we have a confident answer from the knowledge base
		// pgvector scores exceed 1.0 because embeddings aren't L2-normalized.
		// Observed: unrelated queries ~1.10, in-KB queries ~1.80+
		const hasConfidentAnswer = chunks.length > 0 && chunks[0].similarity > 1.15;

		// Low-confidence branch: return contact-form data part instead of calling LLM
		if (!hasConfidentAnswer) {
			const noAnswerText =
				"I don't have information about that in my knowledge base. Let me connect you with our team who can help!";

			// Create UI message stream with text-only response
			const textPartId = "no-answer";
			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					writer.write({ type: "start" });
					writer.write({ type: "start-step" });
					writer.write({ type: "text-start", id: textPartId });
					writer.write({
						type: "text-delta",
						delta: noAnswerText,
						id: textPartId,
					});
					writer.write({ type: "text-end", id: textPartId });
					writer.write({ type: "finish-step" });
					writer.write({ type: "finish", finishReason: "stop" });
				},
			});

			// Persist messages with answeredFromKb: false
			saveMessages(conversationId, userMessage, noAnswerText, false).catch(
				(err) => {
					console.error("Failed to persist conversation:", err);
				},
			);

			// Return proper SSE response with contact form data in header
			return createUIMessageStreamResponse({
				stream,
				status: 200,
				headers: {
					"X-Conversation-Id": conversationId,
					"X-Contact-Form": JSON.stringify({
						conversationId,
						originalQuestion: userMessage,
					}),
				},
			});
		}

		// High-confidence branch: proceed with LLM streaming
		// Select top 1-2 chunks for citation sources
		const citationSources = chunks.slice(0, 2).map((chunk) => ({
			title: chunk.documentTitle,
			heading: chunk.sectionHeading,
			snippet: chunk.content.substring(0, 200),
			similarity: chunk.similarity,
		}));

		// Format all chunks for RAG context
		const ragContext = formatRagContext(chunks);

		// 7. Build context
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

		// 8. Stream response
		const openaiProvider = createOpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const result = streamText({
			model: openaiProvider("gpt-4.1-mini"),
			system: systemPrompt,
			messages: coreMessages,
			abortSignal: req.signal,
			maxOutputTokens: 300,
			temperature: 0.7,
			// 9. Fire-and-forget persistence and cost tracking
			onFinish: async ({ text }) => {
				// Determine if answer was grounded in KB (chunks found with sufficient similarity)
				const answeredFromKb = chunks.length > 0 && chunks[0].similarity > 0.7;

				// Save conversation
				saveMessages(conversationId, userMessage, text, answeredFromKb).catch(
					(err) => {
						console.error("Failed to persist conversation:", err);
					},
				);

				// Track cost (fire-and-forget, never throw)
				const outputTokens = countTokens(text);
				// Calculate total input tokens: system + RAG + selected history messages
				const historyTokens = selectedHistory.reduce(
					(sum, msg) => sum + countTokens(msg.content),
					0,
				);
				const inputTokens = systemTokens + historyTokens;

				trackChatCost(inputTokens, outputTokens).catch((err) => {
					console.error("Failed to track cost:", err);
				});
			},
		});

		// 10. Return streaming response with citation metadata
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
