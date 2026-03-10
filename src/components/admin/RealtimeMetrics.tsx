"use client";

import { BarChart3, MessageSquare, MessagesSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

	const fetchMetrics = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/metrics");
			if (!res.ok) return;
			const data = await res.json();
			setTotalConversations(data.totalConversations);
			setMessagesToday(data.messagesToday);
			setTotalMessages(data.totalMessages);
		} catch (error) {
			console.error("Error fetching metrics:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchMetrics();
		const interval = setInterval(fetchMetrics, 5000);
		return () => clearInterval(interval);
	}, [fetchMetrics]);

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
