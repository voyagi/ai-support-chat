import { countTokens } from "./token-counter";
import type { Chunk, ChunkOptions } from "./types";
import { DEFAULT_CHUNK_OPTIONS } from "./types";

interface Section {
	heading: string;
	content: string;
}

/** Push a chunk to the array if it meets the minimum token threshold. */
function tryPushChunk(
	chunks: Chunk[],
	heading: string,
	body: string,
	documentTitle: string,
	minTokens: number,
): void {
	const content = `${heading}: ${body}`;
	const tokenCount = countTokens(content);
	if (tokenCount >= minTokens) {
		chunks.push({
			content,
			documentTitle,
			sectionHeading: heading,
			position: 0,
			totalChunks: 0,
			tokenCount,
		});
	}
}

/**
 * Split markdown content into sections based on ## headings.
 * Handles code blocks to avoid splitting inside them.
 */
function splitIntoSections(content: string): Section[] {
	const lines = content.split("\n");
	const sections: Section[] = [];
	let currentHeading = "General";
	let currentContent: string[] = [];
	let inCodeBlock = false;

	for (const line of lines) {
		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
		}

		if (!inCodeBlock && line.trim().startsWith("## ")) {
			if (currentContent.length > 0) {
				sections.push({
					heading: currentHeading,
					content: currentContent.join("\n").trim(),
				});
				currentContent = [];
			}
			currentHeading = line.replace(/^##\s+/, "").trim();
		} else {
			currentContent.push(line);
		}
	}

	if (currentContent.length > 0) {
		sections.push({
			heading: currentHeading,
			content: currentContent.join("\n").trim(),
		});
	}

	return sections;
}

