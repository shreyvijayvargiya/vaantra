/**
 * Verify a Firebase ID token server-side via Identity Toolkit `accounts:lookup`
 * (POST body — avoids Google `tokeninfo` GET limits / `invalid_token` + Invalid Value).
 * For extra hardening, prefer firebase-admin `verifyIdToken` + service account.
 */
export async function verifyFirebaseIdToken(idToken) {
	if (!idToken || typeof idToken !== "string") {
		throw new Error("Missing id token");
	}
	const trimmed = idToken.trim();
	if (!trimmed) {
		throw new Error("Missing id token");
	}

	const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
	if (!apiKey) {
		throw new Error(
			"Server missing NEXT_PUBLIC_FIREBASE_API_KEY (needed to verify sign-in)",
		);
	}

	const res = await fetch(
		`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ idToken: trimmed }),
		},
	);

	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const msg =
			data?.error?.message ||
			data?.error?.errors?.[0]?.message ||
			"Invalid or expired session";
		throw new Error(
			typeof msg === "string" ? msg : "Invalid or expired session",
		);
	}

	const user = data?.users?.[0];
	if (!user?.localId) {
		throw new Error("Token missing subject");
	}

	return {
		uid: String(user.localId),
		email: user.email || null,
	};
}
