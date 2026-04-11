/**
 * Normalize various YouTube inputs to https://www.youtube.com/watch?v=VIDEO_ID
 * Accepts full URLs, youtu.be, shorts, embed, bare 11-char ids, and path-only strings.
 */
export function normalizeYouTubeVideoUrl(input) {
	if (input == null || typeof input !== "string") return null;
	let s = input.trim();
	if (!s) return null;

	if (/^[a-zA-Z0-9_-]{11}$/.test(s)) {
		return `https://www.youtube.com/watch?v=${s}`;
	}

	let candidate = s;
	if (!/^https?:\/\//i.test(candidate)) {
		if (candidate.startsWith("//")) candidate = `https:${candidate}`;
		else if (/^(www\.)?youtube\.com/i.test(candidate))
			candidate = `https://${candidate.replace(/^\/+/, "")}`;
		else if (/^youtu\.be\//i.test(candidate))
			candidate = `https://${candidate.replace(/^\/+/, "")}`;
		else if (/^m\.youtube\.com/i.test(candidate))
			candidate = `https://${candidate.replace(/^\/+/, "")}`;
		else if (
			candidate.includes("youtube.com") ||
			candidate.includes("youtu.be")
		) {
			candidate = candidate.startsWith("www.")
				? `https://${candidate}`
				: `https://${candidate.replace(/^\/+/, "")}`;
		}
	}

	try {
		const u = new URL(candidate);
		const host = u.hostname.replace(/^www\./, "").toLowerCase();

		if (host === "youtu.be") {
			const id = u.pathname.replace(/^\//, "").split("/")[0];
			if (/^[a-zA-Z0-9_-]{11}$/.test(id))
				return `https://www.youtube.com/watch?v=${id}`;
		}

		if (host.includes("youtube.com")) {
			if (u.pathname.startsWith("/shorts/")) {
				const id = u.pathname.split("/")[2];
				if (/^[a-zA-Z0-9_-]{11}$/.test(id))
					return `https://www.youtube.com/watch?v=${id}`;
			}
			if (u.pathname.startsWith("/embed/")) {
				const id = u.pathname.split("/")[2];
				if (/^[a-zA-Z0-9_-]{11}$/.test(id))
					return `https://www.youtube.com/watch?v=${id}`;
			}
			const v = u.searchParams.get("v");
			if (v && /^[a-zA-Z0-9_-]{11}$/.test(v))
				return `https://www.youtube.com/watch?v=${v}`;
		}
	} catch {
		/* regex fallback below */
	}

	const m = s.match(
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
	);
	if (m) return `https://www.youtube.com/watch?v=${m[1]}`;

	return null;
}

export const PENDING_YOUTUBE_TRANSLATE_STORAGE_KEY = "pendingYoutubeTranslateUrl";
