import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "aantraa_cookie_consent";

export default function CookieConsent() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (!saved) setVisible(true);
		} catch {
			setVisible(true);
		}
	}, []);

	const accept = () => {
		try {
			localStorage.setItem(STORAGE_KEY, "accepted");
		} catch {}
		setVisible(false);
	};

	const decline = () => {
		try {
			localStorage.setItem(STORAGE_KEY, "declined");
		} catch {}
		setVisible(false);
	};

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0, y: 24, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 16, scale: 0.97 }}
					transition={{ duration: 0.28, ease: "easeOut" }}
					style={{
						position: "fixed",
						bottom: 24,
						right: 24,
						zIndex: 9999,
						width: "clamp(280px, 90vw, 340px)",
						background: "#fff",
						borderRadius: 16,
						border: "1px solid rgba(0,0,0,0.09)",
						boxShadow:
							"0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
						padding: "16px 18px 18px",
						fontFamily: "'DM Sans', system-ui, sans-serif",
					}}
				>
					{/* Header */}
					<div
						style={{
							display: "flex",
							alignItems: "flex-start",
							justifyContent: "space-between",
							gap: 10,
							marginBottom: 10,
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<div
								style={{
									width: 32,
									height: 32,
									borderRadius: 9,
									background: "rgba(234,88,12,0.1)",
									border: "1px solid rgba(234,88,12,0.2)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								<Cookie size={16} style={{ color: "#ea580c" }} />
							</div>
							<span
								style={{
									fontSize: 14,
									fontWeight: 700,
									color: "#18181b",
									letterSpacing: "-0.01em",
								}}
							>
								Cookies
							</span>
						</div>
						<button
							type="button"
							onClick={decline}
							aria-label="Dismiss"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: 26,
								height: 26,
								borderRadius: 7,
								border: "none",
								background: "rgba(0,0,0,0.04)",
								color: "#71717a",
								cursor: "pointer",
								flexShrink: 0,
							}}
						>
							<X size={14} strokeWidth={2.2} />
						</button>
					</div>

					{/* Body */}
					<p
						style={{
							fontSize: 12.5,
							color: "#52525b",
							lineHeight: 1.6,
							marginBottom: 14,
						}}
					>
						We use cookies to improve your experience and analyse site usage.
						Read our{" "}
						<Link
							href="/privacy"
							style={{
								color: "#ea580c",
								fontWeight: 500,
								textDecoration: "underline",
								textUnderlineOffset: 2,
							}}
						>
							Privacy Policy
						</Link>{" "}
						and{" "}
						<Link
							href="/terms-and-conditions"
							style={{
								color: "#ea580c",
								fontWeight: 500,
								textDecoration: "underline",
								textUnderlineOffset: 2,
							}}
						>
							Terms
						</Link>
						.
					</p>

					{/* Actions */}
					<div style={{ display: "flex", gap: 8 }}>
						<button
							type="button"
							onClick={decline}
							style={{
								flex: 1,
								padding: "8px 0",
								borderRadius: 9,
								fontSize: 13,
								fontWeight: 500,
								border: "1px solid rgba(0,0,0,0.1)",
								background: "transparent",
								color: "#71717a",
								cursor: "pointer",
								transition: "background 0.15s",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.background = "rgba(0,0,0,0.04)")
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.background = "transparent")
							}
						>
							Decline
						</button>
						<button
							type="button"
							onClick={accept}
							style={{
								flex: 1,
								padding: "8px 0",
								borderRadius: 9,
								fontSize: 13,
								fontWeight: 600,
								border: "none",
								background: "linear-gradient(135deg, #f97316, #ea580c)",
								color: "#fff",
								cursor: "pointer",
								boxShadow: "0 2px 8px rgba(234,88,12,0.3)",
								transition: "opacity 0.15s",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
							onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
						>
							Accept all
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
