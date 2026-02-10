"use client";

import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

interface AccuracyData {
	answeredFromKb: number;
	totalMessages: number;
	kbPercentage: number;
}

export function AccuracyMetrics() {
	const [data, setData] = useState<AccuracyData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const response = await fetch("/api/analytics/accuracy");
				if (!response.ok) throw new Error("Failed to fetch accuracy metrics");
				const result = (await response.json()) as AccuracyData;
				setData(result);
			} catch (error) {
				console.error("Error fetching accuracy metrics:", error);
				setData(null);
			} finally {
				setLoading(false);
			}
		};

		void fetchData();
	}, []);

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
					Response Accuracy
				</h3>
				<div className="h-[300px] flex items-center justify-center">
					<div className="animate-pulse text-gray-400 dark:text-gray-500">
						Loading metrics...
					</div>
				</div>
			</div>
		);
	}

	if (!data || data.totalMessages === 0) {
		return (
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
					Response Accuracy
				</h3>
				<div className="h-[300px] flex items-center justify-center">
					<p className="text-sm text-gray-500 dark:text-gray-400">No data</p>
				</div>
			</div>
		);
	}

	const chartData = [
		{
			name: "Answered from KB",
			value: data.answeredFromKb,
			color: "#10b981",
		},
		{
			name: "Fallback",
			value: data.totalMessages - data.answeredFromKb,
			color: "#f59e0b",
		},
	];

	return (
		<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
			<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
				Response Accuracy
			</h3>
			<div className="flex flex-col items-center">
				<ResponsiveContainer width="100%" height={200}>
					<PieChart>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							innerRadius={50}
							outerRadius={80}
							dataKey="value"
							startAngle={90}
							endAngle={-270}
						>
							{chartData.map((entry) => (
								<Cell key={entry.name} fill={entry.color} />
							))}
						</Pie>
						<Legend
							wrapperStyle={{
								fontSize: "12px",
								color: "#9ca3af",
							}}
						/>
					</PieChart>
				</ResponsiveContainer>
				<div className="mt-2 text-center">
					<div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
						{data.kbPercentage.toFixed(1)}%
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400">
						Answered from KB
					</div>
				</div>
			</div>
		</div>
	);
}
