import { getAccuracyMetrics } from "@/lib/analytics/accuracy";
import { getSession } from "@/lib/auth/session";

export async function GET() {
	// Verify admin authentication
	const session = await getSession();
	if (!session.isAuthenticated) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await getAccuracyMetrics();
		return Response.json(data);
	} catch (error) {
		console.error("Accuracy API error:", error);
		return Response.json(
			{ error: "Failed to fetch accuracy metrics" },
			{ status: 500 },
		);
	}
}
