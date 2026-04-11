import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Languages } from "lucide-react";

/** Public YouTube clips under ~1 min — optional `afterVideoId` when you have a real dubbed upload. */
const BENEFIT_SHORTS = [
	{
		videoId: "jNQXAC9IVRw",
		headline: "Reach new viewers fast",
		benefit:
			"Turn a short English clip into a dubbed Spanish version—same energy, new market.",
		fromLang: "English",
		toLang: "Spanish",
	},
	{
		videoId: "C0DPdy98e4c",
		headline: "Test ideas in minutes",
		benefit:
			"Validate hooks globally: one upload, then Hindi, French, or German dubs in parallel.",
		fromLang: "English",
		toLang: "Hindi",
	},
	{
		videoId: "INscMGmFJX4",
		headline: "Shorts that travel",
		benefit:
			"Vertical clips are ideal for TikTok & Shorts—localize captions + voice without a studio.",
		fromLang: "English",
		toLang: "French",
	},
	{
		videoId: "ZZ5LpwO-An4",
		headline: "Memorable in any language",
		benefit:
			"Keep your brand voice: AI dubbing matches tone so the joke (or pitch) still lands.",
		fromLang: "English",
		toLang: "Japanese",
	},
];

function ytThumb(id) {
	return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function ReelCompareCard({
	videoId,
	langLabel,
	subLabel,
	isPlaying,
	onPlay,
	onPause,
	locked,
	lockedHint,
}) {
	return (
		<div
			style={{
				position: "relative",
				width: "min(220px, 42vw)",
				flexShrink: 0,
				aspectRatio: "9 / 16",
				borderRadius: 22,
				overflow: "hidden",
				boxShadow: locked
					? "0 12px 32px rgba(0,0,0,0.08)"
					: "0 28px 60px rgba(0,0,0,0.14)",
				...(locked ? { opacity: 0.92 } : {}),
			}}
		>
			{locked ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						zIndex: 4,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: 16,
						background: "rgba(24,24,27,0.72)",
						backdropFilter: "blur(6px)",
						textAlign: "center",
						color: "#fafafa",
						fontSize: 13,
						fontWeight: 600,
						lineHeight: 1.45,
					}}
				>
					<Languages
						size={28}
						strokeWidth={1.75}
						style={{ marginBottom: 10, opacity: 0.9 }}
						aria-hidden
					/>
					{lockedHint}
				</div>
			) : null}

			{!locked && isPlaying ? (
				<>
					<iframe
						title={`${subLabel} — ${langLabel}`}
						src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						style={{
							position: "absolute",
							inset: 0,
							width: "100%",
							height: "100%",
							border: "none",
						}}
					/>
					<button
						type="button"
						aria-label="Stop video"
						onClick={onPause}
						style={{
							position: "absolute",
							top: 10,
							right: 10,
							padding: "6px 12px",
							fontSize: 11,
							fontWeight: 600,
							borderRadius: 8,
							border: "none",
							background: "rgba(255,255,255,0.95)",
							color: "#3f3f46",
							cursor: "pointer",
							boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
							zIndex: 3,
						}}
					>
						Close
					</button>
				</>
			) : (
				<button
					type="button"
					disabled={locked}
					onClick={() => !locked && onPlay()}
					style={{
						position: "absolute",
						inset: 0,
						border: "none",
						padding: 0,
						margin: 0,
						cursor: locked ? "default" : "pointer",
						display: "block",
					}}
				>
					<img
						src={ytThumb(videoId)}
						alt=""
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							display: "block",
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 0,
							background:
								"linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.75) 100%)",
							pointerEvents: "none",
						}}
					/>
					{!locked ? (
						<div
							style={{
								position: "absolute",
								bottom: 14,
								left: 14,
								display: "inline-flex",
								alignItems: "center",
								gap: 6,
								padding: "7px 14px",
								borderRadius: 10,
								background: "rgba(0,0,0,0.45)",
								backdropFilter: "blur(8px)",
								color: "#fff",
								fontSize: 13,
								fontWeight: 600,
							}}
						>
							<Play size={15} fill="currentColor" aria-hidden />
							Play
						</div>
					) : null}
				</button>
			)}

			<div
				style={{
					position: "absolute",
					top: 12,
					left: 12,
					zIndex: 3,
					pointerEvents: "none",
					display: "flex",
					flexDirection: "column",
					gap: 6,
					alignItems: "flex-start",
				}}
			>
				<span
					style={{
						display: "inline-block",
						padding: "3px 8px",
						borderRadius: 6,
						background: "rgba(0,0,0,0.55)",
						color: "#fff",
						fontSize: 10,
						fontWeight: 700,
						letterSpacing: "0.06em",
						textTransform: "uppercase",
					}}
				>
					{subLabel}
				</span>
				<span
					style={{
						display: "inline-block",
						padding: "5px 11px",
						borderRadius: 8,
						background: "rgba(234,88,12,0.95)",
						color: "#fff",
						fontSize: 12,
						fontWeight: 700,
					}}
				>
					{langLabel}
				</span>
			</div>
		</div>
	);
}

