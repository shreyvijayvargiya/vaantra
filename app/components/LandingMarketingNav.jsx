import Link from "next/link";

const NAV_LINKS = [
	{ label: "Features", hash: "features" },
	{ label: "Benefits", hash: "benefits" },
	{ label: "Pricing", hash: "pricing" },
	{ label: "FAQ", hash: "faq" },
];

const navStyle = {
	position: "sticky",
	top: 0,
	zIndex: 100,
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: "0 clamp(20px, 5vw, 64px)",
	height: 62,
	background: "rgba(255,255,255,0.85)",
	backdropFilter: "blur(18px)",
	borderBottom: "1px solid rgba(0,0,0,0.06)",
};

const signInButtonStyle = {
	padding: "8px 18px",
	borderRadius: 10,
	fontSize: 13,
	fontWeight: 600,
	background: "rgba(234,88,12,0.1)",
	border: "1px solid rgba(234,88,12,0.35)",
	color: "#c2410c",
	transition: "background 0.2s",
	textDecoration: "none",
	display: "inline-block",
};

/**
 * Landing-style nav: logo, anchor links to home sections, Sign in.
 * @param {object} props
 * @param {() => void} [props.onSignIn] — if set, Sign in opens modal (home). Otherwise links to `/login`.
 */
export default function LandingMarketingNav({ onSignIn }) {
	return (
		<nav style={navStyle}>
			<Link
				href="/"
				className="vaantra-font"
				style={{ fontSize: 22, fontWeight: 700, color: "#18181b" }}
			>
				vaantra<span style={{ color: "#ea580c" }}>.</span>
			</Link>
			<div style={{ display: "flex", alignItems: "center", gap: 32 }}>
				{NAV_LINKS.map(({ label, hash }) => (
					<Link
						key={hash}
						href={`/#${hash}`}
						className="md-show"
						style={{
							fontSize: 14,
							color: "#71717a",
							transition: "color 0.2s",
							display: "none",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "#18181b";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "#71717a";
						}}
					>
						{label}
					</Link>
				))}
				{onSignIn ? (
					<button
						type="button"
						onClick={onSignIn}
						style={signInButtonStyle}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(234,88,12,0.18)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "rgba(234,88,12,0.1)";
						}}
					>
						Sign in
					</button>
				) : (
					<Link
						href="/login"
						style={signInButtonStyle}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = "rgba(234,88,12,0.18)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "rgba(234,88,12,0.1)";
						}}
					>
						Sign in
					</Link>
				)}
			</div>
		</nav>
	);
}
