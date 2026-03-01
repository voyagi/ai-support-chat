import { Resend } from "resend";
import { getRedis } from "@/lib/redis";

function getResendClient(): Resend | null {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		console.warn(
			"RESEND_API_KEY not configured, cost alert emails are disabled",
		);
		return null;
	}
	return new Resend(apiKey);
}

function getAlertKeyForToday(level: "warning" | "critical"): string {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	return `cost-alert-sent:${today}:${level}`;
}

export async function shouldSendAlert(
	level: "warning" | "critical",
): Promise<boolean> {
	const key = getAlertKeyForToday(level);
	const alreadySent = await getRedis().get(key);
	return alreadySent === null;
}

export async function sendCostAlertEmail(
	currentCost: number,
	level: "warning" | "critical",
): Promise<void> {
	try {
		// Check if we should send this alert
		const shouldSend = await shouldSendAlert(level);
		if (!shouldSend) {
			console.log(
				`Cost alert ${level} already sent today, skipping email notification`,
			);
			return;
		}

		// Get Resend client (may be null if not configured)
		const resend = getResendClient();
		if (!resend) {
			return; // Graceful degradation
		}

		// Get the email recipient
		const toEmail = process.env.COST_ALERT_EMAIL;
		if (!toEmail) {
			console.warn("COST_ALERT_EMAIL not configured, cannot send alert");
			return;
		}

		// Send email
		const percentThreshold = level === "warning" ? "50%" : "80%";
		const subject = `[FlowBoard Demo] Cost alert: ${percentThreshold} of daily budget used`;
		const text = `Cost Alert: ${level.toUpperCase()}

Current cost: $${currentCost.toFixed(2)}
Daily budget: $10.00
Percentage used: ${((currentCost / 10) * 100).toFixed(1)}%

The FlowBoard AI chatbot demo has reached ${percentThreshold} of its daily budget.

${level === "critical" ? "WARNING: Service will shut off automatically at 100% to prevent overages.\n\n" : ""}Please check the admin dashboard for details: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/analytics

This is an automated alert from the cost tracking system.
`;

		await resend.emails.send({
			from: "FlowBoard Alerts <onboarding@resend.dev>",
			to: toEmail,
			subject,
			text,
		});

		console.log(`Cost alert email sent: ${level} (${percentThreshold})`);

		// Mark this alert as sent for today
		const key = getAlertKeyForToday(level);
		await getRedis().set(key, "1", { ex: 86400 }); // 1 day TTL
	} catch (error) {
		// Never throw - this is fire-and-forget
		console.error("Failed to send cost alert email:", error);
	}
}
