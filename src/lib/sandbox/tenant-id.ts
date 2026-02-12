import { createHash } from "node:crypto";

/**
 * Generates a deterministic tenant ID from an IP address.
 * Uses SHA-256 hash to anonymize the IP while ensuring consistent IDs per IP.
 */
export function getTenantIdFromIp(ip: string): string {
	const hash = createHash("sha256").update(ip).digest("hex");
	return `tenant_${hash.substring(0, 12)}`;
}

/**
 * Extracts the client IP address from a request.
 * Handles Vercel's x-forwarded-for header and falls back to localhost.
 */
export function getIpFromRequest(request: Request): string {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		// x-forwarded-for can be comma-separated (client, proxy1, proxy2...)
		return forwardedFor.split(",")[0].trim();
	}
	return "127.0.0.1";
}
