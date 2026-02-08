import fs from "node:fs";
import path from "node:path";
import {
	type EvaluationSummary,
	evaluateRetrieval,
	type TestCase,
} from "../src/lib/rag/evaluation";
import { searchSimilarChunks } from "../src/lib/rag/similarity-search";

/**
 * Extract document title from the first # heading
 */
function extractTitle(content: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : "Untitled Document";
}

/**
 * Build a map of fixture filename -> document title
 */
function buildFilenameToTitleMap(): Map<string, string> {
	const fixturesDir = path.join(process.cwd(), "test", "fixtures");
	const files = fs
		.readdirSync(fixturesDir)
		.filter((file) => file.startsWith("flowboard-") && file.endsWith(".md"));

	const titleMap = new Map<string, string>();

	for (const file of files) {
		const filepath = path.join(fixturesDir, file);
		const content = fs.readFileSync(filepath, "utf-8");
		const title = extractTitle(content);
		titleMap.set(file, title);
	}

	return titleMap;
}

/**
 * Print evaluation results in structured CLI format
 */
function printResults(summary: EvaluationSummary) {
	console.log("\n=== RAG Evaluation Results ===\n");

	// Overall metrics
	console.log("Overall Metrics:");
	console.log(`  Queries evaluated: ${summary.totalQueries}`);
	console.log(
		`  Average Precision@5: ${(summary.avgPrecisionAt5 * 100).toFixed(1)}%`,
	);
	console.log(
		`  Average Recall@20: ${(summary.avgRecallAt20 * 100).toFixed(1)}%`,
	);
	console.log(`  Status: ${summary.passed ? "✓ PASS" : "✗ FAIL"}`);
	console.log();

	// Similarity score distribution
	console.log("Similarity Score Distribution:");
	console.log(
		`  Total results retrieved: ${summary.similarityReport.totalResults}`,
	);
	console.log(
		`  Results with similarity >= 0.7: ${summary.similarityReport.resultsAboveThreshold} (${summary.similarityReport.percentAboveThreshold.toFixed(1)}%)`,
	);
	console.log(
		`  Average top-result similarity: ${summary.similarityReport.avgTopResultSimilarity.toFixed(3)}`,
	);
	console.log(
		`  Minimum top-result similarity: ${summary.similarityReport.minTopResultSimilarity.toFixed(3)}`,
	);

	if (summary.similarityReport.queriesWithWeakTopResult.length > 0) {
		console.log("\n  ⚠ Queries with weak top result (similarity < 0.7):");
		for (const query of summary.similarityReport.queriesWithWeakTopResult) {
			console.log(`    - ${query}`);
		}
	}
	console.log();

	// Breakdown by category
	console.log("Performance by Category:");
	for (const [category, stats] of Object.entries(summary.byCategory)) {
		console.log(
			`  ${category}: P@5=${(stats.avgPrecision * 100).toFixed(1)}% R@20=${(stats.avgRecall * 100).toFixed(1)}% (n=${stats.count})`,
		);
	}
	console.log();

	// Breakdown by difficulty
	console.log("Performance by Difficulty:");
	for (const [difficulty, stats] of Object.entries(summary.byDifficulty)) {
		console.log(
			`  ${difficulty}: P@5=${(stats.avgPrecision * 100).toFixed(1)}% R@20=${(stats.avgRecall * 100).toFixed(1)}% (n=${stats.count})`,
		);
	}
	console.log();

	// Per-query results
	console.log("Per-Query Results:");
	console.log("ID        | Status | P@5   | R@20  | Top Sim | >0.7 | Query");
	console.log(
		"----------|--------|-------|-------|---------|------|------------------------",
	);

	for (const result of summary.results) {
		const status = result.passed ? "✓" : "✗";
		const p5 = `${(result.precisionAt5 * 100).toFixed(0)}%`.padStart(5);
		const r20 = `${(result.recallAt20 * 100).toFixed(0)}%`.padStart(5);
		const topSim = result.topResultSimilarity.toFixed(3);
		const aboveThreshold = `${result.resultsAboveThreshold}/20`.padStart(4);
		const queryPreview =
			result.query.length > 40
				? `${result.query.slice(0, 37)}...`
				: result.query;

		console.log(
			`${result.queryId.padEnd(9)} | ${status}      | ${p5} | ${r20} | ${topSim}   | ${aboveThreshold} | ${queryPreview}`,
		);
	}
	console.log();

	// Failed queries details
	const failedQueries = summary.results.filter((r) => !r.passed);
	if (failedQueries.length > 0) {
		console.log(`Failed Queries (${failedQueries.length}):`);
		for (const result of failedQueries) {
			console.log(`\n  ${result.queryId}: ${result.query}`);
			console.log(
				`    Precision@5: ${(result.precisionAt5 * 100).toFixed(1)}% (need >= 70%)`,
			);
			console.log(
				`    Recall@20: ${(result.recallAt20 * 100).toFixed(1)}% (need >= 80%)`,
			);
			console.log(
				`    Expected documents: ${result.expectedDocuments.join(", ")}`,
			);
			console.log(
				`    Retrieved top 5: ${result.retrievedDocuments.slice(0, 5).join(", ")}`,
			);
		}
		console.log();
	}

	// Quality gate
	console.log("=== Quality Gate ===");
	console.log(
		`Precision@5 >= 70%: ${summary.avgPrecisionAt5 >= 0.7 ? "✓ PASS" : "✗ FAIL"}`,
	);
	console.log(
		`Recall@20 >= 80%: ${summary.avgRecallAt20 >= 0.8 ? "✓ PASS" : "✗ FAIL"}`,
	);
	console.log(
		`\nOverall: ${summary.passed ? "✓ PASS - RAG pipeline meets quality standards" : "✗ FAIL - RAG pipeline needs tuning"}`,
	);
	console.log();
}

/**
 * Main evaluation function
 */
async function main() {
	console.log("=== FlowBoard RAG Evaluation ===\n");

	// Load test cases
	const testCasesPath = path.join(
		process.cwd(),
		"test",
		"fixtures",
		"evaluation-queries.json",
	);
	const testCasesData = JSON.parse(fs.readFileSync(testCasesPath, "utf-8"));
	const testCases: TestCase[] = testCasesData.testCases;

	console.log(`Loaded ${testCases.length} test queries`);

	// Build filename -> title mapping
	const filenameToTitle = buildFilenameToTitleMap();
	console.log(`Mapped ${filenameToTitle.size} fixture documents\n`);

	// Convert expected filenames to expected titles for comparison
	const testCasesWithTitles = testCases.map((tc) => ({
		...tc,
		expectedDocuments: tc.expectedDocuments.map(
			(filename) => filenameToTitle.get(filename) || filename,
		),
	}));

	// Create search function wrapper
	const searchFn = async (
		query: string,
		count: number,
	): Promise<{ documentTitle: string; id: string; similarity: number }[]> => {
		const results = await searchSimilarChunks(query, {
			threshold: 0.0, // No threshold filtering for evaluation (we want all results)
			count,
		});

		return results.map((r) => ({
			documentTitle: r.documentTitle,
			id: r.id,
			similarity: r.similarity,
		}));
	};

	console.log("Running evaluation...\n");

	// Run evaluation
	const summary = await evaluateRetrieval(testCasesWithTitles, searchFn);

	// Print results
	printResults(summary);

	// Exit with appropriate code
	process.exit(summary.passed ? 0 : 1);
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
