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

/** mm:ss for UI (e.g. cost hints). */
export function formatDurationClock(seconds) {
	const s = Math.max(0, Math.floor(Number(seconds) || 0));
	const m = Math.floor(s / 60);
	const r = s % 60;
	return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Best-effort duration from an audio URL (e.g. voice translation result). Needs CORS for cross-origin.
 * @returns {Promise<number>} duration in seconds, or 0 if unknown
 */
export function probeAudioDurationSeconds(url) {
	if (typeof window === "undefined" || !url || typeof url !== "string") {
		return Promise.resolve(0);
	}
	return new Promise((resolve) => {
		const a = document.createElement("audio");
		a.preload = "metadata";
		a.crossOrigin = "anonymous";
		const done = (sec) => {
			try {
				a.removeAttribute("src");
				a.load();
			} catch {
				/* ignore */
			}
			resolve(sec);
		};
		a.onloadedmetadata = () => {
			const d = a.duration;
			if (Number.isFinite(d) && d > 0) done(d);
			else done(0);
		};
		a.onerror = () => done(0);
		a.src = url;
	});
}
