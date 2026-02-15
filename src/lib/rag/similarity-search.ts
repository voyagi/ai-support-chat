import { generateEmbedding } from "@/lib/embeddings/embeddings";
import { getErrorMessage } from "@/lib/errors";
import { createServiceRoleClient } from "@/lib/supabase/server";

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

	// Generate embedding for the query
	let queryEmbedding: number[];
	try {
		queryEmbedding = await generateEmbedding(query);
	} catch (error) {
		throw new Error(
			`Failed to generate embedding for query: ${getErrorMessage(error)}`,
		);
	}

	// Query Supabase using RPC function
	const supabase = createServiceRoleClient();

	// Build RPC parameters, conditionally including tenant_id
	const rpcParams: Record<string, unknown> = {
		query_embedding: queryEmbedding,
		match_threshold: threshold,
		match_count: count,
	};

	// Add p_tenant_id if provided (enables multi-tenant RAG search)
	// Prefixed to avoid PostgreSQL column/parameter name collision
	if (options?.tenantId) {
		rpcParams.p_tenant_id = options.tenantId;
	}

	const { data, error } = await supabase.rpc(
		"match_document_chunks",
		rpcParams,
	);

	if (error) {
		throw new Error(
			`Similarity search RPC failed: ${error.message} (code: ${error.code})`,
		);
	}

	if (!data || data.length === 0) {
		return [];
	}

	// Map snake_case response to camelCase SimilarChunk interface
	return data.map(
		(row: {
			id: string;
			document_id: string;
			document_title: string;
			section_heading: string;
			content: string;
			chunk_position: number;
			total_chunks: number;
			similarity: number;
		}) => ({
			id: row.id,
			documentId: row.document_id,
			documentTitle: row.document_title,
			sectionHeading: row.section_heading,
			content: row.content,
			chunkPosition: row.chunk_position,
			totalChunks: row.total_chunks,
			similarity: row.similarity,
		}),
	);
}
