import { createServiceRoleClient } from "@/lib/supabase/server";

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
	const supabase = createServiceRoleClient();

	// Count total assistant messages
	const { count: totalCount, error: totalError } = await supabase
		.from("messages")
		.select("*", { count: "exact", head: true })
		.eq("role", "assistant");

	if (totalError) {
		throw new Error(`Failed to fetch total messages: ${totalError.message}`);
	}

	// Count KB-answered assistant messages
	const { count: kbCount, error: kbError } = await supabase
		.from("messages")
		.select("*", { count: "exact", head: true })
		.eq("role", "assistant")
		.eq("answered_from_kb", true);

	if (kbError) {
		throw new Error(`Failed to fetch KB-answered count: ${kbError.message}`);
	}

	const totalMessages = totalCount ?? 0;
	const answeredFromKb = kbCount ?? 0;
	const fallbackToGeneral = totalMessages - answeredFromKb;
	const kbPercentage =
		totalMessages > 0 ? Math.round((answeredFromKb / totalMessages) * 100) : 0;

	return { totalMessages, answeredFromKb, fallbackToGeneral, kbPercentage };
}
