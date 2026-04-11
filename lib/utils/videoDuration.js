/**
 * Best-effort duration from a video URL (needs CORS for cross-origin).
 * @returns {Promise<number>} duration in seconds, or 0 if unknown
 */
export function probeVideoDurationSeconds(url) {
	if (typeof window === "undefined" || !url || typeof url !== "string") {
		return Promise.resolve(0);
	}
	return new Promise((resolve) => {
		const v = document.createElement("video");
		v.preload = "metadata";
		v.crossOrigin = "anonymous";
		const done = (sec) => {
			try {
				URL.revokeObjectURL(v.src);
			} catch {
				/* ignore */
			}
			resolve(sec);
		};
		v.onloadedmetadata = () => {
			const d = v.duration;
			if (Number.isFinite(d) && d > 0) done(d);
			else done(0);
		};
		v.onerror = () => done(0);
		v.src = url;
	});
}

export function secondsToBillableMinutes(seconds) {
	const s = Number(seconds);
	if (!Number.isFinite(s) || s <= 0) return 1;
	return Math.max(1, Math.ceil(s / 60));
}
