import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { TRANSLATION_EXAMPLES } from "../../lib/config/translationExamples";
import StudioVideoPlayer from "./StudioVideoPlayer";
import StudioYouTubePreview from "./StudioYouTubePreview";

function TwitterOriginalEmbed({ tweetId, label = "Original tweet" }) {
	return (
		<div className="overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 shadow-xl shadow-black/20">
			<div className="relative w-full aspect-video max-h-72 bg-black overflow-hidden rounded-xl m-1">
				<iframe
					src={`https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(tweetId)}&theme=dark`}
					title="Original tweet"
					className="absolute inset-0 w-full h-full border-0"
					allowFullScreen
				/>
			</div>
			<div className="flex items-center gap-2 px-3 py-2 bg-black/40 border-t border-white/10">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="currentColor"
					className="shrink-0 text-white/70"
					aria-hidden
				>
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.261 5.635L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
				</svg>
				<span className="text-[11px] font-mono text-white/80">{label}</span>
			</div>
		</div>
	);
}

function renderOriginalEmbed(original) {
	if (original.type === "youtube") {
		return <StudioYouTubePreview videoId={original.videoId} />;
	}
	if (original.type === "twitter") {
		return (
			<TwitterOriginalEmbed
				tweetId={original.tweetId}
				label={original.label}
			/>
		);
	}
	return null;
}

function getTabMeta(example, examples) {
	const { flag, lang } = example.translated;
	const duplicates = examples.filter((e) => e.translated.lang === lang);
	const duplicateIndex = duplicates.findIndex((e) => e.id === example.id);
	const suffix =
		duplicates.length > 1 ? ` ${duplicateIndex + 1}` : "";

	return {
		flag,
		label: lang,
		sublabel:
			duplicates.length > 1
				? `${example.original.flag} ${example.original.lang}`
				: null,
		ariaLabel: `${lang}${suffix} translation example`,
	};
}

