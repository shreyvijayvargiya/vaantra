/**
 * Dynamic sitemap at /sitemap.xml (rewrite in next.config.js).
 * Always uses canonical production URLs (https://aantraa.site), never Vercel preview hosts.
 */
import { getStaticBlogsList } from "../../lib/blogs/staticBlogs";
import { getCanonicalSiteUrl } from "../../lib/utils/siteUrl";

/** Marketing pages worth indexing — excludes /app, /admin, /login, dashboard routes. */
const STATIC_PAGES = [
	{ path: "/", changefreq: "weekly", priority: 1.0 },
	{ path: "/features", changefreq: "weekly", priority: 0.9 },
	{ path: "/pricing", changefreq: "weekly", priority: 0.9 },
	{ path: "/examples", changefreq: "weekly", priority: 0.85 },
	{ path: "/blog", changefreq: "weekly", priority: 0.85 },
	{ path: "/contact", changefreq: "monthly", priority: 0.7 },
	{ path: "/privacy", changefreq: "yearly", priority: 0.3 },
	{ path: "/terms-and-conditions", changefreq: "yearly", priority: 0.3 },
	{ path: "/legal", changefreq: "yearly", priority: 0.3 },
];

function formatLastmod(dateStr) {
	if (!dateStr) return null;
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return null;
	return d.toISOString().slice(0, 10);
}

function buildEntries() {
	const today = new Date().toISOString().slice(0, 10);
	const staticEntries = STATIC_PAGES.map((page) => ({
		...page,
		lastmod: today,
	}));

	const blogEntries = getStaticBlogsList().map((blog) => ({
		path: `/blog/${blog.slug}`,
		changefreq: "monthly",
		priority: 0.8,
		lastmod: formatLastmod(blog.publishedAt) || today,
	}));

	return [...staticEntries, ...blogEntries];
}

function escapeXml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function urlTag(base, { path, changefreq, priority, lastmod }) {
	const loc = path === "/" ? `${base}/` : `${base}${path}`;
	let xml = `  <url>\n    <loc>${escapeXml(loc)}</loc>`;
	if (lastmod) xml += `\n    <lastmod>${lastmod}</lastmod>`;
	xml += `\n    <changefreq>${changefreq}</changefreq>`;
	xml += `\n    <priority>${priority.toFixed(1)}</priority>`;
	xml += `\n  </url>`;
	return xml;
}

export default function handler(req, res) {
	const base = getCanonicalSiteUrl();
	const entries = buildEntries();

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => urlTag(base, entry)).join("\n")}
</urlset>`;

	res.setHeader("Content-Type", "application/xml; charset=utf-8");
	res.setHeader(
		"Cache-Control",
		"public, s-maxage=3600, stale-while-revalidate=86400",
	);
	res.status(200).send(body);
}
