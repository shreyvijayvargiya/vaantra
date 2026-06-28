/** Canonical production domain — never use Vercel preview URLs in sitemaps or SEO. */
export const DEFAULT_SITE_URL = "https://aantraa.site";

function normalizeOrigin(input) {
	const raw = String(input ?? "").trim();
	if (!raw) return DEFAULT_SITE_URL;
	try {
		const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
		return new URL(withProto).origin.replace(/\/+$/, "");
	} catch {
		return DEFAULT_SITE_URL;
	}
}

/**
 * Canonical site origin for sitemaps, canonical tags, and OG URLs.
 * Priority: NEXT_PUBLIC_SITE_URL → production default (aantraa.site).
 * Does NOT fall back to VERCEL_URL (preview deploys break Google Search Console).
 */
export function getCanonicalSiteUrl() {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (explicit) return normalizeOrigin(explicit);

	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}

	return DEFAULT_SITE_URL;
}

/** Build absolute URL for a pathname (e.g. `/pricing` → `https://aantraa.site/pricing`). */
export function absoluteSiteUrl(pathname = "/") {
	const base = getCanonicalSiteUrl();
	if (!pathname || pathname === "/") return `${base}/`;
	const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
	return `${base}${path}`;
}
