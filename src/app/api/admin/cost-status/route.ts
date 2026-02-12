import {
	checkCostAlerts,
	DAILY_BUDGET,
	getCurrentCost,
} from "@/lib/cost-tracking";

export async function GET() {
	try {
		const cost = await getCurrentCost();
		const alert = checkCostAlerts(cost);
		const percentUsed = (cost / DAILY_BUDGET) * 100;

		return Response.json({
			cost,
			budget: DAILY_BUDGET,
			percentUsed,
			level: alert.level,
			message: alert.message,
		});
	} catch (error) {
		console.error("Failed to fetch cost status:", error);
		return Response.json(
			{ error: "Failed to fetch cost status" },
			{ status: 500 },
		);
	}
}
