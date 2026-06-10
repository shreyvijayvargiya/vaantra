import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { TRANSLATION_EXAMPLES } from "../../lib/config/translationExamples";
import StudioVideoPlayer from "./StudioVideoPlayer";
import StudioYouTubePreview from "./StudioYouTubePreview";

function TwitterOriginalEmbed({ tweetId, label = "Original tweet" }) {
	return (
		<div
			style={{
				borderRadius: 16,
				overflow: "hidden",
				background:
					"linear-gradient(145deg, #18181b 0%, #27272a 45%, #1c1917 100%)",
				border: "1px solid rgba(255,255,255,0.06)",
				boxShadow:
					"0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
			}}
		>
			<div
				style={{
					borderRadius: 12,
					overflow: "hidden",
					position: "relative",
					background: "#000",
					aspectRatio: "16/9",
					maxHeight: 320,
					width: "100%",
				}}
			>
				<iframe
					src={`https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(tweetId)}&theme=dark`}
					title="Original tweet"
					style={{
						width: "100%",
						height: "100%",
						border: "none",
						display: "block",
					}}
					allowFullScreen
				/>
			</div>
			<div
				style={{
					padding: "8px 12px",
					background: "rgba(0,0,0,0.45)",
					borderTop: "1px solid rgba(255,255,255,0.06)",
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="currentColor"
					style={{ color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
				>
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.261 5.635L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
				</svg>
				<span
					style={{
						fontSize: 11,
						fontFamily: "'DM Mono', monospace",
						color: "rgba(255,255,255,0.8)",
					}}
				>
					{label}
				</span>
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

function TranslationExampleRow({
	originalEmbed,
	originalFlag,
	originalLang,
	originalUrl,
	showOriginalLink = false,
	translatedSrc,
	translatedFlag,
	translatedLang,
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-60px" }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			style={{
				display: "grid",
				gridTemplateColumns: "1fr auto 1fr",
				alignItems: "center",
				gap: "clamp(12px, 3vw, 32px)",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 12,
					background: "rgba(234,88,12,0.02)",
				}}
				className="p-2 border border-orange-100 rounded-xl"
			>
				{originalEmbed}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 8,
						padding: "8px 14px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "start",
							gap: 8,
						}}
					>
						<span style={{ fontSize: 20, lineHeight: 1 }}>{originalFlag}</span>
						<span
							style={{ fontSize: 13.5, fontWeight: 600, color: "#18181b" }}
						>
							{originalLang}
						</span>
						<span
							style={{
								fontSize: 11,
								color: "#a1a1aa",
								marginLeft: 4,
								fontFamily: "'DM Mono', monospace",
							}}
						>
							original
						</span>
					</div>
					{showOriginalLink && originalUrl ? (
						<a
							href={originalUrl}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 6,
								fontSize: 12,
								fontWeight: 500,
								color: "#ea580c",
								wordBreak: "break-all",
								lineHeight: 1.4,
							}}
						>
							<ExternalLink size={13} aria-hidden />
							View original source
						</a>
					) : null}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 6,
					flexShrink: 0,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div className="flex items-center gap-2 -rotate-90">
						<img
							className="h-10"
							src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOCAyOCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZDVkNWQ1IiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0xOS40MDEgMy4zNzhhLjc1Ljc1IDAgMCAwLTEuMDIzLS4yOEMxMy4wNzIgNi4xMzIgMTMgMTEuMjY5IDEzIDE0Ljc1djcuNjlsLTQuNzItNC43MmEuNzUuNzUgMCAxIDAtMS4wNiAxLjA2bDYgNmEuNzUuNzUgMCAwIDAgMS4wNiAwbDYtNmEuNzUuNzUgMCAwIDAtMS4wNi0xLjA2bC00LjcyIDQuNzJ2LTcuNjljMC0zLjUxOC4xMjgtNy43OCA0LjYyMi0xMC4zNDlhLjc1Ljc1IDAgMCAwIC4yOC0xLjAyMyIvPjwvc3ZnPg=="
							alt=""
						/>
					</div>
				</div>
				<span
					style={{
						fontSize: 10.5,
						fontFamily: "'DM Mono', monospace",
						color: "#a1a1aa",
						textTransform: "uppercase",
						letterSpacing: "0.06em",
					}}
				>
					Aantraa
				</span>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 12,
					borderRadius: 10,
					background: "rgba(234,88,12,0.1)",
					padding: "8px 8px",
					border: "1px solid rgba(234,88,12,0.18)",
					boxShadow: "0 1px 4px rgba(234,88,12,0.08)",
				}}
			>
				<StudioVideoPlayer src={translatedSrc} />
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "start",
						gap: 8,
						padding: "8px 14px",
					}}
				>
					<span style={{ fontSize: 20, lineHeight: 1 }}>{translatedFlag}</span>
					<span style={{ fontSize: 13.5, fontWeight: 600, color: "#c2410c" }}>
						{translatedLang}
					</span>
					<span
						style={{
							fontSize: 11,
							color: "#ea580c",
							marginLeft: 4,
							fontFamily: "'DM Mono', monospace",
							opacity: 0.7,
						}}
					>
						translated
					</span>
				</div>
			</div>
		</motion.div>
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
	return (
		<section
			id={sectionId}
			style={{
				borderTop: "1px solid rgba(0,0,0,0.06)",
				padding: "80px clamp(20px,5vw,64px)",
				background: "#faf9f7",
			}}
		>
			<div style={{ maxWidth: 1100, margin: "0 auto" }}>
				<h2
					className="aantraa-font"
					style={{
						textAlign: "center",
						fontSize: "clamp(1.8rem,4vw,2.8rem)",
						fontWeight: 700,
						color: "#18181b",
						marginBottom: 12,
					}}
				>
					See it in action
				</h2>
				<p
					style={{
						textAlign: "center",
						fontSize: 15,
						color: "#71717a",
						lineHeight: 1.65,
						maxWidth: 520,
						margin: "0 auto 56px",
					}}
				>
					Real translations made with aantra — original on the left, translated
					on the right.
				</p>

				<div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
					{TRANSLATION_EXAMPLES.map((example) => (
						<TranslationExampleRow
							key={example.id}
							originalEmbed={renderOriginalEmbed(example.original)}
							originalFlag={example.original.flag}
							originalLang={example.original.lang}
							originalUrl={example.original.url}
							showOriginalLink={showOriginalLink}
							translatedSrc={example.translated.src}
							translatedFlag={example.translated.flag}
							translatedLang={example.translated.lang}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
