import type { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { SandboxUploader } from "./SandboxUploader";

export const metadata: Metadata = {
	title: "Chat with Flo | AI Support Chat",
	description:
		"Ask FlowBoard's AI assistant about pricing, features, integrations, and more",
};

export default function ChatPage() {
	const sandboxEnabled = process.env.NEXT_PUBLIC_SANDBOX_ENABLED === "true";

	return (
		<div className="flex h-full flex-col">
			{sandboxEnabled && (
				<div className="p-4 pb-0">
					<SandboxUploader />
				</div>
			)}
			<div className="flex-1 overflow-hidden">
				<ChatWindow />
			</div>
		</div>
	);
}
