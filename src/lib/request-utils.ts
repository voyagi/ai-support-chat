/**
 * Extract client IP address from a request.
 * Priority: request.ip (Vercel runtime) -> x-vercel-forwarded-for (trusted)
 * -> x-forwarded-for (first entry, spoofable) -> 127.0.0.1
 */
export function getClientIp(request: Request): string {
	// Vercel's NextRequest.ip is the most trusted source
	const ip = (request as unknown as { ip?: string }).ip;
	if (ip) {
		return ip;
	}

	// x-vercel-forwarded-for is set by Vercel's edge, not spoofable
	const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
	if (vercelForwardedFor) {
		return vercelForwardedFor.split(",")[0].trim();
	}

	// x-forwarded-for is spoofable but better than nothing
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	return "127.0.0.1";
}
