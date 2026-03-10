import { getDb } from "@/lib/db";

/**
 * GET /api/admin/recent-questions
 * Returns the 10 most recent user questions.
 * Replaces browser Supabase client reads with server-side query.
 */
export async function GET() {
	try {
		const sql = getDb();

		const rows = await sql`
			SELECT id, content, created_at
			FROM messages
			WHERE role = 'user'
			ORDER BY created_at DESC
			LIMIT 10
		`;

		return Response.json(rows);
	} catch (error) {
		console.error("Recent questions API error:", error);
		return Response.json(
			{ error: "Failed to fetch recent questions" },
			{ status: 500 },
		);
	}
}
