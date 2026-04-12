/**
 * Translation backend — browser calls these URLs directly (no Next.js proxy).
 * POST: full URL to create job (returns `video_translate_id`).
 * GET: same origin as POST + `/api/video-translate/:id` for status.
 *
 * Set `NEXT_PUBLIC_TRANSLATE_API_URL` to your POST endpoint, or the API origin only:
 * `https://api.example.com` → normalized to `https://api.example.com/api/video-translate`.
 * Full path also works: `https://api.example.com/api/video-translate`.
 * Optional: `NEXT_PUBLIC_TRANSLATE_STATUS_URL` with `{id}` or `:id` for a custom GET URL.
 * Voice/text: `NEXT_PUBLIC_VOICE_TRANSLATE_API_URL` or `{same origin}/api/voice-translate` — POST `{ text, output_language }`, JSON `data`: transcript + `audio_url`.
 * Transcribe (prompt fill): `NEXT_PUBLIC_TRANSCRIBE_API_URL` or `{same origin}/api/transcribe` — POST multipart `audio` → `transcript` / `text`.
 * Auth headers are built in `pages/index.js` (`getTranslateAuthHeaders`): optional `NEXT_PUBLIC_TRANSLATE_API_TOKEN`, else Firebase ID token + `X-User-Id`.
 */
/** When `NEXT_PUBLIC_TRANSLATE_API_URL` is unset (local dev). */
const DEFAULT_TRANSLATE_API_ORIGIN = "http://localhost:3002";

/**
 * Env may be only the origin (`https://api.example.com`). POST must hit
 * `/api/video-translate`; status/SSE already use `origin + /api/...`.
 */
function normalizeTranslatePostUrl(raw) {
	const s = String(raw).trim();
	if (!s) return null;
	try {
		const u = new URL(s);
		const path = u.pathname.replace(/\/+$/, "") || "/";
		if (path === "/") {
			u.pathname = "/api/video-translate";
		}
		return u.href;
	} catch {
		return null;
	}
}

export function getTranslatePostUrl() {
	const fromEnv = process.env.NEXT_PUBLIC_TRANSLATE_API_URL?.trim();
	if (fromEnv) {
		const normalized = normalizeTranslatePostUrl(fromEnv);
		if (normalized) return normalized;
	}
	return `${DEFAULT_TRANSLATE_API_ORIGIN}/api/video-translate`;
}

function getTranslateApiOrigin() {
	try {
		return new URL(getTranslatePostUrl()).origin;
	} catch {
		return DEFAULT_TRANSLATE_API_ORIGIN;
	}
}

/** localStorage key for persisted model choice in the translate UI */
export const TRANSLATE_LLM_STORAGE_KEY = "vaantra_llm_choice";

/**
 * Video translate LLM options (OpenRouter-style ids).
 * When `apiValue` is null, omit `model` and `llm_model` — backend defaults to Google Gemini 2.5 Flash.
 */
export const TRANSLATE_LLM_OPTIONS = [
	{
		id: "gemini",
		label: "Gemini 2.5 Flash",
		hint: "Default — fast and capable",
		apiValue: null,
	},
	{
		id: "gpt-4o-mini",
		label: "GPT-4o mini",
		hint: "OpenAI",
		apiValue: "openai/gpt-4o-mini",
	},
	{
		id: "sonnet",
		label: "Claude 3.5 Sonnet",
		hint: "Anthropic",
		apiValue: "anthropic/claude-3.5-sonnet",
	},
	{
		id: "kimi",
		label: "Kimi K2",
		hint: "Moonshot AI",
		apiValue: "moonshotai/kimi-k2-0905",
	},
	{
		id: "grok",
		label: "Grok 2",
		hint: "xAI",
		apiValue: "x-ai/grok-2-1212",
	},
];

/** Top-level `error` from POST/GET JSON (null = ok) */
export function getApiErrorMessage(data) {
	if (!data || data.error == null || data.error === "") return null;
	if (typeof data.error === "string") return data.error;
	try {
		return JSON.stringify(data.error);
	} catch {
		return "Request error";
	}
}

/**
 * GET job status — direct backend URL: `{POST origin}/api/video-translate/:videoId`
 */
