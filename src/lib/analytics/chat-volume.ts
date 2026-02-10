import { createServiceRoleClient } from "@/lib/supabase/server";

export interface ChatVolumeRow {
	date: string;
	conversations: number;
	messages: number;
}

/**
 * Fetch chat volume data aggregated by day or week
 * Uses PostgreSQL date_trunc via get_chat_volume RPC function
 * Returns zero-filled rows for dates with no activity
 */
export async function getChatVolume(
	period: "day" | "week" = "day",
	days = 30,
): Promise<ChatVolumeRow[]> {
	const supabase = createServiceRoleClient();

	const interval = period === "day" ? "1 day" : "1 week";

	const { data, error } = await supabase.rpc("get_chat_volume", {
		trunc_unit: period,
		interval_str: interval,
		days_back: days,
	});

	if (error) {
		throw new Error(`Failed to fetch chat volume: ${error.message}`);
	}

	return (data ?? []) as ChatVolumeRow[];
}
