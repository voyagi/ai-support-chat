import { getSession } from "@/lib/auth/session";

type RouteHandler = (req: Request) => Promise<Response>;

/** Wraps an API route handler with admin session authentication. */
export function withAdminAuth(handler: RouteHandler): RouteHandler {
	return async (req: Request) => {
		const session = await getSession();
		if (!session.isAuthenticated) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}
		return handler(req);
	};
}
