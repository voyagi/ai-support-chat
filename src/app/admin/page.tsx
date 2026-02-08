import { redirect } from "next/navigation";
import { listDocuments } from "@/app/actions/documents";
import { getSession } from "@/lib/auth/session";
import { AdminDashboard } from "./AdminDashboard";

export default async function AdminDashboardPage() {
	const session = await getSession();

	// Data Access Layer: verify session in Server Component
	if (!session.isAuthenticated) {
		redirect("/admin/login");
	}

	const initialDocuments = await listDocuments();

	return <AdminDashboard initialDocuments={initialDocuments} />;
}
