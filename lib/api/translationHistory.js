/**
 * Firestore-backed translation job groups (video + voice).
 * Path: users/{uid}/translationGroups/{groupId}
 *
 * Security rules (deploy in Firebase console):
 * match /users/{userId}/translationGroups/{groupId} {
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
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
	dedupeVideosById,
	inferTranslationGroupType,
	loadVideosForUser,
	normalizeStoredVideo,
	saveVideos,
} from "../utils/translationStorage";

/** Job fields we merge so local URLs are not lost when Firestore has an older partial doc. */
const JOB_MERGE_URL_FIELDS = [
	"resultUrl",
	"audioUrl",
	"sourceVideoUrl",
	"captionUrl",
	"translatedTranscript",
	"transcriptOriginal",
	"caption",
];

function mergeJob(a, b) {
	if (!a) return { ...b };
	if (!b) return { ...a };
	const out = { ...a, ...b };
	for (const key of JOB_MERGE_URL_FIELDS) {
		const av = a[key];
		const bv = b[key];
		if (bv != null && bv !== "") out[key] = bv;
		else if ((out[key] == null || out[key] === "") && av != null && av !== "")
			out[key] = av;
	}
	return out;
}

function mergeJobsById(jobsA, jobsB) {
	const map = new Map();
	for (const j of jobsA || []) {
		if (j?.id) map.set(j.id, { ...j });
	}
	for (const j of jobsB || []) {
		if (!j?.id) continue;
		const prev = map.get(j.id);
		map.set(j.id, prev ? mergeJob(prev, j) : { ...j });
	}
	return [...map.values()];
}

function pickNewerIso(a, b) {
	const ta = new Date(a || 0).getTime();
	const tb = new Date(b || 0).getTime();
	return tb >= ta ? b : a;
}

/**
 * Merge two group snapshots (e.g. remote + local) so URLs and metadata are preserved.
 */
export function mergeTranslationGroups(remoteGroup, localGroup) {
	const a = normalizeStoredVideo(remoteGroup) || remoteGroup;
	const b = normalizeStoredVideo(localGroup) || localGroup;
	if (!a?.id) return b;
	if (!b?.id) return a;
	const mergedJobs = mergeJobsById(a.jobs, b.jobs);
	const merged = {
		...a,
		...b,
		id: a.id,
		label: b.label ?? a.label,
		jobs: mergedJobs,
		sourceVideoUrl: b.sourceVideoUrl ?? a.sourceVideoUrl,
		createdAt: pickNewerIso(a.createdAt, b.createdAt),
	};
	merged.type = inferTranslationGroupType(merged);
	return normalizeStoredVideo(merged) || merged;
}

function groupsCollectionRef(uid) {
	return collection(db, "users", uid, "translationGroups");
}

function groupDocRef(uid, groupId) {
	return doc(db, "users", uid, "translationGroups", groupId);
}

function coerceIso(val) {
	if (val == null) return new Date().toISOString();
	if (typeof val?.toDate === "function") return val.toDate().toISOString();
	if (typeof val === "string") return val;
	return String(val);
}

function normalizeJobFromFirestore(j) {
	if (!j || typeof j !== "object") return j;
	const createdAt = j.createdAt ? coerceIso(j.createdAt) : undefined;
	return {
		...j,
		createdAt,
		resultUrl: j.resultUrl ?? j.audioUrl ?? null,
		audioUrl: j.audioUrl ?? j.resultUrl ?? null,
	};
}

/**
 * Firestore document → same shape as localStorage group.
 */
export function firestoreDocToGroup(docId, data) {
	if (!data || typeof data !== "object") return null;
	const jobs = Array.isArray(data.jobs)
		? data.jobs.map(normalizeJobFromFirestore)
		: [];
	const g = {
		id: data.id || docId,
		label: data.label ?? null,
		type: data.type ?? null,
		jobs,
		createdAt: coerceIso(data.createdAt),
		sourceVideoUrl: data.sourceVideoUrl ?? null,
		sourceText: data.sourceText ?? null,
	};
	const normalized = normalizeStoredVideo(g);
	return normalized;
}

/**
 * Full group payload for Firestore: `type` (video | audio), all job URLs/metadata, no undefined.
 */
