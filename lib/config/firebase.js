import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function env(name) {
	const v = process.env[name];
	return typeof v === "string" ? v.trim() : v;
}

const firebaseConfig = {
	apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY"),
	authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
	projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
	storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
	messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
	appId: env("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

const required = [
	["NEXT_PUBLIC_FIREBASE_API_KEY", firebaseConfig.apiKey],
	["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
	["NEXT_PUBLIC_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
	["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
	["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", firebaseConfig.messagingSenderId],
	["NEXT_PUBLIC_FIREBASE_APP_ID", firebaseConfig.appId],
];
const missing = required.filter(([, val]) => !val).map(([name]) => name);
if (missing.length) {
	throw new Error(
		`Firebase is not configured: missing environment variable(s): ${missing.join(", ")}. ` +
			"Add them in the Vercel project → Settings → Environment Variables (Production and Preview), " +
			"then trigger a new deployment so NEXT_PUBLIC_* values are available at build time.",
	);
}

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;

