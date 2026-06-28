/**
 * Dynamic sitemap for crawlers. Rewritten as /sitemap.xml via next.config.js.
 * Set NEXT_PUBLIC_SITE_URL (e.g. https://aantraa.com) on Vercel for stable absolute URLs.
 */
import { getAllStaticBlogSlugs } from "../../lib/blogs/staticBlogs";

const PATHS = [
	{ path: "/", changefreq: "weekly", priority: 1 },
	{ path: "/pricing", changefreq: "weekly", priority: 0.9 },
	{ path: "/login", changefreq: "monthly", priority: 0.7 },
	{ path: "/features", changefreq: "weekly", priority: 0.8 },
	{ path: "/contact", changefreq: "monthly", priority: 0.7 },
	{ path: "/docs", changefreq: "weekly", priority: 0.8 },
	{ path: "/blog", changefreq: "weekly", priority: 0.8 },
	{ path: "/examples", changefreq: "weekly", priority: 0.75 },
	{ path: "/legal", changefreq: "yearly", priority: 0.4 },
	{ path: "/privacy", changefreq: "yearly", priority: 0.4 },
	{ path: "/terms-and-conditions", changefreq: "yearly", priority: 0.4 },
	...getAllStaticBlogSlugs().map((slug) => ({
		path: `/blog/${slug}`,
		changefreq: "monthly",
		priority: 0.75,
	})),
];

function getSiteBase() {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (explicit) return explicit.replace(/\/+$/, "");
	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
	return "http://localhost:3000";
}

export default function handler(req, res) {
	const base = getSiteBase();
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PATHS.map(
	({ path, changefreq, priority }) => `  <url>
    <loc>${base}${path === "/" ? "/" : path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join("\n")}
</urlset>`;
	res.setHeader("Content-Type", "text/xml; charset=utf-8");
	res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
	res.status(200).send(body);
}
