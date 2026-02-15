import { NextResponse } from "next/server";
import {
	extractDocumentTitle,
	processDocumentUpload,
} from "@/lib/documents/upload";
import { getErrorMessage } from "@/lib/errors";
import { getClientIp } from "@/lib/request-utils";
import { getTenantIdFromIp } from "@/lib/sandbox/tenant-id";
import {
	checkSandboxLimits,
	SANDBOX_LIMITS,
} from "@/lib/sandbox/upload-limits";

const MAX_FILE_SIZE = SANDBOX_LIMITS.maxFileSizeMb * 1024 * 1024;

/**
 * Sandbox document upload endpoint.
 * Allows prospects to upload their own documents for RAG testing.
 * Documents are isolated per IP address and auto-deleted after 24 hours.
 */
export async function POST(request: Request) {
	if (process.env.NEXT_PUBLIC_SANDBOX_ENABLED !== "true") {
		return NextResponse.json(
			{ success: false, error: "Sandbox mode is disabled" },
			{ status: 403 },
		);
	}

	const ip = getClientIp(request);
	const tenantId = getTenantIdFromIp(ip);

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

	try {
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

		const content = await file.text();
		const titleOverride = formData.get("title") as string | null;
		const title = extractDocumentTitle(content, file.name, titleOverride);

		const result = await processDocumentUpload(content, title, { tenantId });

		return NextResponse.json({
			success: true,
			documentId: result.documentId,
			chunkCount: result.chunkCount,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: getErrorMessage(error),
			},
			{ status: 500 },
		);
	}
}
