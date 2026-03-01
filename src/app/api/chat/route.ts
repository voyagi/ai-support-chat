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
import { extractMessageText } from "@/lib/chat/message-utils";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import { sendCostAlertEmail } from "@/lib/cost-alerts";
import {
	checkBudgetRemaining,
	checkCostAlerts,
	getCurrentCost,
	trackChatCost,
} from "@/lib/cost-tracking";
import { countTokens } from "@/lib/embeddings/token-counter";
import type { SimilarChunk } from "@/lib/rag/similarity-search";
import { searchSimilarChunks } from "@/lib/rag/similarity-search";
import { getClientIp } from "@/lib/request-utils";
import { getTenantIdFromIp } from "@/lib/sandbox/tenant-id";

interface ChatMessage {
	role: "user" | "assistant";
	content?: string;
	parts?: Array<{ type: string; text?: string }>;
}

interface RequestBody {
	messages: ChatMessage[];
	conversationId: string | null;
}

/** Build a low-confidence response stream with contact form header. */
function handleLowConfidence(conversationId: string, userMessage: string) {
	const noAnswerText =
		"I don't have information about that in my knowledge base. Let me connect you with our team who can help!";

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

	saveMessages(conversationId, userMessage, noAnswerText, false).catch(
		(err) => {
			console.error("Failed to persist conversation:", err);
		},
	);

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

/** Build a high-confidence streaming LLM response with RAG context. */
function handleHighConfidence(
	req: Request,
	conversationId: string,
	userMessage: string,
	messages: ChatMessage[],
	chunks: SimilarChunk[],
) {
	const citationSources = chunks.slice(0, 2).map((chunk) => ({
		title: chunk.documentTitle,
		heading: chunk.sectionHeading,
		snippet: chunk.content.substring(0, 200),
		similarity: chunk.similarity,
	}));

	const ragContext = formatRagContext(chunks);
	const systemPrompt = buildSystemPrompt(ragContext);
	const systemTokens = countTokens(systemPrompt);
	const ragTokens = countTokens(ragContext);
	const availableBudget = calculateAvailableBudget(systemTokens, ragTokens);

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
		onFinish: async ({ text }) => {
			const answeredFromKb = chunks.length > 0 && chunks[0].similarity > 0.7;

			saveMessages(conversationId, userMessage, text, answeredFromKb).catch(
				(err) => {
					console.error("Failed to persist conversation:", err);
				},
			);

			const outputTokens = countTokens(text);
			const historyTokens = selectedHistory.reduce(
				(sum, msg) => sum + countTokens(msg.content),
				0,
			);
			const inputTokens = systemTokens + historyTokens;

			trackChatCost(inputTokens, outputTokens)
				.then(async () => {
					const updatedCost = await getCurrentCost();
					const alert = checkCostAlerts(updatedCost);

					if (alert.level === "warning" || alert.level === "critical") {
						sendCostAlertEmail(updatedCost, alert.level).catch((err) => {
							console.error("Failed to send cost alert email:", err);
						});
					}
				})
				.catch((err) => {
					console.error("Failed to track cost:", err);
				});
		},
	});

	const headers: Record<string, string> = {
		"X-Conversation-Id": conversationId,
	};

	if (citationSources.length > 0) {
		headers["X-Sources"] = JSON.stringify(citationSources);
	}

	return result.toUIMessageStreamResponse({ headers });
}

export async function POST(req: Request) {
	try {
		// 1. Check budget
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

		// 2. Parse and validate
		const body = (await req.json()) as RequestBody;
		const { messages, conversationId: incomingConversationId } = body;

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

		// 4. Create conversation if needed
		const conversationId =
			incomingConversationId || (await createConversation());

		// 5. Get tenant ID if sandbox mode is enabled
		let tenantId: string | undefined;
		if (process.env.NEXT_PUBLIC_SANDBOX_ENABLED === "true") {
			const ip = getClientIp(req);
			tenantId = getTenantIdFromIp(ip);
		}

		// 6. RAG retrieval
		const chunks = await searchSimilarChunks(userMessage, {
			threshold: 0.7,
			count: 5,
			tenantId,
		});

		// pgvector scores exceed 1.0 because embeddings aren't L2-normalized.
		// Observed: unrelated queries ~1.10, in-KB queries ~1.80+
		const CONFIDENCE_THRESHOLD = 1.15;
		const bestScore = chunks.length > 0 ? chunks[0].similarity : 0;

		if (bestScore > 0) {
			console.log(
				`[chat] RAG top score: ${bestScore.toFixed(3)} (threshold: ${CONFIDENCE_THRESHOLD})`,
			);
		}
		if (bestScore > CONFIDENCE_THRESHOLD && bestScore <= 1.3) {
			console.warn(
				`[chat] Borderline RAG score ${bestScore.toFixed(3)} in zone ${CONFIDENCE_THRESHOLD}-1.30, may need threshold recalibration`,
			);
		}

		const hasConfidentAnswer = bestScore > CONFIDENCE_THRESHOLD;

		if (!hasConfidentAnswer) {
			return handleLowConfidence(conversationId, userMessage);
		}

		return handleHighConfidence(
			req,
			conversationId,
			userMessage,
			messages,
			chunks,
		);
	} catch (error) {
		console.error("Chat API error:", error);
		return Response.json(
			{ error: "Failed to generate response. Please try again." },
			{ status: 500 },
		);
	}
}
