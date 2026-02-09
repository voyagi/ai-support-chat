"use client";

import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Source {
	title: string;
	heading: string;
	snippet: string;
	similarity: number;
}

interface MessageBubbleProps {
	role: "user" | "assistant";
	content: string;
	sources?: Source[];
}

export function MessageBubble({ role, content, sources }: MessageBubbleProps) {
	const [sourcesExpanded, setSourcesExpanded] = useState(false);

	if (role === "user") {
		return (
			<div className="flex justify-end">
				<div className="bg-blue-600 dark:bg-blue-500 text-white rounded-lg rounded-br-sm px-4 py-2.5 max-w-[80%] md:max-w-[70%]">
					<p className="whitespace-pre-wrap">{content}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex gap-3">
			{/* Bot avatar */}
			<div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
				<Bot size={20} />
			</div>

			{/* Assistant message container */}
			<div className="flex-1 max-w-[80%] md:max-w-[70%]">
				<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Flo</p>
				<div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg rounded-bl-sm px-4 py-2.5">
					<p className="whitespace-pre-wrap">{content}</p>
				</div>

				{/* Sources section */}
				{sources && sources.length > 0 && (
					<div className="mt-2">
						<button
							type="button"
							onClick={() => setSourcesExpanded(!sourcesExpanded)}
							className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
						>
							<span>Sources ({sources.length})</span>
							{sourcesExpanded ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
						</button>

						{sourcesExpanded && (
							<div className="mt-2 space-y-2">
								{sources.map((source, idx) => (
									<div
										key={`${source.title}-${idx}`}
										className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-3 text-sm"
									>
										<p className="font-semibold text-gray-900 dark:text-gray-100">
											{source.title}
										</p>
										{source.heading && (
											<p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
												{source.heading}
											</p>
										)}
										<p className="text-gray-700 dark:text-gray-300 mt-1 text-xs">
											{source.snippet}
										</p>
										<p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
											Similarity: {(source.similarity * 100).toFixed(1)}%
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
