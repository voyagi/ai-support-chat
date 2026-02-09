import type { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const metadata: Metadata = {
	title: "Chat with Flo | AI Support Chat",
	description:
		"Ask FlowBoard's AI assistant about pricing, features, integrations, and more",
};

export default function ChatPage() {
	return <ChatWindow />;
}
