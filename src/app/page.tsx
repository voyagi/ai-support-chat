import { BookOpen, History, MessageCircle, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "AI Support Chat — Live Demo",
	description:
		"Interactive AI customer support chatbot demo. Powered by RAG, streaming AI, and a knowledge base. Try it instantly — no signup required.",
};

export default function Home() {
	return (
		<main className="bg-gradient-to-b from-blue-50 to-white">
			{/* Hero Section */}
			<section className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-24">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
						AI Support Chat
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed">
						See how AI-powered customer support works. Ask questions, get
						instant answers from a knowledge base — powered by RAG and streaming
						AI.
					</p>

					{/* Primary CTA */}
					<Link
						href="/chat"
						className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl mt-10"
					>
						<MessageCircle className="w-5 h-5" />
						Try the Demo
					</Link>

					<p className="text-sm text-gray-500 mt-4">
						No signup required — instant access
					</p>
				</div>
			</section>

			{/* Feature Highlights */}
			<section className="max-w-5xl mx-auto px-4 pb-16 sm:pb-24">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
					{/* Feature 1: Streaming */}
					<div className="flex flex-col items-start">
						<Zap className="w-10 h-10 text-blue-600 mb-3" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Streaming Responses
						</h3>
						<p className="text-gray-600 leading-relaxed">
							Watch answers appear in real-time, token by token. No waiting for
							the full response.
						</p>
					</div>

					{/* Feature 2: RAG */}
					<div className="flex flex-col items-start">
						<BookOpen className="w-10 h-10 text-blue-600 mb-3" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Knowledge Base RAG
						</h3>
						<p className="text-gray-600 leading-relaxed">
							Every answer is grounded in documentation. No hallucination, just
							facts from the knowledge base.
						</p>
					</div>

					{/* Feature 3: Conversation Context */}
					<div className="flex flex-col items-start">
						<History className="w-10 h-10 text-blue-600 mb-3" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Conversation Context
						</h3>
						<p className="text-gray-600 leading-relaxed">
							Follow-up questions work naturally. The AI remembers what you
							discussed earlier.
						</p>
					</div>
				</div>

				{/* Footer/Attribution */}
				<div className="text-center mt-16 sm:mt-24">
					<p className="text-sm text-gray-500">
						Built as a portfolio demo —{" "}
						<Link
							href="/admin"
							className="underline hover:text-gray-700 transition-colors"
						>
							Admin Panel
						</Link>
					</p>
					<p className="text-xs text-gray-400 mt-2">
						Powered by Next.js, OpenAI, and Supabase
					</p>
				</div>
			</section>
		</main>
	);
}
