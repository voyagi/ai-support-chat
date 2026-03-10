import { getDb } from "@/lib/db";

interface ContactSubmissionBody {
	conversationId: string | null;
	name: string;
	email: string;
	question: string;
}

/**
 * POST /api/contact
 * Submit a contact form when bot lacks a confident answer.
 * This endpoint is public (no auth), called from the chat UI and widget.
 * No CSRF protection: the widget runs on external sites via iframe,
 * so origin checks would break it. Rate limiting in middleware is the
 * primary abuse defense.
 */
export async function POST(req: Request) {
	try {
		// 1. Parse and validate request body
		const body = (await req.json()) as Partial<ContactSubmissionBody>;

		// Validate required fields
		if (
			!body.name ||
			typeof body.name !== "string" ||
			body.name.trim() === ""
		) {
			return Response.json(
				{ error: "Name is required and must not be empty" },
				{ status: 400 },
			);
		}

		if (
			!body.email ||
			typeof body.email !== "string" ||
			body.email.trim() === ""
		) {
			return Response.json(
				{ error: "Email is required and must not be empty" },
				{ status: 400 },
			);
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email.trim())) {
			return Response.json(
				{ error: "Email format is invalid" },
				{ status: 400 },
			);
		}

		if (
			!body.question ||
			typeof body.question !== "string" ||
			body.question.trim() === ""
		) {
			return Response.json(
				{ error: "Question is required and must not be empty" },
				{ status: 400 },
			);
		}

		// Field length limits
		if (body.name.length > 100) {
			return Response.json(
				{ error: "Name must be 100 characters or fewer" },
				{ status: 400 },
			);
		}
		if (body.email.length > 254) {
			return Response.json(
				{ error: "Email must be 254 characters or fewer" },
				{ status: 400 },
			);
		}
		if (body.question.length > 5000) {
			return Response.json(
				{ error: "Question must be 5000 characters or fewer" },
				{ status: 400 },
			);
		}

		// 2. Insert into database
		const sql = getDb();
		const rows = await sql`
			INSERT INTO contact_submissions (conversation_id, name, email, original_question, status)
			VALUES (${body.conversationId || null}, ${body.name.trim()}, ${body.email.trim()}, ${body.question.trim()}, 'pending')
			RETURNING id
		`;

		if (!rows[0]?.id) {
			console.error("Contact submission created but no ID returned");
			return Response.json(
				{ error: "Failed to save contact submission. Please try again." },
				{ status: 500 },
			);
		}

		// 3. Return success
		return Response.json({
			success: true,
			id: rows[0].id,
		});
	} catch (error) {
		console.error("Contact API error:", error);
		return Response.json(
			{ error: "An unexpected error occurred. Please try again." },
			{ status: 500 },
		);
	}
}
