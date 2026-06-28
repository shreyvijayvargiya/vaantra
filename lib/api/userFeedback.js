import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

/** @returns {() => void} unsubscribe */
export function subscribeUserFeedbackStatus(uid, onClaimed) {
	if (!uid) {
		onClaimed(false);
		return () => {};
	}
	const ref = doc(db, "users", uid);
	return onSnapshot(
		ref,
		(snap) => {
			onClaimed(Boolean(snap.data()?.feedbackBonusClaimed));
		},
		() => onClaimed(false),
	);
}
