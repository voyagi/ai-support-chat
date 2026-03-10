import { getDb } from "@/lib/db";

export interface ChatVolumeRow {
	date: string;
	conversations: number;
	messages: number;
}

/**
 * Fetch chat volume data aggregated by day or week
 * Returns zero-filled rows for dates with no activity
 */
export async function getChatVolume(
	period: "day" | "week" = "day",
	days = 30,
): Promise<ChatVolumeRow[]> {
	const sql = getDb();

	const interval = period === "day" ? "1 day" : "1 week";

	const data = await sql`
		WITH buckets AS (
			SELECT generate_series(
				date_trunc(${period}, now() - make_interval(days => ${days})),
				date_trunc(${period}, now()),
				${interval}::interval
			) AS bucket
		)
		SELECT
			b.bucket::date::text AS date,
			COALESCE(COUNT(DISTINCT c.id), 0)::int AS conversations,
			COALESCE(COUNT(DISTINCT m.id), 0)::int AS messages
		FROM buckets b
		LEFT JOIN conversations c
			ON c.created_at >= b.bucket AND c.created_at < b.bucket + ${interval}::interval
		LEFT JOIN messages m
			ON m.created_at >= b.bucket AND m.created_at < b.bucket + ${interval}::interval
		GROUP BY b.bucket
		ORDER BY b.bucket
	`;

	return data as ChatVolumeRow[];
}
