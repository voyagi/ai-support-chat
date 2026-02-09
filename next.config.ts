import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "5mb",
		},
	},
	async headers() {
		return [
			{
				// Allow /widget to be embedded in iframes on any site
				source: "/widget",
				headers: [
					{
						key: "X-Frame-Options",
						value: "ALLOWALL",
					},
					{
						key: "Content-Security-Policy",
						value: "frame-ancestors *",
					},
				],
			},
			{
				// Allow widget.js to be loaded from any site
				source: "/widget.js",
				headers: [
					{
						key: "Access-Control-Allow-Origin",
						value: "*",
					},
				],
			},
		];
	},
};

export default nextConfig;
