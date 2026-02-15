import { withAdminAuth } from "@/lib/admin-auth";
import { getChatVolume } from "@/lib/analytics/chat-volume";

export const GET = withAdminAuth(async (req: Request) => {
	const url = new URL(req.url);
	const period = url.searchParams.get("period") === "week" ? "week" : "day";
	const daysParam = url.searchParams.get("days");
	const days = daysParam ? Math.min(Number.parseInt(daysParam, 10), 90) : 30;

	try {
		const data = await getChatVolume(period, days);
		return Response.json(data);
	} catch (error) {
		console.error("Chat volume API error:", error);
		return Response.json(
			{ error: "Failed to fetch chat volume data" },
			{ status: 500 },
		);
	}
});
