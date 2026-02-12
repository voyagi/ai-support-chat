import { createServiceRoleClient } from "@/lib/supabase/server";
import { SANDBOX_LIMITS } from "./constants";

export { SANDBOX_LIMITS };

export interface SandboxLimitCheck {
	allowed: boolean;
	currentCount: number;
	maxDocuments: number;
	error?: string;
}

/**
 * Checks if a tenant can upload more documents.
 * Returns the current document count and whether more uploads are allowed.
 */
export async function checkSandboxLimits(
	tenantId: string,
): Promise<SandboxLimitCheck> {
	const supabase = createServiceRoleClient();

	const { count, error } = await supabase
		.from("documents")
		.select("*", { count: "exact", head: true })
		.eq("tenant_id", tenantId);

	if (error) {
		return {
			allowed: false,
			currentCount: 0,
			maxDocuments: SANDBOX_LIMITS.maxDocuments,
			error: `Failed to check upload limits: ${error.message}`,
		};
	}

	const currentCount = count ?? 0;

	return {
		allowed: currentCount < SANDBOX_LIMITS.maxDocuments,
		currentCount,
		maxDocuments: SANDBOX_LIMITS.maxDocuments,
	};
}
