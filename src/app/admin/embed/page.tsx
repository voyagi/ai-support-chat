import { redirect } from "next/navigation";
import { EmbedPage } from "@/components/admin/EmbedPage";
import { getSession } from "@/lib/auth/session";

export default async function AdminEmbedPage() {
	const session = await getSession();

	// Data Access Layer: verify session in Server Component
	if (!session.isAuthenticated) {
		redirect("/admin/login");
	}

	return <EmbedPage />;
}
