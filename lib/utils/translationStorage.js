/** Browser localStorage keys for translation job groups (fallback + offline cache). */

/**
 * Whether this group is voice/audio or video translation (used in Firestore + sidebar).
 */
export function inferTranslationGroupType(group) {
	if (!group || typeof group !== "object") return "video";
	const t = group.type;
	if (t === "audio" || t === "video" || t === "caption" || t === "clips") return t;
	const jobs = group.jobs;
	if (Array.isArray(jobs)) {
		if (jobs.some((j) => j && String(j.id).startsWith("voice_"))) {
			return "audio";
		}
		if (jobs.some((j) => j && String(j.id).startsWith("vcc_"))) {
			return "clips";
		}
		if (jobs.some((j) => j && String(j.id).startsWith("vc_"))) {
			return "caption";
		}
	}
	return "video";
}

export const LEGACY_VIDEO_KEYS = ["aantraa_videos", "translatemyvideo_videos"];

export function videosStorageKey(uid) {
	return uid ? `aantraa_videos_${uid}` : "aantraa_videos";
}

export function dedupeVideosById(list) {
	const seen = new Set();
	const out = [];
	for (const v of list) {
		if (!v?.id) continue;
		if (seen.has(v.id)) continue;
		seen.add(v.id);
		out.push(v);
	}
	return out;
}

export function normalizeStoredVideo(v) {
	if (!v || typeof v !== "object") return null;
	if (Array.isArray(v.jobs) && v.jobs.length > 0) {
		const withJobs = {
			...v,
			id: v.id,
			label: v.label ?? null,
			jobs: v.jobs.map((j) => ({ ...j })),
			createdAt: v.createdAt || new Date().toISOString(),
		};
		return { ...withJobs, type: inferTranslationGroupType(withJobs) };
	}
	const id = v.id;
	if (!id) return null;
	const legacy = {
		id,
		label: v.label ?? null,
		type: v.type ?? "video",
		jobs: [
			{
				id,
				lang: v.lang || "—",
				status: v.status || "queued",
				createdAt: v.createdAt,
				resultUrl: v.resultUrl ?? null,
				sourceVideoUrl: v.sourceVideoUrl ?? null,
				transcriptOriginal: v.transcriptOriginal ?? null,
				translatedTranscript: v.translatedTranscript ?? null,
				captionUrl: v.captionUrl ?? null,
				caption: v.caption ?? null,
				outputLanguage: v.outputLanguage ?? null,
				videoTranslateId: v.videoTranslateId ?? id,
			},
		],
		createdAt: v.createdAt || new Date().toISOString(),
		sourceVideoUrl: v.sourceVideoUrl ?? null,
	};
	return { ...legacy, type: inferTranslationGroupType(legacy) };
}

export function loadVideosForUser(uid) {
	if (typeof window === "undefined" || !uid) return [];
	try {
		const key = videosStorageKey(uid);
		let raw = localStorage.getItem(key);
		if (!raw || raw === "[]") {
			for (const legacyKey of LEGACY_VIDEO_KEYS) {
				const leg = localStorage.getItem(legacyKey);
				if (leg && leg !== "[]") {
					localStorage.setItem(key, leg);
					break;
				}
			}
			raw = localStorage.getItem(key);
		}
		const arr = JSON.parse(raw || "[]");
		const list = Array.isArray(arr) ? arr : [];
		return dedupeVideosById(list.map(normalizeStoredVideo).filter(Boolean));
	} catch {
		return [];
	}
}

export function saveVideos(list, uid) {
	if (!uid) return;
	try {
		localStorage.setItem(videosStorageKey(uid), JSON.stringify(list));
	} catch {
		/* ignore */
	}
}
