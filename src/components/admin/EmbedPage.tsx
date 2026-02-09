"use client";

import { useState } from "react";
import { BrowserPreview } from "./BrowserPreview";
import { CodeBlock } from "./CodeBlock";
import { ConfigPanel, type WidgetConfig } from "./ConfigPanel";

function generateEmbedCode(config: WidgetConfig): string {
	const origin =
		typeof window !== "undefined"
			? window.location.origin
			: "https://your-domain.com";

	const attributes: string[] = [`src="${origin}/widget.js"`];

	// Add optional attributes only if they differ from defaults
	if (config.theme !== "light") {
		attributes.push(`data-theme="${config.theme}"`);
	}

	if (config.position !== "bottom-right") {
		attributes.push(`data-position="${config.position}"`);
	}

	if (config.greeting?.trim()) {
		attributes.push(`data-greeting="${config.greeting}"`);
	}

	return `<script ${attributes.join(" ")}></script>`;
}

export function EmbedPage() {
	const [config, setConfig] = useState<WidgetConfig>({
		position: "bottom-right",
		theme: "light",
	});

	const embedCode = generateEmbedCode(config);

	return (
		<div className="max-w-6xl mx-auto pt-8 px-6 pb-12">
			{/* Page heading */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Embed Widget
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">
					Add the chat widget to your website
				</p>
			</div>

			{/* Two-column layout */}
			<div className="grid lg:grid-cols-2 gap-8">
				{/* Left column: Config + Code */}
				<div className="space-y-6">
					<ConfigPanel config={config} onChange={setConfig} />

					<div>
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
							Paste this before <code className="text-xs">&lt;/body&gt;</code>{" "}
							on your website
						</p>
						<CodeBlock code={embedCode} />
					</div>
				</div>

				{/* Right column: Preview */}
				<div>
					<BrowserPreview config={config} />
				</div>
			</div>
		</div>
	);
}
