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

export default function TermsPage() {
	return (
		<>
			<Head>
				<title>Terms of Service · aantraa</title>
				<meta
					name="description"
					content="Terms of Service for aantraa — the AI-powered video and audio translation platform."
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
								Terms of Service
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
								These Terms of Service ("Terms") govern your access to and use
								of <strong>aantraa</strong> ("Service"), operated by aantraa
								("we", "us"). By using the Service you agree to be bound by
								these Terms. If you do not agree, do not use the Service.
							</p>

							<div style={sectionStyle}>
								<h2 style={h2Style}>1. The Service</h2>
								<p style={pStyle}>
									aantraa provides AI-powered video and audio translation,
									dubbing, and voice cloning via a web application and API.
									Features include YouTube URL translation, file upload
									translation, multi-language parallel jobs, and audio
									translation with voice cloning.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>2. Accounts</h2>
								<p style={pStyle}>
									You must create an account to use the Service. You are
									responsible for maintaining the security of your credentials
									and for all activity under your account. Notify us immediately
									of any suspected unauthorised use.
								</p>
								<p style={pStyle}>
									You must be at least 13 years old to create an account.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>3. Usage-Based Billing</h2>
								<p style={pStyle}>
									The Service is billed based on minutes of video or audio
									processed. New accounts receive a one-time free starter credit.
									Beyond that:
								</p>
								<ul style={ulStyle}>
									<li style={liStyle}>
										You purchase credit packs in advance via Polar checkout.
									</li>
									<li style={liStyle}>
										Minutes are deducted per completed job (rounded up to the
										nearest billable minute).
									</li>
									<li style={liStyle}>
										Credits do not expire but are non-refundable once consumed.
									</li>
									<li style={liStyle}>
										Failed jobs due to our errors are not charged; failed jobs
										due to invalid source content are charged at cost.
									</li>
								</ul>
								<p style={pStyle}>
									We reserve the right to change pricing with 14 days' notice
									posted on the pricing page.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>4. Acceptable Use</h2>
								<p style={pStyle}>You agree not to use the Service to:</p>
								<ul style={ulStyle}>
									<li style={liStyle}>
										Translate content you do not have rights to (copyright
										infringement).
									</li>
									<li style={liStyle}>
										Produce or distribute illegal, defamatory, obscene, or
										harmful content.
									</li>
									<li style={liStyle}>
										Attempt to reverse-engineer, scrape, or abuse the API
										beyond your authorised rate limits.
									</li>
									<li style={liStyle}>
										Impersonate any person or entity or misrepresent your
										affiliation.
									</li>
									<li style={liStyle}>
										Use automated scripts to create accounts or submit jobs in
										bulk without a commercial API agreement.
									</li>
								</ul>
								<p style={pStyle}>
									Violation of acceptable use may result in immediate account
									suspension without refund.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>5. Your Content</h2>
								<p style={pStyle}>
									You retain ownership of source content you submit. By
									submitting content you grant us a limited, non-exclusive
									licence to process it solely to provide the Service. We do
									not use your content to train AI models without your explicit
									consent.
								</p>
								<p style={pStyle}>
									Translated outputs are yours to use subject to the licence of
									the source material — you are responsible for ensuring you
									have the rights to translate and distribute the output.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>6. Intellectual Property</h2>
								<p style={pStyle}>
									The aantraa platform, interface, brand, and underlying
									technology are our exclusive property and are protected by
									applicable intellectual property laws. Nothing in these Terms
									transfers any ownership rights to you.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>7. Service Availability</h2>
								<p style={pStyle}>
									We aim for high availability but do not guarantee uninterrupted
									access. We may perform maintenance, update models, or
									temporarily suspend access with reasonable notice where
									possible. Planned downtime will be announced via status
									updates.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>8. Disclaimer of Warranties</h2>
								<p style={pStyle}>
									The Service is provided "as is" and "as available" without
									warranties of any kind, express or implied. We do not warrant
									that translation outputs will be error-free, accurate, or fit
									for any particular purpose. AI-generated translations may
									contain inaccuracies — always review outputs before
									publication.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>9. Limitation of Liability</h2>
								<p style={pStyle}>
									To the maximum extent permitted by law, aantraa's total
									liability for any claim relating to the Service is limited to
									the amount you paid us in the 30 days preceding the claim. We
									are not liable for indirect, incidental, special,
									consequential, or punitive damages.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>10. Termination</h2>
								<p style={pStyle}>
									You may delete your account at any time from the Account
									settings page. We may suspend or terminate accounts that
									violate these Terms, with or without notice. Unused credits at
									termination for cause are forfeited.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>11. Governing Law</h2>
								<p style={pStyle}>
									These Terms are governed by the laws of India. Any disputes
									shall be subject to the exclusive jurisdiction of courts
									located in India.
								</p>
							</div>

							<div style={sectionStyle}>
								<h2 style={h2Style}>12. Changes to Terms</h2>
								<p style={pStyle}>
									We may modify these Terms at any time. Material changes will
									be notified via email or an in-app banner at least 14 days
									before they take effect. Continued use of the Service after
									changes constitutes acceptance of the new Terms.
								</p>
							</div>

							<div>
								<h2 style={h2Style}>13. Contact</h2>
								<p style={pStyle}>
									Questions about these Terms? Email us at{" "}
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
