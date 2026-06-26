import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
	Video,
	Mic2,
	Subtitles,
	Scissors,
	Share2,
	ArrowRight,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PublicShareJobResult from "./PublicShareJobResult";
import { usePublicShare } from "../../lib/hooks/usePublicShare";
import { getPublicShareUrl, shareTypeLabel } from "../../lib/api/publicShare";
import { flagForLanguageName } from "../../lib/utils/languages";

const TYPE_META = {
	video: { label: "Video translation", Icon: Video, color: "#ea580c" },
	audio: { label: "Audio translation", Icon: Mic2, color: "#7c3aed" },
	voice: { label: "Audio translation", Icon: Mic2, color: "#7c3aed" },
	caption: { label: "AI captions", Icon: Subtitles, color: "#0891b2" },
	clips: { label: "Viral clips", Icon: Scissors, color: "#db2777" },
};

function displayTitle(share) {
	if (share?.label?.trim()) return share.label.trim();
	return shareTypeLabel(share?.type);
}

export default function PublicSharePage({ shareId }) {
	const { data: share, isLoading, isError } = usePublicShare(shareId);
	const [tab, setTab] = useState(0);

	const jobs = useMemo(
		() => (share?.jobs || []).filter((j) => j.status === "done"),
		[share?.jobs],
	);

	const activeJob = jobs[tab] ?? jobs[0] ?? null;
	const typeMeta = TYPE_META[share?.type] || TYPE_META.video;
	const TypeIcon = typeMeta.Icon;
	const pageTitle = share ? `${displayTitle(share)} — aantraa` : "Shared project — aantraa";

	const handleCopyShare = async () => {
		if (!shareId) return;
		try {
			await navigator.clipboard.writeText(getPublicShareUrl(shareId));
			toast.success("Link copied");
		} catch {
			toast.error("Could not copy link");
		}
	};

	return (
		<div className="sans min-h-screen bg-[#f5f4f0] text-zinc-700">
			<Head>
				<title>{pageTitle}</title>
				<meta
					name="description"
					content={
						share
							? `Watch ${shareTypeLabel(share.type).toLowerCase()} shared on aantraa — ${jobs.length} language${jobs.length !== 1 ? "s" : ""}.`
							: "Shared AI translation project on aantraa."
					}
				/>
				<meta property="og:title" content={pageTitle} />
				<meta property="og:type" content="website" />
			</Head>

			<Navbar variant="marketing" />

			<main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-24 text-zinc-500">
						<Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
						<p className="text-sm">Loading shared project…</p>
					</div>
				) : isError || !share || jobs.length === 0 ? (
					<div className="rounded-2xl bg-white border border-zinc-200 p-10 text-center">
						<AlertCircle className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
						<h1 className="aantraa-font text-xl font-bold text-zinc-900 mb-2">
							Share not available
						</h1>
						<p className="text-sm text-zinc-600 mb-6 max-w-md mx-auto">
							This link may be private, expired, or the project is not finished
							yet. Ask the owner to share again after a translation completes.
						</p>
						<Link
							href="/"
							className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700"
						>
							Try aantraa
							<ArrowRight className="w-4 h-4" />
						</Link>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm overflow-hidden"
					>
						<div className="px-5 sm:px-7 pt-6 pb-5 border-b border-zinc-100">
							<div className="flex flex-wrap items-start justify-between gap-4 mb-4">
								<div className="min-w-0">
									<span
										className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide mb-3"
										style={{
											color: typeMeta.color,
											background: `${typeMeta.color}14`,
											border: `1px solid ${typeMeta.color}33`,
										}}
									>
										<TypeIcon className="w-3.5 h-3.5" />
										{typeMeta.label}
									</span>
									<h1 className="aantraa-font text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
										{displayTitle(share)}
									</h1>
									<p className="text-sm text-zinc-500 mt-2">
										{jobs.length} language{jobs.length !== 1 ? "s" : ""} ·
										Shared on aantraa
									</p>
								</div>
								<button
									type="button"
									onClick={handleCopyShare}
									className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 shrink-0"
								>
									<Share2 className="w-4 h-4" />
									Copy link
								</button>
							</div>

							{jobs.length > 1 && (
								<div
									className="flex gap-1 flex-wrap border-b border-zinc-100 -mb-px"
									role="tablist"
									aria-label="Languages"
								>
									{jobs.map((job, i) => {
										const active = tab === i;
										return (
											<button
												key={job.id}
												type="button"
												role="tab"
												aria-selected={active}
												onClick={() => setTab(i)}
												className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
													active
														? "border-orange-500 text-orange-700 bg-orange-50/60"
														: "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
												}`}
											>
												<span aria-hidden>{flagForLanguageName(job.lang)}</span>
												{job.lang}
											</button>
										);
									})}
								</div>
							)}
						</div>

						<div className="px-5 sm:px-7 py-6 sm:py-8">
							{jobs.length === 1 && (
								<p className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
									<span aria-hidden>{flagForLanguageName(activeJob.lang)}</span>
									{activeJob.lang}
								</p>
							)}
							<PublicShareJobResult type={share.type} job={activeJob} />
						</div>
					</motion.div>
				)}

				{share && jobs.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
						className="mt-10 rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8 text-center"
					>
						<h2 className="aantraa-font text-xl font-bold text-zinc-900 mb-2">
							Translate your own videos
						</h2>
						<p className="text-sm text-zinc-600 mb-5 max-w-md mx-auto">
							Dub video, generate captions, or cut viral clips in 90+ languages
							with aantraa.
						</p>
						<Link
							href="/login"
							className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700"
						>
							Get started free
							<ArrowRight className="w-4 h-4" />
						</Link>
					</motion.div>
				)}
			</main>

			<Footer variant="marketing" />
		</div>
	);
}
