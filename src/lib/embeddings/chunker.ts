import { countTokens } from "./token-counter";
import type { Chunk, ChunkOptions } from "./types";
import { DEFAULT_CHUNK_OPTIONS } from "./types";

interface Section {
	heading: string;
	content: string;
}

/**
 * Split markdown content into sections based on ## headings
 * Handles code blocks to avoid splitting inside them
 */
function splitIntoSections(content: string): Section[] {
	const lines = content.split("\n");
	const sections: Section[] = [];
	let currentHeading = "General"; // Default heading for content before first ##
	let currentContent: string[] = [];
	let inCodeBlock = false;

	for (const line of lines) {
		// Track code block state to avoid splitting inside them
		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
		}

		// Only recognize ## headings outside code blocks
		if (!inCodeBlock && line.trim().startsWith("## ")) {
			// Save previous section if it has content
			if (currentContent.length > 0) {
				sections.push({
					heading: currentHeading,
					content: currentContent.join("\n").trim(),
				});
				currentContent = [];
			}
			// Start new section
			currentHeading = line.replace(/^##\s+/, "").trim();
		} else {
			currentContent.push(line);
		}
	}

	// Save final section
	if (currentContent.length > 0) {
		sections.push({
			heading: currentHeading,
			content: currentContent.join("\n").trim(),
		});
	}

	return sections;
}

/**
 * Detect if a section is FAQ-style (multiple ### sub-headings)
 */
function isFAQSection(content: string): boolean {
	const subheadingMatches = content.match(/^###\s+/gm);
	return (subheadingMatches?.length ?? 0) >= 2;
}

/**
 * Split FAQ section into individual Q&A chunks
 */
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
			// Save previous Q&A if exists
			if (currentQA.length > 0) {
				const qaContent = currentQA.join("\n").trim();
				const tokenCount = countTokens(`${heading}: ${qaContent}`);
				if (tokenCount >= options.minChunkTokens) {
					chunks.push({
						content: `${heading}: ${qaContent}`,
						documentTitle,
						sectionHeading: heading,
						position: 0, // Will be set later
						totalChunks: 0, // Will be set later
						tokenCount,
					});
				}
				currentQA = [];
			}
			// Start new Q&A
			currentQA.push(line);
		} else {
			currentQA.push(line);
		}
	}

	// Save final Q&A
	if (currentQA.length > 0) {
		const qaContent = currentQA.join("\n").trim();
		const tokenCount = countTokens(`${heading}: ${qaContent}`);
		if (tokenCount >= options.minChunkTokens) {
			chunks.push({
				content: `${heading}: ${qaContent}`,
				documentTitle,
				sectionHeading: heading,
				position: 0,
				totalChunks: 0,
				tokenCount,
			});
		}
	}

	return chunks;
}

/**
 * Split text at paragraph boundaries
 */
function splitIntoParagraphs(text: string): string[] {
	return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
}

/**
 * Split text at sentence boundaries (. followed by space and capital letter, or newline)
 */
function splitIntoSentences(text: string): string[] {
	// Simple sentence splitter - matches ". " followed by uppercase or ".\n"
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
			i++; // Skip the space after period
		}
	}

	if (current.trim().length > 0) {
		sentences.push(current.trim());
	}

	return sentences;
}

