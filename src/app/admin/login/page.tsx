import { ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function AdminLoginPage() {
	const session = await getSession();

	// Already authenticated -- redirect to admin dashboard
	if (session.isAuthenticated) {
		redirect("/admin");
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
			<div className="w-full max-w-md">
				{/* Login Card */}
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{/* Branding */}
					<div className="flex flex-col items-center mb-8">
						<div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-4">
							<Bot className="h-6 w-6" />
						</div>
						<h1 className="text-xl font-bold text-gray-900">AI Support Chat</h1>
						<p className="text-sm text-gray-500 mt-1">Admin Panel</p>
					</div>

					<LoginForm />
				</div>

				{/* Back link */}
				<div className="mt-6 text-center">
					<Link
						href="/"
						className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Back to home
					</Link>
				</div>
			</div>
		</div>
	);
}