export function getTranslateStatusUrl(videoId) {
	const custom = process.env.NEXT_PUBLIC_TRANSLATE_STATUS_URL?.trim();
	if (custom) return custom.replace("{id}", videoId).replace(":id", videoId);

	const post = getTranslatePostUrl();
	try {
		const u = new URL(post);
		return `${u.origin}/api/video-translate/${encodeURIComponent(videoId)}`;
	} catch {
		return `${getTranslateApiOrigin()}/api/video-translate/${encodeURIComponent(videoId)}`;
	}
}

/**
 * POST body shape: `{ error: null, data: { video_translate_id, video_translate_ids } }`
 */
export function parseVideoIdFromPostResponse(data) {
	if (!data || typeof data !== "object") return null;
	const inner = data.data && typeof data.data === "object" ? data.data : data;
	const ids = inner.video_translate_ids;
	const firstFromBatch = Array.isArray(ids) && ids.length > 0 ? ids[0] : null;
	return (
		inner.video_translate_id ??
		firstFromBatch ??
		data.videoId ??
		data.video_id ??
		data.id ??
		data.data?.video_translate_id ??
		data.data?.videoId ??
		data.data?.video_id ??
		data.data?.id ??
		null
	);
}

/** Map backend status strings to UI step keys */
export function normalizeStatus(raw) {
	const s = String(raw ?? "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "_");
	if (!s) return "queued";
	if (
		["done", "completed", "success", "finished", "complete", "ready"].includes(
			s,
		)
	)
		return "done";
	if (["error", "failed", "failure", "cancelled", "canceled"].includes(s))
		return "error";
	if (["queued", "queue", "pending", "waiting", "scheduled"].includes(s))
		return "queued";
	if (["uploading", "upload"].includes(s)) return "uploading";
	if (
		[
			"processing",
			"analyzing",
			"processing_video",
			"extracting",
			"transcribing",
		].includes(s)
	)
		return "processing";
	if (
		[
			"translating",
			"dubbing",
			"translation",
			"synthesizing",
			"rendering",
		].includes(s)
	)
		return "translating";
	return "processing";
}

export function extractResultUrl(data) {
	if (!data || typeof data !== "object") return null;
	const d = data.data && typeof data.data === "object" ? data.data : data;
	return (
		d.url ??
		d.outputUrl ??
		d.output_url ??
		d.videoUrl ??
		d.video_url ??
		d.resultUrl ??
		d.result_url ??
		d.downloadUrl ??
		d.download_url ??
		null
	);
}

/**
 * Fields from GET /api/video-translate/:id `data` object (dubbed url, source, transcripts).
 */
export function extractJobFieldsFromGetResponse(data) {
	const d = data?.data && typeof data.data === "object" ? data.data : null;
	if (!d) return {};
	const durationSeconds =
		d.duration_seconds ?? d.duration_secs ?? d.video_duration_seconds ?? null;
	let durationMinutes = null;
	if (durationSeconds != null && Number.isFinite(Number(durationSeconds))) {
		durationMinutes = Math.max(1, Math.ceil(Number(durationSeconds) / 60));
	}
	return {
		resultUrl: d.url ?? null,
		sourceVideoUrl: d.source_video_url ?? null,
		transcriptOriginal: d.transcript_original ?? null,
		translatedTranscript: d.translated_transcript ?? null,
		captionUrl: d.caption_url ?? null,
		caption: d.caption ?? null,
		outputLanguage: d.output_language ?? null,
		videoTranslateId: d.video_translate_id ?? null,
		durationMinutes,
	};
}

export function extractStatusField(data) {
	if (!data || typeof data !== "object") return "";
	const d = data.data && typeof data.data === "object" ? data.data : data;
	return d.status ?? d.state ?? d.stage ?? d.phase ?? "";
}

/**
 * SSE: `{origin}/api/video-translate/caption?video_translate_id=…&stream=1`
 * (same as backend `stream=1` or Accept: text/event-stream).
 */
export function getCaptionStreamUrl(videoTranslateId) {
	const custom = process.env.NEXT_PUBLIC_TRANSLATE_CAPTION_STREAM_URL?.trim();
	if (custom) {
		return custom
			.replace("{id}", videoTranslateId)
			.replace(":id", videoTranslateId);
	}
	const post = getTranslatePostUrl();
	try {
		const u = new URL(post);
		const base = `${u.origin}/api/video-translate/caption`;
		const q = new URLSearchParams({
			video_translate_id: String(videoTranslateId).trim(),
			stream: "1",
		});
		return `${base}?${q.toString()}`;
	} catch {
		const q = new URLSearchParams({
			video_translate_id: String(videoTranslateId).trim(),
			stream: "1",
		});
		return `${getTranslateApiOrigin()}/api/video-translate/caption?${q.toString()}`;
	}
}

/** Parse one SSE block (lines ending with blank line). */
function parseSseBlock(block) {
	let eventName = "message";
	const dataLines = [];
	for (const line of block.split("\n")) {
		if (line.startsWith("event:")) eventName = line.slice(6).trim();
		else if (line.startsWith("data:")) {
			const rest = line.slice(5);
			dataLines.push(rest.startsWith(" ") ? rest.slice(1) : rest);
		}
	}
	const dataStr = dataLines.join("\n");
	if (!dataStr) return { event: eventName, data: null };
	try {
		return { event: eventName, data: JSON.parse(dataStr) };
	} catch {
		return { event: eventName, data: dataStr };
	}
}

/**
 * Full GET status (fallback if SSE ends early or for one-shot refresh).
 * `getAuthHeaders` async () => Record<string, string>
 */
export async function fetchTranslateJobStatus(videoId, getAuthHeaders) {
	const headers = await getAuthHeaders();
	const res = await fetch(getTranslateStatusUrl(videoId), { headers });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const msg =
			getApiErrorMessage(data) || data.message || `HTTP ${res.status}`;
		throw new Error(msg);
	}
	const apiErr = getApiErrorMessage(data);
	if (apiErr) throw new Error(apiErr);
	const mapped = normalizeStatus(extractStatusField(data));
	const fields = extractJobFieldsFromGetResponse(data);
	return {
		status: mapped,
		fields: {
			...fields,
			resultUrl: fields.resultUrl ?? extractResultUrl(data) ?? null,
		},
	};
}

