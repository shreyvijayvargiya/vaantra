import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import TranslationExamplesSection from "../app/components/TranslationExamplesSection";
import LoginModal from "../lib/ui/LoginModal";
import { UsagePricingPanel } from "../lib/ui/UsagePricingPanel";
import {
	FREE_STARTER_MINUTES,
	PRICE_PER_MINUTE_USD,
} from "../lib/utils/usagePricing";

export default function ExamplesPage() {
	const [showLogin, setShowLogin] = useState(false);

	return (
		<div className="sans" style={{ color: "#52525b", minHeight: "100vh" }}>
			<Navbar variant="marketing" onSignIn={() => setShowLogin(true)} />

			<TranslationExamplesSection showOriginalLink sectionId="examples" />

			<section
				id="pricing"
				className="border-t border-zinc-200/80 bg-white py-16 px-5 sm:px-8"
			>
				<div className="max-w-xl mx-auto">
					<div className="text-center mb-10">
						<h2 className="aantraa-font text-3xl sm:text-4xl font-bold text-zinc-900 mb-3 tracking-tight">
							Simple{" "}
							<span className="text-orange-600">pricing</span>
						</h2>
						<p className="text-base text-zinc-600 leading-relaxed max-w-lg mx-auto">
							Pay only for the minutes you use. New accounts get{" "}
							{FREE_STARTER_MINUTES} free starter minute
							{FREE_STARTER_MINUTES !== 1 ? "s" : ""} — then from $
							{PRICE_PER_MINUTE_USD.toFixed(2)} per minute.
						</p>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-lg shadow-black/5 mb-8"
					>
						<h3 className="text-lg font-semibold text-zinc-900 mb-1">
							Translation minutes
						</h3>
						<p className="text-sm text-zinc-600 mb-6">
							Choose a pack and check out securely. Minutes apply to video
							dubbing, voice translation, captions, and viral clips.
						</p>
						<UsagePricingPanel
							successReturnPath="/examples"
							onRequireLogin={() => setShowLogin(true)}
						/>
					</motion.div>

					<div className="text-center">
						<Link
							href="/login"
							className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all"
						>
							Get started
							<ArrowRight className="w-4 h-4" aria-hidden />
						</Link>
						<p className="mt-3 text-sm text-zinc-500">
							Sign in to translate your first video.
						</p>
					</div>
				</div>
			</section>

			<Footer variant="marketing" />

			<LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
		</div>
	);
}
