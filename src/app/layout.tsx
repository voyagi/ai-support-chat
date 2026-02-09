import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "AI Support Chat",
	description:
		"AI-powered customer support chatbot with knowledge base integration",
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
