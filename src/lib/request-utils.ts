/**
 * Extract client IP address from a request.
 * Tries NextRequest.ip (Vercel runtime), then x-forwarded-for, then falls back to 127.0.0.1.
 */
export function getClientIp(request: Request): string {
	// Try request.ip first (Vercel's NextRequest provides this at runtime)
	const ip = (request as unknown as { ip?: string }).ip;
	if (ip) {
		return ip;
	}

	// Fallback to x-forwarded-for header (first IP in comma-separated list)
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	return "127.0.0.1";
}
