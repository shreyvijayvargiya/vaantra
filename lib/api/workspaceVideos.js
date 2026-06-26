/**
 * User workspace videos — reusable MP4 URLs for translate / caption / clips.
 * Path: users/{uid}/workspaceVideos/{videoId}
 *
 * Firestore rules (deploy in Firebase console):
 * match /users/{userId}/workspaceVideos/{videoId} {
 *   allow read, write: if request.auth != null && request.auth.uid == userId;
 * }
 */

import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION = "workspaceVideos";

function normalizeWorkspaceVideo(raw, id) {
	if (!raw?.url) return null;
	return {
		id: id || raw.id,
		name: raw.name || "Untitled video",
		url: raw.url,
		sizeBytes: raw.sizeBytes ?? null,
		durationSec: raw.durationSec ?? null,
		source: raw.source || "upload",
		groupId: raw.groupId ?? null,
		langs: Array.isArray(raw.langs) ? [...new Set(raw.langs.filter(Boolean))] : [],
		isPersisted: raw.isPersisted !== false,
		createdAt:
			raw.createdAt?.toDate?.()?.toISOString?.() ||
			raw.createdAt ||
			new Date().toISOString(),
	};
}

export async function fetchWorkspaceVideos(uid) {
	if (!uid) return [];
	try {
		const q = query(
			collection(db, "users", uid, COLLECTION),
			orderBy("createdAt", "desc"),
		);
		const snap = await getDocs(q);
		return snap.docs
			.map((d) => normalizeWorkspaceVideo(d.data(), d.id))
			.filter(Boolean);
	} catch (e) {
		console.warn("[workspaceVideos] ordered fetch failed, using fallback:", e);
		try {
			const snap = await getDocs(collection(db, "users", uid, COLLECTION));
			return snap.docs
				.map((d) => normalizeWorkspaceVideo(d.data(), d.id))
				.filter(Boolean)
				.sort(
					(a, b) =>
						new Date(b.createdAt || 0).getTime() -
						new Date(a.createdAt || 0).getTime(),
				);
		} catch (e2) {
			console.warn("[workspaceVideos] fetch failed:", e2);
			return [];
		}
	}
}

export async function findWorkspaceVideoByUrl(uid, url) {
	if (!uid || !url) return null;
	const q = query(
		collection(db, "users", uid, COLLECTION),
		where("url", "==", url),
	);
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return normalizeWorkspaceVideo(d.data(), d.id);
}

export async function addWorkspaceVideo(uid, payload) {
	if (!uid || !payload?.url) throw new Error("Missing uid or video url");
	const existing = await findWorkspaceVideoByUrl(uid, payload.url);
	if (existing) return existing;

	const id =
		payload.id ||
		(typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: `wv_${Date.now()}_${Math.random().toString(36).slice(2)}`);

	const docData = {
		id,
		name: payload.name || "Untitled video",
		url: payload.url,
		sizeBytes: payload.sizeBytes ?? null,
		durationSec: payload.durationSec ?? null,
		source: payload.source || "upload",
		groupId: payload.groupId ?? null,
		createdAt: payload.createdAt || new Date().toISOString(),
		updatedAt: serverTimestamp(),
	};

	await setDoc(doc(db, "users", uid, COLLECTION, id), docData, { merge: true });
	return normalizeWorkspaceVideo(docData, id);
}

/** Register a job source URL in workspace if not already present. */
export async function ensureWorkspaceVideoFromJob(uid, { url, name, groupId }) {
	if (!uid || !url) return null;
	return addWorkspaceVideo(uid, {
		url,
		name: name || "From job",
		source: "job",
		groupId: groupId ?? null,
	});
}

export async function deleteWorkspaceVideo(uid, videoId) {
	if (!uid || !videoId) return;
	await deleteDoc(doc(db, "users", uid, COLLECTION, videoId));
}

/** Derive display name from URL when no filename is available. */
export function workspaceVideoLabel(video) {
	if (!video) return "";
	if (video.name && video.name !== "Untitled video") return video.name;
	try {
		const path = new URL(video.url).pathname;
		const base = path.split("/").pop() || "";
		return decodeURIComponent(base) || video.url;
	} catch {
		return video.url || "Video";
	}
}

function groupDisplayName(group) {
	if (group?.label && String(group.label).trim()) return group.label.trim();
	if (group?.type === "caption") return "AI Captions";
	if (group?.type === "clips") return "Viral Clips";
	const jobs = group?.jobs || [];
	if (jobs.length === 0) return "Translation";
	if (jobs.length === 1) return jobs[0].lang || "Translation";
	return `${jobs[0].lang} +${jobs.length - 1}`;
}

