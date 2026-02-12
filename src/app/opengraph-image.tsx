import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FlowBoard - AI Customer Support";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
					padding: "80px",
				}}
			>
				<div
					style={{
						fontSize: "72px",
						fontWeight: "bold",
						color: "white",
						marginBottom: "24px",
					}}
				>
					FlowBoard
				</div>
				<div
					style={{
						fontSize: "32px",
						color: "rgba(255, 255, 255, 0.9)",
						marginBottom: "16px",
					}}
				>
					AI Customer Support
				</div>
				<div
					style={{
						fontSize: "24px",
						color: "rgba(255, 255, 255, 0.7)",
						maxWidth: "700px",
					}}
				>
					Try the demo - Instant answers from your knowledge base
				</div>
			</div>
		</div>,
		{
			...size,
		},
	);
}
