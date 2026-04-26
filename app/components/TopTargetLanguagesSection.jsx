import { motion } from "framer-motion";

/**
 * Top destination languages (from English) — flag + label chips for the landing page.
 * Order: broadly popular + regional coverage; Tamil uses the same flag family as other Indian languages.
 */
const TOP_TARGET_LANGS = [
	{ flag: "🇪🇸", label: "Spanish" },
	{ flag: "🇰🇷", label: "Korean" },
	{ flag: "🇹🇭", label: "Thai" },
	{ flag: "🇯🇵", label: "Japanese" },
	{ flag: "🇫🇷", label: "French" },
	{ flag: "🇮🇳", label: "Hindi" },
	{ flag: "🇮🇳", label: "Tamil" },
	{ flag: "🇨🇳", label: "Chinese" },
	{ flag: "🇩🇪", label: "German" },
	{ flag: "🇸🇦", label: "Arabic" },
];

export default function TopTargetLanguagesSection() {
	return (
		<section
			id="benefits"
			style={{
				position: "relative",
				zIndex: 1,
				background: "#fff",
				borderTop: "1px solid rgba(0,0,0,0.06)",
				padding: "80px clamp(20px,5vw,64px) 88px",
			}}
		>
			<div style={{ maxWidth: 900, margin: "0 auto" }}>
				<h2
					className="aantraa-font"
					style={{
						textAlign: "center",
						fontSize: "clamp(1.65rem,3.8vw,2.45rem)",
						fontWeight: 700,
						color: "#18181b",
						marginBottom: 14,
						lineHeight: 1.2,
						letterSpacing: "-0.02em",
					}}
				>
					From English to{" "}
					<span style={{ color: "#ea580c" }}>10 top languages</span>
				</h2>
				<p
					style={{
						textAlign: "center",
						color: "#71717a",
						fontSize: 15,
						lineHeight: 1.65,
						maxWidth: 560,
						margin: "0 auto 32px",
					}}
				>
					Dub and translate with voice cloning—pick a target language and ship localized
					audio and video in minutes, not days.
				</p>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: 10,
					}}
				>
					{TOP_TARGET_LANGS.map(({ flag, label }, i) => (
						<motion.span
							key={label + i}
							initial={{ opacity: 0, y: 8 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.04, duration: 0.3 }}
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 8,
								padding: "10px 16px",
								borderRadius: 999,
								background: "#fff",
								border: "1px solid rgba(0,0,0,0.1)",
								fontSize: 14,
								fontWeight: 600,
								color: "#27272a",
								boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
							}}
						>
							<span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
								{flag}
							</span>
							{label}
						</motion.span>
					))}
				</div>
				<p
					className="sans"
					style={{
						textAlign: "center",
						color: "#a1a1aa",
						fontSize: 13,
						marginTop: 28,
						marginBottom: 0,
					}}
				>
					— plus 80+ more in the app —
				</p>
			</div>
		</section>
	);
}
