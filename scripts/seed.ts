import fs from "node:fs";
import path from "node:path";
import { chunkMarkdown } from "../src/lib/embeddings/chunker";
import { generateEmbeddings } from "../src/lib/embeddings/embeddings";
import { createServiceRoleClient } from "../src/lib/supabase/server";

const DRY_RUN = process.argv.includes("--dry-run");

interface DocumentStats {
	filename: string;
	title: string;
	chunkCount: number;
	totalTokens: number;
	success: boolean;
	error?: string;
}

/**
 * Extract document title from the first # heading
 */
function extractTitle(content: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : "Untitled Document";
}

/**
 * Seed a single document into Supabase
 */
async function seedDocument(
	filepath: string,
	filename: string,
): Promise<DocumentStats> {
	const stats: DocumentStats = {
		filename,
		title: "",
		chunkCount: 0,
		totalTokens: 0,
		success: false,
	};

	try {
		// Read file
		const content = fs.readFileSync(filepath, "utf-8");
		const title = extractTitle(content);
		stats.title = title;

		// Chunk the document
		const chunks = chunkMarkdown({ title, content });
		stats.chunkCount = chunks.length;
		stats.totalTokens = chunks.reduce(
			(sum, chunk) => sum + chunk.tokenCount,
			0,
		);

		console.log(
			`  ${filename}: ${chunks.length} chunks, ${stats.totalTokens} tokens`,
		);

		if (DRY_RUN) {
			stats.success = true;
			return stats;
		}

		// Database operations require credentials
		const supabase = createServiceRoleClient();

		// Check if document already exists (idempotency)
		const { data: existing } = await supabase
			.from("documents")
			.select("id")
			.eq("title", title)
			.single();

		if (existing) {
			// Delete existing document (cascade will delete chunks)
			console.log(`  Re-uploading existing document: ${title}`);
			await supabase.from("documents").delete().eq("id", existing.id);
		}

		// Insert document
		const { data: document, error: docError } = await supabase
			.from("documents")
			.insert({ title, content })
			.select("id")
			.single();

		if (docError || !document) {
			throw new Error(`Failed to insert document: ${docError?.message}`);
		}

		// Generate embeddings for all chunks
		const chunkTexts = chunks.map((chunk) => chunk.content);
		const embeddings = await generateEmbeddings(chunkTexts);

		// Prepare chunk records
		const chunkRecords = chunks.map((chunk, index) => ({
			document_id: document.id,
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

		stats.success = true;
	} catch (error) {
		stats.success = false;
		stats.error = error instanceof Error ? error.message : String(error);
		console.error(`  ERROR: ${stats.error}`);
	}

	return stats;
}

/**
 * Main seeding function
 */
async function main() {
	console.log("=== FlowBoard Knowledge Base Seeding ===");
	console.log(`Mode: ${DRY_RUN ? "DRY RUN (no API calls)" : "LIVE"}`);
	console.log();

	const fixturesDir = path.join(process.cwd(), "test", "fixtures");
	const files = fs
		.readdirSync(fixturesDir)
		.filter((file) => file.startsWith("flowboard-") && file.endsWith(".md"))
		.sort();

	console.log(`Found ${files.length} documents to seed:\n`);

	const allStats: DocumentStats[] = [];

	for (const file of files) {
		const filepath = path.join(fixturesDir, file);
		const stats = await seedDocument(filepath, file);
		allStats.push(stats);
	}

	// Summary
	console.log("\n=== Summary ===");
	const successCount = allStats.filter((s) => s.success).length;
	const failureCount = allStats.filter((s) => !s.success).length;
	const totalChunks = allStats.reduce((sum, s) => sum + s.chunkCount, 0);
	const totalTokens = allStats.reduce((sum, s) => sum + s.totalTokens, 0);

	console.log(`Documents processed: ${allStats.length}`);
	console.log(`  ✓ Success: ${successCount}`);
	if (failureCount > 0) {
		console.log(`  ✗ Failed: ${failureCount}`);
	}
	console.log(`Total chunks: ${totalChunks}`);
	console.log(`Total tokens: ${totalTokens}`);

	if (failureCount > 0) {
		console.log("\n=== Failures ===");
		for (const stat of allStats.filter((s) => !s.success)) {
			console.log(`${stat.filename}: ${stat.error}`);
		}
		process.exit(1);
	}

	console.log("\n✓ Seeding complete!");
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
