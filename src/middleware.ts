import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic redirect for unauthenticated /admin/* requests.
 *
 * IMPORTANT: This is NOT the sole auth gate. Every Server Component and
 * Server Action that accesses admin data must also call getSession() and
 * verify isAuthenticated (Data Access Layer pattern per CVE-2025-29927).
 * Middleware only provides fast redirect UX.
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

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
	matcher: ["/admin/:path*"],
};
