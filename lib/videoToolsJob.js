import {
	CAPTION_STATUS_LABELS,
	CLIP_STATUS_LABELS,
	getCaptionJob,
	getClipCutJob,
} from "./videoToolsApi";

export function normalizeCaptionApiStatus(raw) {
	const s = String(raw ?? "pending").toLowerCase();
	if (s === "success") return "done";
	if (s === "failed") return "error";
	if (s === "running") return "processing";
	return "queued";
}

export function normalizeClipApiStatus(raw) {
	const s = String(raw ?? "pending").toLowerCase();
	if (s === "success") return "done";
	if (s === "failed") return "error";
	return "processing";
}

export function captionStatusLabel(apiStatus) {
	return CAPTION_STATUS_LABELS[apiStatus] || apiStatus || "Processing…";
}

export function clipStatusLabel(apiStatus) {
	return CLIP_STATUS_LABELS[apiStatus] || apiStatus || "Processing…";
}

export function extractCaptionJobFields(data) {
	if (!data || typeof data !== "object") return {};
	const apiStatus = data.status ?? "pending";
	return {
		videoCaptionId: data.video_caption_id ?? null,
		sourceVideoUrl: data.source_video_url ?? null,
		resultUrl:
			data.videoUrl ??
			data.video_url ??
			data.captioned_video_url ??
			data.final_video_url ??
			null,
		transcript: data.transcript ?? data.caption ?? null,
		caption: data.caption ?? data.transcript ?? null,
		captionUrl: data.caption_url ?? null,
		srtUrl: data.srt_url ?? null,
		timedCaptions: Array.isArray(data.captions) ? data.captions : null,
		apiStatus,
		status: normalizeCaptionApiStatus(apiStatus),
		errorMessage: data.error ?? null,
	};
}

export function extractClipJobFields(data) {
	if (!data || typeof data !== "object") return {};
	const apiStatus = data.status ?? "pending";
	return {
		viralClipCutId: data.viral_clip_cut_id ?? null,
		sourceVideoUrl: data.source_video_url ?? null,
		summary: data.summary ?? null,
		transcript: data.transcript ?? null,
		clips: Array.isArray(data.clips) ? data.clips : null,
		clipCount: data.clip_count ?? null,
		apiStatus,
		status: normalizeClipApiStatus(apiStatus),
		errorMessage: data.error ?? null,
	};
}

export async function fetchCaptionJobOnce(captionId) {
	const data = await getCaptionJob(captionId);
	return extractCaptionJobFields(data);
}

export async function fetchClipJobOnce(clipCutId) {
	const data = await getClipCutJob(clipCutId);
	return extractClipJobFields(data);
}
