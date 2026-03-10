import { getDb } from "@/lib/db";
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
 */
export async function checkSandboxLimits(
	tenantId: string,
): Promise<SandboxLimitCheck> {
	try {
		const sql = getDb();

		const rows = await sql`
			SELECT COUNT(*)::int AS count
			FROM documents
			WHERE tenant_id = ${tenantId}
		`;

		const currentCount = (rows[0]?.count as number) ?? 0;

		return {
			allowed: currentCount < SANDBOX_LIMITS.maxDocuments,
			currentCount,
			maxDocuments: SANDBOX_LIMITS.maxDocuments,
		};
	} catch (error) {
		return {
			allowed: false,
			currentCount: 0,
			maxDocuments: SANDBOX_LIMITS.maxDocuments,
			error: `Failed to check upload limits: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}
