import type { IronSession } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
	isAuthenticated: boolean;
	createdAt: number;
}

function getSessionOptions() {
	const secret = process.env.SESSION_SECRET;
	if (!secret) {
		throw new Error(
			"SESSION_SECRET environment variable is required. Generate one with: openssl rand -hex 32",
		);
	}
	return {
		password: secret,
		cookieName: "admin_session",
		ttl: 86400, // 24 hours
		cookieOptions: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax" as const,
			path: "/",
		},
	};
}

export type { IronSession };

export async function getSession(): Promise<IronSession<SessionData>> {
	const cookieStore = await cookies();
	return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