/**
 * Subdivide large section with overlap
 */
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

		// If single paragraph exceeds target, split at sentence level
		if (paraTokens > options.targetTokens) {
			// Save current chunk if exists
			if (currentChunk.length > 0) {
				const chunkContent = currentChunk.join("\n\n");
				const tokenCount = countTokens(`${heading}: ${chunkContent}`);
				if (tokenCount >= options.minChunkTokens) {
					chunks.push({
						content: `${heading}: ${chunkContent}`,
						documentTitle,
						sectionHeading: heading,
						position: 0,
						totalChunks: 0,
						tokenCount,
					});
				}
				currentChunk = [];
				currentTokens = 0;
			}

			// Split paragraph at sentence level
			const sentences = splitIntoSentences(para);
			let sentenceChunk: string[] = [];
			let sentenceTokens = 0;

			for (const sentence of sentences) {
				const sentTokens = countTokens(sentence);
				if (
					sentenceTokens + sentTokens > options.targetTokens &&
					sentenceChunk.length > 0
				) {
					const chunkContent = sentenceChunk.join(" ");
					const tokenCount = countTokens(`${heading}: ${chunkContent}`);
					if (tokenCount >= options.minChunkTokens) {
						chunks.push({
							content: `${heading}: ${chunkContent}`,
							documentTitle,
							sectionHeading: heading,
							position: 0,
							totalChunks: 0,
							tokenCount,
						});
					}

					// Apply overlap: keep last 15% of sentences
					const overlapSentenceCount = Math.ceil(
						sentenceChunk.length * options.overlapPercent,
					);
					sentenceChunk = sentenceChunk.slice(-overlapSentenceCount);
					sentenceTokens = countTokens(sentenceChunk.join(" "));
				}

				sentenceChunk.push(sentence);
				sentenceTokens += sentTokens;
			}

			// Save remaining sentences
			if (sentenceChunk.length > 0) {
				const chunkContent = sentenceChunk.join(" ");
				const tokenCount = countTokens(`${heading}: ${chunkContent}`);
				if (tokenCount >= options.minChunkTokens) {
					chunks.push({
						content: `${heading}: ${chunkContent}`,
						documentTitle,
						sectionHeading: heading,
						position: 0,
						totalChunks: 0,
						tokenCount,
					});
				}
			}
		} else if (
			currentTokens + paraTokens > options.targetTokens &&
			currentChunk.length > 0
		) {
			// Current paragraph would exceed target, save current chunk
			const chunkContent = currentChunk.join("\n\n");
			const tokenCount = countTokens(`${heading}: ${chunkContent}`);
			if (tokenCount >= options.minChunkTokens) {
				chunks.push({
					content: `${heading}: ${chunkContent}`,
					documentTitle,
					sectionHeading: heading,
					position: 0,
					totalChunks: 0,
					tokenCount,
				});
			}

			// Apply overlap: keep last 15% of paragraphs
			const overlapParaCount = Math.ceil(
				currentChunk.length * options.overlapPercent,
			);
			currentChunk = currentChunk.slice(-overlapParaCount);
			currentTokens = countTokens(currentChunk.join("\n\n"));

			currentChunk.push(para);
			currentTokens += paraTokens;
		} else {
			// Add paragraph to current chunk
			currentChunk.push(para);
			currentTokens += paraTokens;
		}
	}

	// Save final chunk
	if (currentChunk.length > 0) {
		const chunkContent = currentChunk.join("\n\n");
		const tokenCount = countTokens(`${heading}: ${chunkContent}`);
		if (tokenCount >= options.minChunkTokens) {
			chunks.push({
				content: `${heading}: ${chunkContent}`,
				documentTitle,
				sectionHeading: heading,
				position: 0,
				totalChunks: 0,
				tokenCount,
			});
		}
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

	// Handle empty document
	if (!document.content || document.content.trim().length === 0) {
		return [];
	}

	const sections = splitIntoSections(document.content);
	const allChunks: Chunk[] = [];

	for (const section of sections) {
		const sectionWithHeading = `${section.heading}: ${section.content}`;
		const sectionTokens = countTokens(sectionWithHeading);

		// Check if FAQ section
		if (isFAQSection(section.content)) {
			const faqChunks = splitFAQSection(
				section.heading,
				section.content,
				document.title,
				opts,
			);
			allChunks.push(...faqChunks);
		} else if (sectionTokens <= opts.targetTokens) {
			// Section fits in one chunk
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
			// Section needs subdivision
			const subChunks = subdivideSection(
				section.heading,
				section.content,
				document.title,
				opts,
			);
			allChunks.push(...subChunks);
		}
	}

	// Set position and totalChunks on all chunks
	const totalChunks = allChunks.length;
	for (let i = 0; i < allChunks.length; i++) {
		allChunks[i].position = i + 1;
		allChunks[i].totalChunks = totalChunks;
	}

	return allChunks;
}
