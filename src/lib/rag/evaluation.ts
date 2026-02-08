/**
 * RAG Evaluation Metrics Library
 *
 * Provides functions to measure RAG retrieval quality:
 * - Precision@K: How many of the top K results are relevant
 * - Recall@K: How many of the relevant documents were found in top K
 * - Similarity Score Distribution: Tracks quality of similarity scores
 */

export interface SimilarityScoreReport {
	totalResults: number;
	resultsAboveThreshold: number;
	percentAboveThreshold: number;
	queriesWithWeakTopResult: string[];
	avgTopResultSimilarity: number;
	minTopResultSimilarity: number;
}

export interface EvaluationResult {
	queryId: string;
	query: string;
	category: string;
	difficulty: string;
	precisionAt5: number;
	recallAt20: number;
	topResultSimilarity: number;
	resultsAboveThreshold: number;
	retrievedDocuments: string[];
	expectedDocuments: string[];
	passed: boolean;
}

export interface EvaluationSummary {
	totalQueries: number;
	avgPrecisionAt5: number;
	avgRecallAt20: number;
	passed: boolean;
	similarityReport: SimilarityScoreReport;
	byCategory: Record<
		string,
		{ avgPrecision: number; avgRecall: number; count: number }
	>;
	byDifficulty: Record<
		string,
		{ avgPrecision: number; avgRecall: number; count: number }
	>;
	results: EvaluationResult[];
}

export interface TestCase {
	id: string;
	query: string;
	category: string;
	difficulty: string;
	expectedDocuments: string[];
	expectedTopics?: string[];
	expectedAnswer?: string;
}

/**
 * Calculate Precision@K: What fraction of top K results are relevant?
 *
 * @param retrievedIds - Array of retrieved chunk IDs (ordered by relevance)
 * @param relevantIds - Array of ground truth relevant chunk IDs
 * @param k - Number of top results to consider
 * @returns Precision score from 0.0 to 1.0
 */
export function calculatePrecisionAtK(
	retrievedIds: string[],
	relevantIds: string[],
	k: number,
): number {
	if (relevantIds.length === 0) {
		return 0;
	}

	const topK = retrievedIds.slice(0, k);
	const relevantSet = new Set(relevantIds);
	const relevantFound = topK.filter((id) => relevantSet.has(id)).length;

	return relevantFound / k;
}

/**
 * Evaluate retrieval quality across a set of test cases
 *
 * @param testCases - Array of test queries with expected documents
 * @param searchFn - Function that performs similarity search and returns results
 * @returns Complete evaluation summary with per-query and aggregate metrics
 */
