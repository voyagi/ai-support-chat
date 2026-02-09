"use client";

import { SendHorizonal } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useId, useState } from "react";

interface ChatInputProps {
	onSubmit: (message: string) => void;
	disabled: boolean;
	placeholder?: string;
}

export function ChatInput({
	onSubmit,
	disabled,
	placeholder = "Ask a question...",
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

	return (
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
				placeholder={placeholder}
				aria-label="Chat message input"
				rows={1}
				className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg resize-none max-h-[6rem] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
			/>
			<button
				type="submit"
				disabled={disabled || !value.trim()}
				aria-label="Send message"
				className="flex-shrink-0 rounded-full p-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				<SendHorizonal size={20} />
			</button>
		</form>
	);
}
