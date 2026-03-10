import { getDb } from "@/lib/db";

/**
 * Maximum messages allowed per conversation (enforces 50-message cap)
 */
export const MAX_MESSAGES_PER_CONVERSATION = 50;

/**
 * Create a new conversation in the database
 * @returns UUID of the new conversation
 */
export async function createConversation(): Promise<string> {
	const sql = getDb();

	const rows = await sql`
		INSERT INTO conversations DEFAULT VALUES
		RETURNING id
	`;

	if (!rows[0]?.id) {
		throw new Error("Failed to create conversation: No ID returned");
	}

	return rows[0].id as string;
}

/**
 * Save user and assistant messages to a conversation
 */
export async function saveMessages(
	conversationId: string,
	userContent: string,
	assistantContent: string,
	answeredFromKb = true,
): Promise<void> {
	const sql = getDb();

	await sql`
		INSERT INTO messages (conversation_id, role, content, answered_from_kb)
		VALUES
			(${conversationId}, 'user', ${userContent}, NULL),
			(${conversationId}, 'assistant', ${assistantContent}, ${answeredFromKb})
	`;
}

/**
 * Get the total number of messages in a conversation
 */
export async function getMessageCount(
	conversationId: string | null | undefined,
): Promise<number> {
	if (!conversationId) {
		return 0;
	}

	const sql = getDb();

	const rows = await sql`
		SELECT COUNT(*)::int AS count
		FROM messages
		WHERE conversation_id = ${conversationId}
	`;

	return (rows[0]?.count as number) ?? 0;
}
