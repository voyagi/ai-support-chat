"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface ChatVolumeData {
	date: string;
	conversations: number;
	messages: number;
}

interface ChatVolumeChartProps {
	period?: "day" | "week";
}

export function ChatVolumeChart({ period = "day" }: ChatVolumeChartProps) {
	const [data, setData] = useState<ChatVolumeData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/analytics/chat-volume?period=${period}`,
				);
				if (!response.ok) throw new Error("Failed to fetch chat volume");
				const result = (await response.json()) as ChatVolumeData[];
				setData(result);
			} catch (error) {
				console.error("Error fetching chat volume:", error);
				setData([]);
			} finally {
				setLoading(false);
			}
		};

		void fetchData();
	}, [period]);

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
					Chat Volume
				</h3>
				<div className="h-[300px] flex items-center justify-center">
					<div className="animate-pulse text-gray-400 dark:text-gray-500">
						Loading chart...
					</div>
				</div>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
					Chat Volume
				</h3>
				<div className="h-[300px] flex items-center justify-center">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						No data yet
					</p>
				</div>
			</div>
		);
	}

	// Transform dates for display
	const chartData = data.map((row) => ({
		...row,
		displayDate: format(new Date(row.date), "MMM d"),
	}));

	return (
		<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
			<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
				Chat Volume
			</h3>
			<ResponsiveContainer width="100%" height={300}>
				<AreaChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
					<XAxis
						dataKey="displayDate"
						stroke="#9ca3af"
						style={{ fontSize: "12px" }}
					/>
					<YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
					<Tooltip
						contentStyle={{
							backgroundColor: "#1f2937",
							border: "1px solid #374151",
							borderRadius: "8px",
							color: "#f9fafb",
						}}
						labelStyle={{ color: "#e5e7eb" }}
					/>
					<Legend
						wrapperStyle={{
							fontSize: "12px",
							color: "#9ca3af",
						}}
					/>
					<Area
						type="monotone"
						dataKey="conversations"
						stroke="#3b82f6"
						fill="#3b82f6"
						fillOpacity={0.1}
						strokeWidth={2}
						name="Conversations"
					/>
					<Area
						type="monotone"
						dataKey="messages"
						stroke="#10b981"
						fill="#10b981"
						fillOpacity={0.1}
						strokeWidth={2}
						name="Messages"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
