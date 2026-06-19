/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
	outputFileTracingRoot: path.join(__dirname),
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	env: {
		NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		NEXT_PUBLIC_UPLOADTHING_TOKEN: process.env.UPLOADTHING_SECRET,
	},
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
		return [{ source: "/sitemap.xml", destination: "/api/sitemap" }];
	},
};

module.exports = nextConfig;
