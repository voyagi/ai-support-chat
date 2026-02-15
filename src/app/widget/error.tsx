"use client";

export default function WidgetError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="h-full flex items-center justify-center p-4">
			<div className="text-center">
				<p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
					Something went wrong. Please try again.
				</p>
				<button
					type="button"
					onClick={reset}
					className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Reload
				</button>
			</div>
		</div>
	);
}
