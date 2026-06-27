import { auth } from "./config/firebase";
import { getApiErrorMessage } from "./translateApi";

const DEFAULT_VIDEO_TOOLS_ORIGIN = "http://localhost:3002";
const POLL_MS = 2500;
const MAX_POLL_MS = 15 * 60 * 1000;

export function getVideoToolsApiOrigin() {
	const raw =
		process.env.NEXT_PUBLIC_IHATEREADING_API_URL?.trim() ||
		process.env.API_BASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_TRANSLATE_API_URL?.trim();
	if (raw) {
		try {
			return new URL(raw).origin;
		} catch {
			/* fall through */
		}
	}
	return DEFAULT_VIDEO_TOOLS_ORIGIN;
}

/** Firebase ID token — same pattern as video-translate in dashboard */
export async function getVideoApiAuthHeaders() {
	const headers = {};
	try {
		const u = auth.currentUser;
		if (u) {
			const idToken = await u.getIdToken();
			if (idToken) {
				headers.Authorization = `Bearer ${idToken}`;
				if (u.uid) headers["X-User-Id"] = u.uid;
				return headers;
			}
		}
	} catch {
		/* fall back */
	}
	const env = process.env.NEXT_PUBLIC_TRANSLATE_API_TOKEN?.trim();
	if (env) {
		headers.Authorization = `Bearer ${env.replace(/^Bearer\s+/i, "")}`;
	}
	return headers;
}

async function parseJsonResponse(res) {
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const msg =
			getApiErrorMessage(data) ||
			data.message ||
			(res.status === 401
				? "Sign in required"
				: res.status === 403
					? "Access denied"
					: res.status === 429
						? "Rate limit exceeded — try again shortly"
						: `HTTP ${res.status}`);
		const err = new Error(msg);
		err.code = data.code;
		err.status = res.status;
		throw err;
	}
	const apiErr = getApiErrorMessage(data);
	if (apiErr) {
		const err = new Error(apiErr);
		err.code = data.code;
		throw err;
	}
	return data;
}

function captionPostUrl() {
	return `${getVideoToolsApiOrigin()}/api/video-caption`;
}

function captionStatusUrl(id) {
	return `${getVideoToolsApiOrigin()}/api/video-caption/${encodeURIComponent(id)}`;
}

function clipCutPostUrl() {
	return `${getVideoToolsApiOrigin()}/api/viral-clip-cut`;
}

function clipCutStatusUrl(id) {
	return `${getVideoToolsApiOrigin()}/api/viral-clip-cut/${encodeURIComponent(id)}`;
}

function blogToVideoPostUrl() {
	return `${getVideoToolsApiOrigin()}/api/blog-to-video`;
}

function blogToVideoStatusUrl(id) {
	return `${getVideoToolsApiOrigin()}/api/blog-to-video/${encodeURIComponent(id)}`;
}

export const BLOG_ASPECT_OPTIONS = [
	{ id: "16:9", label: "16:9 Landscape" },
	{ id: "9:16", label: "9:16 Vertical" },
	{ id: "1:1", label: "1:1 Square" },
];

export const BLOG_TTS_VOICE_OPTIONS = [
	{ value: "Puck", label: "Puck — Upbeat" },
	{ value: "Kore", label: "Kore — Firm" },
	{ value: "Charon", label: "Charon — Informative" },
	{ value: "Zephyr", label: "Zephyr — Bright" },
	{ value: "Aoede", label: "Aoede — Breezy" },
	{ value: "Fenrir", label: "Fenrir — Excitable" },
];

export const CAPTION_MODEL_OPTIONS = [
	{ id: "gemini", label: "Gemini" },
	{ id: "gpt-4o-mini", label: "GPT-4o mini" },
	{ id: "sonnet", label: "Claude Sonnet" },
	{ id: "kimi", label: "Kimi" },
	{ id: "grok", label: "Grok" },
];

export const CLIP_ASPECT_OPTIONS = [
	{ id: "", label: "Original" },
	{ id: "9:16", label: "9:16 Shorts" },
	{ id: "16:9", label: "16:9" },
	{ id: "1:1", label: "1:1 Square" },
];

export const CAPTION_STATUS_LABELS = {
	pending: "Queued…",
	running: "Generating captions…",
	success: "Done",
	failed: "Failed",
};

export const CLIP_STATUS_LABELS = {
	pending: "Queued…",
	analyzing: "AI is finding viral moments…",
	cutting: "Cutting clips…",
	uploading: "Uploading clips…",
	success: "Done",
	failed: "Failed",
};

export const BLOG_STATUS_LABELS = {
	pending: "Queued…",
	scraping: "Scraping blog…",
	strategizing: "Planning narration…",
	directing: "Directing visuals…",
	planning: "Building scenes…",
	rendering: "Rendering video…",
	success: "Done",
	failed: "Failed",
};

