"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function WidgetPage() {
	const { setTheme } = useTheme();

	useEffect(() => {
		const appUrl = process.env.NEXT_PUBLIC_APP_URL;
		const isProduction = process.env.NODE_ENV === "production";

		// Validate message origin
		const isAllowedOrigin = (origin: string) => {
			if (!isProduction) return true;
			if (!appUrl) return false;
			return origin === appUrl;
		};

		// Listen for messages from parent window
		const handleMessage = (event: MessageEvent) => {
			if (!isAllowedOrigin(event.origin)) return;

			const { type, theme } = event.data ?? {};

			if (type === "THEME_UPDATE" && (theme === "light" || theme === "dark")) {
				setTheme(theme);
			}
		};

		window.addEventListener("message", handleMessage);

		// Notify parent that widget is ready
		window.parent.postMessage({ type: "WIDGET_READY" }, "*");

		// Track content height changes and report to parent
		const observer = new ResizeObserver(() => {
			const height = document.body.scrollHeight;
			window.parent.postMessage({ type: "RESIZE", data: { height } }, "*");
		});

		observer.observe(document.body);

		return () => {
			window.removeEventListener("message", handleMessage);
			observer.disconnect();
		};
	}, [setTheme]);

	return (
		<div className="h-full">
			<ChatWindow widget />
		</div>
	);
}
