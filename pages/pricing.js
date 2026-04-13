import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import LandingMarketingNav from "../app/components/LandingMarketingNav";
import LandingMarketingFooter from "../app/components/LandingMarketingFooter";
import { motion } from "framer-motion";
import {
	CreditCard,
	Calendar,
	RefreshCw,
	X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "../lib/store/hooks";
import { useSubscription } from "../lib/hooks/useSubscription";
import LoginModal from "../lib/ui/LoginModal";
import ConfirmationModal from "../lib/ui/ConfirmationModal";
import {
	getUserCookie,
	removeUserCookie,
	setUserCookie,
} from "../lib/utils/cookies";
import { onAuthStateChange } from "../lib/api/auth";
import { toast } from "sonner";
import { UsagePricingPanel } from "../lib/ui/UsagePricingPanel";

const PricingPage = () => {
	const queryClient = useQueryClient();
	const authUnsubscribeRef = useRef(null);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	useSubscription();
	const subscription = useAppSelector((state) => state.subscription);

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

	const handleCancelSubscription = async () => {
		if (!subscription.customerId) {
			toast.error("Unable to cancel subscription. Customer ID not found.");
			return;
		}
		setIsCancelling(true);
		try {
			const response = await fetch("/api/polar/cancel-subscription", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ customerId: subscription.customerId }),
			});
			const data = await response.json();
			if (response.ok) {
				toast.success(
					"Subscription cancelled. You'll have access until the end of your billing period.",
				);
				setShowCancelModal(false);
				queryClient.invalidateQueries({ queryKey: ["subscription"] });
			} else {
				throw new Error(data.error || "Failed to cancel subscription");
			}
		} catch (error) {
			console.error("Error cancelling subscription:", error);
			toast.error(
				error.message || "Failed to cancel subscription. Please try again.",
			);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleRefreshSubscription = async () => {
		setIsRefreshing(true);
		try {
			await queryClient.invalidateQueries({ queryKey: ["subscription"] });
			toast.success("Subscription data refreshed");
		} catch (error) {
			console.error("Error refreshing subscription:", error);
			toast.error("Failed to refresh subscription data");
		} finally {
			setIsRefreshing(false);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		} catch {
			return "Invalid date";
		}
	};

	return (
		<>
			<div
				className="min-h-screen flex flex-col"
				style={{ background: "#f5f4f0" }}
			>
				<LandingMarketingNav />
				<section className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
					<div className="max-w-xl mx-auto">
						<div className="text-center mb-12">
							<h1 className="aantraa-font text-4xl sm:text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
								Usage-based{" "}
								<span style={{ color: "#ea580c" }}>pricing</span>
							</h1>
							<p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
								Buy translation minutes when you need them. No monthly seat
								fees—pay for processing time, check out securely, and
								use minutes across video dubbing and voice translation.
							</p>
						</div>

						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded-2xl border border-zinc-200/80 bg-white p-8 sm:p-10 shadow-xl shadow-black/5 mb-12"
						>
							<h2 className="text-lg font-semibold text-zinc-900 mb-1">
								Translation minutes
							</h2>
							<p className="text-sm text-zinc-600 mb-6">
								Choose a pack, review the USD total, then pay. Minutes
								apply to your account for dubbing and voice jobs.
							</p>
							<UsagePricingPanel
								successReturnPath="/pricing"
								onRequireLogin={() => setShowLoginModal(true)}
							/>
						</motion.div>

						<ul className="mb-12 space-y-3 text-sm text-zinc-600 max-w-xl mx-auto">
							<li className="flex gap-2">
								<span className="text-amber-600 font-bold">•</span>
								<span>
									<strong className="text-zinc-800">Usage-based:</strong> you
									only pay for the minutes you purchase—no hidden plan tiers on
									this page.
								</span>
							</li>
							<li className="flex gap-2">
								<span className="text-amber-600 font-bold">•</span>
								<span>
									<strong className="text-zinc-800">Free tier:</strong> new
									accounts get monthly free translation jobs before you buy
									minutes.
								</span>
							</li>
							<li className="flex gap-2">
								<span className="text-amber-600 font-bold">•</span>
								<span>
									<strong className="text-zinc-800">Sign in required</strong> to
									checkout—use{" "}
									<Link
										href="/login"
										className="text-amber-700 underline underline-offset-2"
									>
										/login
									</Link>{" "}
									if you need to create a session first.
								</span>
							</li>
						</ul>

						{user && subscription.isSubscribed && (
							<motion.div
								initial={{ opacity: 0, y: -12 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-8 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white shadow-xl"
							>
								<div className="flex items-start justify-between flex-wrap gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-4">
											<CreditCard className="w-6 h-6" />
											<h2 className="text-2xl font-bold">
												Subscription (Polar)
											</h2>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-zinc-400 mb-1">Plan</p>
												<p className="text-lg font-semibold">
													{subscription.planName || "—"}
												</p>
											</div>
											<div>
												<p className="text-sm text-zinc-400 mb-1">Status</p>
												<p className="text-lg font-semibold capitalize">
													{subscription.status === "active" ? (
														<span className="text-green-400">Active</span>
													) : subscription.status === "canceled" ? (
														<span className="text-yellow-400">Canceled</span>
													) : (
														<span className="text-red-400">
															{subscription.status || "Inactive"}
														</span>
													)}
												</p>
											</div>
											<div>
												<p className="text-sm text-zinc-400 mb-1">Renews / ends</p>
												<p className="text-lg font-semibold flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													{formatDate(subscription.expiresAt)}
												</p>
											</div>
										</div>
									</div>
									<div className="flex flex-col gap-2">
										<button
											type="button"
											onClick={handleRefreshSubscription}
											disabled={isRefreshing}
											className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors disabled:opacity-50"
											title="Refresh subscription data"
										>
											<RefreshCw
												className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
											/>
										</button>
										{subscription.status === "active" && (
											<button
												type="button"
												onClick={() => setShowCancelModal(true)}
												className="text-sm text-red-300 hover:text-red-200 flex items-center gap-1"
											>
												<X className="w-4 h-4" />
												Cancel subscription
											</button>
										)}
									</div>
								</div>
							</motion.div>
						)}
					</div>
				</section>
				<LandingMarketingFooter />
				<LoginModal
					isOpen={showLoginModal}
					onClose={() => setShowLoginModal(false)}
				/>
				<ConfirmationModal
					isOpen={showCancelModal}
					onClose={() => setShowCancelModal(false)}
					onConfirm={handleCancelSubscription}
					title="Cancel Subscription"
					message="You'll keep access until the end of the current billing period. You won't be charged again."
					confirmText={
						isCancelling ? "Cancelling..." : "Yes, cancel subscription"
					}
					cancelText="Keep subscription"
					variant="danger"
				/>
			</div>
		</>
	);
};

export default PricingPage;
