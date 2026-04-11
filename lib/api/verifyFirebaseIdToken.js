/**
 * Verify a Firebase ID token without firebase-admin (Google tokeninfo).
 * For production hardening, prefer Admin SDK verifyIdToken.
 */
export async function verifyFirebaseIdToken(idToken) {
	if (!idToken || typeof idToken !== "string") {
		throw new Error("Missing id token");
	}
	const res = await fetch(
		`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
	);
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Invalid token: ${err}`);
	}
	const data = await res.json();
	const uid = data.sub || data.user_id;
	if (!uid) {
		throw new Error("Token missing subject");
	}
	return {
		uid: String(uid),
		email: data.email || null,
	};
}
