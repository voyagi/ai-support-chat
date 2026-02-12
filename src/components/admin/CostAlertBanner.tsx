"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CostStatus {
	cost: number;
	budget: number;
	percentUsed: number;
	level: "ok" | "warning" | "critical" | "shutoff";
	message: string;
}

export function CostAlertBanner() {
	const [status, setStatus] = useState<CostStatus | null>(null);
	const [dismissed, setDismissed] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchStatus() {
			try {
				const response = await fetch("/api/admin/cost-status");
				if (response.ok) {
					const data = await response.json();
					setStatus(data);
				}
			} catch (error) {
				console.error("Failed to fetch cost status:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchStatus();
	}, []);

	// Don't render anything while loading or if dismissed or if level is ok
	if (loading || dismissed || !status || status.level === "ok") {
		return null;
	}

	const isWarning = status.level === "warning";
	const isCritical = status.level === "critical";
	const isShutoff = status.level === "shutoff";

	const bgColor = isWarning
		? "bg-amber-50 dark:bg-amber-900/20"
		: "bg-red-50 dark:bg-red-900/20";
	const borderColor = isWarning
		? "border-amber-200 dark:border-amber-800"
		: "border-red-200 dark:border-red-800";
	const textColor = isWarning
		? "text-amber-800 dark:text-amber-200"
		: "text-red-800 dark:text-red-200";
	const iconColor = isWarning
		? "text-amber-600 dark:text-amber-400"
		: "text-red-600 dark:text-red-400";

	return (
		<div
			className={`${bgColor} ${borderColor} border-b px-4 py-3 flex items-center justify-between gap-3`}
		>
			<div className="flex items-center gap-3">
				<AlertTriangle className={iconColor} size={20} />
				<div className={`text-sm ${textColor}`}>
					{isShutoff ? (
						<>
							<strong>Budget exceeded:</strong> Chat service is disabled until
							tomorrow ($
							{status.cost.toFixed(2)} of ${status.budget})
						</>
					) : isCritical ? (
						<>
							<strong>Cost critical:</strong> {status.percentUsed.toFixed(0)}%
							of daily budget used (${status.cost.toFixed(2)} of $
							{status.budget}). Service will shut off at 100%.
						</>
					) : (
						<>
							<strong>Cost alert:</strong> {status.percentUsed.toFixed(0)}% of
							daily budget used (${status.cost.toFixed(2)} of ${status.budget})
						</>
					)}
				</div>
			</div>
			<button
				type="button"
				onClick={() => setDismissed(true)}
				className={`${textColor} hover:opacity-70 transition-opacity`}
				aria-label="Dismiss alert"
			>
				<X size={18} />
			</button>
		</div>
	);
}