/**
 * Caption SSE: progress / caption / error / done.
 * Uses fetch + stream (supports Authorization; EventSource does not).
 */
export function subscribeCaptionStatusStream(
	videoTranslateId,
	getAuthHeaders,
	{ onProgress, onCaption, onError, onDone },
	signal,
) {
	return (async () => {
		const url = getCaptionStreamUrl(videoTranslateId);
		const auth = await getAuthHeaders();
		const res = await fetch(url, {
			method: "GET",
			headers: {
				...auth,
				Accept: "text/event-stream",
			},
			signal,
		});
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			let parsed = {};
			try {
				parsed = JSON.parse(text);
			} catch {
				/* ignore */
			}
			const msg =
				getApiErrorMessage(parsed) ||
				parsed.message ||
				text ||
				`Stream HTTP ${res.status}`;
			throw new Error(msg);
		}
		const reader = res.body?.getReader();
		if (!reader) throw new Error("No response body");
		const decoder = new TextDecoder();
		let buffer = "";
		let sawDone = false;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			buffer = buffer.replace(/\r\n/g, "\n");
			for (;;) {
				const sep = buffer.indexOf("\n\n");
				if (sep === -1) break;
				const block = buffer.slice(0, sep);
				buffer = buffer.slice(sep + 2);
				const { event, data } = parseSseBlock(block);
				if (data == null) continue;

				if (event === "progress" && data && typeof data === "object") {
					onProgress?.(data.status ?? data);
					continue;
				}
				if (event === "caption" && data && typeof data === "object") {
					const inner = data.data != null ? data.data : data;
					onCaption?.(data, inner);
					continue;
				}
				if (event === "error") {
					onError?.(data);
					continue;
				}
				if (event === "done") {
					sawDone = true;
					const ok = data && typeof data === "object" && data.ok === true;
					onDone?.(ok, data);
					continue;
				}
			}
		}

		if (!sawDone) {
			onDone?.(false, { incomplete: true });
		}
	})();
}

// ─── Voice / text translation (transcript + TTS audio) ───────────────────────
/**
 * POST `{origin}/api/voice-translate/text` — JSON: `{ text, languages: string[], include_audio?: boolean }`
 * or multipart: `audio`, `languages` (JSON array string), optional `text`, `include_audio`.
 * Set `NEXT_PUBLIC_VOICE_TRANSLATE_API_URL` or defaults to `{video API origin}/api/voice-translate/text`.
 */
