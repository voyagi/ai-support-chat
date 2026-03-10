import { getDb } from "@/lib/db";

/**
 * GET /api/admin/metrics
 * Returns conversation and message counts for the admin dashboard.
 * Replaces Supabase Realtime subscriptions with polling.
 */
export async function GET() {
	try {
		const sql = getDb();

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayIso = today.toISOString();

		const rows = await sql`
			SELECT
				(SELECT COUNT(*)::int FROM conversations) AS total_conversations,
				(SELECT COUNT(*)::int FROM messages WHERE created_at >= ${todayIso}) AS messages_today,
				(SELECT COUNT(*)::int FROM messages) AS total_messages
		`;

		return Response.json({
			totalConversations: rows[0].total_conversations,
			messagesToday: rows[0].messages_today,
			totalMessages: rows[0].total_messages,
		});
	} catch (error) {
		console.error("Metrics API error:", error);
		return Response.json({ error: "Failed to fetch metrics" }, { status: 500 });
	}
}
