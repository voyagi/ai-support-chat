import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

const redis = getRedis();

// Two rate limiter singletons created OUTSIDE handlers for edge caching
export const hourlyLimit = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(20, "1 h"),
	analytics: true,
	prefix: "@upwork-ai-chatbot:hourly",
});

export const dailyLimit = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(100, "1 d"),
	analytics: true,
	prefix: "@upwork-ai-chatbot:daily",
});

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

export async function checkRateLimit(
	identifier: string,
): Promise<RateLimitResult> {
	const [hourlyResult, dailyResult] = await Promise.all([
		hourlyLimit.limit(identifier),
		dailyLimit.limit(identifier),
	]);

	// Use the tighter limit (whichever has lower remaining count)
	const hourlyRemaining = hourlyResult.remaining;
	const dailyRemaining = dailyResult.remaining;

	const isTighterHourly = hourlyRemaining < dailyRemaining;
	const tighterLimit = isTighterHourly ? hourlyResult : dailyResult;

	return {
		success: hourlyResult.success && dailyResult.success,
		limit: tighterLimit.limit,
		remaining: Math.min(hourlyRemaining, dailyRemaining),
		reset: tighterLimit.reset,
	};
}

export { getClientIp as getIpAddress } from "@/lib/request-utils";