export function getVoiceTranslatePostUrl() {
	const custom = process.env.NEXT_PUBLIC_VOICE_TRANSLATE_API_URL?.trim();
	if (custom) return custom;
	const post = getTranslatePostUrl();
	try {
		const u = new URL(post);
		return `${u.origin}/api/voice-translate/text`;
	} catch {
		return `${getTranslateApiOrigin()}/api/voice-translate/text`;
	}
}

/** Normalize POST response: translated transcript + audio URL for target language. */
export function extractVoiceTranslateResponse(data) {
	const d = data?.data && typeof data.data === "object" ? data.data : data;
	if (!d || typeof d !== "object") {
		return { transcript: null, audioUrl: null, outputLanguage: null };
	}
	return {
		transcript:
			d.transcript ??
			d.translated_transcript ??
			d.translated_text ??
			d.output_transcript ??
			d.text ??
			null,
		audioUrl: d.audio_url ?? d.audioUrl ?? d.url ?? d.audio ?? null,
		outputLanguage: d.output_language ?? d.outputLanguage ?? null,
	};
}

function normalizeVoiceResultItem(item) {
	if (!item || typeof item !== "object") return null;
	return {
		lang:
			item.output_language ??
			item.lang ??
			item.language ??
			item.target_language ??
			"—",
		transcript:
			item.transcript ??
			item.translated_transcript ??
			item.translated_text ??
			item.text ??
			null,
		audioUrl: item.audio_url ?? item.audioUrl ?? item.url ?? item.audio ?? null,
	};
}

/**
 * Batch voice response: `data.results[]`, `data.outputs[]`, or single-object shape.
 */
export function extractVoiceTranslateBatchResponse(data) {
	const d = data?.data && typeof data.data === "object" ? data.data : data;
	if (!d || typeof d !== "object") return [];

	const fromArray = (arr) =>
		arr
			.map(normalizeVoiceResultItem)
			.filter((x) => x && (x.transcript || x.audioUrl));

	if (Array.isArray(d.results)) return fromArray(d.results);
	if (Array.isArray(d.outputs)) return fromArray(d.outputs);
	if (Array.isArray(d.items)) return fromArray(d.items);

	const single = extractVoiceTranslateResponse(data);
	if (single.transcript || single.audioUrl) {
		return [
			{
				lang: single.outputLanguage || "—",
				transcript: single.transcript,
				audioUrl: single.audioUrl,
			},
		];
	}
	return [];
}

// ─── Speech-to-text (fill prompt before translate) ───────────────────────────
/**
 * POST multipart: `audio` file → transcript/caption text.
 * `NEXT_PUBLIC_TRANSCRIBE_API_URL` or `{video API origin}/api/transcribe`.
 */
export function getTranscribePostUrl() {
	const custom = process.env.NEXT_PUBLIC_TRANSCRIBE_API_URL?.trim();
	if (custom) return custom;
	const post = getTranslatePostUrl();
	try {
		const u = new URL(post);
		return `${u.origin}/api/transcribe`;
	} catch {
		return `${getTranslateApiOrigin()}/api/transcribe`;
	}
}

export function extractTranscribeText(data) {
	const d = data?.data && typeof data.data === "object" ? data.data : data;
	if (!d || typeof d !== "object") return null;
	const t =
		d.transcript ??
		d.text ??
		d.caption ??
		d.transcription ??
		d.original_transcript ??
		null;
	if (typeof t !== "string") return null;
	const s = t.trim();
	return s || null;
}

/**
 * `getAuthHeaders` async () => headers (no Content-Type for multipart).
 * Returns transcript string or null on failure / empty.
 */
export async function transcribeAudioBlob(fileOrBlob, getAuthHeaders) {
	const url = getTranscribePostUrl();
	const file =
		fileOrBlob instanceof File
			? fileOrBlob
			: new File([fileOrBlob], "audio.webm", {
					type: fileOrBlob.type || "audio/webm",
				});
	const fd = new FormData();
	fd.append("audio", file);
	const auth = await getAuthHeaders();
	const res = await fetch(url, { method: "POST", headers: auth, body: fd });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const msg = getApiErrorMessage(data);
		if (msg) throw new Error(msg);
		return null;
	}
	if (getApiErrorMessage(data)) return null;
	return extractTranscribeText(data);
}
