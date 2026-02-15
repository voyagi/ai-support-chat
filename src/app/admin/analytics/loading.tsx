export default function AnalyticsLoading() {
	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<div className="animate-pulse space-y-6">
				<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-36" />
				{/* Metric cards skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={`metric-${i}`}
							className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
						/>
					))}
				</div>
				{/* Chart skeleton */}
				<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
			</div>
		</div>
	);
}
