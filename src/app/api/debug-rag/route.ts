import { getDb } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings/embeddings";
import { searchSimilarChunks } from "@/lib/rag/similarity-search";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const query = url.searchParams.get("q") || "What is TechStart pricing?";

		const sql = getDb();

		// Count documents and chunks
		const docCount = await sql`SELECT COUNT(*) as count FROM documents`;
		const chunkCount = await sql`SELECT COUNT(*) as count FROM document_chunks`;
		const embCount =
			await sql`SELECT COUNT(*) as count FROM document_chunks WHERE embedding IS NOT NULL`;

		// Generate embedding
		let embedding: number[];
		try {
			embedding = await generateEmbedding(query);
		} catch (e) {
			return NextResponse.json({
				error: "Embedding generation failed",
				message: e instanceof Error ? e.message : String(e),
				documents: Number(docCount[0].count),
				chunks: Number(chunkCount[0].count),
				chunksWithEmbeddings: Number(embCount[0].count),
			});
		}

		const embeddingStr = `[${embedding.join(",")}]`;

		// Raw SQL search (no threshold filter)
		const rawResults = await sql`
			SELECT document_title, section_heading,
				1 - (embedding <=> ${embeddingStr}::vector) AS similarity
			FROM document_chunks
			ORDER BY embedding <=> ${embeddingStr}::vector
			LIMIT 5
		`;

		// Also test via searchSimilarChunks (the function the chat route uses)
		let functionResults;
		let functionError;
		try {
			functionResults = await searchSimilarChunks(query, {
				threshold: 0.7,
				count: 5,
			});
		} catch (e) {
			functionError = e instanceof Error ? e.message : String(e);
		}

		return NextResponse.json({
			query,
			embeddingDimensions: embedding.length,
			documents: Number(docCount[0].count),
			chunks: Number(chunkCount[0].count),
			chunksWithEmbeddings: Number(embCount[0].count),
			sandboxEnabled: process.env.NEXT_PUBLIC_SANDBOX_ENABLED,
			rawResults: rawResults.map((r) => ({
				title: r.document_title,
				section: r.section_heading,
				similarity: Number(Number(r.similarity).toFixed(4)),
			})),
			functionResults: functionResults
				? functionResults.map((r) => ({
						title: r.documentTitle,
						similarity: r.similarity,
					}))
				: null,
			functionError: functionError || null,
		});
	} catch (e) {
		return NextResponse.json(
			{
				error: "Debug endpoint failed",
				message: e instanceof Error ? e.message : String(e),
			},
			{ status: 500 },
		);
	}
}
