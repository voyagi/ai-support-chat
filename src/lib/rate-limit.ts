import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

let hourlyLimit: Ratelimit | null = null;
let dailyLimit: Ratelimit | null = null;

function getRateLimiters() {
	if (!hourlyLimit || !dailyLimit) {
		const redis = getRedis();
		hourlyLimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(20, "1 h"),
			analytics: true,
			prefix: "@upwork-ai-chatbot:hourly",
		});
		dailyLimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(100, "1 d"),
			analytics: true,
			prefix: "@upwork-ai-chatbot:daily",
		});
	}
	return { hourlyLimit, dailyLimit };
}

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

export async function checkRateLimit(
	identifier: string,
): Promise<RateLimitResult> {
	const { hourlyLimit, dailyLimit } = getRateLimiters();
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

let loginLimit: Ratelimit | null = null;

function getLoginLimiter() {
	if (!loginLimit) {
		const redis = getRedis();
		loginLimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(5, "15 m"),
			analytics: true,
			prefix: "@upwork-ai-chatbot:login",
		});
	}
	return loginLimit;
}

export async function checkLoginRateLimit(
	identifier: string,
): Promise<RateLimitResult> {
	const limiter = getLoginLimiter();
	const result = await limiter.limit(identifier);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset,
	};
}

export { getClientIp as getIpAddress } from "@/lib/request-utils";
