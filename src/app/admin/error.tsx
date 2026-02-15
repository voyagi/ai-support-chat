"use client";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
					Admin panel error
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mb-4">
					{error.message || "Failed to load admin content."}
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
