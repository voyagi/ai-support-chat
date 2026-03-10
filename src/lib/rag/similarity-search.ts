import { getDb } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings/embeddings";
import { getErrorMessage } from "@/lib/errors";

export interface SimilarChunk {
	id: string;
	documentId: string;
	documentTitle: string;
	sectionHeading: string;
	content: string;
	chunkPosition: number;
	totalChunks: number;
	similarity: number;
}

interface SearchOptions {
	threshold?: number;
	count?: number;
	tenantId?: string;
}

/**
 * Search for similar document chunks using pgvector similarity search
 * @param query - The search query text
 * @param options - Search configuration (threshold: 0-1 similarity score, count: max results)
 * @returns Array of similar chunks sorted by similarity (highest first)
 */
export async function searchSimilarChunks(
	query: string,
	options?: SearchOptions,
): Promise<SimilarChunk[]> {
	const threshold = options?.threshold ?? 0.7;
	const count = options?.count ?? 5;

	let queryEmbedding: number[];
	try {
		queryEmbedding = await generateEmbedding(query);
	} catch (error) {
		throw new Error(
			`Failed to generate embedding for query: ${getErrorMessage(error)}`,
		);
	}

	const sql = getDb();
	const embeddingStr = `[${queryEmbedding.join(",")}]`;
	const tenantId = options?.tenantId ?? null;

	const data = await sql`
		SELECT
			dc.id,
			dc.document_id,
			dc.document_title,
			dc.section_heading,
			dc.content,
			dc.chunk_position,
			dc.total_chunks,
			1 - (dc.embedding <=> ${embeddingStr}::vector) AS similarity
		FROM document_chunks dc
		WHERE 1 - (dc.embedding <=> ${embeddingStr}::vector) > ${threshold}
			AND (${tenantId}::text IS NULL OR dc.tenant_id = ${tenantId})
		ORDER BY dc.embedding <=> ${embeddingStr}::vector
		LIMIT ${count}
	`;

	if (!data || data.length === 0) {
		return [];
	}

	return data.map((row) => ({
		id: row.id as string,
		documentId: row.document_id as string,
		documentTitle: row.document_title as string,
		sectionHeading: row.section_heading as string,
		content: row.content as string,
		chunkPosition: row.chunk_position as number,
		totalChunks: row.total_chunks as number,
		similarity: row.similarity as number,
	}));
}
