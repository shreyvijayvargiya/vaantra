import Link from "next/link";
import { Mail } from "lucide-react";

/** Keep in sync with landing `pages/index.js` marketing constants. */
const CONTACT_EMAIL = "shreyvijayvargiya26@gmail.com";
const X_PROFILE_URL = "https://x.com/shreyvijayvargiya26";

export default function LandingMarketingFooter() {
	return (
		<footer
			style={{
				borderTop: "1px solid rgba(0,0,0,0.06)",
				padding: "32px clamp(20px,5vw,64px)",
				textAlign: "center",
			}}
		>
			<div
				className="aantraa-font"
				style={{
					fontSize: 20,
					fontWeight: 700,
					color: "#18181b",
					marginBottom: 8,
				}}
			>
				aantraa<span style={{ color: "#ea580c" }}>.</span>
			</div>
			<p style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 12 }}>
				© 2026 aantraa.video · All rights reserved
			</p>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					alignItems: "center",
					gap: 16,
					fontSize: 13,
				}}
			>
				<a
					href={X_PROFILE_URL}
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "#18181b", fontWeight: 500 }}
				>
					X (Twitter)
				</a>
				<span style={{ color: "#d4d4d8" }}>·</span>
				<a
					href={`mailto:${CONTACT_EMAIL}`}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						color: "#18181b",
						fontWeight: 500,
					}}
				>
				<Mail size={14} style={{ color: "#ea580c" }} />
				{CONTACT_EMAIL}
			</a>
			<span style={{ color: "#d4d4d8" }}>·</span>
			<Link href="/privacy" style={{ color: "#71717a", fontWeight: 400 }}>
				Privacy
			</Link>
			<span style={{ color: "#d4d4d8" }}>·</span>
			<Link
				href="/terms-and-conditions"
				style={{ color: "#71717a", fontWeight: 400 }}
			>
				Terms
			</Link>
		</div>
	</footer>
	);
}
