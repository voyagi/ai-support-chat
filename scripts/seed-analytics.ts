import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
	console.error(
		"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables",
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample user questions (realistic FlowBoard topics)
const sampleQuestions = [
	"How much does the Pro plan cost?",
	"Can I integrate with Slack?",
	"How do I create a new project?",
	"What's the difference between Free and Pro?",
	"How do I invite team members?",
	"Is there an API available?",
	"How do I export my data?",
	"What are the storage limits?",
	"Can I use Kanban and Timeline views?",
	"How do I contact support?",
	"What security certifications do you have?",
	"How do I set up SSO?",
	"Can I customize workflows?",
	"What happens when my trial ends?",
	"How do I upgrade my plan?",
	"How do I reset my password?",
	"Can I have multiple workspaces?",
	"What file types can I upload?",
	"Is there a mobile app?",
	"How do I delete my account?",
];

// Sample assistant responses (short, realistic)
const sampleResponses = [
	"The Pro plan costs $12 per user per month, billed annually.",
	"Yes! FlowBoard integrates with Slack through our integrations page.",
	"To create a new project, click the + button in your dashboard sidebar.",
	"The Free plan includes basic features, while Pro adds advanced views, unlimited storage, and integrations.",
	"You can invite team members from the Workspace settings page.",
	"Yes, we offer a REST API for Pro and Enterprise customers.",
	"You can export your data as CSV or JSON from the workspace settings.",
	"Free plan includes 2GB storage, Pro includes unlimited storage.",
	"Yes, both Kanban and Timeline views are available on all plans.",
	"You can reach our support team at support@flowboard.com.",
	"We are SOC 2 Type II certified and GDPR compliant.",
	"SSO is available on Enterprise plans through the security settings.",
	"Pro and Enterprise plans support custom workflow automation.",
	"After your trial ends, you'll be moved to the Free plan automatically.",
	"You can upgrade from the billing page in your account settings.",
	"Use the password reset link on the login page to reset your password.",
	"Yes, you can create multiple workspaces from your account dashboard.",
	"We support common formats like PDF, Word, Excel, images, and more.",
	"Yes, we have iOS and Android apps available in the app stores.",
	"Account deletion can be requested from the security settings page.",
];

/**
 * Get a random item from an array
 */
function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)] as T;
}

/**
 * Get a random integer between min (inclusive) and max (inclusive)
 */
function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a timestamp offset from a base date
 */
function offsetTimestamp(baseDate: Date, minutesOffset: number): string {
	const timestamp = new Date(baseDate);
	timestamp.setMinutes(timestamp.getMinutes() + minutesOffset);
	return timestamp.toISOString();
}

async function main() {
	console.log("🌱 Seeding analytics test data (30 days)...\n");

	// Delete all existing conversations and messages (idempotent approach)
	console.log("Clearing existing data...");
	const { error: deleteError } = await supabase
		.from("conversations")
		.delete()
		.neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (neq impossible ID)

	if (deleteError) {
		console.error("Failed to clear existing data:", deleteError.message);
		process.exit(1);
	}

	let totalConversations = 0;
	let totalMessages = 0;

	// Generate 30 days of data
	for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
		const baseDate = new Date();
		baseDate.setDate(baseDate.getDate() - daysAgo);
		baseDate.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0); // Random time during business hours

		// Random number of conversations per day (weighted toward 2-5)
		const conversationCount =
			Math.random() < 0.2 ? randomInt(0, 1) : randomInt(2, 8);

		for (let convIdx = 0; convIdx < conversationCount; convIdx++) {
			// Spread conversations throughout the day
			const conversationTime = new Date(baseDate);
			conversationTime.setMinutes(conversationTime.getMinutes() + convIdx * 60);

			// Create conversation
			const { data: conversation, error: convError } = await supabase
				.from("conversations")
				.insert({ created_at: conversationTime.toISOString() })
				.select("id")
				.single();

			if (convError || !conversation) {
				console.error(
					`Failed to create conversation for day ${daysAgo}:`,
					convError?.message,
				);
				continue;
			}

			totalConversations++;

			// Generate 2-10 messages per conversation (alternating user/assistant)
			const messageCount = randomInt(2, 10);
			const messages = [];

			for (let msgIdx = 0; msgIdx < messageCount; msgIdx++) {
				const role = msgIdx % 2 === 0 ? "user" : "assistant";
				const content =
					role === "user"
						? randomItem(sampleQuestions)
						: randomItem(sampleResponses);

				// Spread messages within conversation (1-3 minutes apart)
				const messageTime = offsetTimestamp(
					conversationTime,
					msgIdx * randomInt(1, 3),
				);

				const message: {
					conversation_id: string;
					role: string;
					content: string;
					created_at: string;
					answered_from_kb?: boolean;
				} = {
					conversation_id: conversation.id,
					role,
					content,
					created_at: messageTime,
				};

				// Set answered_from_kb for assistant messages (~80% true, ~20% false)
				if (role === "assistant") {
					message.answered_from_kb = Math.random() < 0.8;
				}

				messages.push(message);
			}

			const { error: msgError } = await supabase
				.from("messages")
				.insert(messages);

			if (msgError) {
				console.error(
					`Failed to insert messages for conversation ${conversation.id}:`,
					msgError.message,
				);
				continue;
			}

			totalMessages += messages.length;
		}
	}

	console.log("\n✅ Seeding complete!");
	console.log(
		`📊 Generated ${totalConversations} conversations with ${totalMessages} messages over 30 days`,
	);
}

main().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
