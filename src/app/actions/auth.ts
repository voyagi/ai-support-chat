"use server";

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

	if (password !== process.env.ADMIN_PASSWORD) {
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
