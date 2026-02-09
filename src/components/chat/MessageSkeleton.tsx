"use client";

export function MessageSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			{/* Assistant message skeleton */}
			<div className="flex gap-3">
				<div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300" />
				<div className="flex-1 max-w-[70%] space-y-2">
					<div className="h-4 bg-gray-300 rounded w-12" />
					<div className="bg-gray-200 rounded-lg rounded-bl-sm p-4 space-y-2">
						<div className="h-4 bg-gray-300 rounded w-3/4" />
						<div className="h-4 bg-gray-300 rounded w-1/2" />
					</div>
				</div>
			</div>

			{/* User message skeleton */}
			<div className="flex justify-end">
				<div className="bg-gray-300 rounded-lg rounded-br-sm p-4 max-w-[70%] space-y-2">
					<div className="h-4 bg-gray-400 rounded w-48" />
				</div>
			</div>

			{/* Assistant message skeleton */}
			<div className="flex gap-3">
				<div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300" />
				<div className="flex-1 max-w-[70%] space-y-2">
					<div className="h-4 bg-gray-300 rounded w-12" />
					<div className="bg-gray-200 rounded-lg rounded-bl-sm p-4 space-y-2">
						<div className="h-4 bg-gray-300 rounded w-full" />
						<div className="h-4 bg-gray-300 rounded w-4/5" />
						<div className="h-4 bg-gray-300 rounded w-2/3" />
					</div>
				</div>
			</div>
		</div>
	);
}
