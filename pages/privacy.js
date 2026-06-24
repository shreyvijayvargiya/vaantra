import Head from "next/head";
import Link from "next/link";
import LandingMarketingNav from "../app/components/LandingMarketingNav";
import LandingMarketingFooter from "../app/components/LandingMarketingFooter";

const LAST_UPDATED = "May 13, 2026";
const CONTACT_EMAIL = "shreyvijayvargiya26@gmail.com";

const sectionStyle = {
	marginBottom: 32,
};

const h2Style = {
	fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
	fontWeight: 700,
	color: "#18181b",
	marginBottom: 10,
	marginTop: 36,
	letterSpacing: "-0.01em",
};

const pStyle = {
	fontSize: 14.5,
	color: "#52525b",
	lineHeight: 1.75,
	marginBottom: 10,
};

const ulStyle = {
	paddingLeft: 20,
	marginBottom: 10,
};

const liStyle = {
	fontSize: 14.5,
	color: "#52525b",
	lineHeight: 1.75,
	marginBottom: 4,
};

export default function PrivacyPage() {
	return (
		<>
			<Head>
				<title>Privacy Policy · aantraa</title>
				<meta
					name="description"
					content="How aantraa collects, uses, and protects your personal information when you use our AI video translation service."
				/>
			</Head>

			<div
				style={{
					fontFamily: "'DM Sans', system-ui, sans-serif",
					background: "#f5f4f0",
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<LandingMarketingNav />

				<main
					style={{
						flex: 1,
						padding: "56px clamp(20px, 5vw, 64px) 80px",
					}}
				>
					<div style={{ maxWidth: 720, margin: "0 auto" }}>
						{/* Header */}
						<div style={{ marginBottom: 40 }}>
							<span
								style={{
									display: "inline-block",
									fontSize: 11.5,
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "#ea580c",
									background: "rgba(234,88,12,0.08)",
									border: "1px solid rgba(234,88,12,0.18)",
									borderRadius: 6,
									padding: "3px 10px",
									marginBottom: 16,
								}}
							>
								Legal
							</span>
							<h1
								className="aantraa-font"
								style={{
									fontSize: "clamp(2rem, 5vw, 3rem)",
									fontWeight: 700,
									color: "#18181b",
									marginBottom: 10,
									letterSpacing: "-0.02em",
									lineHeight: 1.15,
								}}
							>
								Privacy Policy
							</h1>
							<p style={{ fontSize: 14, color: "#a1a1aa" }}>
								Last updated: {LAST_UPDATED}
							</p>
						</div>

						{/* Card */}
						<div
							style={{
								background: "#fff",
								borderRadius: 20,
								border: "1px solid rgba(0,0,0,0.07)",
								boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
								padding: "clamp(24px, 5vw, 48px)",
							}}
						>
							<p style={pStyle}>
								Welcome to <strong>aantraa</strong> ("we", "us", or "our"). We
								operate the AI-powered video translation service at{" "}
								<a
									href="https://aantraa.site"
									style={{ color: "#ea580c", fontWeight: 500 }}
								>
									aantraa.site
								</a>
								. This Privacy Policy explains how we collect, use, disclose,
								and safeguard your information when you use our service.
							</p>

							<div style={sectionStyle}>
								<h2 style={h2Style}>1. Information We Collect</h2>
								<p style={pStyle}>
									We collect information you provide directly and information
									collected automatically when you use our service:
								</p>
								<ul style={ulStyle}>
									<li style={liStyle}>
										<strong>Account data</strong> — name, email address, and
										authentication credentials when you sign up via Google or
										email.
									</li>
									<li style={liStyle}>
										<strong>Usage data</strong> — translation jobs submitted,
										source URLs or uploaded files, target languages selected,
										minutes of video/audio processed, and job outputs.
									</li>
									<li style={liStyle}>
										<strong>Billing data</strong> — payment method details
										processed by our third-party payment provider (Polar). We do
										not store raw card numbers.
									</li>
									<li style={liStyle}>
										<strong>Device &amp; log data</strong> — IP address, browser
										type, referring URLs, pages visited, and timestamps,
										collected automatically via server logs and analytics.
									</li>
									<li style={liStyle}>
										<strong>Cookies &amp; local storage</strong> — session
										tokens and preference values to keep you signed in and
										remember settings.
									</li>
								</ul>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>2. How We Use Your Information</h2>
								<ul style={ulStyle}>
									<li style={liStyle}>
										Provide, operate, and improve the aantraa translation
										service.
									</li>
									<li style={liStyle}>
										Process payments and track usage-based billing in minutes.
									</li>
									<li style={liStyle}>
										Send transactional emails (job completion, receipts, account
										alerts).
									</li>
									<li style={liStyle}>
										Detect and prevent fraud, abuse, and violations of our Terms.
									</li>
									<li style={liStyle}>
										Analyse aggregate usage patterns to improve product quality.
									</li>
									<li style={liStyle}>
										Comply with applicable legal obligations.
									</li>
								</ul>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>3. Sharing Your Information</h2>
								<p style={pStyle}>
									We do not sell your personal information. We may share it
									only in these circumstances:
								</p>
								<ul style={ulStyle}>
									<li style={liStyle}>
										<strong>Service providers</strong> — Firebase (auth &amp;
										database), Uploadthing (file storage), Polar (payments),
										ElevenLabs / Sieve (AI translation processing), Vercel
										(hosting), PostHog (analytics). Each is bound by data
										processing agreements.
									</li>
									<li style={liStyle}>
										<strong>Legal requirements</strong> — when required by law,
										court order, or valid government request.
									</li>
									<li style={liStyle}>
										<strong>Business transfer</strong> — in the event of a
										merger, acquisition, or asset sale your data may transfer as
										a business asset.
									</li>
								</ul>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>4. Data Retention</h2>
								<p style={pStyle}>
									We retain your account data for as long as your account is
									active. Translation job outputs are stored to allow you to
									download results; you can delete individual jobs from your
									dashboard at any time. We delete inactive accounts and their
									associated data after 12 months of inactivity.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>5. Cookies &amp; Tracking</h2>
								<p style={pStyle}>
									We use first-party cookies for authentication sessions and
									user preferences. We use PostHog for product analytics (page
									views, feature usage). You can opt out of non-essential cookies
									by clicking "Decline" in the cookie consent banner. Declining
									will not affect core service functionality.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>6. Data Security</h2>
								<p style={pStyle}>
									We use HTTPS encryption for all data in transit, and
									industry-standard measures for data at rest. Authentication is
									handled by Firebase Authentication. No method of transmission
									over the internet is 100% secure — we cannot guarantee
									absolute security but we take reasonable precautions.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>7. Your Rights</h2>
								<p style={pStyle}>
									Depending on your jurisdiction (GDPR, CCPA, etc.) you may
									have rights to:
								</p>
								<ul style={ulStyle}>
									<li style={liStyle}>Access the personal data we hold about you.</li>
									<li style={liStyle}>Correct inaccurate data.</li>
									<li style={liStyle}>
										Request deletion of your account and associated data.
									</li>
									<li style={liStyle}>
										Object to or restrict certain processing activities.
									</li>
									<li style={liStyle}>Data portability.</li>
								</ul>
								<p style={pStyle}>
									To exercise any of these rights, email us at{" "}
									<a
										href={`mailto:${CONTACT_EMAIL}`}
										style={{ color: "#ea580c", fontWeight: 500 }}
									>
										{CONTACT_EMAIL}
									</a>
									.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>8. Children's Privacy</h2>
								<p style={pStyle}>
									aantraa is not directed to children under 13. We do not
									knowingly collect personal information from anyone under 13.
									If you believe a child has provided us with personal data,
									contact us and we will delete it promptly.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>9. Changes to This Policy</h2>
								<p style={pStyle}>
									We may update this Privacy Policy from time to time. We will
									notify you of material changes by posting the updated policy
									on this page with a new "Last updated" date. Continued use of
									the service after changes constitutes acceptance.
								</p>
							</div>

							<div>
								<h2 style={h2Style}>10. Contact</h2>
								<p style={pStyle}>
									Questions about this policy? Email us at{" "}
									<a
										href={`mailto:${CONTACT_EMAIL}`}
										style={{ color: "#ea580c", fontWeight: 500 }}
									>
										{CONTACT_EMAIL}
									</a>
									.
								</p>
							</div>
						</div>

						{/* Back link */}
						<div style={{ marginTop: 32, textAlign: "center" }}>
							<Link
								href="/"
								style={{
									fontSize: 13.5,
									color: "#71717a",
									textDecoration: "none",
									display: "inline-flex",
									alignItems: "center",
									gap: 6,
								}}
							>
								← Back to home
							</Link>
						</div>
					</div>
				</main>

				<LandingMarketingFooter />
			</div>
		</>
	);
}
