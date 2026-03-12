import { getDb } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings/embeddings";
import { NextResponse } from "next/server";

// Use Node.js runtime to match chat route behavior

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const query = url.searchParams.get("q") || "What is FlowBoard pricing?";

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

		// Search with no threshold
		const results = await sql`
			SELECT document_title, section_heading,
				1 - (embedding <=> ${embeddingStr}::vector) AS similarity
			FROM document_chunks
			ORDER BY embedding <=> ${embeddingStr}::vector
			LIMIT 5
		`;

		return NextResponse.json({
			query,
			embeddingDimensions: embedding.length,
			documents: Number(docCount[0].count),
			chunks: Number(chunkCount[0].count),
			chunksWithEmbeddings: Number(embCount[0].count),
			topResults: results.map((r) => ({
				title: r.document_title,
				section: r.section_heading,
				similarity: Number(Number(r.similarity).toFixed(4)),
			})),
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
