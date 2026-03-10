import { getDb } from "@/lib/db";

export interface AccuracyMetrics {
	totalMessages: number;
	answeredFromKb: number;
	fallbackToGeneral: number;
	kbPercentage: number;
}

/**
 * Compute response accuracy metrics
 * Counts assistant messages answered from KB vs fallback
 */
export async function getAccuracyMetrics(): Promise<AccuracyMetrics> {
	const sql = getDb();

	const rows = await sql`
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE answered_from_kb = true)::int AS kb_count
		FROM messages
		WHERE role = 'assistant'
	`;

	const totalMessages = (rows[0]?.total as number) ?? 0;
	const answeredFromKb = (rows[0]?.kb_count as number) ?? 0;
	const fallbackToGeneral = totalMessages - answeredFromKb;
	const kbPercentage =
		totalMessages > 0 ? Math.round((answeredFromKb / totalMessages) * 100) : 0;

	return { totalMessages, answeredFromKb, fallbackToGeneral, kbPercentage };
}
