import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		default: "FlowBoard - AI Customer Support",
		template: "%s | FlowBoard",
	},
	description:
		"Try the demo - Get instant answers from your knowledge base with AI-powered chat",
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	),
	openGraph: {
		title: "FlowBoard - AI Customer Support",
		description:
			"Try the demo - Get instant answers from your knowledge base with AI-powered chat",
		siteName: "FlowBoard",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "FlowBoard - AI Customer Support",
		description:
			"Try the demo - Get instant answers from your knowledge base with AI-powered chat",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.className} bg-white dark:bg-gray-900`}>
				<ThemeProvider
					attribute="data-theme"
					defaultTheme="system"
					enableSystem
					storageKey="theme"
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