function LanguageExampleTabs({ examples, activeId, onChange }) {
	return (
		<div
			className="flex gap-2 hidescrollbar overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
			role="tablist"
			aria-label="Translation language examples"
		>
			{examples.map((example) => {
				const active = example.id === activeId;
				const { flag, label, sublabel, ariaLabel } = getTabMeta(
					example,
					examples,
				);

				return (
					<button
						key={example.id}
						type="button"
						role="tab"
						aria-selected={active}
						aria-label={ariaLabel}
						onClick={() => onChange(example.id)}
						className={`flex shrink-0 flex-wrap text-sm items-center gap-0.5 min-w-[4.5rem] sm:min-w-[5.5rem] p-2 rounded-xl border text-center transition-all ${
							active
								? "border-orange-300 bg-gradient-to-b from-orange-100/90 to-orange-50/90 text-orange-800 shadow-sm shadow-orange-100/80"
								: "border-transparent bg-white/70 text-zinc-600 hover:bg-white hover:border-zinc-200 hover:text-zinc-800"
						}`}
					>
						<span className="text-xl sm:text-2xl leading-none" aria-hidden>
							{flag}
						</span>
						<span className="text-xs sm:text-sm font-semibold truncate max-w-[5.5rem]">
							{label}
						</span>
						{sublabel ? (
							<span className="text-[10px] text-zinc-400 font-medium truncate max-w-[5.5rem]">
								from {sublabel}
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}

function LangBadge({ flag, lang, variant = "original" }) {
	const isTranslated = variant === "translated";
	return (
		<div
			className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
				isTranslated
					? "bg-orange-100 text-orange-800 border border-orange-200/80"
					: "bg-zinc-100 text-zinc-800 border border-zinc-200/80"
			}`}
		>
			<span className="text-lg leading-none" aria-hidden>
				{flag}
			</span>
			<span>{lang}</span>
			<span
				className={`text-[10px] font-mono uppercase tracking-wider ${
					isTranslated ? "text-orange-600/80" : "text-zinc-400"
				}`}
			>
				{isTranslated ? "translated" : "original"}
			</span>
		</div>
	);
}

function FlowConnector() {
	return (
		<div className="flex flex-col items-center justify-center gap-1.5 shrink-0 py-2 lg:py-0 lg:px-2">
			<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm text-orange-500">
				<ArrowDown className="h-5 w-5 lg:hidden" aria-hidden />
				<ArrowRight className="h-5 w-5 hidden lg:block" aria-hidden />
			</div>
			<span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
				aantraa
			</span>
		</div>
	);
}

function TranslationExampleCard({
	example,
	showOriginalLink,
}) {
	const originalEmbed = renderOriginalEmbed(example.original);

	return (
		<div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-lg shadow-black/[0.04]">
			<div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-stretch gap-4 lg:gap-5">
				<div className="flex flex-col rounded-2xl border border-zinc-100 bg-zinc-50/80 overflow-hidden">
					<div className="px-4 pt-4 pb-2">
						<LangBadge
							flag={example.original.flag}
							lang={example.original.lang}
							variant="original"
						/>
					</div>
					<div className="px-3 pb-3 flex-1 min-w-0">{originalEmbed}</div>
					{showOriginalLink && example.original.url ? (
						<div className="px-4 pb-4 pt-1 border-t border-zinc-100">
							<a
								href={example.original.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 break-all"
							>
								<ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
								View original source
							</a>
						</div>
					) : null}
				</div>

				<FlowConnector />

				<div className="relative flex flex-col rounded-2xl border-2 border-orange-200/90 bg-gradient-to-br from-orange-50 via-white to-orange-50/40 overflow-hidden shadow-md shadow-orange-500/10">
					<div className="absolute top-3 right-3 z-10">
						<span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
							<Sparkles className="w-3 h-3" aria-hidden />
							AI dubbed
						</span>
					</div>
					<div className="px-4 pt-4 pb-2">
						<LangBadge
							flag={example.translated.flag}
							lang={example.translated.lang}
							variant="translated"
						/>
					</div>
					<div className="px-3 pb-4 flex-1 min-w-0">
						<div className="rounded-xl overflow-hidden ring-1 ring-orange-200/60 bg-black/5">
							<StudioVideoPlayer src={example.translated.src} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * @param {object} props
 * @param {boolean} [props.showOriginalLink] — show source URL below original video
 * @param {string} [props.sectionId] — anchor id for the section
 */
export default function TranslationExamplesSection({
	showOriginalLink = false,
	sectionId = "examples",
}) {
	const [activeId, setActiveId] = useState(TRANSLATION_EXAMPLES[0]?.id ?? "");

	const activeExample = useMemo(
		() =>
			TRANSLATION_EXAMPLES.find((e) => e.id === activeId) ??
			TRANSLATION_EXAMPLES[0],
		[activeId],
	);

	return (
		<section
			id={sectionId}
			className="border-t border-zinc-200/80 bg-[#faf9f7] py-16 sm:py-20 px-5 sm:px-8"
		>
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-10 sm:mb-12">
					<h2 className="aantraa-font text-3xl sm:text-4xl font-bold text-zinc-900 mb-3 tracking-tight">
						See it in action
					</h2>
					<p className="text-base text-zinc-600 leading-relaxed max-w-lg mx-auto">
						Pick a language — original on the left, AI-dubbed output on the
						right.
					</p>
				</div>

				<div className="rounded-2xl border border-zinc-200/80 bg-zinc-100/60 p-2 sm:p-2.5 mb-6">
					<LanguageExampleTabs
						examples={TRANSLATION_EXAMPLES}
						activeId={activeExample?.id}
						onChange={setActiveId}
					/>
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={activeExample?.id}
						role="tabpanel"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
					>
						{activeExample ? (
							<TranslationExampleCard
								example={activeExample}
								showOriginalLink={showOriginalLink}
							/>
						) : null}
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	);
}
