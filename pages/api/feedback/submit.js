import {
	collection,
	doc,
	increment,
	runTransaction,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/config/firebase";
import { verifyFirebaseIdToken } from "../../../lib/api/verifyFirebaseIdToken";
import {
	FEEDBACK_BONUS_MINUTES,
	FEEDBACK_REFERRAL_OPTIONS,
	FEEDBACK_TOOL_OPTIONS,
} from "../../../lib/constants/feedback";

const USERS = "users";
const FEEDBACK = "feedbackSubmissions";

const TOOL_VALUES = new Set(FEEDBACK_TOOL_OPTIONS.map((o) => o.value));
const REFERRAL_VALUES = new Set(FEEDBACK_REFERRAL_OPTIONS.map((o) => o.value));

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const {
			idToken,
			feedback,
			visitReason,
			interestedTool,
			referralSource,
			referralSourceOther,
		} = req.body || {};

		const { uid, email } = await verifyFirebaseIdToken(idToken);

		const feedbackText = String(feedback ?? "").trim();
		const reasonText = String(visitReason ?? "").trim();
		const tool = String(interestedTool ?? "").trim();
		const source = String(referralSource ?? "").trim();
		const sourceOther = String(referralSourceOther ?? "").trim();

		if (feedbackText.length < 10) {
			return res.status(400).json({ error: "Please write at least a few words of feedback." });
		}
		if (reasonText.length < 3) {
			return res.status(400).json({ error: "Please tell us why you visited aantraa." });
		}
		if (!TOOL_VALUES.has(tool)) {
			return res.status(400).json({ error: "Please select a tool you are interested in." });
		}
		if (!REFERRAL_VALUES.has(source)) {
			return res.status(400).json({ error: "Please select where you found us." });
		}
		if (source === "other" && sourceOther.length < 2) {
			return res.status(400).json({ error: "Please specify where you found us." });
		}

		const userRef = doc(db, USERS, uid);
		const feedbackRef = doc(collection(db, FEEDBACK));

		await runTransaction(db, async (transaction) => {
			const userSnap = await transaction.get(userRef);
			if (userSnap.exists() && userSnap.data()?.feedbackBonusClaimed) {
				const err = new Error("ALREADY_CLAIMED");
				err.code = "ALREADY_CLAIMED";
				throw err;
			}

			if (userSnap.exists()) {
				transaction.update(userRef, {
					feedbackBonusClaimed: true,
					feedbackBonusClaimedAt: serverTimestamp(),
					usageMinutesCredited: increment(FEEDBACK_BONUS_MINUTES),
					updatedAt: serverTimestamp(),
				});
			} else {
				transaction.set(userRef, {
					uid,
					email: email || null,
					feedbackBonusClaimed: true,
					feedbackBonusClaimedAt: serverTimestamp(),
					usageMinutesCredited: FEEDBACK_BONUS_MINUTES,
					usageMinutesUsed: 0,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				});
			}

			transaction.set(feedbackRef, {
				uid,
				email: email || null,
				feedback: feedbackText,
				visitReason: reasonText,
				interestedTool: tool,
				referralSource: source,
				referralSourceOther: source === "other" ? sourceOther : null,
				bonusMinutesGranted: FEEDBACK_BONUS_MINUTES,
				createdAt: serverTimestamp(),
			});
		});

		return res.status(200).json({
			success: true,
			minutesGranted: FEEDBACK_BONUS_MINUTES,
		});
	} catch (e) {
		if (e?.code === "ALREADY_CLAIMED" || e?.message === "ALREADY_CLAIMED") {
			return res.status(409).json({
				error: "You already claimed your free feedback minute.",
				code: "ALREADY_CLAIMED",
			});
		}
		console.error("[feedback/submit]", e);
		const msg = e?.message || "Could not submit feedback";
		if (msg.includes("id token") || msg.includes("session")) {
			return res.status(401).json({ error: "Please sign in and try again." });
		}
		return res.status(500).json({ error: "Could not submit feedback. Please try again." });
	}
}
