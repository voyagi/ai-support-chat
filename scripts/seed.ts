import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { chunkMarkdown } from "../src/lib/embeddings/chunker";
import { generateEmbeddings } from "../src/lib/embeddings/embeddings";

const DRY_RUN = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL && !DRY_RUN) {
	console.error("Missing DATABASE_URL environment variable");
	process.exit(1);
}
const DATABASE_URL = process.env.DATABASE_URL ?? "";

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
 * Seed a single document into Neon
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
		const content = fs.readFileSync(filepath, "utf-8");
		const title = extractTitle(content);
		stats.title = title;

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

		const sql = neon(DATABASE_URL);

		// Check if document already exists (idempotency)
		const existing = await sql`
			SELECT id FROM documents WHERE title = ${title} LIMIT 1
		`;

		if (existing.length > 0) {
			console.log(`  Re-uploading existing document: ${title}`);
			await sql`DELETE FROM documents WHERE id = ${existing[0].id}`;
		}

		// Insert document
		const docRows = await sql`
			INSERT INTO documents (title, content)
			VALUES (${title}, ${content})
			RETURNING id
		`;

		if (!docRows[0]?.id) {
			throw new Error("Failed to insert document: No ID returned");
		}

		const documentId = docRows[0].id as string;

		// Generate embeddings for all chunks
		const chunkTexts = chunks.map((chunk) => chunk.content);
		const embeddings = await generateEmbeddings(chunkTexts);

		// Insert chunks with embeddings
		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			const embeddingStr = `[${embeddings[i].join(",")}]`;

			await sql`
				INSERT INTO document_chunks
					(document_id, document_title, section_heading, content, chunk_position, total_chunks, embedding)
				VALUES
					(${documentId}, ${chunk.documentTitle}, ${chunk.sectionHeading}, ${chunk.content}, ${chunk.position}, ${chunk.totalChunks}, ${embeddingStr}::vector)
			`;
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
	console.log(`  Success: ${successCount}`);
	if (failureCount > 0) {
		console.log(`  Failed: ${failureCount}`);
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

	console.log("\nSeeding complete!");
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
