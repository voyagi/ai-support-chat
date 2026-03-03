import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabaseConfig() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!url) {
		throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
	}
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!key) {
		throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
	}
	return { url, key };
}

export async function createServerSupabaseClient() {
	const { url, key } = getSupabaseConfig();
	const cookieStore = await cookies();

	return createServerClient(url, key, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(
				cookiesToSet: Array<{
					name: string;
					value: string;
					options: CookieOptions;
				}>,
			) {
				for (const { name, value, options } of cookiesToSet) {
					cookieStore.set(name, value, options);
				}
			},
		},
	});
}

export function createServiceRoleClient() {
	const secretKey = process.env.SUPABASE_SECRET_KEY;
	if (!secretKey) {
		throw new Error("SUPABASE_SECRET_KEY is not set");
	}
	const { url } = getSupabaseConfig();
	return createClient(url, secretKey);
}
