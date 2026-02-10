"use client";

import { useState } from "react";
import { AccuracyMetrics } from "@/components/admin/AccuracyMetrics";
import { ChatVolumeChart } from "@/components/admin/ChatVolumeChart";
import { RealtimeMetrics } from "@/components/admin/RealtimeMetrics";
import { RecentQuestions } from "@/components/admin/RecentQuestions";

type Period = "day" | "week";

export function AnalyticsDashboard() {
	const [period, setPeriod] = useState<Period>("day");

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Analytics
				</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
					Chat performance and usage metrics
				</p>
			</div>

			{/* Real-time Metrics Row */}
			<div className="mb-6">
				<RealtimeMetrics />
			</div>

			{/* Charts Section */}
			<div className="mb-6">
				{/* Period Toggle */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Chat Volume Over Time
					</h2>
					<div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
						<button
							type="button"
							onClick={() => setPeriod("day")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
								period === "day"
									? "bg-blue-600 text-white"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
							}`}
						>
							Daily
						</button>
						<button
							type="button"
							onClick={() => setPeriod("week")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
								period === "week"
									? "bg-blue-600 text-white"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
							}`}
						>
							Weekly
						</button>
					</div>
				</div>

				{/* Two-column Grid: Volume Chart + Accuracy Metrics */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<ChatVolumeChart period={period} />
					</div>
					<div className="lg:col-span-1">
						<AccuracyMetrics />
					</div>
				</div>
			</div>

			{/* Recent Questions - Full Width */}
			<div>
				<RecentQuestions />
			</div>
		</div>
	);
}
