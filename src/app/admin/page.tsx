import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
	const session = await getSession();

	// Data Access Layer: verify session in Server Component
	if (!session.isAuthenticated) {
		redirect("/admin/login");
	}

	return (
		<div className="max-w-6xl mx-auto pt-8 px-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
				<p className="text-gray-500 mt-1">Upload and manage your documents</p>
			</div>

			{/* Placeholder for DocumentTable and UploadZone (Plan 03) */}
			<div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
				<FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
				<p className="text-sm text-gray-500">
					Document management will be available in the next update.
				</p>
			</div>
		</div>
	);
}
