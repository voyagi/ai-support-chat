/**
 * Startup environment variable validation.
 * Called from instrumentation.ts on server startup to fail fast
 * with a clear message instead of cryptic runtime errors.
 */

const REQUIRED_SERVER_ENV = [
	"OPENAI_API_KEY",
	"DATABASE_URL",
	"SESSION_SECRET",
	"ADMIN_PASSWORD",
] as const;

export function validateEnv(): void {
	const missing = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}
}
