import Link from "next/link";
import { Mail } from "lucide-react";

const CONTACT_EMAIL = "shreyvijayvargiya26@gmail.com";
const X_PROFILE_URL = "https://x.com/treyvijay";
const TAGLINE =
	"AI audio and video translation into 90+ languages with voice-cloned output.";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-zinc-200/80 bg-white px-5 sm:px-8 py-8 text-center">
			<Link href="/" className="inline-flex items-center justify-center mb-4">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="/aantra-logo.png"
					alt="aantraa"
					className="h-8 w-auto"
				/>
			</Link>

			<p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed mb-4">
				{TAGLINE}
			</p>

			<p className="text-xs text-zinc-400 mb-4">
				© {currentYear} aantraa.site · All rights reserved
			</p>

			<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
				<a
					href={X_PROFILE_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium text-zinc-800 hover:text-orange-600 transition-colors"
				>
					X (Twitter)
				</a>
				<span className="text-zinc-300 hidden sm:inline" aria-hidden>
					·
				</span>
				<a
					href={`mailto:${CONTACT_EMAIL}`}
					className="inline-flex items-center gap-1.5 font-medium text-zinc-800 hover:text-orange-600 transition-colors break-all"
				>
					<Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
					{CONTACT_EMAIL}
				</a>
				<span className="text-zinc-300 hidden sm:inline" aria-hidden>
					·
				</span>
				<Link
					href="/privacy"
					className="text-zinc-500 hover:text-zinc-800 transition-colors"
				>
					Privacy
				</Link>
				<span className="text-zinc-300 hidden sm:inline" aria-hidden>
					·
				</span>
				<Link
					href="/terms-and-conditions"
					className="text-zinc-500 hover:text-zinc-800 transition-colors"
				>
					Terms
				</Link>
			</div>
		</footer>
	);
};

export default Footer;
