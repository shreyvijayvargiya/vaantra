import { motion } from "framer-motion";
import { Video, Mic2, Subtitles, Scissors, Zap, Sparkles } from "lucide-react";

export const AANTRAA_FEATURES = [
	{
		id: "video-translation",
		Icon: Video,
		quote: "My videos only reach one audience",
		title: "Video translation",
		description:
			"Upload a video or paste a direct file URL, choose target languages, and get AI-dubbed output with voice cloning — synced timing, parallel jobs, and 90+ languages.",
		image: "/demo-images/translate-video-form.png",
		imageAlt: "aantraa video translation demo",
	},
	{
		id: "text-to-audio",
		Icon: Mic2,
		quote: "I need voiceovers without a studio",
		title: "Text to audio",
		description:
			"Paste a script, record from your mic, or upload audio — aantraa transcribes, translates, and generates natural speech in the languages you pick.",
		image: "/demo-images/translate-audio-form.png",
		imageAlt: "aantraa text to audio demo",
	},
	{
		id: "caption-generator",
		Icon: Subtitles,
		quote: "Every platform needs captions",
		title: "Caption generator",
		description:
			"Drop a video or URL and AI transcribes speech, styles captions, and burns them into your footage — ready for Reels, Shorts, and long-form.",
		image: "/demo-images/caption-generator-form.png",
		imageAlt: "aantraa caption generator demo",
	},
	{
		id: "viral-shorts",
		Icon: Scissors,
		quote: "I don't have time to cut clips",
		title: "Viral shorts creator",
		description:
			"Upload long-form video and AI finds punchy moments, cuts vertical clips, and optimizes aspect ratio for TikTok, Reels, and Shorts.",
		image: "/demo-images/viral-clip-creator-form.png",
		imageAlt: "aantraa viral shorts creator demo",
	},
];

function FeatureDemoImage({ src, alt, title }) {
	return (
		<div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={alt}
				className="w-full h-auto min-h-[200px] object-cover object-top"
				onError={(e) => {
					e.currentTarget.classList.add("hidden");
					const placeholder = e.currentTarget.nextElementSibling;
					if (placeholder) placeholder.classList.remove("hidden");
				}}
			/>
			<div className="hidden flex flex-col items-center justify-center gap-2 min-h-[220px] px-6 py-10 bg-gradient-to-br from-zinc-50 to-orange-50/40 text-center">
				<p className="text-sm font-semibold text-zinc-700">{title}</p>
				<p className="text-xs text-zinc-500 max-w-xs">
					Add a demo image at{" "}
					<code className="text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[11px]">
						public{src}
					</code>
				</p>
			</div>
		</div>
	);
}

function FeaturePainPoint({ Icon, quote }) {
	return (
		<div className="flex flex-col items-start max-w-md">
			<div className="flex items-start gap-4">
				<div className="relative shrink-0 mt-0.5">
					<Zap
						className="absolute -top-2 -right-2 h-4 w-4 text-orange-300 fill-orange-200/60 stroke-orange-300"
						strokeWidth={1.75}
						aria-hidden
					/>
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100/90 text-orange-600 border border-orange-200/70">
						<Icon className="h-6 w-6" aria-hidden />
					</div>
					<Sparkles
						className="absolute -bottom-1.5 -left-1.5 h-4 w-4 text-orange-300 fill-orange-200/50 stroke-orange-300"
						strokeWidth={1.75}
						aria-hidden
					/>
				</div>

				<p className="aantraa-font text-xl sm:text-2xl font-bold text-zinc-900 leading-snug tracking-tight pt-2">
					&ldquo;{quote}&rdquo;
				</p>
			</div>

			<svg
				className="w-36 sm:w-44 h-14 text-orange-300/90 ml-1 mt-1"
				viewBox="0 0 160 56"
				fill="none"
				aria-hidden
			>
				<path
					d="M12 10 C 48 10, 72 42, 148 44"
					stroke="currentColor"
					strokeWidth="2.25"
					strokeLinecap="round"
					strokeDasharray="5 7"
				/>
				<path
					d="M138 36 L148 44 L138 52"
					stroke="currentColor"
					strokeWidth="2.25"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
}

function FeatureRow({ feature, index }) {
	const { Icon, quote, title, description, image, imageAlt } = feature;

	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.5, delay: index * 0.06 }}
			className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-8 lg:gap-12 items-center"
		>
			<FeaturePainPoint Icon={Icon} quote={quote} />

			{/* Right — solution card */}
			<div className="rounded-3xl bg-[#f7f4ef] border border-zinc-200/60 p-6 sm:p-8 shadow-sm shadow-black/[0.03]">
				<h3 className="aantraa-font text-lg sm:text-xl font-bold text-zinc-900 mb-2 tracking-tight">
					{title}
				</h3>
				<p className="text-sm sm:text-base text-zinc-600 leading-relaxed mb-6 max-w-xl">
					{description}
				</p>
				<FeatureDemoImage src={image} alt={imageAlt} title={title} />
			</div>
		</motion.div>
	);
}

/**
 * Problem → solution feature rows (reference layout: quote left, demo card right).
 */
export default function FeaturesShowcaseSection({
	sectionId = "product-features",
	showHeader = true,
	className = "",
}) {
	return (
		<section
			id={sectionId}
			className={`border-t border-zinc-200/80 bg-white py-16 sm:py-20 px-5 sm:px-8 ${className}`}
		>
			<div className="max-w-5xl mx-auto">
				{showHeader && (
					<div className="text-center mb-14 sm:mb-16">
						<h2 className="aantraa-font text-3xl sm:text-4xl font-bold text-zinc-900 mb-3 tracking-tight">
							Four ways to go{" "}
							<span className="text-orange-600">multilingual</span>
						</h2>
						<p className="text-base text-zinc-600 max-w-lg mx-auto leading-relaxed">
							From full video dubbing to viral clips — everything you need to
							repurpose audio and video for global audiences.
						</p>
					</div>
				)}

				<div className="flex flex-col gap-16 sm:gap-20">
					{AANTRAA_FEATURES.map((feature, index) => (
						<FeatureRow key={feature.id} feature={feature} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}
