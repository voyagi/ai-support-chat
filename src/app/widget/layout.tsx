import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Chat Widget",
	robots: "noindex, nofollow",
};

export default function WidgetLayout({ children }: { children: ReactNode }) {
	return <div className="h-screen overflow-hidden">{children}</div>;
}
