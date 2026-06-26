/**
 * Public share snapshots for translation projects.
 * Path: publicShares/{groupId}
 *
 * Firestore rules (deploy in Firebase console):
 * match /publicShares/{shareId} {
 *   allow read: if true;
 *   allow create, update, delete: if request.auth != null
 *     && request.auth.uid == request.resource.data.ownerUid;
 * }
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import {
	inferTranslationGroupType,
	normalizeStoredVideo,
} from "../utils/translationStorage";

const COLLECTION = "publicShares";

const PUBLIC_JOB_FIELDS = [
	"id",
	"lang",
	"status",
	"createdAt",
	"resultUrl",
	"outputLanguage",
	"transcriptOriginal",
	"translatedTranscript",
	"caption",
	"summary",
	"titles",
	"thumbnailTexts",
	"hooks",
	"clips",
	"captionUrl",
	"srtUrl",
	"timedCaptions",
	"transcript",
];

function sanitizeJobForPublic(job) {
	if (!job || job.status !== "done") return null;
	const out = {};
	for (const key of PUBLIC_JOB_FIELDS) {
		if (job[key] != null && job[key] !== "") out[key] = job[key];
	}
	if (!out.id) return null;
	return out;
}

export function getPublicShareUrl(groupId, origin) {
	const base =
		origin ||
		(typeof window !== "undefined" ? window.location.origin : "") ||
		process.env.NEXT_PUBLIC_SITE_URL ||
		"https://aantraa.site";
	return `${base.replace(/\/$/, "")}/share/${encodeURIComponent(groupId)}`;
}

export function shareTypeLabel(type) {
	switch (type) {
		case "caption":
			return "AI captions";
		case "clips":
			return "Viral clips";
		case "audio":
		case "voice":
			return "Audio translation";
		default:
			return "Video translation";
	}
}

/** Publish a sanitized snapshot for public viewing (done jobs only). */
export async function publishPublicShare(uid, group) {
	if (!uid || !group?.id) return null;
	const normalized = normalizeStoredVideo(group);
	if (!normalized) return null;

	const jobs = (normalized.jobs || [])
		.map(sanitizeJobForPublic)
		.filter(Boolean);
	if (!jobs.length) return null;

	const type = normalized.type ?? inferTranslationGroupType(normalized);
	const payload = {
		id: normalized.id,
		ownerUid: uid,
		label: normalized.label ?? null,
		type,
		createdAt: normalized.createdAt || new Date().toISOString(),
		jobs,
		updatedAt: serverTimestamp(),
	};

	await setDoc(doc(db, COLLECTION, normalized.id), payload, { merge: true });
	return {
		...payload,
		updatedAt: new Date().toISOString(),
	};
}

/** Read a public share (no auth required when Firestore rules allow). */
export async function fetchPublicShare(shareId) {
	if (!shareId) return null;
	const snap = await getDoc(doc(db, COLLECTION, String(shareId)));
	if (!snap.exists()) return null;
	const data = snap.data();
	return {
		...data,
		id: data.id || snap.id,
		jobs: Array.isArray(data.jobs) ? data.jobs : [],
		updatedAt:
			data.updatedAt?.toDate?.()?.toISOString?.() ||
			data.updatedAt ||
			null,
	};
}
