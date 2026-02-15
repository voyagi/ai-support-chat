"use client";

import { Bot } from "lucide-react";

export default function ChatError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
			<div className="text-center max-w-md">
				<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
					<Bot size={32} />
				</div>
				<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
					Chat unavailable
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mb-4">
					Something went wrong loading the chat. Please try again.
				</p>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Reload chat
				</button>
			</div>
		</div>
	);
}