export default function BenefitsShortsSection() {
	const [active, setActive] = useState(0);
	const [playingBefore, setPlayingBefore] = useState(false);
	const [playingAfter, setPlayingAfter] = useState(false);
	const [hasTranslated, setHasTranslated] = useState(false);

	const n = BENEFIT_SHORTS.length;

	const go = useCallback(
		(dir) => {
			setPlayingBefore(false);
			setPlayingAfter(false);
			setHasTranslated(false);
			setActive((i) => (i + dir + n) % n);
		},
		[n],
	);

	useEffect(() => {
		setPlayingBefore(false);
		setPlayingAfter(false);
		setHasTranslated(false);
	}, [active]);

	const current = BENEFIT_SHORTS[active];
	const afterVideoId = current.afterVideoId ?? current.videoId;

	const playBefore = useCallback(() => {
		setPlayingBefore(true);
		setPlayingAfter(false);
	}, []);

	const pauseBefore = useCallback(() => setPlayingBefore(false), []);

	const playAfter = useCallback(() => {
		if (!hasTranslated) return;
		setPlayingAfter(true);
		setPlayingBefore(false);
	}, [hasTranslated]);

	const pauseAfter = useCallback(() => setPlayingAfter(false), []);

	const onTranslate = useCallback(() => {
		setHasTranslated(true);
		setPlayingBefore(false);
		setPlayingAfter(true);
	}, []);

	return (
		<section
			id="benefits"
			style={{
				position: "relative",
				zIndex: 1,
				background: "#fff",
				borderTop: "1px solid rgba(0,0,0,0.06)",
				padding: "80px clamp(20px,5vw,64px) 88px",
			}}
		>
			<style>{`
				.benefits-compare-row {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: clamp(20px, 4vw, 28px);
					min-height: min(420px, 70vh);
				}
				@media (min-width: 768px) {
					.benefits-compare-row {
						flex-direction: row;
						align-items: center;
						gap: clamp(16px, 3vw, 28px);
					}
				}
			`}</style>
			<div style={{ maxWidth: 1100, margin: "0 auto" }}>
				<h2
					className="vaantra-font"
					style={{
						textAlign: "center",
						fontSize: "clamp(1.65rem,3.8vw,2.45rem)",
						fontWeight: 700,
						color: "#18181b",
						marginBottom: 14,
						lineHeight: 1.2,
						letterSpacing: "-0.02em",
					}}
				>
					See why teams dub with{" "}
					<span style={{ color: "#ea580c" }}>vaantra</span>
				</h2>
				<p
					style={{
						textAlign: "center",
						color: "#71717a",
						fontSize: 15,
						lineHeight: 1.65,
						maxWidth: 560,
						margin: "0 auto 48px",
					}}
				>
					Compare the original reel with your localized version—tap Translate to preview
					the dubbed Short (demo uses the same clip with language labels).
				</p>

				<div
					style={{
						position: "relative",
						maxWidth: 960,
						margin: "0 auto",
						padding: "0 clamp(44px, 8vw, 72px)",
					}}
				>
					<button
						type="button"
						aria-label="Previous example"
						onClick={() => go(-1)}
						style={{
							position: "absolute",
							left: 0,
							top: "50%",
							transform: "translateY(-50%)",
							zIndex: 10,
							width: 46,
							height: 46,
							borderRadius: "50%",
							border: "none",
							background: "#ea580c",
							color: "#fff",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							boxShadow: "0 8px 24px rgba(234,88,12,0.35)",
							transition: "transform 0.15s ease, background 0.15s",
						}}
						onMouseDown={(e) =>
							(e.currentTarget.style.transform = "translateY(-50%) scale(0.96)")
						}
						onMouseUp={(e) =>
							(e.currentTarget.style.transform = "translateY(-50%) scale(1)")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.transform = "translateY(-50%) scale(1)")
						}
					>
						<ChevronLeft size={22} strokeWidth={2.5} />
					</button>
					<button
						type="button"
						aria-label="Next example"
						onClick={() => go(1)}
						style={{
							position: "absolute",
							right: 0,
							top: "50%",
							transform: "translateY(-50%)",
							zIndex: 10,
							width: 46,
							height: 46,
							borderRadius: "50%",
							border: "none",
							background: "#ea580c",
							color: "#fff",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							boxShadow: "0 8px 24px rgba(234,88,12,0.35)",
							transition: "transform 0.15s ease",
						}}
						onMouseDown={(e) =>
							(e.currentTarget.style.transform = "translateY(-50%) scale(0.96)")
						}
						onMouseUp={(e) =>
							(e.currentTarget.style.transform = "translateY(-50%) scale(1)")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.transform = "translateY(-50%) scale(1)")
						}
					>
						<ChevronRight size={22} strokeWidth={2.5} />
					</button>

					<div className="benefits-compare-row">
						<ReelCompareCard
							videoId={current.videoId}
							langLabel={current.fromLang}
							subLabel="Before"
							isPlaying={playingBefore}
							onPlay={playBefore}
							onPause={pauseBefore}
							locked={false}
						/>

						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 8,
								flexShrink: 0,
								padding: "0 4px",
							}}
						>
							<button
								type="button"
								onClick={onTranslate}
								disabled={hasTranslated}
								aria-label={
									hasTranslated
										? "Translation preview ready"
										: `Translate from ${current.fromLang} to ${current.toLang}`
								}
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									gap: 8,
									padding: "14px 22px",
									borderRadius: 999,
									border: "none",
									background: hasTranslated
										? "linear-gradient(180deg, #d4d4d8 0%, #a1a1aa 100%)"
										: "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)",
									color: "#fff",
									fontSize: 14,
									fontWeight: 700,
									cursor: hasTranslated ? "default" : "pointer",
									boxShadow: hasTranslated
										? "none"
										: "0 10px 28px rgba(234,88,12,0.4)",
									minWidth: 160,
									transition: "transform 0.15s ease, opacity 0.2s",
								}}
							>
								<Languages size={18} strokeWidth={2.25} aria-hidden />
								{hasTranslated ? "Translated" : "Translate"}
							</button>
							<span
								style={{
									fontFamily: "'DM Sans', system-ui, sans-serif",
									fontSize: 11,
									fontWeight: 600,
									color: "#a1a1aa",
									letterSpacing: "0.02em",
									textAlign: "center",
									maxWidth: 120,
									lineHeight: 1.35,
								}}
							>
								{current.fromLang} → {current.toLang}
							</span>
						</div>

						<ReelCompareCard
							videoId={afterVideoId}
							langLabel={current.toLang}
							subLabel="After"
							isPlaying={playingAfter}
							onPlay={playAfter}
							onPause={pauseAfter}
							locked={!hasTranslated}
							lockedHint="Tap Translate to unlock the dubbed preview"
						/>
					</div>
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={active}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.25 }}
						style={{
							textAlign: "center",
							marginTop: 36,
							maxWidth: 520,
							marginLeft: "auto",
							marginRight: "auto",
						}}
					>
						<h3
							className="vaantra-font"
							style={{
								fontSize: 18,
								fontWeight: 700,
								color: "#18181b",
								marginBottom: 10,
							}}
						>
							{current.headline}
						</h3>
						<p
							style={{
								fontSize: 14.5,
								color: "#52525b",
								lineHeight: 1.7,
								margin: 0,
							}}
						>
							{current.benefit}
						</p>
						<div
							style={{
								marginTop: 18,
								display: "flex",
								justifyContent: "center",
								gap: 8,
								flexWrap: "wrap",
							}}
						>
							{BENEFIT_SHORTS.map((_, i) => (
								<button
									key={i}
									type="button"
									aria-label={`Go to example ${i + 1}`}
									onClick={() => {
										setPlayingBefore(false);
										setPlayingAfter(false);
										setHasTranslated(false);
										setActive(i);
									}}
									style={{
										width: i === active ? 22 : 8,
										height: 8,
										borderRadius: 4,
										border: "none",
										background: i === active ? "#ea580c" : "#d4d4d8",
										cursor: "pointer",
										transition: "width 0.2s ease, background 0.2s",
									}}
								/>
							))}
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	);
}
