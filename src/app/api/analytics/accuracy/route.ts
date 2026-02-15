import { withAdminAuth } from "@/lib/admin-auth";
import { getAccuracyMetrics } from "@/lib/analytics/accuracy";

export const GET = withAdminAuth(async () => {
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
});
