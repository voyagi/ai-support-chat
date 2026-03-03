"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export async function login(
	password: string,
): Promise<{ success: boolean; error?: string }> {
	if (!process.env.ADMIN_PASSWORD) {
		return {
			success: false,
			error: "Server misconfigured: ADMIN_PASSWORD not set",
		};
	}

	const expected = process.env.ADMIN_PASSWORD;
	const pwBuf = Buffer.from(password);
	const expBuf = Buffer.from(expected);
	if (pwBuf.length !== expBuf.length || !timingSafeEqual(pwBuf, expBuf)) {
		return { success: false, error: "Incorrect password" };
	}

	const session = await getSession();
	session.isAuthenticated = true;
	session.createdAt = Date.now();
	await session.save();

	return { success: true };
}

export async function logout(): Promise<void> {
	const session = await getSession();
	session.destroy();
	redirect("/admin/login");
}
