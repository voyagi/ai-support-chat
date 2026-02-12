import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// Shared Redis client for edge caching
const redis = Redis.fromEnv();

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

export function getIpAddress(request: NextRequest): string {
	// Try request.ip first (Vercel provides this at runtime)
	const ip = (request as unknown as { ip?: string }).ip;
	if (ip) {
		return ip;
	}

	// Fallback to x-forwarded-for header (first IP in comma-separated list)
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	// Last resort fallback
	return "127.0.0.1";
}
