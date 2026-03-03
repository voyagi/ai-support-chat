import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Daily cleanup cron for sandbox tenant data.
 * Removes documents and chunks older than 24 hours (tenant_id IS NOT NULL only).
 * Called by Vercel Cron at 3 AM UTC.
 */
export async function GET(request: Request) {
	try {
		// Verify authorization
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			console.error("CRON_SECRET not configured");
			return NextResponse.json(
				{ success: false, error: "Cron secret not configured" },
				{ status: 500 },
			);
		}

		// Timing-safe comparison to prevent timing attacks on the secret
		// Vercel sends Authorization: Bearer <CRON_SECRET> on genuine cron invocations
		const expected = Buffer.from(`Bearer ${cronSecret}`, "utf-8");
		const actual = Buffer.from(authHeader ?? "", "utf-8");
		const isValidSecret =
			expected.length === actual.length && timingSafeEqual(expected, actual);

		if (!isValidSecret) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// Calculate cutoff time: 24 hours ago
		const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

		const supabase = createServiceRoleClient();

		// Delete tenant documents older than cutoff
		// FK cascade will automatically delete corresponding document_chunks
		const { count, error } = await supabase
			.from("documents")
			.delete({ count: "exact" })
			.not("tenant_id", "is", null) // Only delete tenant docs, not main KB
			.lt("created_at", cutoffTime);

		if (error) {
			console.error("Cleanup cron failed:", error);
			return NextResponse.json(
				{
					success: false,
					error: `Failed to delete documents: ${error.message}`,
				},
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			deletedCount: count ?? 0,
			cutoffTime,
		});
	} catch (error) {
		console.error("Cleanup cron error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
