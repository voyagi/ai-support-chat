"use client";

import { AlertCircle, Send } from "lucide-react";
import { useId, useState } from "react";

interface ContactFormProps {
	conversationId: string;
	originalQuestion: string;
}

export function ContactForm({
	conversationId,
	originalQuestion,
}: ContactFormProps) {
	const nameId = useId();
	const emailId = useId();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					conversationId,
					name: name.trim(),
					email: email.trim(),
					question: originalQuestion,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to submit contact form");
			}

			setSubmitted(true);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to submit. Please try again.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		return (
			<div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
				<p className="text-green-800 dark:text-green-200 text-sm font-medium">
					Thanks! Our team will get back to you soon.
				</p>
			</div>
		);
	}

	return (
		<div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
			{/* Header */}
			<div className="flex items-center gap-2 mb-3">
				<AlertCircle
					size={20}
					className="text-amber-600 dark:text-amber-400 flex-shrink-0"
				/>
				<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
					Get help from our team
				</p>
			</div>

			{/* Original Question Context */}
			<div className="mb-3 text-sm text-amber-800 dark:text-amber-200">
				<p className="font-medium mb-1">Your question:</p>
				<p className="italic">{originalQuestion}</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-3">
				<div>
					<label
						htmlFor={nameId}
						className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-1"
					>
						Name
					</label>
					<input
						id={nameId}
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						disabled={submitting}
						className="
							w-full px-3 py-2 text-sm
							bg-white dark:bg-gray-800
							border border-gray-300 dark:border-gray-600
							text-gray-900 dark:text-gray-100
							rounded-lg
							focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400
							disabled:opacity-50 disabled:cursor-not-allowed
						"
						placeholder="Your name"
					/>
				</div>

				<div>
					<label
						htmlFor={emailId}
						className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-1"
					>
						Email
					</label>
					<input
						id={emailId}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={submitting}
						className="
							w-full px-3 py-2 text-sm
							bg-white dark:bg-gray-800
							border border-gray-300 dark:border-gray-600
							text-gray-900 dark:text-gray-100
							rounded-lg
							focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400
							disabled:opacity-50 disabled:cursor-not-allowed
						"
						placeholder="your@email.com"
					/>
				</div>

				{/* Error message */}
				{error && (
					<p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
				)}

				{/* Submit button */}
				<button
					type="submit"
					disabled={submitting}
					className="
						w-full flex items-center justify-center gap-2
						bg-amber-600 dark:bg-amber-500
						hover:bg-amber-700 dark:hover:bg-amber-600
						text-white font-medium text-sm
						px-4 py-2 rounded-lg
						transition-colors
						disabled:opacity-50 disabled:cursor-not-allowed
					"
				>
					{submitting ? (
						"Sending..."
					) : (
						<>
							<Send size={16} />
							Send Message
						</>
					)}
				</button>
			</form>
		</div>
	);
}
