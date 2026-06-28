import {
	CAPTION_STATUS_LABELS,
	CLIP_STATUS_LABELS,
	BLOG_STATUS_LABELS,
	getCaptionJob,
	getClipCutJob,
} from "./videoToolsApi";
import { getVideoEditorProject, stripFramesForStorage } from "./videoEditorApi";

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
	if (s === "ready") return "done";
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
		errorMessage: data.error ?? data.user_message ?? null,
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
		errorMessage: data.error ?? data.user_message ?? null,
	};
}

export function extractBlogToVideoJobFields(data) {
	if (!data || typeof data !== "object") return {};
	const apiStatus = data.status ?? "pending";
	const projectId = data.project_id ?? data.blog_to_video_id ?? null;
	const project = data.project ?? null;
	const frames = Array.isArray(data.frames) ? data.frames : null;
	const globalStyle = data.global_style ?? data.globalStyle ?? project?.global_style ?? null;

	return {
		blogToVideoId: projectId,
		videoEditorProjectId: projectId,
		editorProject: project
			? {
					width: project.width,
					height: project.height,
					fps: project.fps,
					duration_ms: project.duration_ms,
					title: project.title,
				}
			: null,
		editorFrames: frames,
		editorFramesStored: frames ? stripFramesForStorage(frames) : null,
		globalStyle,
		styleThemes: Array.isArray(data.style_themes) ? data.style_themes : null,
		title: project?.title ?? data.title ?? null,
		blogUrl: data.url ?? data.blog_url ?? null,
		targetDuration: data.target_duration ?? data.targetDuration ?? null,
		aspect: data.aspect ?? null,
		ttsVoice: data.tts_voice ?? data.ttsVoice ?? null,
		model: data.model ?? null,
		style: globalStyle,
		videoWidth: project?.width ?? null,
		videoHeight: project?.height ?? null,
		maxDurationSec: data.max_duration_sec ?? null,
		maxFrames: data.max_frames ?? null,
		resultUrl:
			data.video_url ??
			data.videoUrl ??
			data.final_video_url ??
			data.export_url ??
			null,
		apiStatus,
		status: normalizeBlogApiStatus(apiStatus),
		errorMessage: data.error ?? data.user_message ?? null,
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

export async function fetchBlogToVideoJobOnce(projectId) {
	const data = await getVideoEditorProject(projectId);
	return extractBlogToVideoJobFields(data);
}
