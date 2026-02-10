import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
	const session = await getSession();
	if (!session.isAuthenticated) {
		redirect("/admin/login");
	}
	return <AnalyticsDashboard />;
}
