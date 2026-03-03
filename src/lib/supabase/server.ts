import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
	throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabasePublishableKey) {
	throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
}

export async function createServerSupabaseClient() {
	const cookieStore = await cookies();

	return createServerClient(supabaseUrl, supabasePublishableKey, {
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
	return createClient(supabaseUrl, secretKey);
}
