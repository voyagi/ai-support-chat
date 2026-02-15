import { ImageResponse } from "next/og";

/** Shared brand icon renderer used by both icon.tsx and apple-icon.tsx. */
export function createBrandIcon(
	iconSize: number,
	borderRadius: number,
	fontSize: number,
) {
	return new ImageResponse(
		<div
			style={{
				background: "#2563eb",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: `${borderRadius}px`,
			}}
		>
			<span
				style={{
					color: "white",
					fontSize: `${fontSize}px`,
					fontWeight: "bold",
				}}
			>
				F
			</span>
		</div>,
		{ width: iconSize, height: iconSize },
	);
}
