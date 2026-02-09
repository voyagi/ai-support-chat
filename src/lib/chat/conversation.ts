import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Maximum messages allowed per conversation (enforces 50-message cap)
 */
export const MAX_MESSAGES_PER_CONVERSATION = 50;

/**
 * Create a new conversation in the database
 * @returns UUID of the new conversation
 * @throws Error with descriptive message if creation fails
 */
export async function createConversation(): Promise<string> {
	const supabase = createServiceRoleClient();

	const { data, error } = await supabase
		.from("conversations")
		.insert({})
		.select("id")
		.single();

	if (error) {
		throw new Error(`Failed to create conversation: ${error.message}`);
	}

	if (!data?.id) {
		throw new Error("Failed to create conversation: No ID returned");
	}

	return data.id;
}

/**
 * Save user and assistant messages to a conversation
 * Inserts both messages in a single database call
 * @param conversationId - UUID of the conversation
 * @param userContent - User's message content
 * @param assistantContent - Assistant's response content
 * @throws Error with descriptive message if save fails
 */
export async function saveMessages(
	conversationId: string,
	userContent: string,
	assistantContent: string,
): Promise<void> {
	const supabase = createServiceRoleClient();

	const { error } = await supabase.from("messages").insert([
		{
			conversation_id: conversationId,
			role: "user",
			content: userContent,
		},
		{
			conversation_id: conversationId,
			role: "assistant",
			content: assistantContent,
		},
	]);

	if (error) {
		throw new Error(`Failed to save messages: ${error.message}`);
	}
}

/**
 * Get the total number of messages in a conversation
 * Used to enforce the 50-message cap
 * @param conversationId - UUID of the conversation (can be null/undefined)
 * @returns Count of messages (0 if conversationId is null/undefined)
 */
export async function getMessageCount(
	conversationId: string | null | undefined,
): Promise<number> {
	if (!conversationId) {
		return 0;
	}

	const supabase = createServiceRoleClient();

	const { count, error } = await supabase
		.from("messages")
		.select("*", { count: "exact", head: true })
		.eq("conversation_id", conversationId);

	if (error) {
		throw new Error(`Failed to get message count: ${error.message}`);
	}

	return count ?? 0;
}
