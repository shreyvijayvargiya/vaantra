import { normalizeYouTubeVideoUrl } from "../../lib/utils/youtubeUrl";

function parseDurationSecondsFromYoutubeHtml(html) {
	if (typeof html !== "string" || !html) return 0;
	const ls =
		html.match(/"lengthSeconds":"(\d+)"/) || html.match(/"lengthSeconds":(\d+)/);
	if (ls) {
		const sec = parseInt(ls[1], 10);
		return Number.isFinite(sec) && sec > 0 ? sec : 0;
	}
	const am = html.match(/"approxDurationMs":"(\d+)"/);
	if (am) {
		const ms = parseInt(am[1], 10);
		if (!Number.isFinite(ms) || ms <= 0) return 0;
		return Math.max(1, Math.round(ms / 1000));
	}
	return 0;
}

/**
 * Best-effort public video length (no API key). YouTube HTML shape changes may break this.
 */
export default async function handler(req, res) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		return res.status(405).json({ error: "Method not allowed" });
	}
	const raw = req.query.url;
	const input = typeof raw === "string" ? raw : raw?.[0];
	const normalized = normalizeYouTubeVideoUrl(input || "");
	if (!normalized) {
		return res.status(400).json({ durationSec: 0 });
	}
	let videoId;
	try {
		videoId = new URL(normalized).searchParams.get("v");
	} catch {
		return res.status(400).json({ durationSec: 0 });
	}
	if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
		return res.status(400).json({ durationSec: 0 });
	}

	const controller = new AbortController();
	const t = setTimeout(() => controller.abort(), 8000);
	try {
		const r = await fetch(
			`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
			{
				headers: {
					"User-Agent":
						"Mozilla/5.0 (compatible; AantraDuration/1.0; +https://aantraa.com)",
					"Accept-Language": "en-US,en;q=0.9",
				},
				signal: controller.signal,
			},
		);
		const html = await r.text();
		const durationSec = parseDurationSecondsFromYoutubeHtml(html);
		res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
		return res.status(200).json({ durationSec });
	} catch {
		return res.status(200).json({ durationSec: 0 });
	} finally {
		clearTimeout(t);
	}
}
