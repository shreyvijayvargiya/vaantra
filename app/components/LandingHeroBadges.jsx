import { TrendingUp, Sparkles } from "lucide-react";

/** Inline hero badges (headline with growth pills + social cluster). */
export function GrowthBadgePillLight() {
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				verticalAlign: "middle",
				gap: 6,
				height: 30,
				paddingLeft: 4,
				paddingRight: 10,
				borderRadius: 999,
				background: "#e4e4e7",
				margin: "0 0.1em",
			}}
		>
			<span
				style={{
					width: 22,
					height: 22,
					borderRadius: "50%",
					background: "#ea580c",
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<TrendingUp size={12} color="#fff" strokeWidth={2.5} aria-hidden />
			</span>
			<span
				className="sans"
				style={{ fontWeight: 700, fontSize: "0.82em", color: "#18181b" }}
			>
				24X
			</span>
		</span>
	);
}

export function GrowthBadgePillOrange() {
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				verticalAlign: "middle",
				gap: 6,
				height: 34,
				paddingLeft: 8,
				paddingRight: 14,
				borderRadius: 999,
				background: "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)",
				boxShadow: "0 4px 16px rgba(234, 88, 12, 0.38)",
				margin: "0 0.1em",
			}}
		>
			<TrendingUp size={17} color="#fff" strokeWidth={2.5} aria-hidden />
			<span className="sans" style={{ fontWeight: 700, fontSize: "0.95em", color: "#fff" }}>
				24X
			</span>
		</span>
	);
}

export function HeroSparkleIcon() {
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				verticalAlign: "middle",
				width: 28,
				height: 28,
				borderRadius: 8,
				background: "#18181b",
				margin: "0 0.08em",
			}}
		>
			<Sparkles size={14} color="#fff" strokeWidth={2.5} aria-hidden />
		</span>
	);
}

export function HeroSocialCluster() {
	const box = {
		width: 28,
		height: 28,
		borderRadius: 8,
		background: "#fff",
		border: "1px solid #e4e4e7",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	};
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 4,
				verticalAlign: "middle",
				margin: "0 0.08em",
			}}
		>
			<span style={box} title="X">
				<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
					<path
						fill="#18181b"
						d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
					/>
				</svg>
			</span>
			<span style={box} title="Instagram Reels">
				<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
					<defs>
						<linearGradient id="heroReelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#f09433" />
							<stop offset="45%" stopColor="#e6683c" />
							<stop offset="100%" stopColor="#bc1888" />
						</linearGradient>
					</defs>
					<rect width="24" height="24" rx="7" fill="url(#heroReelGrad)" />
					<path
						fill="#fff"
						d="M10 7.5v9l7-4.5-7-4.5z"
						transform="translate(0.5,0)"
					/>
				</svg>
			</span>
			<span style={{ ...box, border: "1px solid #fecaca" }} title="YouTube Shorts">
				<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
					<rect width="24" height="24" rx="6" fill="#ff0000" />
					<path fill="#fff" d="M10 8.5v7l6-3.5-6-3.5z" />
				</svg>
			</span>
		</span>
	);
}
