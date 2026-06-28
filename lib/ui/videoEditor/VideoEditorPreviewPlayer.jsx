import { useMemo, useRef, useState } from "react";
import { Play, Pause, Square } from "lucide-react";
import VideoEditorCanvas from "./VideoEditorCanvas";

function formatMs(ms) {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoEditorPreviewPlayer({
	frames,
	globalStyle,
	projectWidth,
	projectHeight,
	selectedFrameId,
	playing,
	playingFrameId,
	exportVideoUrl,
	onTogglePlay,
	onStop,
}) {
	const videoRef = useRef(null);
	const [videoPlaying, setVideoPlaying] = useState(false);

	const displayFrameId = playing && playingFrameId ? playingFrameId : selectedFrameId;
	const displayFrame = useMemo(
		() => frames.find((f) => f.id === displayFrameId) ?? frames[0] ?? null,
		[frames, displayFrameId],
	);

	const { frameIndex, elapsedMs, totalMs } = useMemo(() => {
		const idx = displayFrame
			? Math.max(0, frames.findIndex((f) => f.id === displayFrame.id))
			: 0;
		const elapsed = frames.slice(0, idx).reduce(
			(sum, f) => sum + (Number(f.duration_ms) || 0),
			0,
		);
		const total = frames.reduce((sum, f) => sum + (Number(f.duration_ms) || 0), 0);
		return { frameIndex: idx, elapsedMs: elapsed, totalMs: total };
	}, [frames, displayFrame]);

	const showExportedVideo = Boolean(exportVideoUrl);
	const isPlaying = showExportedVideo ? videoPlaying : playing;

	const handleToggle = async () => {
		if (showExportedVideo && videoRef.current) {
			const v = videoRef.current;
			if (v.paused) {
				try {
					await v.play();
					setVideoPlaying(true);
				} catch {
					setVideoPlaying(false);
				}
			} else {
				v.pause();
				setVideoPlaying(false);
			}
			return;
		}
		onTogglePlay?.();
	};

	const handleStop = () => {
		if (showExportedVideo && videoRef.current) {
			const v = videoRef.current;
			v.pause();
			v.currentTime = 0;
			setVideoPlaying(false);
		}
		onStop?.();
	};

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 min-h-[240px] lg:min-h-0 relative group">
				{showExportedVideo ? (
					<video
						ref={videoRef}
						src={exportVideoUrl}
						className="absolute inset-0 w-full h-full object-contain rounded-xl bg-zinc-950"
						playsInline
						onPlay={() => setVideoPlaying(true)}
						onPause={() => setVideoPlaying(false)}
						onEnded={() => setVideoPlaying(false)}
					/>
				) : (
					<VideoEditorCanvas
						frame={displayFrame}
						globalStyle={globalStyle}
						projectWidth={projectWidth}
						projectHeight={projectHeight}
						fillContainer
						animateWaveform={playing}
						className="h-full w-full"
					/>
				)}

				<div className="absolute inset-0 flex items-center justify-center">
					<button
						type="button"
						onClick={() => void handleToggle()}
						disabled={!frames.length && !exportVideoUrl}
						className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-600/95 text-white shadow-lg shadow-orange-900/30 hover:bg-orange-500 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 ${
							isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
						}`}
						aria-label={isPlaying ? "Pause preview" : "Play preview"}
					>
						{isPlaying ? (
							<Pause className="w-6 h-6" />
						) : (
							<Play className="w-6 h-6 ml-0.5" />
						)}
					</button>
				</div>

				{isPlaying ? (
					<button
						type="button"
						onClick={handleStop}
						className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 text-white text-xs font-medium hover:bg-black/70"
					>
						<Square className="w-3 h-3" />
						Stop
					</button>
				) : null}
			</div>

			{!showExportedVideo ? (
				<div className="mt-3 shrink-0 space-y-1.5">
					<div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
						<span>
							Frame {frames.length ? frameIndex + 1 : 0}/{frames.length}
						</span>
						<span>
							{formatMs(elapsedMs)} / {formatMs(totalMs)}
						</span>
					</div>
					<div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
						<div
							className="h-full bg-orange-500 transition-[width] duration-300"
							style={{
								width: totalMs
									? `${Math.min(100, (elapsedMs / totalMs) * 100)}%`
									: "0%",
							}}
						/>
					</div>
				</div>
			) : (
				<p className="mt-3 text-[11px] text-zinc-500 text-center">
					Exported MP4 · {projectWidth}×{projectHeight}
				</p>
			)}
		</div>
	);
}