export function buildGroupDocumentForFirestore(group) {
	const n = normalizeStoredVideo(group);
	if (!n?.id) return null;
	const type = n.type ?? inferTranslationGroupType(n);
	const jobs = (n.jobs || []).map((j) => {
		const job = {
			...j,
			id: j.id,
			lang: j.lang ?? "—",
			status: j.status ?? "queued",
			createdAt: j.createdAt
				? typeof j.createdAt === "string"
					? j.createdAt
					: coerceIso(j.createdAt)
				: new Date().toISOString(),
			resultUrl: j.resultUrl ?? j.audioUrl ?? null,
			audioUrl:
				type === "audio"
					? (j.audioUrl ?? j.resultUrl ?? null)
					: (j.audioUrl ?? null),
			sourceVideoUrl: j.sourceVideoUrl ?? null,
			transcriptOriginal: j.transcriptOriginal ?? null,
			translatedTranscript: j.translatedTranscript ?? null,
			captionUrl: j.captionUrl ?? null,
			caption: j.caption ?? null,
			outputLanguage: j.outputLanguage ?? null,
			videoTranslateId: j.videoTranslateId ?? j.id ?? null,
		};
		return JSON.parse(JSON.stringify(job));
	});
	const doc = {
		...n,
		id: n.id,
		type,
		label: n.label ?? null,
		jobs,
		createdAt: n.createdAt || new Date().toISOString(),
		sourceVideoUrl: n.sourceVideoUrl ?? null,
		sourceText: n.sourceText ?? null,
	};
	return JSON.parse(JSON.stringify(doc));
}

/** @deprecated Use `buildGroupDocumentForFirestore`. */
export function sanitizeGroupForFirestore(group) {
	return buildGroupDocumentForFirestore(group);
}

/**
 * Read all translation groups for a user from Firestore (ordered by `createdAt`).
 * Same client Firestore usage style as `getAllUsers` in `lib/api/users.js`.
 */
export async function fetchTranslationGroups(uid) {
	if (!uid) return [];
	const q = query(groupsCollectionRef(uid), orderBy("createdAt", "desc"));
	const snap = await getDocs(q);
	const out = [];
	for (const d of snap.docs) {
		const g = firestoreDocToGroup(d.id, d.data());
		if (g) out.push(g);
	}
	return dedupeVideosById(out);
}

export async function upsertTranslationGroup(uid, group) {
	if (!uid || !group?.id) return;
	const payload = buildGroupDocumentForFirestore({
		...group,
		id: group.id,
		createdAt: group.createdAt || new Date().toISOString(),
	});
	if (!payload) return;
	await setDoc(
		groupDocRef(uid, group.id),
		{
			...payload,
			updatedAt: serverTimestamp(),
		},
		{ merge: true },
	);
}

export async function deleteTranslationGroupDoc(uid, groupId) {
	if (!uid || !groupId) return;
	await deleteDoc(groupDocRef(uid, groupId));
}

/**
 * Load remote groups, push any local-only groups to Firestore, merge, refresh cache, return sorted list.
 */
export async function fetchAndMergeTranslationGroups(uid) {
	if (!uid) return [];

	let remote = [];
	try {
		remote = await fetchTranslationGroups(uid);
	} catch (e) {
		console.warn("[translationHistory] Firestore fetch failed, using local only:", e);
		return loadVideosForUser(uid);
	}

	const local = loadVideosForUser(uid);
	const remoteIds = new Set(remote.map((r) => r.id));
	const missingOnRemote = local.filter((g) => !remoteIds.has(g.id));

	for (const g of missingOnRemote) {
		try {
			await upsertTranslationGroup(uid, g);
		} catch (e) {
			console.warn("[translationHistory] Failed to sync local group to Firestore:", g.id, e);
		}
	}

	let merged = remote;
	if (missingOnRemote.length) {
		try {
			merged = await fetchTranslationGroups(uid);
		} catch {
			merged = mergeRemoteAndLocal(remote, local);
		}
	} else {
		merged = mergeRemoteAndLocal(remote, local);
	}

	merged = dedupeVideosById([...merged]).sort(
		(a, b) =>
			new Date(b.createdAt || 0).getTime() -
			new Date(a.createdAt || 0).getTime(),
	);
	saveVideos(merged, uid);
	return merged;
}

function mergeRemoteAndLocal(remote, local) {
	const map = new Map(remote.map((g) => [g.id, g]));
	for (const g of local) {
		const existing = map.get(g.id);
		if (!existing) map.set(g.id, g);
		else map.set(g.id, mergeTranslationGroups(existing, g));
	}
	return Array.from(map.values());
}
