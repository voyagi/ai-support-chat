"use client";

interface ContactSubmission {
	id: string;
	name: string;
	email: string;
	original_question: string;
	status: "pending" | "contacted" | "resolved";
	created_at: string;
	conversation_id: string | null;
}

interface ContactsTableProps {
	submissions: ContactSubmission[];
}

function StatusBadge({ status }: { status: ContactSubmission["status"] }) {
	const styles = {
		pending:
			"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
		contacted:
			"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
		resolved:
			"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
		>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
}

export function ContactsTable({ submissions }: ContactsTableProps) {
	if (submissions.length === 0) {
		return (
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
				<p className="text-gray-500 dark:text-gray-400">
					No contact submissions yet
				</p>
			</div>
		);
	}

	return (
		<>
			{/* Desktop Table */}
			<div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead className="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Date
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Name
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Email
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Question
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Status
							</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
						{submissions.map((submission) => {
							const date = new Date(submission.created_at);
							const dateString = date.toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
							});
							const timeString = date.toLocaleTimeString("en-US", {
								hour: "numeric",
								minute: "2-digit",
							});
							const truncatedQuestion =
								submission.original_question.length > 80
									? `${submission.original_question.slice(0, 80)}...`
									: submission.original_question;

							return (
								<tr key={submission.id}>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
										<div>{dateString}</div>
										<div className="text-gray-500 dark:text-gray-400 text-xs">
											{timeString}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
										{submission.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
										{submission.email}
									</td>
									<td
										className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
										title={submission.original_question}
									>
										{truncatedQuestion}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<StatusBadge status={submission.status} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Mobile Card Layout */}
			<div className="md:hidden space-y-4">
				{submissions.map((submission) => {
					const date = new Date(submission.created_at);
					const dateString = date.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					});
					const timeString = date.toLocaleTimeString("en-US", {
						hour: "numeric",
						minute: "2-digit",
					});

					return (
						<div
							key={submission.id}
							className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3"
						>
							<div className="flex items-start justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">
										{submission.name}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{submission.email}
									</p>
								</div>
								<StatusBadge status={submission.status} />
							</div>

							<div className="text-sm text-gray-900 dark:text-gray-100">
								<p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
									Question:
								</p>
								<p>{submission.original_question}</p>
							</div>

							<div className="text-xs text-gray-500 dark:text-gray-400">
								{dateString} at {timeString}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
