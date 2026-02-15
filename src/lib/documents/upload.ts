import { chunkMarkdown } from "@/lib/embeddings/chunker";
import { generateEmbeddings } from "@/lib/embeddings/embeddings";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface UploadOptions {
	tenantId?: string;
}

interface UploadResult {
	documentId: string;
	chunkCount: number;
}

/**
 * Extract document title from content.
 * Priority: explicit override > first markdown heading > filename stem.
 */
export function extractDocumentTitle(
	content: string,
	fileName: string,
	titleOverride?: string | null,
): string {
	if (titleOverride?.trim()) {
		return titleOverride.trim();
	}
	const headingMatch = content.match(/^#\s+(.+)$/m);
	return headingMatch
		? headingMatch[1].trim()
		: fileName.replace(/\.(txt|md|pdf)$/i, "");
}

/**
 * Core document upload pipeline: insert record, chunk, embed, store chunks.
 * Cleans up the document record on failure.
 * Callers handle auth, file validation, and response formatting.
 */
export async function processDocumentUpload(
	content: string,
	title: string,
	options?: UploadOptions,
): Promise<UploadResult> {
	const supabase = createServiceRoleClient();
	let documentId: string | undefined;

	try {
		// Insert document record
		const insertData: Record<string, unknown> = { title, content };
		if (options?.tenantId) {
			insertData.tenant_id = options.tenantId;
		}

		const { data: document, error: docError } = await supabase
			.from("documents")
			.insert(insertData)
			.select("id")
			.single();

		if (docError || !document) {
			throw new Error(
				`Failed to insert document: ${docError?.message ?? "Unknown error"}`,
			);
		}

		documentId = document.id;
		const confirmedId: string = document.id;

		// Chunk the content
		const chunks = chunkMarkdown({ title, content });

		if (chunks.length === 0) {
			return { documentId: confirmedId, chunkCount: 0 };
		}

		// Generate embeddings for all chunks
		const chunkTexts = chunks.map((chunk) => chunk.content);
		const embeddings = await generateEmbeddings(chunkTexts);

		// Prepare chunk records with metadata
		const chunkRecords = chunks.map((chunk, index) => {
			const record: Record<string, unknown> = {
				document_id: confirmedId,
				document_title: chunk.documentTitle,
				section_heading: chunk.sectionHeading,
				content: chunk.content,
				chunk_position: chunk.position,
				total_chunks: chunk.totalChunks,
				embedding: embeddings[index],
			};
			if (options?.tenantId) {
				record.tenant_id = options.tenantId;
			}
			return record;
		});

		// Insert chunks with embeddings
		const { error: chunksError } = await supabase
			.from("document_chunks")
			.insert(chunkRecords);

		if (chunksError) {
			throw new Error(`Failed to insert chunks: ${chunksError.message}`);
		}

		return { documentId: confirmedId, chunkCount: chunks.length };
	} catch (error) {
		// Clean up orphan document if processing failed after insert
		if (documentId) {
			await supabase.from("documents").delete().eq("id", documentId);
		}
		throw error;
	}
}