export function formatMsRange(startMs, endMs) {
	const fmt = (ms) => {
		const s = Math.floor(ms / 1000);
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, "0")}`;
	};
	return `${fmt(startMs)} – ${fmt(endMs)}`;
}

export async function startCaptionJob(payload, { file = null } = {}) {
	const headers = await getVideoApiAuthHeaders();
	let res;
	if (file) {
		const fd = new FormData();
		fd.append("file", file);
		fd.append("video", file);
		if (payload.video_url) fd.append("video_url", payload.video_url);
		if (payload.language) fd.append("language", payload.language);
		if (payload.burn_captions != null)
			fd.append("burn_captions", String(payload.burn_captions));
		if (payload.caption_style) fd.append("caption_style", payload.caption_style);
		if (payload.model) fd.append("model", payload.model);
		res = await fetch(captionPostUrl(), { method: "POST", headers, body: fd });
	} else {
		res = await fetch(captionPostUrl(), {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
	}
	const data = await parseJsonResponse(res);
	const id = data?.data?.video_caption_id;
	if (!id) throw new Error("No video_caption_id in response");
	return id;
}

export async function getCaptionJob(id) {
	const headers = await getVideoApiAuthHeaders();
	const res = await fetch(captionStatusUrl(id), { headers });
	const data = await parseJsonResponse(res);
	return data?.data ?? null;
}

export async function pollCaptionJob(id, { onStatus, signal, maxMs = MAX_POLL_MS } = {}) {
	const started = Date.now();
	for (;;) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const job = await getCaptionJob(id);
		const status = job?.status ?? "pending";
		onStatus?.(status, job);
		if (status === "success" || status === "failed") {
			if (status === "failed") {
				throw new Error(job?.error || "Caption job failed");
			}
			return job;
		}
		if (Date.now() - started > maxMs) {
			throw new Error("Caption job timed out — try again or use a shorter video");
		}
		await new Promise((r) => setTimeout(r, POLL_MS));
	}
}

export async function startClipCutJob(payload, { file = null } = {}) {
	const headers = await getVideoApiAuthHeaders();
	let res;
	if (file) {
		const fd = new FormData();
		fd.append("file", file);
		fd.append("video", file);
		Object.entries(payload).forEach(([k, v]) => {
			if (v != null && v !== "") fd.append(k, String(v));
		});
		res = await fetch(clipCutPostUrl(), { method: "POST", headers, body: fd });
	} else {
		res = await fetch(clipCutPostUrl(), {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
	}
	const data = await parseJsonResponse(res);
	const id = data?.data?.viral_clip_cut_id;
	if (!id) throw new Error("No viral_clip_cut_id in response");
	return id;
}

export async function getClipCutJob(id) {
	const headers = await getVideoApiAuthHeaders();
	const res = await fetch(clipCutStatusUrl(id), { headers });
	const data = await parseJsonResponse(res);
	return data?.data ?? null;
}

export async function pollClipCutJob(id, { onStatus, signal, maxMs = MAX_POLL_MS } = {}) {
	const started = Date.now();
	for (;;) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const job = await getClipCutJob(id);
		const status = job?.status ?? "pending";
		onStatus?.(status, job);
		if (status === "success" || status === "failed") {
			if (status === "failed") {
				throw new Error(job?.error || "Clip cut job failed");
			}
			return job;
		}
		if (Date.now() - started > maxMs) {
			throw new Error("Clip job timed out — try again or use a shorter video");
		}
		await new Promise((r) => setTimeout(r, POLL_MS));
	}
}

export async function startBlogToVideoJob(payload) {
	const headers = await getVideoApiAuthHeaders();
	const res = await fetch(blogToVideoPostUrl(), {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	const data = await parseJsonResponse(res);
	const id = data?.data?.blog_to_video_id;
	if (!id) throw new Error("No blog_to_video_id in response");
	return id;
}

export async function getBlogToVideoJob(id) {
	const headers = await getVideoApiAuthHeaders();
	const res = await fetch(blogToVideoStatusUrl(id), { headers });
	const data = await parseJsonResponse(res);
	return data?.data ?? null;
}

export async function pollBlogToVideoJob(id, { onStatus, signal, maxMs = MAX_POLL_MS } = {}) {
	const started = Date.now();
	for (;;) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const job = await getBlogToVideoJob(id);
		const status = job?.status ?? "pending";
		onStatus?.(status, job);
		if (status === "success" || status === "failed") {
			if (status === "failed") {
				throw new Error(job?.error || "Blog-to-video job failed");
			}
			return job;
		}
		if (Date.now() - started > maxMs) {
			throw new Error("Blog-to-video timed out — try again later");
		}
		await new Promise((r) => setTimeout(r, POLL_MS));
	}
}
