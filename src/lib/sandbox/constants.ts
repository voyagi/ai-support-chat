/**
 * Sandbox mode limits (shared between client and server).
 * Extracted to avoid server-side imports in client components.
 */
export const SANDBOX_LIMITS = {
	maxDocuments: 3,
	maxPagesPerDoc: 10,
	allowedTypes: [".txt", ".md", ".pdf"],
	maxFileSizeMb: 5,
} as const;
