import { useState } from "react";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import TranslationExamplesSection from "../app/components/TranslationExamplesSection";
import LoginModal from "../lib/ui/LoginModal";

export default function ExamplesPage() {
	const [showLogin, setShowLogin] = useState(false);

	return (
		<div className="sans" style={{ color: "#52525b", minHeight: "100vh" }}>
			<Navbar variant="marketing" onSignIn={() => setShowLogin(true)} />

			<TranslationExamplesSection showOriginalLink sectionId="examples" />

			<Footer variant="marketing" />

			<LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
		</div>
	);
}
