import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("Missing DATABASE_URL environment variable");
	process.exit(1);
}

const sql = neon(DATABASE_URL);

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

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function offsetTimestamp(baseDate: Date, minutesOffset: number): string {
	const timestamp = new Date(baseDate);
	timestamp.setMinutes(timestamp.getMinutes() + minutesOffset);
	return timestamp.toISOString();
}

async function main() {
	console.log("Seeding analytics test data (30 days)...\n");

	// Delete all existing conversations (cascades to messages)
	console.log("Clearing existing data...");
	await sql`DELETE FROM conversations WHERE id IS NOT NULL`;

	let totalConversations = 0;
	let totalMessages = 0;

	for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
		const baseDate = new Date();
		baseDate.setDate(baseDate.getDate() - daysAgo);
		baseDate.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0);

		const conversationCount =
			Math.random() < 0.2 ? randomInt(0, 1) : randomInt(2, 8);

		for (let convIdx = 0; convIdx < conversationCount; convIdx++) {
			const conversationTime = new Date(baseDate);
			conversationTime.setMinutes(conversationTime.getMinutes() + convIdx * 60);

			const convRows = await sql`
				INSERT INTO conversations (created_at)
				VALUES (${conversationTime.toISOString()})
				RETURNING id
			`;

			if (!convRows[0]?.id) {
				console.error(`Failed to create conversation for day ${daysAgo}`);
				continue;
			}

			const conversationId = convRows[0].id as string;
			totalConversations++;

			const messageCount = randomInt(2, 10);

			for (let msgIdx = 0; msgIdx < messageCount; msgIdx++) {
				const role = msgIdx % 2 === 0 ? "user" : "assistant";
				const content =
					role === "user"
						? randomItem(sampleQuestions)
						: randomItem(sampleResponses);

				const messageTime = offsetTimestamp(
					conversationTime,
					msgIdx * randomInt(1, 3),
				);

				const answeredFromKb =
					role === "assistant" ? Math.random() < 0.8 : null;

				await sql`
					INSERT INTO messages (conversation_id, role, content, created_at, answered_from_kb)
					VALUES (${conversationId}, ${role}, ${content}, ${messageTime}, ${answeredFromKb})
				`;

				totalMessages++;
			}
		}
	}

	console.log("\nSeeding complete!");
	console.log(
		`Generated ${totalConversations} conversations with ${totalMessages} messages over 30 days`,
	);
}

main().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
