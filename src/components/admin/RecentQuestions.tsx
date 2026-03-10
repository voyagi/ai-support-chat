"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Message {
	id: string;
	content: string;
	created_at: string;
}

export function RecentQuestions() {
	const [questions, setQuestions] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchQuestions = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/recent-questions");
			if (!res.ok) return;
			const data = await res.json();
			setQuestions(data);
		} catch (error) {
			console.error("Error fetching recent questions:", error);
			setQuestions([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchQuestions();
	}, [fetchQuestions]);

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
					Recent Questions
				</h3>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="animate-pulse">
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
							<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
					Recent Questions
				</h3>
				<div className="flex items-center justify-center py-8">
					<div className="text-center">
						<MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
						<p className="text-sm text-gray-500 dark:text-gray-400">
							No questions yet
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
			<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
				Recent Questions
			</h3>
			<div className="space-y-3">
				{questions.map((question) => {
					const truncated =
						question.content.length > 120
							? `${question.content.slice(0, 120)}...`
							: question.content;

					return (
						<div
							key={question.id}
							className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
						>
							<p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
								{truncated}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{formatDistanceToNow(new Date(question.created_at), {
									addSuffix: true,
								})}
							</p>
						</div>
					);
				})}
			</div>
		</div>
	);
}
