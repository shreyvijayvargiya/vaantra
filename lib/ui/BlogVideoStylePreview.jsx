import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	resolveBlogStylePreview,
	getPreviewFrameSize,
} from "../utils/blogVideoStyle";

const MOCK_TITLE = "Your blog title";
const MOCK_BULLETS = ["Key insight from the article", "Second takeaway point"];
const MOCK_CAPTION = "This is how narration captions appear at the bottom.";

function WaveformSvg({ style, width, height, phase }) {
	const gradId = useId().replace(/:/g, "");
	const wf = style.waveform;
	const boxW = width * wf.widthRatio;
	const boxH = height * wf.heightRatio;
	const cx = width / 2;
	const cy = height * wf.yRatio;
	const left = cx - boxW / 2;
	const top = cy - boxH / 2;
	const points = 48;
	const amplitude = boxH * 0.42;

	const pathD = useMemo(() => {
		const coords = [];
		for (let i = 0; i <= points; i++) {
			const t = i / points;
			const x = left + t * boxW;
			let y = cy;
			if (wf.mode === "p2p") {
				const spike = Math.sin(t * Math.PI * 6 + phase) * 0.6 + Math.sin(t * Math.PI * 14 + phase * 1.3) * 0.4;
				y = cy - spike * amplitude;
			} else if (wf.mode === "line") {
				const bar = Math.abs(Math.sin(t * Math.PI * 10 + phase));
				y = cy - bar * amplitude;
			} else {
				const smooth = Math.sin(t * Math.PI * 4 + phase) * 0.55 + Math.sin(t * Math.PI * 9 + phase * 0.8) * 0.35;
				y = cy - smooth * amplitude;
			}
			coords.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
		}
		return coords.join(" ");
	}, [wf.mode, left, boxW, cy, amplitude, phase]);

	return (
		<svg
			className="absolute inset-0 pointer-events-none"
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			aria-hidden
		>
			<defs>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor={wf.colors[0]} />
					<stop offset="100%" stopColor={wf.colors[1] ?? wf.colors[0]} />
				</linearGradient>
			</defs>
			{wf.mode === "line" ? (
				Array.from({ length: 24 }).map((_, i) => {
					const t = i / 23;
					const x = left + t * boxW;
					const bar = Math.abs(Math.sin(t * Math.PI * 10 + phase));
					const h = bar * boxH * 0.85;
					return (
						<rect
							key={i}
							x={x - boxW / 48}
							y={cy - h / 2}
							width={Math.max(2, boxW / 28)}
							height={h}
							rx={2}
							fill={`url(#${gradId})`}
							opacity={0.9}
						/>
					);
				})
			) : (
				<path
					d={pathD}
					fill="none"
					stroke={`url(#${gradId})`}
					strokeWidth={wf.mode === "p2p" ? 2.5 : 3.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			)}
		</svg>
	);
}

export default function BlogVideoStylePreview({ form, aspect = "16:9" }) {
	const containerRef = useRef(null);
	const [containerSize, setContainerSize] = useState({ w: 280, h: 480 });
	const [phase, setPhase] = useState(0);

	const resolved = useMemo(
		() => resolveBlogStylePreview(form, aspect),
		[form, aspect],
	);

	const frame = useMemo(
		() => getPreviewFrameSize(aspect, containerSize.w, containerSize.h),
		[aspect, containerSize.w, containerSize.h],
	);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setContainerSize({ w: Math.max(160, width - 32), h: Math.max(200, height - 48) });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	useEffect(() => {
		let raf;
		const tick = (t) => {
			setPhase(t / 1000);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, []);

	const scale = frame.width / (aspect === "9:16" ? 360 : aspect === "1:1" ? 400 : 640);

	return (
		<div ref={containerRef} className="flex flex-col items-center justify-center h-full min-h-[320px] p-4">
			<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
				Live preview · {frame.aspectLabel}
			</p>
			<div
				className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/10"
				style={{
					width: frame.width,
					height: frame.height,
					background: resolved.isGradientBackground
						? resolved.background
						: resolved.background,
				}}
			>
				{/* device notch for portrait */}
				{aspect === "9:16" ? (
					<div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-black/20 z-10" />
				) : null}

				<WaveformSvg
					style={resolved}
					width={frame.width}
					height={frame.height}
					phase={phase}
				/>

				{/* Center text */}
				<div
					className="absolute left-0 right-0 px-[8%] text-center pointer-events-none"
					style={{
						top: `${resolved.centerText.yRatio * 100}%`,
						transform: "translateY(-50%)",
						color: resolved.centerText.color,
						fontSize: Math.max(10, resolved.centerText.fontSize * scale * 0.55),
						fontWeight: 700,
						lineHeight: 1.25,
						textShadow: "0 1px 8px rgba(0,0,0,0.35)",
					}}
				>
					<p className="mb-1">{MOCK_TITLE}</p>
					<ul className="text-left inline-block list-disc pl-4 space-y-0.5 font-medium opacity-90">
						{MOCK_BULLETS.slice(0, resolved.centerText.maxLines - 1).map((b) => (
							<li key={b} style={{ fontSize: "0.82em" }}>
								{b}
							</li>
						))}
					</ul>
				</div>

				{/* Caption */}
				<div
					className="absolute left-0 right-0 flex justify-center px-[6%] pointer-events-none"
					style={{
						top: `${resolved.caption.yRatio * 100}%`,
						transform: "translateY(-50%)",
					}}
				>
					<div
						style={{
							color: resolved.caption.color,
							fontSize: Math.max(9, resolved.caption.fontSize * scale * 0.55),
							fontWeight: 500,
							lineHeight: 1.35,
							textAlign: "center",
							maxWidth: "92%",
							padding: resolved.caption.box.enabled
								? resolved.caption.box.padding * scale * 0.4
								: 0,
							background: resolved.caption.box.enabled
								? resolved.caption.box.color
								: "transparent",
							borderRadius: 8,
						}}
					>
						{MOCK_CAPTION}
					</div>
				</div>
			</div>
			<p className="text-[10px] text-zinc-400 mt-3 text-center max-w-[240px]">
				Preview approximates final layout. Exact render may vary slightly by device aspect.
			</p>
		</div>
	);
}
