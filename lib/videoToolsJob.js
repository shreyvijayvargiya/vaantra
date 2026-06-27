import {
	CAPTION_STATUS_LABELS,
	CLIP_STATUS_LABELS,
	BLOG_STATUS_LABELS,
	getCaptionJob,
	getClipCutJob,
	getBlogToVideoJob,
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

export function normalizeBlogApiStatus(raw) {
	const s = String(raw ?? "pending").toLowerCase();
	if (s === "success") return "done";
	if (s === "failed") return "error";
	return "processing";
}

export function blogStatusLabel(apiStatus) {
	return BLOG_STATUS_LABELS[apiStatus] || apiStatus || "Processing…";
}

export function extractCaptionJobFields(data) {
	if (!data || typeof data !== "object") return {};
	const apiStatus = data.status ?? "pending";
	const normalizeList = (value) => {
		if (!Array.isArray(value)) return null;
		const items = value.map((v) => String(v ?? "").trim()).filter(Boolean);
		return items.length ? items : null;
	};
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
		summary: data.summary ?? null,
		titles: normalizeList(data.titles),
		thumbnailTexts: normalizeList(data.thumbnail_texts ?? data.thumbnailTexts),
		hooks: normalizeList(data.hooks),
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

export function extractBlogToVideoJobFields(data) {
	if (!data || typeof data !== "object") return {};
	const apiStatus = data.status ?? "pending";
	const videoUrl = data.video_url ?? data.videoUrl ?? null;
	const audioUrl = data.audio_url ?? data.audioUrl ?? null;
	return {
		blogToVideoId: data.blog_to_video_id ?? null,
		resultUrl: videoUrl ?? audioUrl,
		sourceVideoUrl: videoUrl ?? null,
		audioUrl,
		blogUrl: data.url ?? data.blog_url ?? null,
		title: data.title ?? null,
		summary: data.summary ?? null,
		script: data.script ?? null,
		targetAudience: data.target_audience ?? data.targetAudience ?? null,
		segments: Array.isArray(data.segments) ? data.segments : null,
		visualDirector: data.visual_director ?? data.visualDirector ?? null,
		renderPlan: data.render_plan ?? data.renderPlan ?? null,
		scenes: data.scenes ?? null,
		captions: Array.isArray(data.captions) ? data.captions : null,
		targetDuration: data.target_duration ?? data.targetDuration ?? null,
		aspect: data.aspect ?? null,
		ttsVoice: data.tts_voice ?? data.ttsVoice ?? null,
		model: data.model ?? data.llm_model ?? null,
		style: data.style ?? data.video_style ?? null,
		styleThemes: Array.isArray(data.style_themes) ? data.style_themes : null,
		videoWidth: data.width ?? null,
		videoHeight: data.height ?? null,
		apiStatus,
		status: normalizeBlogApiStatus(apiStatus),
		errorMessage: data.error ?? null,
	};
}

export async function fetchBlogToVideoJobOnce(blogToVideoId) {
	const data = await getBlogToVideoJob(blogToVideoId);
	return extractBlogToVideoJobFields(data);
}
