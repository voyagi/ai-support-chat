import { Bot, LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();
	const isAuthenticated = session.isAuthenticated === true;

	// For unauthenticated users on non-login pages, redirect to login
	// (Data Access Layer pattern -- not relying solely on middleware)
	if (!isAuthenticated) {
		// Let the login page render without the nav shell
		return <>{children}</>;
	}

	// Authenticated: render admin shell with nav bar
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Top Navigation Bar */}
			<nav className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-14">
						{/* Logo / Brand */}
						<Link
							href="/admin"
							className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors"
						>
							<div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white">
								<Bot className="h-4 w-4" />
							</div>
							<span className="font-semibold text-sm">AI Support Chat</span>
							<span className="text-xs text-gray-400 font-normal">Admin</span>
						</Link>

						{/* Logout */}
						<form action={logout}>
							<button
								type="submit"
								className="
									inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
									text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100
									transition-colors
								"
							>
								<LogOut className="h-4 w-4" />
								Log out
							</button>
						</form>
					</div>
				</div>
			</nav>

			{/* Page Content */}
			<main>{children}</main>
		</div>
	);
}
