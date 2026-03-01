import { getRedis } from "@/lib/redis";

// OpenAI pricing for gpt-4.1-mini (per 1M tokens)
const PRICING = {
	input: 0.15, // $0.15 per 1M input tokens
	output: 0.6, // $0.60 per 1M output tokens
};

// Daily budget and alert thresholds
export const DAILY_BUDGET = 10; // dollars

export const ALERT_THRESHOLDS = {
	warning: { percent: 50, amount: 5 }, // $5 (50%)
	critical: { percent: 80, amount: 8 }, // $8 (80%)
	shutoff: { percent: 100, amount: 10 }, // $10 (100%)
};

export type AlertLevel = "ok" | "warning" | "critical" | "shutoff";

export interface CostAlert {
	level: AlertLevel;
	message: string;
}

export interface BudgetStatus {
	allowed: boolean;
	current: number;
	budget: number;
	percentUsed: number;
}

function getTodayKey(): string {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	return `cost:${today}`;
}

export async function getCurrentCost(): Promise<number> {
	const key = getTodayKey();
	const cost = await getRedis().get<number>(key);
	return cost ?? 0;
}

export async function trackChatCost(
	inputTokens: number,
	outputTokens: number,
): Promise<void> {
	const inputCost = (inputTokens / 1_000_000) * PRICING.input;
	const outputCost = (outputTokens / 1_000_000) * PRICING.output;
	const totalCost = inputCost + outputCost;

	const key = getTodayKey();

	const redis = getRedis();

	// Atomically increment the cost for today
	await redis.incrbyfloat(key, totalCost);

	// Set TTL to 2 days if this is a new key
	const ttl = await redis.ttl(key);
	if (ttl === -1) {
		// -1 means key exists but has no expiration
		await redis.expire(key, 172800); // 2 days in seconds
	}
}

export async function checkBudgetRemaining(): Promise<BudgetStatus> {
	const current = await getCurrentCost();
	const percentUsed = (current / DAILY_BUDGET) * 100;
	const allowed = current < DAILY_BUDGET;

	return {
		allowed,
		current,
		budget: DAILY_BUDGET,
		percentUsed,
	};
}

export function checkCostAlerts(currentCost: number): CostAlert {
	const percentUsed = (currentCost / DAILY_BUDGET) * 100;

	if (currentCost >= ALERT_THRESHOLDS.shutoff.amount) {
		return {
			level: "shutoff",
			message: `Daily budget exceeded ($${currentCost.toFixed(2)} of $${DAILY_BUDGET}). Service is disabled until tomorrow.`,
		};
	}

	if (currentCost >= ALERT_THRESHOLDS.critical.amount) {
		return {
			level: "critical",
			message: `${percentUsed.toFixed(0)}% of daily budget used ($${currentCost.toFixed(2)} of $${DAILY_BUDGET}). Service will shut off at 100%.`,
		};
	}

	if (currentCost >= ALERT_THRESHOLDS.warning.amount) {
		return {
			level: "warning",
			message: `${percentUsed.toFixed(0)}% of daily budget used ($${currentCost.toFixed(2)} of $${DAILY_BUDGET}).`,
		};
	}

	return {
		level: "ok",
		message: "Budget usage is normal.",
	};
}
