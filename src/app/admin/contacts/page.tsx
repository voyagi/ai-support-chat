import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ContactsTable } from "./ContactsTable";

export default async function ContactsPage() {
	const session = await getSession();
	if (!session.isAuthenticated) {
		redirect("/admin/login");
	}

	// Fetch contact submissions
	const supabase = createServiceRoleClient();
	const { data: submissions, error } = await supabase
		.from("contact_submissions")
		.select(
			"id, name, email, original_question, status, created_at, conversation_id",
		)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Failed to fetch contact submissions:", error);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Contact Submissions
				</h1>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Questions that couldn't be answered from the knowledge base
				</p>
			</div>

			{/* Contacts Table */}
			<ContactsTable submissions={submissions || []} />
		</div>
	);
}
