import { createServiceRoleClient } from "@/lib/supabase/server";

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

		// conversationId is optional (can be null for edge cases)

		// 2. Insert into database
		const supabase = createServiceRoleClient();
		const { data, error } = await supabase
			.from("contact_submissions")
			.insert({
				conversation_id: body.conversationId || null,
				name: body.name.trim(),
				email: body.email.trim(),
				original_question: body.question.trim(),
				status: "pending",
			})
			.select("id")
			.single();

		if (error) {
			console.error("Failed to save contact submission:", error);
			return Response.json(
				{ error: "Failed to save contact submission. Please try again." },
				{ status: 500 },
			);
		}

		if (!data?.id) {
			console.error("Contact submission created but no ID returned");
			return Response.json(
				{ error: "Failed to save contact submission. Please try again." },
				{ status: 500 },
			);
		}

		// 3. Return success
		return Response.json({
			success: true,
			id: data.id,
		});
	} catch (error) {
		console.error("Contact API error:", error);
		return Response.json(
			{ error: "An unexpected error occurred. Please try again." },
			{ status: 500 },
		);
	}
}
