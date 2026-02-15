"use client";

import { useEffect, useState } from "react";

export interface RateLimitState {
	rateLimitRemaining: number | null;
	rateLimitWarning: string | undefined;
	rateLimitMessage: string | undefined;
	rateLimitHit: boolean;
	budgetExceeded: boolean;
	setRateLimitRemaining: (n: number) => void;
	setRateLimitReset: (s: string) => void;
	setRateLimitHit: (b: boolean) => void;
	setBudgetExceeded: (b: boolean) => void;
}

/** Manages rate limit and budget state, countdown timer, and computed messages. */
export function useRateLimit(): RateLimitState {
	const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(
		null,
	);
	const [rateLimitReset, setRateLimitReset] = useState<string | null>(null);
	const [rateLimitHit, setRateLimitHit] = useState(false);
	const [budgetExceeded, setBudgetExceeded] = useState(false);
	const [countdown, setCountdown] = useState(0);

	// Countdown timer for rate limit reset
	useEffect(() => {
		if (!rateLimitHit || !rateLimitReset) {
			return;
		}

		const updateCountdown = () => {
			const resetTime = new Date(rateLimitReset).getTime();
			const now = Date.now();
			const secondsRemaining = Math.max(0, Math.ceil((resetTime - now) / 1000));
			setCountdown(secondsRemaining);

			if (secondsRemaining === 0) {
				setRateLimitHit(false);
			}
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, [rateLimitHit, rateLimitReset]);

	const rateLimitWarning =
		rateLimitRemaining !== null && rateLimitRemaining <= 4
			? `You have ${rateLimitRemaining} messages left`
			: undefined;

	const rateLimitMessage = rateLimitHit
		? (() => {
				const minutes = Math.floor(countdown / 60);
				const seconds = countdown % 60;
				const timeString =
					minutes > 0
						? `${minutes} minute${minutes > 1 ? "s" : ""}`
						: `${seconds} second${seconds !== 1 ? "s" : ""}`;
				return `You've reached the demo limit. Try again in ${timeString}. Want this for your business? Get in touch.`;
			})()
		: undefined;

	return {
		rateLimitRemaining,
		rateLimitWarning,
		rateLimitMessage,
		rateLimitHit,
		budgetExceeded,
		setRateLimitRemaining,
		setRateLimitReset,
		setRateLimitHit,
		setBudgetExceeded,
	};
}
