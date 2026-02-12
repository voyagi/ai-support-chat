import { NextResponse } from "next/server";
import { chunkMarkdown } from "@/lib/embeddings/chunker";
import { generateEmbeddings } from "@/lib/embeddings/embeddings";
import { getIpFromRequest, getTenantIdFromIp } from "@/lib/sandbox/tenant-id";
import {
	checkSandboxLimits,
	SANDBOX_LIMITS,
} from "@/lib/sandbox/upload-limits";
import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = SANDBOX_LIMITS.maxFileSizeMb * 1024 * 1024;

/**
 * Sandbox document upload endpoint.
 * Allows prospects to upload their own documents for RAG testing.
 * Documents are isolated per IP address and auto-deleted after 24 hours.
 */
export async function POST(request: Request) {
	// Check if sandbox mode is enabled
	if (process.env.NEXT_PUBLIC_SANDBOX_ENABLED !== "true") {
		return NextResponse.json(
			{ success: false, error: "Sandbox mode is disabled" },
			{ status: 403 },
		);
	}

	// Extract tenant ID from IP
	const ip = getIpFromRequest(request);
	const tenantId = getTenantIdFromIp(ip);

	// Check upload limits
	const limitCheck = await checkSandboxLimits(tenantId);
	if (!limitCheck.allowed) {
		return NextResponse.json(
			{
				success: false,
				error:
					limitCheck.error ||
					`Document limit reached (${limitCheck.maxDocuments} max)`,
			},
			{ status: 429 },
		);
	}

	const supabase = createServiceRoleClient();
	let documentId: string | undefined;

	try {
		// Parse form data
		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file || file.size === 0) {
			return NextResponse.json(
				{ success: false, error: "No file provided or file is empty" },
				{ status: 400 },
			);
		}

		// Validate file type
		const fileName = file.name.toLowerCase();
		const hasValidExtension = SANDBOX_LIMITS.allowedTypes.some((ext) =>
			fileName.endsWith(ext),
		);
		if (!hasValidExtension) {
			return NextResponse.json(
				{
					success: false,
					error: `Only ${SANDBOX_LIMITS.allowedTypes.join(", ")} files are supported`,
				},
				{ status: 400 },
			);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					success: false,
					error: `File exceeds maximum size of ${SANDBOX_LIMITS.maxFileSizeMb}MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
				},
				{ status: 400 },
			);
		}

		// Read file content
		const content = await file.text();

		// Extract title: formData override > first # heading > filename
		const titleOverride = formData.get("title") as string | null;
		let title: string;
		if (titleOverride?.trim()) {
			title = titleOverride.trim();
		} else {
			const headingMatch = content.match(/^#\s+(.+)$/m);
			title = headingMatch
				? headingMatch[1].trim()
				: file.name.replace(/\.(txt|md|pdf)$/i, "");
		}

		// Insert document record WITH tenant_id
		const { data: document, error: docError } = await supabase
			.from("documents")
			.insert({ title, content, tenant_id: tenantId })
			.select("id")
			.single();

		if (docError || !document) {
			throw new Error(
				`Failed to insert document: ${docError?.message ?? "Unknown error"}`,
			);
		}

		documentId = document.id;

		// Chunk the content
		const chunks = chunkMarkdown({ title, content });

		if (chunks.length === 0) {
			// Document was empty or below minimum chunk threshold -- keep doc but no chunks
			return NextResponse.json({
				success: true,
				documentId,
				chunkCount: 0,
			});
		}

		// Generate embeddings for all chunks
		const chunkTexts = chunks.map((chunk) => chunk.content);
		const embeddings = await generateEmbeddings(chunkTexts);

		// Prepare chunk records with all metadata AND tenant_id
		const chunkRecords = chunks.map((chunk, index) => ({
			document_id: documentId,
			document_title: chunk.documentTitle,
			section_heading: chunk.sectionHeading,
			content: chunk.content,
			chunk_position: chunk.position,
			total_chunks: chunk.totalChunks,
			embedding: embeddings[index],
			tenant_id: tenantId,
		}));

		// Insert chunks with embeddings
		const { error: chunksError } = await supabase
			.from("document_chunks")
			.insert(chunkRecords);

		if (chunksError) {
			throw new Error(`Failed to insert chunks: ${chunksError.message}`);
		}

		return NextResponse.json({
			success: true,
			documentId,
			chunkCount: chunks.length,
		});
	} catch (error) {
		// Clean up orphan document if embedding/chunking failed after insert
		if (documentId) {
			await supabase.from("documents").delete().eq("id", documentId);
		}
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred during upload",
			},
			{ status: 500 },
		);
	}
}
