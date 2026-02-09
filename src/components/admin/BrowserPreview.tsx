"use client";

import { useEffect, useRef } from "react";
import type { WidgetConfig } from "./ConfigPanel";

interface BrowserPreviewProps {
	config: WidgetConfig;
}

export function BrowserPreview({ config }: BrowserPreviewProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		const sendConfig = () => {
			iframe.contentWindow?.postMessage(
				{ type: "CONFIG_UPDATE", config },
				window.location.origin,
			);
		};

		// Send config when iframe loads
		const handleLoad = () => {
			sendConfig();
		};

		iframe.addEventListener("load", handleLoad);

		// Also send immediately in case iframe is already loaded
		sendConfig();

		return () => {
			iframe.removeEventListener("load", handleLoad);
		};
	}, [config]);

	return (
		<div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-xl">
			{/* Browser toolbar */}
			<div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3">
				{/* Window dots */}
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-red-500" />
					<div className="w-3 h-3 rounded-full bg-yellow-500" />
					<div className="w-3 h-3 rounded-full bg-green-500" />
				</div>

				{/* Address bar */}
				<div className="flex-1 bg-white dark:bg-gray-900 rounded-md px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400">
					https://example.com
				</div>
			</div>

			{/* Content area with iframe */}
			<div className="h-[500px]">
				<iframe
					ref={iframeRef}
					src="/widget"
					title="Widget Preview"
					allow="clipboard-write"
					className="w-full h-full border-0"
				/>
			</div>
		</div>
	);
}