function isFAQSection(content: string): boolean {
	const subheadingMatches = content.match(/^###\s+/gm);
	return (subheadingMatches?.length ?? 0) >= 2;
}

function splitFAQSection(
	heading: string,
	content: string,
	documentTitle: string,
	options: ChunkOptions,
): Chunk[] {
	const chunks: Chunk[] = [];
	const lines = content.split("\n");
	let currentQA: string[] = [];

	for (const line of lines) {
		if (line.trim().startsWith("### ")) {
			if (currentQA.length > 0) {
				tryPushChunk(
					chunks,
					heading,
					currentQA.join("\n").trim(),
					documentTitle,
					options.minChunkTokens,
				);
				currentQA = [];
			}
			currentQA.push(line);
		} else {
			currentQA.push(line);
		}
	}

	if (currentQA.length > 0) {
		tryPushChunk(
			chunks,
			heading,
			currentQA.join("\n").trim(),
			documentTitle,
			options.minChunkTokens,
		);
	}

	return chunks;
}

function splitIntoParagraphs(text: string): string[] {
	return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
}

function splitIntoSentences(text: string): string[] {
	const sentences: string[] = [];
	let current = "";

	for (let i = 0; i < text.length; i++) {
		current += text[i];
		if (
			text[i] === "." &&
			(text[i + 1] === "\n" ||
				(text[i + 1] === " " && /[A-Z]/.test(text[i + 2])))
		) {
			sentences.push(current.trim());
			current = "";
			i++;
		}
	}

	if (current.trim().length > 0) {
		sentences.push(current.trim());
	}

	return sentences;
}

/** Split a large paragraph into chunks at sentence boundaries with overlap. */
function splitBySentences(
	heading: string,
	para: string,
	documentTitle: string,
	options: ChunkOptions,
): Chunk[] {
	const chunks: Chunk[] = [];
	const sentences = splitIntoSentences(para);
	let sentenceChunk: string[] = [];
	let sentenceTokens = 0;

	for (const sentence of sentences) {
		const sentTokens = countTokens(sentence);
		if (
			sentenceTokens + sentTokens > options.targetTokens &&
			sentenceChunk.length > 0
		) {
			tryPushChunk(
				chunks,
				heading,
				sentenceChunk.join(" "),
				documentTitle,
				options.minChunkTokens,
			);

			const overlapCount = Math.ceil(
				sentenceChunk.length * options.overlapPercent,
			);
			sentenceChunk = sentenceChunk.slice(-overlapCount);
			sentenceTokens = countTokens(sentenceChunk.join(" "));
		}

		sentenceChunk.push(sentence);
		sentenceTokens += sentTokens;
	}

	if (sentenceChunk.length > 0) {
		tryPushChunk(
			chunks,
			heading,
			sentenceChunk.join(" "),
			documentTitle,
			options.minChunkTokens,
		);
	}

	return chunks;
}

/** Subdivide a large section into chunks with overlap. */
function subdivideSection(
	heading: string,
	content: string,
	documentTitle: string,
	options: ChunkOptions,
): Chunk[] {
	const chunks: Chunk[] = [];
	const paragraphs = splitIntoParagraphs(content);

	let currentChunk: string[] = [];
	let currentTokens = 0;

	for (let i = 0; i < paragraphs.length; i++) {
		const para = paragraphs[i];
		const paraTokens = countTokens(para);

		if (paraTokens > options.targetTokens) {
			// Flush current chunk before sentence-level splitting
			if (currentChunk.length > 0) {
				tryPushChunk(
					chunks,
					heading,
					currentChunk.join("\n\n"),
					documentTitle,
					options.minChunkTokens,
				);
				currentChunk = [];
				currentTokens = 0;
			}

			chunks.push(
				...splitBySentences(heading, para, documentTitle, options),
			);
		} else if (
			currentTokens + paraTokens > options.targetTokens &&
			currentChunk.length > 0
		) {
			tryPushChunk(
				chunks,
				heading,
				currentChunk.join("\n\n"),
				documentTitle,
				options.minChunkTokens,
			);

			const overlapCount = Math.ceil(
				currentChunk.length * options.overlapPercent,
			);
			currentChunk = currentChunk.slice(-overlapCount);
			currentTokens = countTokens(currentChunk.join("\n\n"));

			currentChunk.push(para);
			currentTokens += paraTokens;
		} else {
			currentChunk.push(para);
			currentTokens += paraTokens;
		}
	}

	if (currentChunk.length > 0) {
		tryPushChunk(
			chunks,
			heading,
			currentChunk.join("\n\n"),
			documentTitle,
			options.minChunkTokens,
		);
	}

	return chunks;
}

/**
 * Chunk markdown document into embedding-ready chunks with metadata
 */
export function chunkMarkdown(
	document: { title: string; content: string },
	options?: Partial<ChunkOptions>,
): Chunk[] {
	const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options };

	if (!document.content || document.content.trim().length === 0) {
		return [];
	}

	const sections = splitIntoSections(document.content);
	const allChunks: Chunk[] = [];

	for (const section of sections) {
		const sectionWithHeading = `${section.heading}: ${section.content}`;
		const sectionTokens = countTokens(sectionWithHeading);

		if (isFAQSection(section.content)) {
			allChunks.push(
				...splitFAQSection(
					section.heading,
					section.content,
					document.title,
					opts,
				),
			);
		} else if (sectionTokens <= opts.targetTokens) {
			if (sectionTokens >= opts.minChunkTokens) {
				allChunks.push({
					content: sectionWithHeading,
					documentTitle: document.title,
					sectionHeading: section.heading,
					position: 0,
					totalChunks: 0,
					tokenCount: sectionTokens,
				});
			}
		} else {
			allChunks.push(
				...subdivideSection(
					section.heading,
					section.content,
					document.title,
					opts,
				),
			);
		}
	}

	const totalChunks = allChunks.length;
	for (let i = 0; i < allChunks.length; i++) {
		allChunks[i].position = i + 1;
		allChunks[i].totalChunks = totalChunks;
	}

	return allChunks;
}
