"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="text-center max-w-md">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
					Something went wrong
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mb-4">
					{error.message || "An unexpected error occurred."}
				</p>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