function isLikelyVideoUrl(url) {
	if (!url || typeof url !== "string") return false;
	const trimmed = url.trim();
	if (!/^https?:\/\//i.test(trimmed)) return false;
	// Skip obvious audio-only URLs (voice translation outputs)
	if (/\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/i.test(trimmed)) return false;
	return true;
}

function isVoiceJob(job) {
	return job && String(job.id).startsWith("voice_");
}

function mergeLangs(a, b) {
	return [...new Set([...(a || []), ...(b || [])])].filter(Boolean);
}

function jobLang(job) {
	return job?.lang || job?.outputLanguage || null;
}

function collectUrlsFromJob(job, group, groupName, groupCreated) {
	const urls = [];
	const createdAt = job.createdAt || groupCreated;
	const lang = jobLang(job);
	const langs = lang ? [lang] : [];

	if (job.sourceVideoUrl) {
		urls.push({ url: job.sourceVideoUrl, name: groupName, createdAt, langs });
	}

	if (!isVoiceJob(job) && job.resultUrl && isLikelyVideoUrl(job.resultUrl)) {
		const sameAsSource =
			job.sourceVideoUrl &&
			job.sourceVideoUrl.trim() === job.resultUrl.trim();
		if (!sameAsSource) {
			urls.push({
				url: job.resultUrl,
				name: groupName,
				createdAt,
				langs,
			});
		}
	}

	if (Array.isArray(job.clips)) {
		job.clips.forEach((clip, i) => {
			const clipUrl = clip?.videoUrl || clip?.video_url;
			if (isLikelyVideoUrl(clipUrl)) {
				urls.push({
					url: clipUrl,
					name: `${groupName} · Clip ${i + 1}`,
					createdAt,
					langs,
				});
			}
		});
	}

	return urls;
}

function derivedVideoId(url) {
	return `derived_${encodeURIComponent(url).slice(0, 120)}`;
}

/**
 * Collect unique source video URLs from translation history (groups + jobs).
 */
export function extractVideosFromTranslationGroups(groups) {
	const byUrl = new Map();

	const add = ({ url, name, groupId, createdAt, langs = [] }) => {
		if (!isLikelyVideoUrl(url)) return;
		const normalized = url.trim();
		const existing = byUrl.get(normalized);
		const nextCreated = createdAt || new Date().toISOString();
		if (!existing) {
			byUrl.set(normalized, {
				id: derivedVideoId(normalized),
				name: name || "From job",
				url: normalized,
				sizeBytes: null,
				durationSec: null,
				source: "job",
				groupId: groupId ?? null,
				langs: mergeLangs([], langs),
				createdAt: nextCreated,
				isPersisted: false,
			});
			return;
		}
		const existingTs = new Date(existing.createdAt || 0).getTime();
		const nextTs = new Date(nextCreated).getTime();
		const merged = {
			...existing,
			langs: mergeLangs(existing.langs, langs),
			groupId: groupId ?? existing.groupId,
		};
		if (nextTs >= existingTs) {
			merged.name = name && name !== "From job" ? name : existing.name;
			merged.createdAt = nextCreated;
		}
		byUrl.set(normalized, merged);
	};

	for (const group of groups || []) {
		const groupName = groupDisplayName(group);
		const groupCreated = group.createdAt || new Date().toISOString();
		const groupLangs = [
			...new Set((group.jobs || []).map(jobLang).filter(Boolean)),
		];
		if (group.sourceVideoUrl) {
			add({
				url: group.sourceVideoUrl,
				name: groupName,
				groupId: group.id,
				createdAt: groupCreated,
				langs: groupLangs,
			});
		}
		for (const job of group.jobs || []) {
			const entries = collectUrlsFromJob(job, group, groupName, groupCreated);
			for (const entry of entries) {
				add({
					...entry,
					groupId: group.id,
				});
			}
		}
	}

	return [...byUrl.values()];
}

/** Merge Firestore workspace docs with URLs discovered from translation history. */
export function mergeWorkspaceVideoLists(stored = [], fromJobs = []) {
	const byUrl = new Map();

	for (const v of stored) {
		if (!v?.url) continue;
		byUrl.set(v.url.trim(), { ...v, isPersisted: true });
	}

	for (const v of fromJobs) {
		if (!v?.url) continue;
		const key = v.url.trim();
		if (byUrl.has(key)) {
			const prev = byUrl.get(key);
			byUrl.set(key, {
				...prev,
				name:
					prev.name && prev.name !== "Untitled video"
						? prev.name
						: v.name || prev.name,
				groupId: prev.groupId ?? v.groupId,
				createdAt:
					new Date(v.createdAt || 0) > new Date(prev.createdAt || 0)
						? v.createdAt
						: prev.createdAt,
			});
		} else {
			byUrl.set(key, v);
		}
	}

	return [...byUrl.values()].sort(
		(a, b) =>
			new Date(b.createdAt || 0).getTime() -
			new Date(a.createdAt || 0).getTime(),
	);
}

/** Workspace videos + all historical URLs from translation groups. */
export async function fetchAndMergeWorkspaceVideos(uid, translationGroups) {
	if (!uid) return [];

	let stored = [];
	try {
		stored = await fetchWorkspaceVideos(uid);
	} catch (e) {
		console.warn("[workspaceVideos] stored fetch failed:", e);
	}

	let groups = translationGroups;
	if (!groups?.length) {
		try {
			const { fetchAndMergeTranslationGroups } = await import("./translationHistory");
			const { loadVideosForUser } = await import("../utils/translationStorage");
			groups = await fetchAndMergeTranslationGroups(uid).catch(() =>
				loadVideosForUser(uid),
			);
		} catch (e) {
			console.warn("[workspaceVideos] groups fetch failed:", e);
			groups = [];
		}
	}

	const fromJobs = extractVideosFromTranslationGroups(groups);
	return mergeWorkspaceVideoLists(stored, fromJobs);
}
