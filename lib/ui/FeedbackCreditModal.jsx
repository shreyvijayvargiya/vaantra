import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Loader2, LogIn, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import FormAnimatedDropdown from "./FormAnimatedDropdown";
import {
	FEEDBACK_REFERRAL_OPTIONS,
	FEEDBACK_TOOL_OPTIONS,
} from "../constants/feedback";
import { auth } from "../config/firebase";
import { fireCenterConfetti } from "./fireCenterConfetti";

const SUCCESS_CLOSE_MS = 2200;

const inputClass =
	"w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-200";

export default function FeedbackCreditModal({
	open,
	onClose,
	user,
	alreadyClaimed = false,
	onRequireLogin,
	onSuccess,
}) {
	const [feedback, setFeedback] = useState("");
	const [visitReason, setVisitReason] = useState("");
	const [interestedTool, setInterestedTool] = useState("");
	const [referralSource, setReferralSource] = useState("");
	const [referralSourceOther, setReferralSourceOther] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submittedSuccess, setSubmittedSuccess] = useState(false);
	const closeTimerRef = useRef(null);

	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose?.();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onClose]);

	useEffect(() => {
		if (open) return;
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
		setFeedback("");
		setVisitReason("");
		setInterestedTool("");
		setReferralSource("");
		setReferralSourceOther("");
		setSubmitting(false);
		setSubmittedSuccess(false);
	}, [open]);

	useEffect(
		() => () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		},
		[],
	);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!user?.uid) {
			onRequireLogin?.();
			return;
		}
		if (alreadyClaimed) {
			toast.info("You already claimed your free feedback minute.");
			return;
		}

		setSubmitting(true);
		try {
			const idToken = await auth.currentUser?.getIdToken();
			if (!idToken) throw new Error("Please sign in again.");

			const res = await fetch("/api/feedback/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					idToken,
					feedback,
					visitReason,
					interestedTool,
					referralSource,
					referralSourceOther:
						referralSource === "other" ? referralSourceOther : undefined,
				}),
			});
			const data = await res.json().catch(() => ({}));

			if (res.status === 409) {
				toast.info(data.error || "You already claimed this bonus.");
				onSuccess?.({ alreadyClaimed: true });
				onClose?.();
				return;
			}
			if (!res.ok) {
				throw new Error(data.error || "Submission failed");
			}

			const minutes = data.minutesGranted ?? 1;
			setSubmittedSuccess(true);
			fireCenterConfetti();
			toast.success(
				`Thanks for your feedback! ${minutes} free minute added to your account.`,
				{ duration: 4500 },
			);
			onSuccess?.({ minutesGranted: minutes });
			closeTimerRef.current = setTimeout(() => {
				onClose?.();
			}, SUCCESS_CLOSE_MS);
		} catch (err) {
			toast.error(err?.message || "Could not submit feedback");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
					onClick={onClose}
					role="dialog"
					aria-modal="true"
					aria-labelledby="feedback-credit-title"
				>
					<motion.div
						initial={{ scale: 0.96, opacity: 0, y: 12 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.96, opacity: 0, y: 12 }}
						transition={{ type: "spring", damping: 26, stiffness: 320 }}
						onClick={(e) => e.stopPropagation()}
						className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
					>
						<div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-200">
							<div className="flex items-start gap-3">
								<div className="p-2 rounded-xl bg-orange-100 text-orange-600 shrink-0">
									<Gift className="w-5 h-5" />
								</div>
								<div>
									<h2
										id="feedback-credit-title"
										className="text-lg font-bold text-zinc-900"
									>
										Get 1 minute free
									</h2>
									<p className="text-sm text-zinc-500 mt-0.5">
										Share quick feedback and we&apos;ll add 1 translation minute
										to your account — once per user.
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={onClose}
								disabled={submittedSuccess}
								className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
								aria-label="Close"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="overflow-y-auto flex-1 px-5 py-4 relative">
							{submittedSuccess ? (
								<motion.div
									initial={{ opacity: 0, scale: 0.92 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ type: "spring", damping: 18, stiffness: 280 }}
									className="flex flex-col items-center justify-center text-center py-12 px-4 min-h-[280px]"
								>
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{
											type: "spring",
											damping: 12,
											stiffness: 320,
											delay: 0.05,
										}}
										className="relative mb-5"
									>
										<div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-4 ring-orange-100/80 shadow-lg shadow-orange-200/50">
											<CheckCircle2 className="w-10 h-10 text-orange-600" />
										</div>
										<motion.span
											initial={{ opacity: 0, y: 6 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.2 }}
											className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-400 text-white shadow-md"
										>
											<Sparkles className="w-3.5 h-3.5" />
										</motion.span>
									</motion.div>
									<motion.h3
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.12 }}
										className="text-xl font-bold text-zinc-900 mb-2"
									>
										You got 1 free minute!
									</motion.h3>
									<motion.p
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.18 }}
										className="text-sm text-zinc-600 max-w-xs leading-relaxed"
									>
										Thanks for helping us improve aantraa. Your minute is ready
										to use on your next translation.
									</motion.p>
								</motion.div>
							) : !user?.uid ? (
								<div className="text-center py-8 space-y-4">
									<p className="text-sm text-zinc-600">
										Sign in or create an account to submit feedback and claim
										your free minute.
									</p>
									<button
										type="button"
										onClick={onRequireLogin}
										className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl"
									>
										<LogIn className="w-4 h-4" />
										Sign in to continue
									</button>
								</div>
							) : alreadyClaimed ? (
								<div className="text-center py-10 space-y-2">
									<p className="text-sm font-medium text-zinc-800">
										You already claimed your free feedback minute.
									</p>
									<p className="text-sm text-zinc-500">
										Thanks for helping us improve aantraa.
									</p>
								</div>
							) : (
								<form id="feedback-credit-form" onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">
											Your feedback
										</label>
										<textarea
											required
											rows={4}
											value={feedback}
											onChange={(e) => setFeedback(e.target.value)}
											placeholder="What do you like, what could be better?"
											className={`${inputClass} resize-y min-h-[100px]`}
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">
											Reason for visiting aantraa
										</label>
										<input
											type="text"
											required
											value={visitReason}
											onChange={(e) => setVisitReason(e.target.value)}
											placeholder="e.g. Dub a YouTube video in Hindi"
											className={inputClass}
										/>
									</div>
									<FormAnimatedDropdown
										label="Which tool are you most interested in?"
										value={interestedTool}
										onChange={setInterestedTool}
										options={FEEDBACK_TOOL_OPTIONS}
										placeholder="Select a tool"
									/>
									<FormAnimatedDropdown
										label="Where did you find us?"
										value={referralSource}
										onChange={setReferralSource}
										options={FEEDBACK_REFERRAL_OPTIONS}
										placeholder="Select a source"
									/>
									{referralSource === "other" ? (
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">
												Please specify
											</label>
											<input
												type="text"
												required
												value={referralSourceOther}
												onChange={(e) => setReferralSourceOther(e.target.value)}
												placeholder="Where did you hear about aantraa?"
												className={inputClass}
											/>
										</div>
									) : null}
								</form>
							)}
						</div>

						{user?.uid && !alreadyClaimed && !submittedSuccess ? (
							<div className="px-5 py-4 border-t border-zinc-200 bg-zinc-50/80 flex justify-end gap-2">
								<button
									type="button"
									onClick={onClose}
									className="px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
								>
									Cancel
								</button>
								<button
									type="submit"
									form="feedback-credit-form"
									disabled={submitting}
									className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-60"
								>
									{submitting ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Gift className="w-4 h-4" />
									)}
									Submit &amp; get 1 min free
								</button>
							</div>
						) : null}
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
