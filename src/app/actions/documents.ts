"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
	extractDocumentTitle,
	processDocumentUpload,
} from "@/lib/documents/upload";
import { getErrorMessage } from "@/lib/errors";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface DocumentListItem {
	id: string;
	title: string;
	createdAt: string;
	chunkCount: number;
}

export interface ChunkListItem {
	id: string;
	content: string;
	sectionHeading: string;
	chunkPosition: number;
	totalChunks: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".txt", ".md"];

/**
 * Upload a document: validate, insert, chunk, embed, store chunks.
 * Delegates core pipeline to shared processDocumentUpload().
 */
export async function uploadDocument(formData: FormData): Promise<{
	success: boolean;
	documentId?: string;
	chunkCount?: number;
	error?: string;
}> {
	const session = await getSession();
	if (!session.isAuthenticated) {
		return { success: false, error: "Not authenticated" };
	}

	const file = formData.get("file") as File | null;
	if (!file || file.size === 0) {
		return { success: false, error: "No file provided or file is empty" };
	}

	// Validate extension
	const fileName = file.name.toLowerCase();
	const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
		fileName.endsWith(ext),
	);
	if (!hasValidExtension) {
		return {
			success: false,
			error: "Only .txt and .md files are supported",
		};
	}

	// Validate size
	if (file.size > MAX_FILE_SIZE) {
		return {
			success: false,
			error: `File exceeds maximum size of 5MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
		};
	}

	try {
		const content = await file.text();
		const titleOverride = formData.get("title") as string | null;
		const title = extractDocumentTitle(content, file.name, titleOverride);

		const result = await processDocumentUpload(content, title);

		revalidatePath("/admin");
		return {
			success: true,
			documentId: result.documentId,
			chunkCount: result.chunkCount,
		};
	} catch (error) {
		return {
			success: false,
			error: getErrorMessage(error),
		};
	}
}

/**
 * List all documents with chunk counts, sorted by created_at desc
 */
export async function listDocuments(): Promise<DocumentListItem[]> {
	const session = await getSession();
	if (!session.isAuthenticated) {
		return [];
	}

	const supabase = createServiceRoleClient();

	const { data: documents, error } = await supabase
		.from("documents")
		.select("id, title, created_at")
		.order("created_at", { ascending: false });

	if (error || !documents) {
		console.error("Failed to list documents:", error?.message);
		return [];
	}

	// Get chunk counts per document
	const documentItems: DocumentListItem[] = [];
	for (const doc of documents) {
		const { count } = await supabase
			.from("document_chunks")
			.select("id", { count: "exact", head: true })
			.eq("document_id", doc.id);

		documentItems.push({
			id: doc.id,
			title: doc.title,
			createdAt: doc.created_at,
			chunkCount: count ?? 0,
		});
	}

	return documentItems;
}

/**
 * Delete a document (cascade deletes chunks via FK constraint)
 */
export async function deleteDocument(
	documentId: string,
): Promise<{ success: boolean; error?: string }> {
	const session = await getSession();
	if (!session.isAuthenticated) {
		return { success: false, error: "Not authenticated" };
	}

	const supabase = createServiceRoleClient();

	const { error } = await supabase
		.from("documents")
		.delete()
		.eq("id", documentId);

	if (error) {
		return {
			success: false,
			error: `Failed to delete document: ${error.message}`,
		};
	}

	revalidatePath("/admin");
	return { success: true };
}

/**
 * Get chunks for a specific document, ordered by position
 */
export async function getDocumentChunks(
	documentId: string,
): Promise<ChunkListItem[]> {
	const session = await getSession();
	if (!session.isAuthenticated) {
		return [];
	}

	const supabase = createServiceRoleClient();

	const { data: chunks, error } = await supabase
		.from("document_chunks")
		.select("id, content, section_heading, chunk_position, total_chunks")
		.eq("document_id", documentId)
		.order("chunk_position", { ascending: true });

	if (error || !chunks) {
		console.error("Failed to get document chunks:", error?.message);
		return [];
	}

	return chunks.map((chunk) => ({
		id: chunk.id,
		content: chunk.content,
		sectionHeading: chunk.section_heading,
		chunkPosition: chunk.chunk_position,
		totalChunks: chunk.total_chunks,
	}));
}
