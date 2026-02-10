"use client";

import { BarChart3, MessageSquare, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MetricCardProps {
	label: string;
	value: number;
	icon: React.ReactNode;
}

function MetricCard({ label, value, icon }: MetricCardProps) {
	return (
		<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
					<p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 transition-all duration-300">
						{value.toLocaleString()}
					</p>
				</div>
				<div className="text-blue-600 dark:text-blue-400">{icon}</div>
			</div>
		</div>
	);
}

export function RealtimeMetrics() {
	const [totalConversations, setTotalConversations] = useState(0);
	const [messagesToday, setMessagesToday] = useState(0);
	const [totalMessages, setTotalMessages] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		// Get today's date at midnight for filtering
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayIso = today.toISOString();

		// Fetch initial counts
		const fetchInitialCounts = async () => {
			try {
				// Total conversations
				const { count: convCount } = await supabase
					.from("conversations")
					.select("*", { count: "exact", head: true });

				// Messages today
				const { count: todayCount } = await supabase
					.from("messages")
					.select("*", { count: "exact", head: true })
					.gte("created_at", todayIso);

				// Total messages
				const { count: totalCount } = await supabase
					.from("messages")
					.select("*", { count: "exact", head: true });

				setTotalConversations(convCount ?? 0);
				setMessagesToday(todayCount ?? 0);
				setTotalMessages(totalCount ?? 0);
			} catch (error) {
				console.error("Error fetching initial counts:", error);
			} finally {
				setLoading(false);
			}
		};

		void fetchInitialCounts();

		// Subscribe to conversations
		const conversationsChannel = supabase
			.channel("conversations-realtime")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "conversations",
				},
				() => {
					setTotalConversations((prev) => prev + 1);
				},
			)
			.subscribe();

		// Subscribe to messages
		const messagesChannel = supabase
			.channel("messages-realtime")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
				},
				(payload) => {
					// Increment total messages
					setTotalMessages((prev) => prev + 1);

					// Check if message was created today
					const messageDate = new Date(
						(payload.new as { created_at: string }).created_at,
					);
					if (messageDate >= today) {
						setMessagesToday((prev) => prev + 1);
					}
				},
			)
			.subscribe();

		// Cleanup subscriptions
		return () => {
			void supabase.removeChannel(conversationsChannel);
			void supabase.removeChannel(messagesChannel);
		};
	}, []);

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse"
					>
						<div className="h-16" />
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<MetricCard
				label="Total Conversations"
				value={totalConversations}
				icon={<MessageSquare className="h-8 w-8" />}
			/>
			<MetricCard
				label="Messages Today"
				value={messagesToday}
				icon={<MessagesSquare className="h-8 w-8" />}
			/>
			<MetricCard
				label="Total Messages"
				value={totalMessages}
				icon={<BarChart3 className="h-8 w-8" />}
			/>
		</div>
	);
}
