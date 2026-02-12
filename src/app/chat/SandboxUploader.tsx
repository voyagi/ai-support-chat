"use client";

import {
	ChevronDown,
	ChevronUp,
	FileText,
	Loader2,
	Upload,
} from "lucide-react";
import { useId, useState } from "react";
import { SANDBOX_LIMITS } from "@/lib/sandbox/constants";

interface UploadedDocument {
	id: string;
	title: string;
	chunkCount: number;
}

export function SandboxUploader() {
	const fileInputId = useId();
	const [isExpanded, setIsExpanded] = useState(false);
	const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/sandbox/upload", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Upload failed");
			}

			// Extract title from filename
			const title = file.name.replace(/\.(txt|md|pdf)$/i, "");

			setUploadedDocs((prev) => [
				...prev,
				{
					id: data.documentId,
					title,
					chunkCount: data.chunkCount,
				},
			]);

			// Reset file input
			e.target.value = "";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const canUploadMore = uploadedDocs.length < SANDBOX_LIMITS.maxDocuments;
	const allowedExtensions = SANDBOX_LIMITS.allowedTypes.join(", ");

	return (
		<div className="mb-4 overflow-hidden rounded-lg border border-dashed border-blue-300 bg-blue-50 dark:border-blue-700/50 dark:bg-blue-900/20">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
			>
				<div className="flex items-center gap-2">
					<Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					<span className="font-medium text-blue-900 dark:text-blue-100">
						Try with your own docs
					</span>
					<span className="text-sm text-blue-600 dark:text-blue-400">
						{uploadedDocs.length} of {SANDBOX_LIMITS.maxDocuments} uploaded
					</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
				) : (
					<ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
				)}
			</button>

			{isExpanded && (
				<div className="border-t border-blue-200 p-4 dark:border-blue-700/30">
					<p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
						Upload your own documents to test the RAG pipeline. Your docs will
						be available for 24 hours alongside the demo knowledge base.
					</p>

					{uploadedDocs.length > 0 && (
						<div className="mb-4 space-y-2">
							{uploadedDocs.map((doc) => (
								<div
									key={doc.id}
									className="flex items-center gap-2 rounded border border-blue-200 bg-white px-3 py-2 text-sm dark:border-blue-700/50 dark:bg-blue-950/30"
								>
									<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									<span className="flex-1 truncate text-blue-900 dark:text-blue-100">
										{doc.title}
									</span>
									<span className="text-xs text-blue-600 dark:text-blue-400">
										{doc.chunkCount} chunks
									</span>
								</div>
							))}
						</div>
					)}

					{error && (
						<div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
							{error}
						</div>
					)}

					<div className="flex items-center gap-2">
						<label
							htmlFor={fileInputId}
							className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
								canUploadMore && !isUploading
									? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
									: "cursor-not-allowed bg-blue-300 text-blue-700 dark:bg-blue-800 dark:text-blue-400"
							}`}
						>
							{isUploading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="h-4 w-4" />
									Upload Document
								</>
							)}
						</label>
						<input
							id={fileInputId}
							type="file"
							accept={allowedExtensions}
							onChange={handleFileSelect}
							disabled={!canUploadMore || isUploading}
							className="hidden"
						/>
						<span className="text-xs text-blue-600 dark:text-blue-400">
							{allowedExtensions}, max {SANDBOX_LIMITS.maxFileSizeMb}MB
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
