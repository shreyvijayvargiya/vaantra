export const DEFAULT_TAB_ORDER = ["video", "voice", "caption", "blog", "clips"];

/** Map stored translation group type → primary video-tools tab id. */
export function groupTypeToPrimaryTab(type) {
	switch (type) {
		case "caption":
			return "caption";
		case "clips":
			return "clips";
		case "blog":
			return "blog";
		case "audio":
		case "voice":
			return "voice";
		default:
			return "video";
	}
}

/** Reorder tabs so the active job type appears first. */
export function getTabOrderForGroupType(type) {
	const primary = groupTypeToPrimaryTab(type);
	const rest = DEFAULT_TAB_ORDER.filter((t) => t !== primary);
	return [primary, ...rest];
}

/** Initial tab when opening follow-up form from a group. */
export function getInitialTabForGroupType(type) {
	return groupTypeToPrimaryTab(type);
}

function isAudioOnlyUrl(url) {
	return /\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/i.test(String(url || ""));
}

/** Best video URL to reuse from a completed group (source input or output). */
export function resolveReuseVideoUrl(group) {
	if (!group) return null;

	const tryUrl = (url) => {
		if (!url || typeof url !== "string") return null;
		const trimmed = url.trim();
		if (!/^https?:\/\//i.test(trimmed)) return null;
		if (isAudioOnlyUrl(trimmed)) return null;
		return trimmed;
	};

	const fromGroup = tryUrl(group.sourceVideoUrl);
	if (fromGroup) return fromGroup;

	for (const job of group.jobs || []) {
		const fromJob = tryUrl(job.sourceVideoUrl);
		if (fromJob) return fromJob;
	}

	for (const job of group.jobs || []) {
		if (String(job.id).startsWith("voice_")) continue;
		const fromResult = tryUrl(job.resultUrl);
		if (fromResult) return fromResult;
	}

	return null;
}

/** Tab order for follow-up tools — video URL reuse (excludes voice/audio tab). */
export function getFollowUpTabOrderForGroupType(type) {
	return getTabOrderForGroupType(type).filter((id) => id !== "voice");
}

/** First follow-up tab for a group type (video tools only). */
export function getInitialFollowUpTabForGroupType(type) {
	const order = getFollowUpTabOrderForGroupType(type);
	return order[0] || "video";
}
