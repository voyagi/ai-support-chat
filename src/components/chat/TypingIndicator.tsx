"use client";

import { Bot } from "lucide-react";

export function TypingIndicator() {
	return (
		<div className="flex gap-3">
			{/* Bot avatar */}
			<div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
				<Bot size={20} />
			</div>

			{/* Typing animation bubble */}
			<div className="bg-gray-100 rounded-lg rounded-bl-sm px-4 py-3">
				<div className="flex gap-1">
					<span
						className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
						style={{ animationDelay: "0ms" }}
					/>
					<span
						className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
						style={{ animationDelay: "150ms" }}
					/>
					<span
						className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
						style={{ animationDelay: "300ms" }}
					/>
				</div>
			</div>
		</div>
	);
}
