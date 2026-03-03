"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { extractMessageText } from "@/lib/chat/message-utils";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Source {
	title: string;
	heading: string;
	snippet: string;
	similarity: number;
}

interface ContactFormData {
	conversationId: string;
	originalQuestion: string;
}

interface ChatWindowProps {
	widget?: boolean;
}

export function ChatWindow({ widget = false }: ChatWindowProps) {
	const conversationIdRef = useRef<string | null>(null);
	const pendingContactRef = useRef<ContactFormData | null>(null);
	const [sourcesMap, setSourcesMap] = useState<Record<string, Source[]>>({});
	const [contactFormMap, setContactFormMap] = useState<
		Record<string, ContactFormData>
	>({});
	const bottomRef = useRef<HTMLDivElement>(null);
	const [isAtBottom, setIsAtBottom] = useState(true);

	const {
		rateLimitWarning,
		rateLimitMessage,
		rateLimitHit,
		budgetExceeded,
		setRateLimitRemaining,
		setRateLimitReset,
		setRateLimitHit,
		setBudgetExceeded,
	} = useRateLimit();

	// Create chat instance with DefaultChatTransport (stable, no state deps)
	// biome-ignore lint/correctness/useExhaustiveDependencies: useState setters are referentially stable
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

						// Extract contact form trigger from headers
						const contactHeader = response.headers.get("X-Contact-Form");
						if (contactHeader) {
							try {
								pendingContactRef.current = JSON.parse(contactHeader);
							} catch {
								// Invalid JSON, ignore
							}
						}

						// Extract rate limit headers
						const remaining = response.headers.get("X-RateLimit-Remaining");
						const reset = response.headers.get("X-RateLimit-Reset");
						if (remaining !== null) {
							setRateLimitRemaining(Number.parseInt(remaining, 10));
						}
						if (reset !== null) {
							setRateLimitReset(reset);
						}

						// Handle rate limit exceeded (429)
						if (response.status === 429) {
							setRateLimitHit(true);
							if (reset) {
								setRateLimitReset(reset);
							}
						}

						// Handle budget exceeded (503)
						if (response.status === 503) {
							try {
								const errorData = await response.clone().json();
								if (errorData.budgetExceeded) {
									setBudgetExceeded(true);
								}
							} catch {
								// Not JSON or can't parse, ignore
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

	const isStreaming = status === "streaming" || status === "submitted";

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

	// Associate pending contact form data with the latest assistant message
	useEffect(() => {
		if (!pendingContactRef.current || messages.length === 0 || isStreaming) {
			return;
		}
		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.role === "assistant" && lastMessage.id) {
			const data = pendingContactRef.current;
			pendingContactRef.current = null;
			setContactFormMap((prev) => ({
				...prev,
				[lastMessage.id]: data,
			}));
		}
	}, [messages, isStreaming]);

	const handleSendMessage = (message: string) => {
		sendMessage({ text: message });
	};

	const showTypingIndicator = isStreaming && messages.length > 0;
	// Warn at 80% of server's 50-message cap (see api/chat/route.ts)
	const showMessageLimitWarning = messages.length >= 40;

	return (
		<div className={cn("flex flex-col", widget ? "h-full" : "h-screen")}>
			{/* Header */}
			{!widget && (
				<header className="border-b dark:border-gray-700 bg-white dark:bg-gray-900 py-3 px-4 md:py-4">
					<div className="max-w-3xl mx-auto">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
									<Bot size={24} />
								</div>
								<div>
									<h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
										Flo
									</h1>
									<p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
										FlowBoard AI Support
									</p>
								</div>
							</div>
							<ThemeToggle />
						</div>
						<p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
							AI assistant — answers based on documentation
						</p>
					</div>
				</header>
			)}

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
					{/* Empty state */}
					{messages.length === 0 && (
						<div className="flex items-center justify-center min-h-[400px]">
							<div className="text-center max-w-md">
								<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
									<Bot size={32} />
								</div>
								<h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
									Hi! I'm Flo, FlowBoard's AI assistant
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
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
								content={extractMessageText(msg)}
								sources={
									msg.role === "assistant" ? sourcesMap[msg.id] : undefined
								}
								contactForm={
									msg.role === "assistant" ? contactFormMap[msg.id] : undefined
								}
							/>
						))}

					{/* Typing indicator */}
					{showTypingIndicator && <TypingIndicator />}

					{/* Error state */}
					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
							<p className="text-red-800 dark:text-red-200 text-sm mb-2">
								Something went wrong. Please try again.
							</p>
							<button
								type="button"
								onClick={() => regenerate()}
								className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300"
							>
								<RefreshCw size={16} />
								Retry
							</button>
						</div>
					)}

					{/* Message limit warning */}
					{showMessageLimitWarning && (
						<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
							<p className="text-amber-800 dark:text-amber-200 text-sm">
								Approaching conversation limit.{" "}
								<button
									type="button"
									onClick={() => window.location.reload()}
									className="text-amber-900 dark:text-amber-100 underline font-medium"
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
			<div className="border-t dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
				<div className="max-w-3xl mx-auto">
					<ChatInput
						onSubmit={handleSendMessage}
						disabled={isStreaming}
						placeholder="Ask about FlowBoard..."
						rateLimitWarning={rateLimitWarning}
						rateLimitHit={rateLimitHit}
						rateLimitMessage={rateLimitMessage}
						budgetExceeded={budgetExceeded}
					/>
				</div>
			</div>
		</div>
	);
}
