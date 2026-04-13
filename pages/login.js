import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import LandingMarketingNav from "../app/components/LandingMarketingNav";
import LandingMarketingFooter from "../app/components/LandingMarketingFooter";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	GrowthBadgePillLight,
	GrowthBadgePillOrange,
	HeroSparkleIcon,
	HeroSocialCluster,
} from "../app/components/LandingHeroBadges";
import { signInWithGoogle, onAuthStateChange } from "../lib/api/auth";
import { toast } from "sonner";
import {
	getUserCookie,
	removeUserCookie,
	setUserCookie,
} from "../lib/utils/cookies";

export default function LoginPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const authUnsubscribeRef = useRef(null);
	const returnUrl = useMemo(() => {
		const q = router.query.return;
		if (typeof q === "string" && q.startsWith("/")) return q;
		return "/app";
	}, [router.isReady, router.query.return]);

	const { data: user } = useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			const cookieUser = getUserCookie();
			if (!authUnsubscribeRef.current) {
				const unsubscribe = onAuthStateChange(async (firebaseUser) => {
					if (firebaseUser) {
						const userData = {
							uid: firebaseUser.uid,
							email: firebaseUser.email,
							displayName:
								firebaseUser.displayName ||
								firebaseUser.email?.split("@")[0] ||
								"User",
							photoURL: firebaseUser.photoURL || null,
							provider:
								firebaseUser.providerData[0]?.providerId === "google.com"
									? "google"
									: "email",
						};
						setUserCookie(userData);
						queryClient.setQueryData(["currentUser"], userData);
					} else {
						removeUserCookie();
						queryClient.setQueryData(["currentUser"], null);
					}
				});
				authUnsubscribeRef.current = unsubscribe;
			}
			return cookieUser;
		},
		enabled: true,
		staleTime: Infinity,
		gcTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	useEffect(() => {
		return () => {
			if (authUnsubscribeRef.current) {
				authUnsubscribeRef.current();
				authUnsubscribeRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!router.isReady) return;
		if (user) {
			router.replace(returnUrl);
		}
	}, [router.isReady, user, returnUrl, router]);

	const handleGoogleLogin = async () => {
		try {
			await signInWithGoogle();
			queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			toast.success("Signed in");
			router.replace(returnUrl);
		} catch (error) {
			console.error("Google login error:", error);
			toast.error("Could not sign in with Google. Try again.");
		}
	};

	return (
		<>
			<div
				className="min-h-screen flex flex-col"
				style={{ background: "#f5f4f0", fontFamily: "'DM Sans', system-ui, sans-serif" }}
			>
				<LandingMarketingNav />
				<main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto">
					<div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-14 lg:py-20 max-w-xl mx-auto lg:mx-0 lg:max-w-none">
						<motion.div
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							
							<h2
								className="sans"
								style={{
									fontSize: "clamp(1.5rem, 3.8vw, 2.65rem)",
									lineHeight: 1.22,
									fontWeight: 700,
									color: "#27272a",
									marginBottom: 20,
									letterSpacing: "-0.02em",
									maxWidth: 620,
								}}
							>
								<span style={{ display: "block" }}>
									Boost your content <GrowthBadgePillLight /> with
								</span>
								<span style={{ display: "block" }}>
									seamless <HeroSparkleIcon /> audio/video
								</span>
								<span style={{ display: "block" }}>
									translation to uplift your <HeroSocialCluster />
								</span>
								<span style={{ display: "block" }}>social game</span>
							</h2>
							<p
								style={{
									color: "#71717a",
									fontSize: "clamp(1rem, 2vw, 1.12rem)",
									lineHeight: 1.75,
									maxWidth: 520,
									margin: "0 0 16px",
								}}
							>
								aantraa translates audio, text, and video into 90+ languages with
								voice-cloned output.
							</p>
							
							<p
								style={{
									color: "#c2410c",
									fontSize: "clamp(0.9rem, 1.8vw, 1rem)",
									fontWeight: 600,
									maxWidth: 520,
									margin: 0,
								}}
							>
								Get started with 10 miuntes free credits — no card required to try
							</p>
						</motion.div>
					</div>

					<div
						className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-14 lg:py-20 "
					>
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, delay: 0.08 }}
							className="w-full max-w-md"
						>
							<div
								className="rounded-2xl border border-zinc-200/80 bg-white p-8 sm:p-10 shadow-xl shadow-black/5"
								style={{
									boxShadow:
										"0 24px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
								}}
							>
								<h2 className="aantraa-font text-2xl font-bold text-zinc-900 mb-2">
									Get Started
								</h2>
								<p className="text-sm text-zinc-600 mb-8">
									Continue with Google to open your dashboard and manage
									translations.
								</p>
								<button
									type="button"
									onClick={handleGoogleLogin}
									className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-50 transition-colors shadow-sm"
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
										<path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											fill="#FBBC05"
										/>
										<path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											fill="#EA4335"
										/>
									</svg>
									Continue with Google
								</button>
							</div>
						</motion.div>
					</div>
				</main>
				<LandingMarketingFooter />
			</div>
		</>
	);
}
