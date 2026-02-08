export interface Chunk {
	content: string; // The chunk text (section heading prepended)
	documentTitle: string; // Parent document title for citation
	sectionHeading: string; // H2 heading this chunk belongs to
	position: number; // Chunk N of M (1-indexed)
	totalChunks: number; // Total chunks in document (set after all chunks created)
	tokenCount: number; // Actual token count of content
}

export interface ChunkOptions {
	targetTokens: number; // Target chunk size (default 500)
	overlapPercent: number; // Overlap when subdividing (default 0.15)
	minChunkTokens: number; // Minimum chunk size to keep (default 50)
}

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
	targetTokens: 500,
	overlapPercent: 0.15,
	minChunkTokens: 50,
};
