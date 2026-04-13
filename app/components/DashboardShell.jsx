import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChange, signOutUser } from "../../lib/api/auth";

export default function DashboardShell({
	DashboardComponent,
	AppAuthLoadingShellComponent,
	GlobalStylesComponent,
}) {
	const router = useRouter();
	const [user, setUser] = useState(null);
	const [authReady, setAuthReady] = useState(false);

	useEffect(() => {
		const unsub = onAuthStateChange((firebaseUser) => {
			setAuthReady(true);
			if (firebaseUser) {
				setUser({
					name:
						firebaseUser.displayName ||
						firebaseUser.email?.split("@")[0] ||
						"User",
					email: firebaseUser.email,
					avatar:
						firebaseUser.photoURL ||
						firebaseUser.displayName?.[0] ||
						"U",
					uid: firebaseUser.uid,
				});
			} else {
				setUser(null);
			}
		});
		return () => unsub();
	}, []);

	useEffect(() => {
		if (authReady && !user) {
			router.replace("/");
		}
	}, [authReady, user, router]);

	const handleLogout = async () => {
		try {
			await signOutUser();
		} catch (e) {
			console.error(e);
		}
		setUser(null);
	};

	if (!authReady || !user) {
		return (
			<>
				<GlobalStylesComponent />
				<AppAuthLoadingShellComponent />
			</>
		);
	}

	return (
		<div
			style={{
				fontFamily: "'DM Sans', system-ui, sans-serif",
				background: "#f5f4f0",
				minHeight: "100vh",
			}}
		>
			<GlobalStylesComponent />
			<AnimatePresence mode="wait">
				<motion.div
					key="dash"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<DashboardComponent user={user} onLogout={handleLogout} />
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
