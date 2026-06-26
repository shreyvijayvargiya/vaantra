import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import FeaturesShowcaseSection from "../app/components/FeaturesShowcaseSection";
import TranslationExamplesSection from "../app/components/TranslationExamplesSection";
import { getCanonicalUrl } from "../lib/config/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aantraa.video";

export default function FeaturesPage() {
	const title = "Features — aantraa";
	const description =
		"Video translation, text to audio, AI captions, and viral shorts — four AI tools to dub, caption, and clip content in 90+ languages.";

	return (
		<>
			<Head>
				<title>{title}</title>
				<meta name="description" content={description} />
				<meta
					name="keywords"
					content="video translation, text to audio, AI captions, viral clips, aantraa features"
				/>
				<link rel="canonical" href={getCanonicalUrl("/features", SITE_URL)} />
				<meta name="robots" content="index, follow" />
				<meta property="og:site_name" content="aantraa" />
				<meta property="og:type" content="website" />
				<meta property="og:url" content={getCanonicalUrl("/features", SITE_URL)} />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={`${SITE_URL}/aantraa-banner.png`} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:site" content="@aantraa_ai" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={description} />
			</Head>

			<div className="min-h-screen flex flex-col bg-white">
				<Navbar />

				{/* Hero */}
				<section className="pt-14 pb-4 px-5 sm:px-8 text-center border-b border-zinc-100">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="max-w-2xl mx-auto"
					>
						<h1 className="aantraa-font text-4xl sm:text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
							Features
						</h1>
						<p className="text-lg text-zinc-600 leading-relaxed mb-6">
							AI audio and video tools built for creators, marketers, and teams
							who need to ship multilingual content fast.
						</p>
						<Link
							href="/login"
							className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all"
						>
							Get started free
							<ArrowRight className="w-4 h-4" aria-hidden />
						</Link>
					</motion.div>
				</section>

				{/* 4 product features — quote left, demo right */}
				<FeaturesShowcaseSection sectionId="product-features" showHeader />

				{/* Real translation examples */}
				<TranslationExamplesSection sectionId="examples" showOriginalLink />

				<Footer />
			</div>
		</>
	);
}
