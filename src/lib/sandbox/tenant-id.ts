import { createHash } from "node:crypto";

/**
 * Generates a deterministic tenant ID from an IP address.
 * Uses SHA-256 hash to anonymize the IP while ensuring consistent IDs per IP.
 */
export function getTenantIdFromIp(ip: string): string {
	const hash = createHash("sha256").update(ip).digest("hex");
	return `tenant_${hash.substring(0, 12)}`;
}
