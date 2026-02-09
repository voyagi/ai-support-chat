"use client";

import { Hash, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ChunkListItem } from "@/app/actions/documents";

interface ChunkPreviewProps {
	chunks: ChunkListItem[];
	isLoading: boolean;
}

export function ChunkPreview({ chunks, isLoading }: ChunkPreviewProps) {
	const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-4 px-3 text-sm text-gray-500 dark:text-gray-400">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading chunks...
			</div>
		);
	}

	if (chunks.length === 0) {
		return (
			<p className="py-4 px-3 text-sm text-gray-400 dark:text-gray-500">
				No chunks found for this document.
			</p>
		);
	}

	const toggleChunk = (chunkId: string) => {
		setExpandedChunks((prev) => {
			const next = new Set(prev);
			if (next.has(chunkId)) {
				next.delete(chunkId);
			} else {
				next.add(chunkId);
			}
			return next;
		});
	};

	return (
		<div className="space-y-2 py-3 px-2">
			{chunks.map((chunk) => {
				const isExpanded = expandedChunks.has(chunk.id);
				const shouldTruncate = chunk.content.length > 200;
				const displayContent =
					isExpanded || !shouldTruncate
						? chunk.content
						: `${chunk.content.slice(0, 200)}...`;

				return (
					<button
						key={chunk.id}
						type="button"
						className="w-full text-left rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						onClick={() => toggleChunk(chunk.id)}
					>
						<div className="flex items-center gap-2 mb-1.5">
							<Hash className="h-3 w-3 text-gray-400 dark:text-gray-500" />
							<span className="text-xs font-medium text-gray-500 dark:text-gray-400">
								Chunk {chunk.chunkPosition} of {chunk.totalChunks}
							</span>
							{chunk.sectionHeading && (
								<span className="text-xs text-gray-400 dark:text-gray-500">
									&middot; {chunk.sectionHeading}
								</span>
							)}
						</div>
						<p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
							{displayContent}
						</p>
						{shouldTruncate && (
							<span className="text-xs text-blue-500 dark:text-blue-400 mt-1 inline-block">
								{isExpanded ? "Click to collapse" : "Click to expand"}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
