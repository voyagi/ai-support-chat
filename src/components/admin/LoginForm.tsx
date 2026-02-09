"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { login } from "@/app/actions/auth";

export function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [shake, setShake] = useState(false);
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);
	const passwordId = useId();

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		const formData = new FormData(event.currentTarget);
		const password = formData.get("password") as string;

		if (!password.trim()) {
			setError("Please enter a password");
			triggerShake();
			return;
		}

		startTransition(async () => {
			const result = await login(password);

			if (result.success) {
				router.push("/admin");
				router.refresh();
			} else {
				setError(result.error ?? "Login failed");
				triggerShake();
				inputRef.current?.select();
			}
		});
	}

	function triggerShake() {
		setShake(true);
		setTimeout(() => setShake(false), 500);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div>
				<label
					htmlFor={passwordId}
					className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
				>
					Admin Password
				</label>
				<div className="relative">
					<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
						<Lock
							className="h-4 w-4 text-gray-400 dark:text-gray-500"
							aria-hidden="true"
						/>
					</div>
					<input
						ref={inputRef}
						id={passwordId}
						name="password"
						type="password"
						autoComplete="current-password"
						disabled={isPending}
						className={`
							block w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2.5 pl-10 pr-4
							text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
							dark:bg-gray-700
							focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:outline-none
							disabled:opacity-50 disabled:cursor-not-allowed
							transition-colors
							${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}
						`}
						placeholder="Enter password"
					/>
				</div>
			</div>

			{error && (
				<p
					className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
					role="alert"
				>
					<span className="inline-block h-1 w-1 rounded-full bg-red-600 dark:bg-red-400" />
					{error}
				</p>
			)}

			<button
				type="submit"
				disabled={isPending}
				className="
					w-full rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2.5
					text-sm font-semibold text-white
					hover:bg-blue-700 dark:hover:bg-blue-400 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800
					disabled:opacity-50 disabled:cursor-not-allowed
					transition-all duration-200 flex items-center justify-center gap-2
				"
			>
				{isPending ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
						Logging in...
					</>
				) : (
					"Log in"
				)}
			</button>
		</form>
	);
}
