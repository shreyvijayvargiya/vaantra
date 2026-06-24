import fs from "fs";
import path from "path";

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");
const BLOGS_JSON_PATH = path.join(BLOGS_DIR, "blogs.json");

function readBlogManifest() {
	const raw = fs.readFileSync(BLOGS_JSON_PATH, "utf8");
	return JSON.parse(raw);
}

export function getStaticBlogsList() {
	return readBlogManifest().sort(
		(a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
	);
}

export function getStaticBlogBySlug(slug) {
	const entry = readBlogManifest().find((blog) => blog.slug === slug);
	if (!entry) return null;

	const contentPath = path.join(BLOGS_DIR, entry.contentFile);
	if (!fs.existsSync(contentPath)) return null;

	const content = fs.readFileSync(contentPath, "utf8");
	return { ...entry, content };
}

export function getAllStaticBlogSlugs() {
	return readBlogManifest().map((blog) => blog.slug);
}
