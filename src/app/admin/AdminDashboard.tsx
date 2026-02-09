"use client";

import { Code } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { type DocumentListItem, listDocuments } from "@/app/actions/documents";
import { DocumentTable } from "@/components/admin/DocumentTable";
import { UploadZone } from "@/components/admin/UploadZone";

interface AdminDashboardProps {
	initialDocuments: DocumentListItem[];
}

export function AdminDashboard({ initialDocuments }: AdminDashboardProps) {
	const [documents, setDocuments] =
		useState<DocumentListItem[]>(initialDocuments);

	const refreshDocuments = useCallback(async () => {
		const fresh = await listDocuments();
		setDocuments(fresh);
	}, []);

	return (
		<div className="max-w-6xl mx-auto pt-8 px-6 pb-12">
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Knowledge Base
					</h1>
					<span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
						{documents.length}{" "}
						{documents.length === 1 ? "document" : "documents"}
					</span>
				</div>

				<Link
					href="/admin/embed"
					className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
				>
					<Code className="h-4 w-4" />
					Get Embed Code
				</Link>
			</div>

			<UploadZone onUploadComplete={refreshDocuments} />

			<div className="my-8" />

			<DocumentTable
				documents={documents}
				onDocumentsChange={refreshDocuments}
			/>
		</div>
	);
}
