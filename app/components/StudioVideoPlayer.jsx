import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Play, Pause, Maximize2 } from "lucide-react";

function formatAudioClock(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "0:00";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${m}:${String(s).padStart(2, "0")}`;
}

function isHttpOrHttpsUrl(s) {
	try {
		const u = new URL(s.trim());
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

function StudioVideoPlayer({ src, footerLabel = "Video", showUrlOnError = false }) {
	const videoRef = useRef(null);
	const [playing, setPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		setLoadError(false);
		const onTime = () => setCurrentTime(v.currentTime);
		const onDur = () =>
			setDuration(Number.isFinite(v.duration) ? v.duration : 0);
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onEnded = () => setPlaying(false);
		const onErr = () => setLoadError(true);
		v.addEventListener("timeupdate", onTime);
		v.addEventListener("loadedmetadata", onDur);
		v.addEventListener("play", onPlay);
		v.addEventListener("pause", onPause);
		v.addEventListener("ended", onEnded);
		v.addEventListener("error", onErr);
		return () => {
			v.removeEventListener("timeupdate", onTime);
			v.removeEventListener("loadedmetadata", onDur);
			v.removeEventListener("play", onPlay);
			v.removeEventListener("pause", onPause);
			v.removeEventListener("ended", onEnded);
			v.removeEventListener("error", onErr);
		};
	}, [src]);

	const toggle = async () => {
		const v = videoRef.current;
		if (!v) return;
		try {
			if (v.paused) await v.play();
			else v.pause();
		} catch {
			setPlaying(false);
		}
	};

	const seek = (e) => {
		const v = videoRef.current;
		if (!v || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		v.currentTime = (x / rect.width) * duration;
	};

	const requestFullscreen = () => {
		const v = videoRef.current;
		if (!v) return;
		try {
			if (v.requestFullscreen) void v.requestFullscreen();
			else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
		} catch {
			/* ignore */
		}
	};

	const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

	if (loadError) {
		const showLinkFallback =
			showUrlOnError &&
			typeof src === "string" &&
			isHttpOrHttpsUrl(src);
		if (showLinkFallback) {
			return (
				<div
					style={{
						borderRadius: 16,
						overflow: "hidden",
						background:
							"linear-gradient(145deg, #18181b 0%, #27272a 45%, #1c1917 100%)",
						border: "1px solid rgba(255,255,255,0.06)",
					}}
				>
					<div
						style={{
							borderRadius: 12,
							overflow: "hidden",
							position: "relative",
							background: "#0c0c0e",
							aspectRatio: "16/9",
							maxHeight: 320,
							width: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							padding: "20px 16px",
							boxSizing: "border-box",
						}}
					>
						<div
							style={{
								textAlign: "center",
								maxWidth: "100%",
							}}
						>
							<p
								style={{
									margin: "0 0 10px",
									fontSize: 13,
									color: "rgba(255,255,255,0.82)",
									lineHeight: 1.45,
								}}
							>
								This link doesn’t load as a raw video file in the browser.
								Open it externally or use a direct MP4/WebM URL when available.
							</p>
							<a
								href={src}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 6,
									fontSize: 13,
									fontWeight: 600,
									color: "#fb923c",
									marginBottom: 12,
								}}
							>
								<ExternalLink size={15} aria-hidden />
								Open source
							</a>
							<p
								style={{
									margin: 0,
									fontSize: 11,
									fontFamily: "'DM Mono', monospace",
									color: "rgba(255,255,255,0.55)",
									wordBreak: "break-all",
									lineHeight: 1.5,
									textAlign: "left",
								}}
							>
								{src}
							</p>
						</div>
					</div>
					<div
						style={{
							padding: "8px 12px",
							background: "rgba(0,0,0,0.45)",
							borderTop: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						<span
							style={{
								fontSize: 11,
								fontFamily: "'DM Mono', monospace",
								color: "rgba(255,255,255,0.8)",
							}}
						>
							{footerLabel}
						</span>
					</div>
				</div>
			);
		}
		return (
			<p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>
				Could not load video.
			</p>
		);
	}

	return (
		<div
			style={{
				borderRadius: 16,
				overflow: "hidden",
				background:
					"linear-gradient(145deg, #18181b 0%, #27272a 45%, #1c1917 100%)",
				border: "1px solid rgba(255,255,255,0.06)",
				boxShadow:
					"0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
			}}
		>
			<motion.div
				animate={
					playing
						? { boxShadow: "0 0 0 1px rgba(234,88,12,0.35)" }
						: { boxShadow: "0 0 0 1px rgba(255,255,255,0.04)" }
				}
				transition={{ duration: 0.35 }}
				style={{
					borderRadius: 12,
					overflow: "hidden",
					position: "relative",
					background: "#000",
					aspectRatio: "16/9",
					maxHeight: 320,
					width: "100%",
				}}
			>
				<video
					ref={videoRef}
					src={src}
					playsInline
					preload="metadata"
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
						display: "block",
						cursor: "pointer",
					}}
					onClick={() => void toggle()}
				/>
				{!playing && (
					<div
						style={{
							position: "absolute",
							inset: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							pointerEvents: "none",
							zIndex: 1,
						}}
					>
						<motion.button
							type="button"
							aria-label="Play"
							initial={{ scale: 0.92 }}
							animate={{ scale: 1 }}
							onClick={(e) => {
								e.stopPropagation();
								void toggle();
							}}
							style={{
								pointerEvents: "auto",
								width: 64,
								height: 64,
								borderRadius: "50%",
								border: "none",
								background:
									"linear-gradient(145deg, #f97316, #ea580c)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#fff",
								boxShadow: "0 12px 40px rgba(234,88,12,0.45)",
								cursor: "pointer",
							}}
						>
							<Play
								size={28}
								strokeWidth={2.2}
								color="currentColor"
								style={{ marginLeft: 4 }}
							/>
						</motion.button>
					</div>
				)}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						zIndex: 4,
						padding: "10px 12px",
						background:
							"linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.92) 100%)",
					}}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					role="presentation"
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
					>
						<motion.button
							type="button"
							aria-label={playing ? "Pause" : "Play"}
							onClick={() => void toggle()}
							whileHover={{ scale: 1.06 }}
							whileTap={{ scale: 0.94 }}
							style={{
								width: 40,
								height: 40,
								borderRadius: "50%",
								border: "none",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
								background: "rgba(255,255,255,0.12)",
								color: "#fff",
								cursor: "pointer",
							}}
						>
							{playing ? (
								<Pause size={18} strokeWidth={2.4} />
							) : (
								<Play size={18} strokeWidth={2.4} style={{ marginLeft: 2 }} />
							)}
						</motion.button>
						<button
							type="button"
							onClick={seek}
							style={{
								flex: 1,
								minWidth: 0,
								padding: 0,
								border: "none",
								background: "transparent",
								cursor: "pointer",
								borderRadius: 4,
							}}
						>
							<div
								style={{
									height: 5,
									borderRadius: 3,
									background: "rgba(255,255,255,0.15)",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										height: "100%",
										width: `${pct}%`,
										borderRadius: 3,
										background:
											"linear-gradient(90deg, #fb923c, #ea580c, #f97316)",
										boxShadow: "0 0 10px rgba(234,88,12,0.45)",
									}}
								/>
							</div>
						</button>
						<span
							style={{
								fontSize: 11,
								fontFamily: "'DM Mono', monospace",
								color: "rgba(255,255,255,0.85)",
								flexShrink: 0,
								whiteSpace: "nowrap",
							}}
						>
							{formatAudioClock(currentTime)} / {formatAudioClock(duration)}
						</span>
						<button
							type="button"
							aria-label="Fullscreen"
							onClick={requestFullscreen}
							style={{
								width: 36,
								height: 36,
								borderRadius: 8,
								border: "none",
								background: "rgba(255,255,255,0.08)",
								color: "rgba(255,255,255,0.9)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								flexShrink: 0,
							}}
						>
							<Maximize2 size={16} strokeWidth={2} />
						</button>
					</div>
				</div>
			</motion.div>
			
		</div>
	);
}

export default StudioVideoPlayer;
