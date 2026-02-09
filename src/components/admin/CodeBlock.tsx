"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
	code: string;
}

type TokenType = "tag" | "attr" | "string" | "text";

interface Token {
	type: TokenType;
	value: string;
}

function tokenizeHTML(html: string): Token[] {
	const tokens: Token[] = [];
	const regex = /<(\w+)|<\/(\w+)>|(\w[\w-]*)=|"([^"]*)"|([^<>"=]+)/g;

	let match = regex.exec(html);
	while (match !== null) {
		if (match[1]) {
			// Opening tag
			tokens.push({ type: "tag", value: `<${match[1]}` });
		} else if (match[2]) {
			// Closing tag
			tokens.push({ type: "tag", value: `</${match[2]}>` });
		} else if (match[3]) {
			// Attribute name
			tokens.push({ type: "attr", value: `${match[3]}=` });
		} else if (match[4]) {
			// String value
			tokens.push({ type: "string", value: `"${match[4]}"` });
		} else if (match[5]) {
			// Text/whitespace
			const value = match[5];
			// Preserve whitespace but detect closing >
			if (value.trim() === ">") {
				tokens.push({ type: "tag", value: ">" });
			} else {
				tokens.push({ type: "text", value });
			}
		}
		match = regex.exec(html);
	}

	return tokens;
}

export function CodeBlock({ code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			// Fallback for non-HTTPS or unsupported browsers
			console.error("Failed to copy to clipboard:", error);
		}
	};

	const tokens = tokenizeHTML(code);

	const getTokenColor = (type: TokenType): string => {
		switch (type) {
			case "tag":
				return "text-pink-400";
			case "attr":
				return "text-cyan-300";
			case "string":
				return "text-green-300";
			case "text":
				return "text-gray-400";
			default:
				return "text-gray-400";
		}
	};

	return (
		<div className="relative bg-gray-900 rounded-lg p-4 overflow-x-auto">
			<button
				type="button"
				onClick={handleCopy}
				className="absolute top-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm"
			>
				{copied ? (
					<>
						<Check className="h-4 w-4 text-green-400" />
						<span>Copied!</span>
					</>
				) : (
					<>
						<Copy className="h-4 w-4" />
						<span>Copy</span>
					</>
				)}
			</button>

			<pre className="text-sm font-mono pr-24">
				<code>
					{tokens.map((token, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: tokens are static and don't have unique IDs
						<span key={index} className={getTokenColor(token.type)}>
							{token.value}
						</span>
					))}
				</code>
			</pre>
		</div>
	);
}