export async function evaluateRetrieval(
	testCases: TestCase[],
	searchFn: (
		query: string,
		count: number,
	) => Promise<{ documentTitle: string; id: string; similarity: number }[]>,
): Promise<EvaluationSummary> {
	const results: EvaluationResult[] = [];
	const similarityScores: number[] = [];
	const topResultSimilarities: number[] = [];
	const queriesWithWeakTopResult: string[] = [];

	for (const testCase of testCases) {
		// Retrieve top 20 results for recall@20 calculation
		const searchResults = await searchFn(testCase.query, 20);

		// Extract document titles from results
		const retrievedTitles = searchResults.map((r) => r.documentTitle);
		const expectedTitles = testCase.expectedDocuments;

		// For precision@5: check how many of top 5 chunks come from expected documents
		const relevantResults = searchResults.filter((r) =>
			expectedTitles.includes(r.documentTitle),
		);
		const relevantIds = relevantResults.map((r) => r.id);
		const retrievedIds = searchResults.map((r) => r.id);
		const precisionAt5 = calculatePrecisionAtK(retrievedIds, relevantIds, 5);

		// For recall@20: check how many expected documents have at least one chunk in top 20
		const retrievedDocTitlesSet = new Set(retrievedTitles);
		const expectedDocsFound = expectedTitles.filter((title) =>
			retrievedDocTitlesSet.has(title),
		).length;
		const recallAt20 =
			expectedTitles.length > 0
				? expectedDocsFound / expectedTitles.length
				: 1.0;

		// Track similarity scores
		for (const result of searchResults) {
			similarityScores.push(result.similarity);
		}

		const topResultSimilarity = searchResults[0]?.similarity ?? 0;
		topResultSimilarities.push(topResultSimilarity);

		// Flag queries where top result is below 0.7 threshold
		if (topResultSimilarity < 0.7) {
			queriesWithWeakTopResult.push(
				`${testCase.id}: ${testCase.query} (similarity: ${topResultSimilarity.toFixed(3)})`,
			);
		}

		// Count results above threshold
		const resultsAboveThreshold = searchResults.filter(
			(r) => r.similarity >= 0.7,
		).length;

		// A query passes if precision@5 >= 0.7 AND recall@20 >= 0.8
		const passed = precisionAt5 >= 0.7 && recallAt20 >= 0.8;

		results.push({
			queryId: testCase.id,
			query: testCase.query,
			category: testCase.category,
			difficulty: testCase.difficulty,
			precisionAt5,
			recallAt20,
			topResultSimilarity,
			resultsAboveThreshold,
			retrievedDocuments: retrievedTitles,
			expectedDocuments: expectedTitles,
			passed,
		});
	}

	// Aggregate metrics
	const avgPrecisionAt5 =
		results.reduce((sum, r) => sum + r.precisionAt5, 0) / results.length;
	const avgRecallAt20 =
		results.reduce((sum, r) => sum + r.recallAt20, 0) / results.length;

	// Overall pass if aggregate meets thresholds
	const passed = avgPrecisionAt5 >= 0.7 && avgRecallAt20 >= 0.8;

	// Group by category
	const byCategory: Record<
		string,
		{ avgPrecision: number; avgRecall: number; count: number }
	> = {};
	for (const result of results) {
		if (!byCategory[result.category]) {
			byCategory[result.category] = { avgPrecision: 0, avgRecall: 0, count: 0 };
		}
		byCategory[result.category].avgPrecision += result.precisionAt5;
		byCategory[result.category].avgRecall += result.recallAt20;
		byCategory[result.category].count += 1;
	}
	for (const category in byCategory) {
		const stats = byCategory[category];
		stats.avgPrecision /= stats.count;
		stats.avgRecall /= stats.count;
	}

	// Group by difficulty
	const byDifficulty: Record<
		string,
		{ avgPrecision: number; avgRecall: number; count: number }
	> = {};
	for (const result of results) {
		if (!byDifficulty[result.difficulty]) {
			byDifficulty[result.difficulty] = {
				avgPrecision: 0,
				avgRecall: 0,
				count: 0,
			};
		}
		byDifficulty[result.difficulty].avgPrecision += result.precisionAt5;
		byDifficulty[result.difficulty].avgRecall += result.recallAt20;
		byDifficulty[result.difficulty].count += 1;
	}
	for (const difficulty in byDifficulty) {
		const stats = byDifficulty[difficulty];
		stats.avgPrecision /= stats.count;
		stats.avgRecall /= stats.count;
	}

	// Similarity score distribution
	const resultsAboveThreshold = similarityScores.filter((s) => s >= 0.7).length;
	const avgTopResultSimilarity =
		topResultSimilarities.reduce((sum, s) => sum + s, 0) /
		topResultSimilarities.length;
	const minTopResultSimilarity = Math.min(...topResultSimilarities);

	const similarityReport: SimilarityScoreReport = {
		totalResults: similarityScores.length,
		resultsAboveThreshold,
		percentAboveThreshold:
			(resultsAboveThreshold / similarityScores.length) * 100,
		queriesWithWeakTopResult,
		avgTopResultSimilarity,
		minTopResultSimilarity,
	};

	return {
		totalQueries: results.length,
		avgPrecisionAt5,
		avgRecallAt20,
		passed,
		similarityReport,
		byCategory,
		byDifficulty,
		results,
	};
}
