import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	fillCanvasBackground,
	getLayer,
	wrapText,
	sampleWaveformPeaks,
	drawWaveformBars,
	drawAnimatedWaveform,
	resolveGlobalStyleForRender,
} from "./editorUtils";

/**
 * Right-panel preview: scales canvas to fit container while preserving project aspect ratio.
 */
export default function VideoEditorCanvas({
	frame,
	globalStyle,
	projectWidth = 1080,
	projectHeight = 1920,
	className = "",
	fillContainer = false,
	animateWaveform = false,
}) {
	const canvasRef = useRef(null);
	const containerRef = useRef(null);
	const sizeRef = useRef({ w: 320, h: 568 });
	const [size, setSize] = useState({ w: 320, h: 568 });
	const [peaks, setPeaks] = useState(null);

	const resolvedStyle = useMemo(
		() => resolveGlobalStyleForRender(globalStyle, projectWidth, projectHeight),
		[globalStyle, projectWidth, projectHeight],
	);

	const drawScene = useCallback(
		(phase = 0) => {
			const canvas = canvasRef.current;
			if (!canvas || !frame) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const { w, h } = sizeRef.current;
			const scaleY = h / projectHeight;

			ctx.clearRect(0, 0, w, h);
			fillCanvasBackground(ctx, w, h, resolvedStyle, frame, projectWidth, projectHeight);

			const centerLayer = getLayer(frame, "center_text", resolvedStyle);
			const wfLayer = getLayer(frame, "waveform", resolvedStyle);
			const capLayer = getLayer(frame, "caption", resolvedStyle);

			const title = frame?.content?.title ?? "";
			const lines = Array.isArray(frame?.content?.lines) ? frame.content.lines : [];
			const centerLines = [title, ...lines].filter(Boolean);

			if (centerLayer && centerLines.length) {
				const fs = (centerLayer.font_size ?? 32) * scaleY;
				const maxW = (centerLayer.width ?? 0.9) * w;
				const cx = (centerLayer.x ?? 0.5) * w;
				const cy = (centerLayer.y ?? 0.16) * h;
				ctx.font = `600 ${fs}px system-ui, sans-serif`;
				ctx.fillStyle = centerLayer.color ?? "#fff";
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				const maxLines = centerLayer.max_lines ?? 4;
				let yOff = cy;
				for (const block of centerLines.slice(0, maxLines)) {
					const wrapped = wrapText(ctx, block, maxW, maxLines);
					for (const ln of wrapped) {
						ctx.fillText(ln, cx, yOff);
						yOff += fs * 1.25;
					}
				}
			}

			if (wfLayer) {
				const wx = ((wfLayer.x ?? 0.5) - (wfLayer.width ?? 0.86) / 2) * w;
				const wy = ((wfLayer.y ?? 0.5) - (wfLayer.height ?? 0.14) / 2) * h;
				const ww = (wfLayer.width ?? 0.86) * w;
				const wh = (wfLayer.height ?? 0.14) * h;
				if (peaks?.length) {
					drawWaveformBars(ctx, peaks, wx, wy, ww, wh, wfLayer.colors, wfLayer.mode);
				} else if (animateWaveform) {
					drawAnimatedWaveform(ctx, wx, wy, ww, wh, wfLayer.colors, wfLayer.mode, phase);
				}
			}

			const narration = frame?.content?.narration ?? "";
			if (capLayer && narration) {
				const fs = (capLayer.font_size ?? 20) * scaleY;
				const maxW = w * 0.92;
				const cx = (capLayer.x ?? 0.5) * w;
				const cy = (capLayer.y ?? 0.885) * h;
				ctx.font = `500 ${fs}px system-ui, sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				const capLines = wrapText(ctx, narration, maxW, capLayer.max_lines ?? 2);
				const box = capLayer.box;
				if (box?.enabled && capLines.length) {
					const pad = (box.padding ?? 10) * scaleY;
					const lineH = fs * 1.3;
					const boxH = capLines.length * lineH + pad * 2;
					const boxW = maxW + pad * 2;
					ctx.fillStyle = box.color ?? "rgba(0,0,0,0.55)";
					ctx.beginPath();
					const bx = cx - boxW / 2;
					const by = cy - pad;
					ctx.roundRect?.(bx, by, boxW, boxH, 8);
					ctx.fill();
				}
				ctx.fillStyle = capLayer.color ?? "#eceff1";
				let yOff = cy;
				for (const ln of capLines) {
					ctx.fillText(ln, cx, yOff);
					yOff += fs * 1.3;
				}
			}
		},
		[frame, resolvedStyle, projectWidth, projectHeight, peaks, animateWaveform],
	);

	useEffect(() => {
		drawScene(0);
	}, [drawScene, size]);

	useEffect(() => {
		if (!animateWaveform) return;
		let raf;
		const tick = (t) => {
			drawScene(t / 1000);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [animateWaveform, drawScene]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			const cw = el.clientWidth;
			const ch = el.clientHeight || (fillContainer ? 480 : 640);
			const ratio = projectWidth / projectHeight;
			let w = cw;
			let h = w / ratio;
			if (fillContainer && ch > 0) {
				if (h > ch) {
					h = ch;
					w = h * ratio;
				}
			} else {
				const maxH = ch;
				if (h > maxH) {
					h = maxH;
					w = h * ratio;
				}
			}
			const nextW = Math.max(1, Math.floor(w));
			const nextH = Math.max(1, Math.floor(h));
			if (sizeRef.current.w === nextW && sizeRef.current.h === nextH) return;
			sizeRef.current = { w: nextW, h: nextH };
			setSize({ w: nextW, h: nextH });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [projectWidth, projectHeight, fillContainer]);

	useEffect(() => {
		let cancelled = false;
		const b64 = frame?.audio?.data_base64;
		if (!b64) {
			setPeaks(null);
			return;
		}
		void sampleWaveformPeaks(b64, 56).then((p) => {
			if (!cancelled) setPeaks(p);
		});
		return () => {
			cancelled = true;
		};
	}, [frame?.id, frame?.audio?.data_base64]);

	if (!frame) {
		return (
			<div
				ref={containerRef}
				className={`flex items-center justify-center bg-zinc-900 rounded-xl ${className}`}
				style={{ minHeight: fillContainer ? "100%" : 280 }}
			>
				<p className="text-sm text-zinc-500">Select a frame</p>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={`flex items-center justify-center bg-zinc-950 rounded-xl overflow-hidden ${className}`}
			style={{
				minHeight: fillContainer ? "100%" : 280,
				height: fillContainer ? "100%" : undefined,
			}}
		>
			<canvas
				ref={canvasRef}
				width={size.w}
				height={size.h}
				className="rounded-xl shadow-2xl ring-1 ring-white/10"
				style={{ maxWidth: "100%", maxHeight: "100%" }}
			/>
		</div>
	);
}
