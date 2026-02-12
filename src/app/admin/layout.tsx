import { Bot, LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { CostAlertBanner } from "@/components/admin/CostAlertBanner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Top Navigation Bar */}
			<nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-14">
						{/* Logo / Brand */}
						<div className="flex items-center gap-4">
							<Link
								href="/admin"
								className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
							>
								<div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white">
									<Bot className="h-4 w-4" />
								</div>
								<span className="font-semibold text-sm">AI Support Chat</span>
								<span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
									Admin
								</span>
							</Link>

							{/* Navigation Links */}
							<div className="flex items-center gap-1">
								<Link
									href="/admin"
									className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								>
									Knowledge Base
								</Link>
								<Link
									href="/admin/embed"
									className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								>
									Embed Widget
								</Link>
								<Link
									href="/admin/analytics"
									className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								>
									Analytics
								</Link>
								<Link
									href="/admin/contacts"
									className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								>
									Contacts
								</Link>
							</div>
						</div>

						{/* Theme Toggle + Logout */}
						<div className="flex items-center gap-2">
							<ThemeToggle />
							<form action={logout}>
								<button
									type="submit"
									className="
										inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
										text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800
										transition-colors
									"
								>
									<LogOut className="h-4 w-4" />
									Log out
								</button>
							</form>
						</div>
					</div>
				</div>
			</nav>

			{/* Cost Alert Banner */}
			<CostAlertBanner />

			{/* Page Content */}
			<main>{children}</main>
		</div>
	);
}
