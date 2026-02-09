"use client";

import { useId } from "react";

export interface WidgetConfig {
	position: "bottom-right" | "bottom-left";
	theme: "light" | "dark";
	greeting?: string;
}

interface ConfigPanelProps {
	config: WidgetConfig;
	onChange: (config: WidgetConfig) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
	const positionId = useId();
	const themeId = useId();
	const greetingId = useId();

	return (
		<div className="space-y-6">
			<h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
				Widget Configuration
			</h2>

			<div className="space-y-4">
				{/* Position */}
				<div>
					<label
						htmlFor={positionId}
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Position
					</label>
					<select
						id={positionId}
						value={config.position}
						onChange={(e) =>
							onChange({
								...config,
								position: e.target.value as WidgetConfig["position"],
							})
						}
						className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="bottom-right">Bottom Right</option>
						<option value="bottom-left">Bottom Left</option>
					</select>
				</div>

				{/* Theme */}
				<div>
					<label
						htmlFor={themeId}
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Default Theme
					</label>
					<select
						id={themeId}
						value={config.theme}
						onChange={(e) =>
							onChange({
								...config,
								theme: e.target.value as WidgetConfig["theme"],
							})
						}
						className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
					</select>
				</div>

				{/* Greeting */}
				<div>
					<label
						htmlFor={greetingId}
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Custom Greeting
					</label>
					<textarea
						id={greetingId}
						rows={2}
						value={config.greeting || ""}
						onChange={(e) =>
							onChange({
								...config,
								greeting: e.target.value,
							})
						}
						placeholder="Hi! How can I help you today?"
						className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>
	);
}
