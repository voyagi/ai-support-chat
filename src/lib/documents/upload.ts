import { getDb } from "@/lib/db";
import { chunkMarkdown } from "@/lib/embeddings/chunker";
import { generateEmbeddings } from "@/lib/embeddings/embeddings";

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
 */
export async function processDocumentUpload(
	content: string,
	title: string,
	options?: UploadOptions,
): Promise<UploadResult> {
	const sql = getDb();
	let documentId: string | undefined;

	try {
		// Insert document record
		const docRows = await sql`
			INSERT INTO documents (title, content, tenant_id)
			VALUES (${title}, ${content}, ${options?.tenantId ?? null})
			RETURNING id
		`;

		if (!docRows[0]?.id) {
			throw new Error("Failed to insert document: No ID returned");
		}

		documentId = docRows[0].id as string;

		// Chunk the content
		const chunks = chunkMarkdown({ title, content });

		if (chunks.length === 0) {
			return { documentId, chunkCount: 0 };
		}

		// Generate embeddings for all chunks
		const chunkTexts = chunks.map((chunk) => chunk.content);
		const embeddings = await generateEmbeddings(chunkTexts);

		// Insert chunks with embeddings
		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			const embeddingStr = `[${embeddings[i].join(",")}]`;

			await sql`
				INSERT INTO document_chunks
					(document_id, document_title, section_heading, content, chunk_position, total_chunks, embedding, tenant_id)
				VALUES
					(${documentId}, ${chunk.documentTitle}, ${chunk.sectionHeading}, ${chunk.content}, ${chunk.position}, ${chunk.totalChunks}, ${embeddingStr}::vector, ${options?.tenantId ?? null})
			`;
		}

		return { documentId, chunkCount: chunks.length };
	} catch (error) {
		// Clean up orphan document if processing failed after insert
		if (documentId) {
			await sql`DELETE FROM documents WHERE id = ${documentId}`;
		}
		throw error;
	}
}
