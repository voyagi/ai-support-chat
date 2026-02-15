export default function AdminLoading() {
	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="animate-pulse space-y-4">
				<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
				<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
				<div className="mt-6 space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
