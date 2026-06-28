/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
	outputFileTracingRoot: path.join(__dirname),
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	images: {
		domains: [
			"lh3.googleusercontent.com",
			"firebasestorage.googleapis.com",
			"images.unsplash.com",
			"storage.googleapis.com",
			"firebase.googleapis.com",
			"*.firebaseio.com",
			"*.firebaseapp.com",
		],
		minimumCacheTTL: 60,
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Permissions-Policy",
						value: "payment=(self), interest-cohort=()",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
				],
			},
			{
				source: "/api/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, max-age=0",
					},
				],
			},
		];
	},
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.alias["yjs"] = path.resolve(__dirname, "node_modules/yjs");
		}
		return config;
	},
	async rewrites() {
		const origin =
			process.env.NEXT_PUBLIC_AANTRA_API_URL?.trim() ||
			process.env.NEXT_PUBLIC_IHATEREADING_API_URL?.trim() ||
			process.env.NEXT_PUBLIC_TRANSLATE_API_URL?.trim() ||
			"http://localhost:3002";
		let apiOrigin = "http://localhost:3002";
		try {
			apiOrigin = new URL(origin).origin;
		} catch {
			/* keep default */
		}
		return [
			{ source: "/sitemap.xml", destination: "/api/sitemap" },
			{
				source: "/api/video-editor/:path*",
				destination: `${apiOrigin}/api/video-editor/:path*`,
			},
		];
	},
};

module.exports = nextConfig;
