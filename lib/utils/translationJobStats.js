import { PRICE_PER_MINUTE_USD } from "./usagePricing";

/**
 * Best-effort token estimate: API field, or ~4 chars per token from transcripts/caption.
 * @param {Record<string, unknown>} job
 * @returns {{ value: number, isEstimate: boolean } | null}
 */
export function getJobTokenEstimate(job) {
	if (!job || typeof job !== "object") return null;
	const fromApi =
		job.tokenCount ?? job.tokens ?? job.usageTokens ?? job.totalTokens;
	if (fromApi != null && Number.isFinite(Number(fromApi))) {
		const n = Math.round(Number(fromApi));
		return n > 0 ? { value: n, isEstimate: false } : null;
	}
	const parts = [
		job.transcriptOriginal,
		job.translatedTranscript,
		job.caption,
	].filter((s) => typeof s === "string" && s.trim());
	if (!parts.length) return null;
	const chars = parts.join("\n").length;
	if (chars <= 0) return null;
	return { value: Math.max(1, Math.ceil(chars / 4)), isEstimate: true };
}

/**
 * Billable minutes from fields we persist (API + client-measured at submit).
 * @param {Record<string, unknown>} job
 * @returns {number | null}
 */
export function getStoredBillableMinutes(job) {
	if (!job || typeof job !== "object") return null;
	const raw = Number(job.durationMinutes);
	if (Number.isFinite(raw) && raw > 0) return raw;
	for (const key of [
		"durationSeconds",
		"duration_seconds",
		"videoDurationSeconds",
		"sourceDurationSeconds",
	]) {
		const sec = Number(job[key]);
		if (Number.isFinite(sec) && sec > 0) {
			return Math.max(1, Math.ceil(sec / 60));
		}
	}
	return null;
}

/**
 * @param {Record<string, unknown>} job
 * @param {Record<string, unknown>} [_group]
 * @param {Record<string, number> | null} [probedMinutesByJobId] client probe fallback
 * @returns {number | null}
 */
export function getJobBillableMinutes(job, _group, probedMinutesByJobId) {
	const stored = getStoredBillableMinutes(job);
	if (stored != null) return stored;
	const id = job?.id;
	if (id && probedMinutesByJobId && probedMinutesByJobId[id] != null) {
		const m = Number(probedMinutesByJobId[id]);
		if (Number.isFinite(m) && m > 0) return m;
	}
	return null;
}

/**
 * @param {Record<string, unknown>} job
 * @param {Record<string, unknown>} [group]
 * @param {Record<string, number> | null} [probed]
 * @returns {number | null}
 */
export function getJobCostUsd(job, group, probed) {
	const m = getJobBillableMinutes(job, group, probed);
	if (m == null) return null;
	return m * PRICE_PER_MINUTE_USD;
}

/**
 * @param {Record<string, unknown>} job
 * @param {Record<string, unknown>} [group]
 */
export function getJobStatsTimestamp(job, group) {
	const raw =
		job?.completedAt ??
		job?.updatedAt ??
		job?.createdAt ??
		group?.updatedAt ??
		group?.createdAt;
	if (raw == null) return null;
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? null : d;
}
