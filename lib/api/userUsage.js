/**
 * Firestore: `users/{uid}` — translation minute allowance & usage.
 * Field names (camelCase):
 * - usageMinutesCredited: total purchased (webhook increments)
 * - usageMinutesUsed: total consumed (API increment after each completed job)
 */

import {
	doc,
	getDoc,
	increment,
	onSnapshot,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const USAGE_FIELDS = {
	credited: "usageMinutesCredited",
	used: "usageMinutesUsed",
};

export const QUERY_KEY_USER_USAGE = (uid) => ["userUsage", uid];

export function userDocRef(uid) {
	return doc(db, "users", uid);
}

/**
 * @param {string} uid
 * @param {(data: { usageMinutesCredited: number, usageMinutesUsed: number } | null) => void} onData
 * @returns {() => void} unsubscribe
 */
/** Client-only: increment billed usage (requires Firestore rules: user can update own doc). */
export async function incrementUserUsageMinutesClient(uid, minutes) {
	const m = Math.floor(Number(minutes) || 0);
	if (!uid || m <= 0) return;
	const ref = userDocRef(uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) {
		await setDoc(ref, {
			usageMinutesUsed: m,
			usageMinutesCredited: 0,
			updatedAt: serverTimestamp(),
		});
	} else {
		await updateDoc(ref, {
			usageMinutesUsed: increment(m),
			updatedAt: serverTimestamp(),
		});
	}
}

export function subscribeUserUsage(uid, onData) {
	if (!uid) {
		onData(null);
		return () => {};
	}
	return onSnapshot(
		userDocRef(uid),
		(snap) => {
			if (!snap.exists()) {
				onData({
					usageMinutesCredited: 0,
					usageMinutesUsed: 0,
				});
				return;
			}
			const d = snap.data();
			onData({
				usageMinutesCredited: Number(d.usageMinutesCredited) || 0,
				usageMinutesUsed: Number(d.usageMinutesUsed) || 0,
			});
		},
		() => {
			onData({
				usageMinutesCredited: 0,
				usageMinutesUsed: 0,
			});
		},
	);
}
