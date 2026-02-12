import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getIpAddress } from "@/lib/rate-limit";

/**
 * Middleware handles two concerns:
 * 1. Optimistic redirect for unauthenticated /admin/* requests
 * 2. Rate limiting for /api/chat requests
 *
 * IMPORTANT: Admin auth check is NOT the sole auth gate. Every Server Component
 * and Server Action that accesses admin data must also call getSession() and
 * verify isAuthenticated (Data Access Layer pattern per CVE-2025-29927).
 * Middleware only provides fast redirect UX.
 */
export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Rate limiting for chat API (applies to both full-page and widget iframe)
	if (pathname === "/api/chat") {
		const ip = getIpAddress(request);
		const rateLimitResult = await checkRateLimit(ip);

		if (!rateLimitResult.success) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded",
					remaining: 0,
					reset: new Date(rateLimitResult.reset).toISOString(),
					retryAfterSeconds: Math.ceil(
						(rateLimitResult.reset - Date.now()) / 1000,
					),
				},
				{ status: 429 },
			);
		}

		// Add rate limit headers to response
		const response = NextResponse.next();
		response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
		response.headers.set(
			"X-RateLimit-Remaining",
			rateLimitResult.remaining.toString(),
		);
		response.headers.set(
			"X-RateLimit-Reset",
			new Date(rateLimitResult.reset).toISOString(),
		);
		return response;
	}

	// Admin auth redirect logic
	// Skip login page itself to avoid redirect loop
	if (pathname === "/admin/login") {
		return NextResponse.next();
	}

	// Check for session cookie existence (optimistic check only)
	const sessionCookie = request.cookies.get("admin_session");
	if (!sessionCookie) {
		const loginUrl = new URL("/admin/login", request.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*", "/api/chat"],
};
