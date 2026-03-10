"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import {
	extractDocumentTitle,
	processDocumentUpload,
} from "@/lib/documents/upload";
import { getErrorMessage } from "@/lib/errors";

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

	const sql = getDb();

	const rows = await sql`
		SELECT
			d.id,
			d.title,
			d.created_at,
			COUNT(dc.id)::int AS chunk_count
		FROM documents d
		LEFT JOIN document_chunks dc ON dc.document_id = d.id
		GROUP BY d.id, d.title, d.created_at
		ORDER BY d.created_at DESC
	`;

	return rows.map((row) => ({
		id: row.id as string,
		title: row.title as string,
		createdAt: row.created_at as string,
		chunkCount: row.chunk_count as number,
	}));
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

	try {
		const sql = getDb();
		await sql`DELETE FROM documents WHERE id = ${documentId}`;

		revalidatePath("/admin");
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: `Failed to delete document: ${getErrorMessage(error)}`,
		};
	}
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

	const sql = getDb();

	const rows = await sql`
		SELECT id, content, section_heading, chunk_position, total_chunks
		FROM document_chunks
		WHERE document_id = ${documentId}
		ORDER BY chunk_position ASC
	`;

	return rows.map((row) => ({
		id: row.id as string,
		content: row.content as string,
		sectionHeading: row.section_heading as string,
		chunkPosition: row.chunk_position as number,
		totalChunks: row.total_chunks as number,
	}));
}
