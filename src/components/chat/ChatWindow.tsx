"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Source {
	title: string;
	heading: string;
	snippet: string;
	similarity: number;
}

// Helper to extract text content from UIMessage parts
function getMessageText(message: {
	parts: Array<{ type: string; text?: string }>;
}): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("");
}

export function ChatWindow() {
	const conversationIdRef = useRef<string | null>(null);
	const [sourcesMap, setSourcesMap] = useState<Record<string, Source[]>>({});
	const bottomRef = useRef<HTMLDivElement>(null);
	const [isAtBottom, setIsAtBottom] = useState(true);

	// Create chat instance with DefaultChatTransport (stable — no state deps)
	const chat = useMemo(
		() =>
			new Chat({
				transport: new DefaultChatTransport({
					api: "/api/chat",
					fetch: async (url, options) => {
						// Inject conversationId into request body
						if (options?.body && conversationIdRef.current) {
							try {
								const body = JSON.parse(options.body as string);
								body.conversationId = conversationIdRef.current;
								options = { ...options, body: JSON.stringify(body) };
							} catch {
								// If body isn't JSON, send as-is
							}
						}

						const response = await fetch(url, options);

						// Extract conversation ID from headers
						const convId = response.headers.get("X-Conversation-Id");
						if (convId && !conversationIdRef.current) {
							conversationIdRef.current = convId;
						}

						// Extract citation sources from headers
						const sourcesHeader = response.headers.get("X-Sources");
						if (sourcesHeader) {
							try {
								const sources = JSON.parse(sourcesHeader) as Source[];
								setSourcesMap((prev) => ({
									...prev,
									_pending: sources,
								}));
							} catch (err) {
								console.error("Failed to parse sources header:", err);
							}
						}

						return response;
					},
				}),
			}),
		[],
	);

	const { messages, sendMessage, status, error, regenerate } = useChat({
		chat,
	});

	// Track if user is at bottom using IntersectionObserver
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsAtBottom(entry.isIntersecting);
			},
			{ threshold: 0.1 },
		);

		if (bottomRef.current) {
			observer.observe(bottomRef.current);
		}

		return () => observer.disconnect();
	}, []);

	// Auto-scroll only if user is at bottom
	// biome-ignore lint/correctness/useExhaustiveDependencies: messages.length triggers scroll on new messages
	useEffect(() => {
		if (isAtBottom && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length, isAtBottom]);

	// Associate pending sources with the latest assistant message
	useEffect(() => {
		if (sourcesMap._pending && messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			if (lastMessage?.role === "assistant" && lastMessage.id) {
				setSourcesMap((prev) => {
					const { _pending, ...rest } = prev;
					return {
						...rest,
						[lastMessage.id]: _pending,
					};
				});
			}
		}
	}, [messages, sourcesMap._pending]);

	const handleSendMessage = (message: string) => {
		sendMessage({
			text: message,
		});
	};

	const isStreaming = status === "streaming" || status === "submitted";
	const showTypingIndicator = isStreaming && messages.length > 0;
	const messageCount = messages.length;
	const showMessageLimitWarning = messageCount >= 30;

	return (
		<div className="flex flex-col h-screen">
			{/* Header */}
			<header className="border-b bg-white py-3 px-4 md:py-4">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
							<Bot size={24} />
						</div>
						<div>
							<h1 className="text-lg md:text-xl font-semibold">Flo</h1>
							<p className="text-xs md:text-sm text-gray-600">
								FlowBoard AI Support
							</p>
						</div>
					</div>
					<p className="text-xs text-gray-500 mt-2">
						AI assistant — answers based on documentation
					</p>
				</div>
			</header>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
					{/* Empty state */}
					{messages.length === 0 && (
						<div className="flex items-center justify-center min-h-[400px]">
							<div className="text-center max-w-md">
								<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
									<Bot size={32} />
								</div>
								<h2 className="text-xl font-semibold mb-2">
									Hi! I'm Flo, FlowBoard's AI assistant
								</h2>
								<p className="text-gray-600">
									Ask me anything about FlowBoard — pricing, features,
									integrations, and more!
								</p>
							</div>
						</div>
					)}

					{/* Messages */}
					{messages
						.filter((msg) => msg.role !== "system")
						.map((msg) => (
							<MessageBubble
								key={msg.id}
								role={msg.role as "user" | "assistant"}
								content={getMessageText(msg)}
								sources={
									msg.role === "assistant" ? sourcesMap[msg.id] : undefined
								}
							/>
						))}

					{/* Typing indicator */}
					{showTypingIndicator && <TypingIndicator />}

					{/* Error state */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<p className="text-red-800 text-sm mb-2">
								Something went wrong. Please try again.
							</p>
							<button
								type="button"
								onClick={() => regenerate()}
								className="flex items-center gap-2 text-red-600 text-sm font-medium hover:text-red-700"
							>
								<RefreshCw size={16} />
								Retry
							</button>
						</div>
					)}

					{/* Message limit warning */}
					{showMessageLimitWarning && (
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
							<p className="text-amber-800 text-sm">
								Approaching conversation limit.{" "}
								<button
									type="button"
									onClick={() => window.location.reload()}
									className="text-amber-900 underline font-medium"
								>
									Start new chat
								</button>
							</p>
						</div>
					)}

					{/* Bottom sentinel for auto-scroll */}
					<div ref={bottomRef} />
				</div>
			</div>

			{/* Input Area */}
			<div className="border-t bg-white p-4">
				<div className="max-w-3xl mx-auto">
					<ChatInput
						onSubmit={handleSendMessage}
						disabled={isStreaming}
						placeholder="Ask about FlowBoard..."
					/>
				</div>
			</div>
		</div>
	);
}
