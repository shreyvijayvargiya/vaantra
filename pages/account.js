import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	LogOut,
	User,
	Mail,
	BarChart2,
	Gift,
	LayoutDashboard,
} from "lucide-react";
import LandingMarketingNav from "../app/components/LandingMarketingNav";
import LandingMarketingFooter from "../app/components/LandingMarketingFooter";
import { auth } from "../lib/config/firebase";
import { onAuthStateChange, signOutUser } from "../lib/api/auth";
import { toast } from "sonner";
import {
	getUserCookie,
	removeUserCookie,
	setUserCookie,
} from "../lib/utils/cookies";
import { subscribeUserUsage } from "../lib/api/userUsage";
import { useTranslationGroups } from "../lib/hooks/useTranslationHistory";
import {
	PRICE_PER_MINUTE_USD,
	USAGE_MINUTE_STEPS,
} from "../lib/utils/usagePricing";

const FREE_CREDITS_PER_MONTH = 10;

export default function AccountPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const authUnsubscribeRef = useRef(null);
	const [authReady, setAuthReady] = useState(false);
	const [usage, setUsage] = useState({ used: 0, credited: 0 });
	const [loggingOut, setLoggingOut] = useState(false);

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

	const uid = user?.uid || auth.currentUser?.uid;

	useEffect(() => {
		return () => {
			if (authUnsubscribeRef.current) {
				authUnsubscribeRef.current();
				authUnsubscribeRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		const unsub = onAuthStateChange((fbUser) => {
			setAuthReady(true);
			if (!fbUser && router.isReady) {
				router.replace("/login?return=/account");
			}
		});
		return () => unsub();
	}, [router.isReady, router]);

	useEffect(() => {
		if (!uid) return;
		return subscribeUserUsage(uid, (data) => {
			if (!data) {
				setUsage({ used: 0, credited: 0 });
				return;
			}
			setUsage({
				used: data.usageMinutesUsed,
				credited: data.usageMinutesCredited,
			});
		});
	}, [uid]);

	const { data: groups } = useTranslationGroups(uid);

	const usedThisMonth = useMemo(() => {
		const now = new Date();
		let n = 0;
		const videos = Array.isArray(groups) ? groups : [];
		for (const v of videos) {
			const jobs = v.jobs?.length ? v.jobs : [];
			for (const j of jobs) {
				if (j.status !== "done") continue;
				const d = new Date(j.createdAt || v.createdAt);
				if (
					d.getMonth() === now.getMonth() &&
					d.getFullYear() === now.getFullYear()
				)
					n++;
			}
		}
		return n;
	}, [groups]);

	const displayName =
		user?.displayName || auth.currentUser?.displayName || "User";
	const email = user?.email || auth.currentUser?.email || "";
	const photoURL = user?.photoURL || auth.currentUser?.photoURL;

	const remainingPurchased = Math.max(0, usage.credited - usage.used);
	const pctUsedOfPurchased =
		usage.credited > 0
			? Math.min(100, (usage.used / usage.credited) * 100)
			: usage.used > 0
				? 100
				: 0;

	const handleLogout = async () => {
		setLoggingOut(true);
		try {
			removeUserCookie();
			queryClient.setQueryData(["currentUser"], null);
			await signOutUser();
			await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			toast.success("Signed out");
			router.replace("/");
		} catch (e) {
			console.error(e);
			toast.error("Could not sign out");
		} finally {
			setLoggingOut(false);
		}
	};

	if (!authReady) {
		return (
			<div
				className="min-h-screen flex flex-col"
				style={{ background: "#f5f4f0" }}
			>
				<LandingMarketingNav />
				<div className="flex-1 flex items-center justify-center px-4">
					<p className="text-zinc-500 text-sm">Loading…</p>
				</div>
				<LandingMarketingFooter />
			</div>
		);
	}

	return (
		<div
			className="min-h-screen flex flex-col sans"
			style={{ background: "#f5f4f0" }}
		>
			<LandingMarketingNav />
			<main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
				<div className="max-w-3xl mx-auto space-y-8">
					<div>
						<h1
							className="aantraa-font text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight"
						>
							Account
						</h1>
						<p className="mt-2 text-zinc-600 text-sm sm:text-base">
							Profile, usage, and your monthly free jobs.
						</p>
					</div>

					{/* Profile */}
					<motion.section
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35 }}
						className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm"
					>
						<div className="flex items-center gap-2 mb-6">
							<User className="w-5 h-5 text-amber-600" aria-hidden />
							<h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center gap-6">
							{photoURL ? (
								<img
									src={photoURL}
									alt=""
									className="w-20 h-20 rounded-2xl object-cover border border-zinc-100 shadow-sm"
								/>
							) : (
								<div
									className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-amber-700 bg-amber-50 border border-amber-100"
								>
									{displayName.charAt(0).toUpperCase()}
								</div>
							)}
							<div className="flex-1 min-w-0 space-y-3">
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
										Name
									</p>
									<p className="text-lg font-semibold text-zinc-900 truncate">
										{displayName}
									</p>
								</div>
								<div className="flex items-start gap-2">
									<Mail className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
									<div>
										<p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
											Email
										</p>
										<p className="text-zinc-800 break-all">{email || "—"}</p>
									</div>
								</div>
							</div>
							<div className="flex flex-col sm:items-end gap-3">
								<Link
									href="/app"
									className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
								>
									<LayoutDashboard className="w-4 h-4" />
									Open dashboard
								</Link>
								<button
									type="button"
									onClick={handleLogout}
									disabled={loggingOut}
									className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
								>
									<LogOut className="w-4 h-4" />
									{loggingOut ? "Signing out…" : "Log out"}
								</button>
							</div>
						</div>
					</motion.section>

					{/* Translation minutes */}
					<motion.section
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.05 }}
						className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm"
					>
						<div className="flex items-center gap-2 mb-2">
							<BarChart2 className="w-5 h-5 text-amber-600" aria-hidden />
							<h2 className="text-lg font-semibold text-zinc-900">
								Translation minutes
							</h2>
						</div>
						<p className="text-sm text-zinc-500 mb-6">
							Purchased balance and billed usage (same as your app sidebar).
						</p>

						<div className="grid gap-6 sm:grid-cols-2">
							<div className="rounded-xl bg-zinc-50 border border-zinc-100 p-5">
								<p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">
									Usage allowed (purchased)
								</p>
								<p className="text-3xl font-bold text-zinc-900 tabular-nums">
									{usage.credited.toFixed(1)}
									<span className="text-lg font-semibold text-zinc-500 ml-1">
										min
									</span>
								</p>
								<p className="text-xs text-zinc-500 mt-2">
									Remaining after use:{" "}
									<span className="font-semibold text-zinc-700">
										{remainingPurchased.toFixed(1)} min
									</span>
								</p>
							</div>
							<div className="rounded-xl bg-amber-50/80 border border-amber-100 p-5">
								<p className="text-xs font-medium uppercase tracking-wide text-amber-800/80 mb-1">
									Usage completed (billed)
								</p>
								<p className="text-3xl font-bold text-zinc-900 tabular-nums">
									{usage.used.toFixed(1)}
									<span className="text-lg font-semibold text-zinc-500 ml-1">
										min
									</span>
								</p>
								<p className="text-xs text-zinc-600 mt-2">
									${PRICE_PER_MINUTE_USD.toFixed(2)}/min · packs{" "}
									{USAGE_MINUTE_STEPS[0]}–
									{USAGE_MINUTE_STEPS[USAGE_MINUTE_STEPS.length - 1]} min
								</p>
							</div>
						</div>

						<div className="mt-6">
							<div className="flex justify-between text-sm mb-2">
								<span className="text-zinc-600">Used of purchased</span>
								<span className="font-semibold text-zinc-900 tabular-nums">
									{pctUsedOfPurchased.toFixed(0)}%
								</span>
							</div>
							<div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
								<div
									className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
									style={{ width: `${pctUsedOfPurchased}%` }}
								/>
							</div>
						</div>

						<div className="mt-6 pt-6 border-t border-zinc-100">
							<Link
								href="/pricing"
								className="text-sm font-semibold text-amber-700 hover:text-amber-800"
							>
								Buy more minutes →
							</Link>
						</div>
					</motion.section>

					{/* Free jobs */}
					<motion.section
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.1 }}
						className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm"
					>
						<div className="flex items-center gap-2 mb-2">
							<Gift className="w-5 h-5 text-amber-600" aria-hidden />
							<h2 className="text-lg font-semibold text-zinc-900">
								Free jobs this month
							</h2>
						</div>
						<p className="text-sm text-zinc-500 mb-6">
							Completed translation jobs counted toward your monthly free
							allowance (same logic as the app).
						</p>
						<div className="flex flex-wrap items-baseline gap-2">
							<span className="text-4xl font-bold text-zinc-900 tabular-nums">
								{usedThisMonth}
							</span>
							<span className="text-xl text-zinc-400">/</span>
							<span className="text-2xl font-semibold text-zinc-600 tabular-nums">
								{FREE_CREDITS_PER_MONTH}
							</span>
							<span className="text-sm text-zinc-500 ml-1">jobs used</span>
						</div>
						<div className="mt-4 h-2 rounded-full bg-zinc-100 overflow-hidden">
							<div
								className="h-full rounded-full bg-zinc-400 transition-all"
								style={{
									width: `${Math.min(100, (usedThisMonth / FREE_CREDITS_PER_MONTH) * 100)}%`,
								}}
							/>
						</div>
					</motion.section>
				</div>
			</main>
			<LandingMarketingFooter />
		</div>
	);
}
