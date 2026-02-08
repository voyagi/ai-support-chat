"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { chunkMarkdown } from "@/lib/embeddings/chunker";
import { generateEmbeddings } from "@/lib/embeddings/embeddings";
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
 * Upload a document: validate, insert, chunk, embed, store chunks
 * Cleans up orphan document if embedding fails
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

	const supabase = createServiceRoleClient();
	let documentId: string | undefined;

	try {
		// Read file content
		const content = await file.text();

		// Extract title: formData override > first # heading > filename
		const titleOverride = formData.get("title") as string | null;
		let title: string;
		if (titleOverride?.trim()) {
			title = titleOverride.trim();
		} else {
			const headingMatch = content.match(/^#\s+(.+)$/m);
			title = headingMatch
				? headingMatch[1].trim()
				: file.name.replace(/\.(txt|md)$/i, "");
		}

		// Insert document record
		const { data: document, error: docError } = await supabase
			.from("documents")
			.insert({ title, content })
			.select("id")
			.single();

		if (docError || !document) {
			throw new Error(
				`Failed to insert document: ${docError?.message ?? "Unknown error"}`,
			);
		}

		documentId = document.id;

		// Chunk the content
		const chunks = chunkMarkdown({ title, content });

		if (chunks.length === 0) {
			// Document was empty or below minimum chunk threshold -- keep doc but no chunks
			revalidatePath("/admin");
			return { success: true, documentId, chunkCount: 0 };
		}

		// Generate embeddings for all chunks
		const chunkTexts = chunks.map((chunk) => chunk.content);
		const embeddings = await generateEmbeddings(chunkTexts);

		// Prepare chunk records with all metadata
		const chunkRecords = chunks.map((chunk, index) => ({
			document_id: documentId,
			document_title: chunk.documentTitle,
			section_heading: chunk.sectionHeading,
			content: chunk.content,
			chunk_position: chunk.position,
			total_chunks: chunk.totalChunks,
			embedding: embeddings[index],
		}));

		// Insert chunks with embeddings
		const { error: chunksError } = await supabase
			.from("document_chunks")
			.insert(chunkRecords);

		if (chunksError) {
			throw new Error(`Failed to insert chunks: ${chunksError.message}`);
		}

		revalidatePath("/admin");
		return { success: true, documentId, chunkCount: chunks.length };
	} catch (error) {
		// Clean up orphan document if embedding/chunking failed after insert
		if (documentId) {
			await supabase.from("documents").delete().eq("id", documentId);
		}
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "An unexpected error occurred during upload",
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
