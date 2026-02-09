"use client";

import { CheckCircle, FileText, Loader2, Upload, XCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocument } from "@/app/actions/documents";

interface FileUploadStatus {
	name: string;
	status: "pending" | "processing" | "ready" | "failed";
	error?: string;
}

interface UploadZoneProps {
	onUploadComplete: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
	const [files, setFiles] = useState<FileUploadStatus[]>([]);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (acceptedFiles.length === 0) return;

			// Initialize all files as processing
			const initialStatuses: FileUploadStatus[] = acceptedFiles.map((file) => ({
				name: file.name,
				status: "processing" as const,
			}));
			setFiles(initialStatuses);

			// Upload each file sequentially
			for (let i = 0; i < acceptedFiles.length; i++) {
				const file = acceptedFiles[i];
				const formData = new FormData();
				formData.append("file", file);

				try {
					const result = await uploadDocument(formData);
					setFiles((prev) =>
						prev.map((f, idx) =>
							idx === i
								? {
										...f,
										status: result.success ? "ready" : "failed",
										error: result.error,
									}
								: f,
						),
					);
				} catch {
					setFiles((prev) =>
						prev.map((f, idx) =>
							idx === i
								? {
										...f,
										status: "failed",
										error: "Upload failed unexpectedly",
									}
								: f,
						),
					);
				}
			}

			onUploadComplete();
		},
		[onUploadComplete],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"text/plain": [".txt"],
			"text/markdown": [".md"],
		},
		maxFiles: 10,
		maxSize: 5 * 1024 * 1024,
	});

	return (
		<div>
			<div
				{...getRootProps()}
				className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
					isDragActive
						? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
						: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
				}`}
			>
				<input {...getInputProps()} />
				<Upload
					className={`h-8 w-8 mx-auto mb-3 ${isDragActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
				/>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					{isDragActive
						? "Drop files here..."
						: "Drag & drop .txt or .md files here, or click to select"}
				</p>
				<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
					Up to 10 files, max 5MB each
				</p>
			</div>

			{files.length > 0 && (
				<div className="mt-4 space-y-2">
					{files.map((file) => (
						<div
							key={file.name}
							className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5"
						>
							<FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
							<span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
								{file.name}
							</span>
							<StatusBadge status={file.status} error={file.error} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function StatusBadge({
	status,
	error,
}: {
	status: FileUploadStatus["status"];
	error?: string;
}) {
	switch (status) {
		case "pending":
			return (
				<span className="inline-flex items-center gap-1 text-xs text-gray-500">
					Waiting...
				</span>
			);
		case "processing":
			return (
				<span className="inline-flex items-center gap-1 text-xs text-amber-600">
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
					Processing...
				</span>
			);
		case "ready":
			return (
				<span className="inline-flex items-center gap-1 text-xs text-green-600">
					<CheckCircle className="h-3.5 w-3.5" />
					Ready
				</span>
			);
		case "failed":
			return (
				<span
					className="inline-flex items-center gap-1 text-xs text-red-600"
					title={error}
				>
					<XCircle className="h-3.5 w-3.5" />
					Failed
				</span>
			);
	}
}
