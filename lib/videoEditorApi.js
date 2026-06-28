import { auth } from "./config/firebase";

/** Same backend as caption/clip/blog tools unless AANTRA URL is set explicitly. */
const DEFAULT_ORIGIN = "http://localhost:3002";

export function getVideoEditorApiOrigin() {
	const raw =
		process.env.NEXT_PUBLIC_AANTRA_API_URL?.trim() ||
		process.env.NEXT_PUBLIC_IHATEREADING_API_URL?.trim() ||
		process.env.NEXT_PUBLIC_TRANSLATE_API_URL?.trim();
	if (raw) {
		try {
			return new URL(raw).origin;
		} catch {
			/* fall through */
		}
	}
	return DEFAULT_ORIGIN;
}

/** Browser: same-origin `/api/video-editor/*` (Next rewrite → backend). SSR: absolute URL. */
function apiRoot() {
	if (typeof window !== "undefined") return "";
	return getVideoEditorApiOrigin();
}

async function editorFetch(url, options = {}) {
	try {
		return await fetch(url, options);
	} catch (e) {
		const origin = getVideoEditorApiOrigin();
		const hint =
			typeof window !== "undefined"
				? " Check that the API is running and NEXT_PUBLIC_AANTRA_API_URL (or NEXT_PUBLIC_IHATEREADING_API_URL) is set, then restart the dev server."
				: "";
		throw new Error(
			`Could not reach video editor API (${origin}).${hint} ${e?.message || ""}`.trim(),
		);
	}
}

export async function getVideoEditorAuthHeaders() {
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
	return headers;
}

async function parseJsonError(res) {
	const data = await res.json().catch(() => ({}));
	const msg =
		data.user_message ||
		data.error ||
		data.message ||
		(res.status === 401 ? "Sign in required" : `HTTP ${res.status}`);
	const err = new Error(msg);
	err.code = data.code || data.error_code;
	err.status = res.status;
	throw err;
}

function generateUrl() {
	return `${apiRoot()}/api/video-editor/generate`;
}

function projectUrl(projectId) {
	return `${apiRoot()}/api/video-editor/${encodeURIComponent(projectId)}`;
}

function exportUrl() {
	return `${apiRoot()}/api/video-editor/export`;
}

/** POST /api/video-editor/generate → project_id */
export async function generateVideoEditorProject(payload) {
	const headers = await getVideoEditorAuthHeaders();
	const res = await editorFetch(generateUrl(), {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) await parseJsonError(res);
	const json = await res.json();
	const id = json?.data?.project_id;
	if (!id) throw new Error("No project_id in response");
	return id;
}

/** GET /api/video-editor/:project_id */
export async function getVideoEditorProject(projectId) {
	const headers = await getVideoEditorAuthHeaders();
	const res = await editorFetch(projectUrl(projectId), { headers });
	if (!res.ok) await parseJsonError(res);
	const json = await res.json();
	return json?.data ?? null;
}

/** POST /api/video-editor/export → MP4 blob */
export async function exportVideoEditorMp4({ project, frames, global_style }) {
	const headers = await getVideoEditorAuthHeaders();
	const res = await editorFetch(exportUrl(), {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({ project, frames, global_style }),
	});
	const ct = res.headers.get("content-type") || "";
	if (!res.ok) {
		if (ct.includes("json")) await parseJsonError(res);
		throw new Error(`Export failed (HTTP ${res.status})`);
	}
	const blob = await res.blob();
	return {
		blob,
		durationMs: Number(res.headers.get("X-Video-Editor-Duration-Ms")) || null,
		width: Number(res.headers.get("X-Video-Width")) || null,
		height: Number(res.headers.get("X-Video-Height")) || null,
	};
}

/** Strip heavy base64 audio before Firestore / localStorage persistence. */
export function stripFramesForStorage(frames) {
	if (!Array.isArray(frames)) return frames;
	return frames.map((f) => {
		if (!f?.audio?.data_base64) return f;
		const { data_base64, ...audioRest } = f.audio;
		return { ...f, audio: { ...audioRest, data_base64: null, _stripped: true } };
	});
}

/** Recompute start_ms after reorder. */
export function reorderFramesWithTiming(frames) {
	const sorted = [...frames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	let ms = 0;
	return sorted.map((f, i) => {
		const out = { ...f, order: i, start_ms: ms };
		ms += Number(f.duration_ms) || 0;
		return out;
	});
}

export function totalDurationMs(frames) {
	if (!Array.isArray(frames)) return 0;
	return frames.reduce((s, f) => s + (Number(f.duration_ms) || 0), 0);
}
