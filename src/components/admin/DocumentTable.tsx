"use client";

import {
	ChevronDown,
	ChevronRight,
	ChevronUp,
	FileText,
	Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
	type ChunkListItem,
	type DocumentListItem,
	deleteDocument,
	getDocumentChunks,
} from "@/app/actions/documents";
import { ChunkPreview } from "./ChunkPreview";

type SortKey = "title" | "createdAt" | "chunkCount";
type SortDir = "asc" | "desc";

interface DocumentTableProps {
	documents: DocumentListItem[];
	onDocumentsChange: () => void;
}

export function DocumentTable({
	documents,
	onDocumentsChange,
}: DocumentTableProps) {
	const [sortKey, setSortKey] = useState<SortKey>("createdAt");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [chunkCache, setChunkCache] = useState<Record<string, ChunkListItem[]>>(
		{},
	);
	const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

	const handleSort = useCallback(
		(key: SortKey) => {
			if (sortKey === key) {
				setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
			} else {
				setSortKey(key);
				setSortDir(key === "title" ? "asc" : "desc");
			}
		},
		[sortKey],
	);

	const toggleExpand = useCallback(
		async (documentId: string) => {
			setExpanded((prev) => {
				const next = new Set(prev);
				if (next.has(documentId)) {
					next.delete(documentId);
				} else {
					next.add(documentId);
				}
				return next;
			});

			// Fetch chunks if not cached
			if (!chunkCache[documentId] && !loadingChunks.has(documentId)) {
				setLoadingChunks((prev) => new Set(prev).add(documentId));
				try {
					const chunks = await getDocumentChunks(documentId);
					setChunkCache((prev) => ({
						...prev,
						[documentId]: chunks,
					}));
				} catch {
					// Silently fail -- ChunkPreview will show empty state
				} finally {
					setLoadingChunks((prev) => {
						const next = new Set(prev);
						next.delete(documentId);
						return next;
					});
				}
			}
		},
		[chunkCache, loadingChunks],
	);

	const handleDelete = useCallback(
		async (event: React.MouseEvent, doc: DocumentListItem) => {
			event.stopPropagation();

			const confirmed = window.confirm(
				`Delete "${doc.title}"? This removes all chunks and embeddings.`,
			);
			if (!confirmed) return;

			setDeletingIds((prev) => new Set(prev).add(doc.id));
			try {
				const result = await deleteDocument(doc.id);
				if (result.success) {
					// Remove from expanded and chunk cache
					setExpanded((prev) => {
						const next = new Set(prev);
						next.delete(doc.id);
						return next;
					});
					setChunkCache((prev) => {
						const next = { ...prev };
						delete next[doc.id];
						return next;
					});
					onDocumentsChange();
				}
			} finally {
				setDeletingIds((prev) => {
					const next = new Set(prev);
					next.delete(doc.id);
					return next;
				});
			}
		},
		[onDocumentsChange],
	);

	// Sort documents
	const sorted = [...documents].sort((a, b) => {
		const dir = sortDir === "asc" ? 1 : -1;
		switch (sortKey) {
			case "title":
				return dir * a.title.localeCompare(b.title);
			case "createdAt":
				return (
					dir *
					(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
				);
			case "chunkCount":
				return dir * (a.chunkCount - b.chunkCount);
			default:
				return 0;
		}
	});

	if (documents.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
				<FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
				<p className="text-sm text-gray-500">
					No documents yet. Upload your first document above.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<table className="w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="w-8 px-4 py-3" />
						<SortableHeader
							label="Title"
							sortKey="title"
							activeSortKey={sortKey}
							sortDir={sortDir}
							onSort={handleSort}
						/>
						<SortableHeader
							label="Upload Date"
							sortKey="createdAt"
							activeSortKey={sortKey}
							sortDir={sortDir}
							onSort={handleSort}
						/>
						<SortableHeader
							label="Chunks"
							sortKey="chunkCount"
							activeSortKey={sortKey}
							sortDir={sortDir}
							onSort={handleSort}
						/>
						<th className="w-12 px-4 py-3" />
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200">
					{sorted.map((doc) => {
						const isExpanded = expanded.has(doc.id);
						const isDeleting = deletingIds.has(doc.id);

						return (
							<DocumentRow
								key={doc.id}
								doc={doc}
								isExpanded={isExpanded}
								isDeleting={isDeleting}
								isLoadingChunks={loadingChunks.has(doc.id)}
								chunks={chunkCache[doc.id] ?? []}
								onToggleExpand={() => toggleExpand(doc.id)}
								onDelete={(e) => handleDelete(e, doc)}
							/>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function SortableHeader({
	label,
	sortKey,
	activeSortKey,
	sortDir,
	onSort,
}: {
	label: string;
	sortKey: SortKey;
	activeSortKey: SortKey;
	sortDir: SortDir;
	onSort: (key: SortKey) => void;
}) {
	const isActive = sortKey === activeSortKey;

	return (
		<th
			className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
			onClick={() => onSort(sortKey)}
		>
			<span className="inline-flex items-center gap-1">
				{label}
				{isActive &&
					(sortDir === "asc" ? (
						<ChevronUp className="h-3.5 w-3.5" />
					) : (
						<ChevronDown className="h-3.5 w-3.5" />
					))}
			</span>
		</th>
	);
}

function DocumentRow({
	doc,
	isExpanded,
	isDeleting,
	isLoadingChunks,
	chunks,
	onToggleExpand,
	onDelete,
}: {
	doc: DocumentListItem;
	isExpanded: boolean;
	isDeleting: boolean;
	isLoadingChunks: boolean;
	chunks: ChunkListItem[];
	onToggleExpand: () => void;
	onDelete: (e: React.MouseEvent) => void;
}) {
	return (
		<>
			<tr
				className={`hover:bg-gray-50 cursor-pointer transition-colors ${isDeleting ? "opacity-50" : ""}`}
				onClick={onToggleExpand}
			>
				<td className="px-4 py-3">
					<ChevronRight
						className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
					/>
				</td>
				<td className="px-4 py-3 text-sm font-medium text-gray-900">
					{doc.title}
				</td>
				<td className="px-4 py-3 text-sm text-gray-500">
					{new Date(doc.createdAt).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})}
				</td>
				<td className="px-4 py-3 text-sm text-gray-500">
					<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
						{doc.chunkCount}
					</span>
				</td>
				<td className="px-4 py-3">
					<button
						type="button"
						onClick={onDelete}
						disabled={isDeleting}
						className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
						title={`Delete ${doc.title}`}
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</td>
			</tr>
			{isExpanded && (
				<tr>
					<td colSpan={5} className="bg-gray-50/50 px-4">
						<ChunkPreview chunks={chunks} isLoading={isLoadingChunks} />
					</td>
				</tr>
			)}
		</>
	);
}
