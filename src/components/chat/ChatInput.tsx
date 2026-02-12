"use client";

import { SendHorizonal } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useId, useState } from "react";

interface ChatInputProps {
	onSubmit: (message: string) => void;
	disabled: boolean;
	placeholder?: string;
	rateLimitWarning?: string;
	rateLimitHit?: boolean;
	rateLimitMessage?: string;
	budgetExceeded?: boolean;
}

export function ChatInput({
	onSubmit,
	disabled,
	placeholder = "Ask a question...",
	rateLimitWarning,
	rateLimitHit = false,
	rateLimitMessage,
	budgetExceeded = false,
}: ChatInputProps) {
	const inputId = useId();
	const [value, setValue] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const trimmedValue = value.trim();
		if (trimmedValue && !disabled) {
			onSubmit(trimmedValue);
			setValue("");
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		// Submit on Enter (not Shift+Enter - that creates newline)
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			const form = e.currentTarget.form;
			if (form) {
				form.requestSubmit();
			}
		}
	};

	const isRateLimited = rateLimitHit || budgetExceeded;
	const isInputDisabled = disabled || isRateLimited;

	return (
		<div className="space-y-2">
			{rateLimitWarning && !isRateLimited && (
				<div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm text-amber-800 dark:text-amber-200">
					{rateLimitWarning}
				</div>
			)}

			<form onSubmit={handleSubmit} className="flex gap-2 items-end">
				<label htmlFor={inputId} className="sr-only">
					Message
				</label>
				<textarea
					id={inputId}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={disabled}
					aria-disabled={isInputDisabled}
					placeholder={placeholder}
					aria-label="Chat message input"
					rows={1}
					className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg resize-none max-h-[6rem] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
				/>
				<button
					type="submit"
					disabled={isInputDisabled || !value.trim()}
					aria-label="Send message"
					className="flex-shrink-0 rounded-full p-2.5 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
				>
					<SendHorizonal size={20} />
				</button>
			</form>

			{isRateLimited && (rateLimitMessage || budgetExceeded) && (
				<div
					role="alert"
					className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200"
				>
					{budgetExceeded
						? "Demo temporarily unavailable. Please try again tomorrow."
						: rateLimitMessage}
				</div>
			)}
		</div>
	);
}
