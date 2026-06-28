import {
	BLOG_THEME_PRESETS,
	DEFAULT_BLOG_STYLE_THEME,
	resolveBlogStylePreview,
} from "../../utils/blogVideoStyle";

export function aspectFromDimensions(width, height) {
	const w = Number(width) || 16;
	const h = Number(height) || 9;
	const ratio = w / h;
	if (Math.abs(ratio - 1) < 0.05) return "1:1";
	if (ratio < 1) return "9:16";
	return "16:9";
}

/** Map editor global_style → form fields for resolveBlogStylePreview. */
export function globalStyleToForm(globalStyle) {
	const gs = globalStyle || {};
	return {
		theme: gs.theme || DEFAULT_BLOG_STYLE_THEME,
		backgroundColor: gs.background?.color ?? "",
		waveformColor1: gs.waveform?.colors?.[0] ?? "",
		waveformColor2: gs.waveform?.colors?.[1] ?? "",
		waveformMode: gs.waveform?.mode ?? "",
		waveformWidthRatio: gs.waveform?.widthRatio ?? null,
		waveformHeightRatio: gs.waveform?.heightRatio ?? null,
		waveformYRatio: gs.waveform?.yRatio ?? null,
		centerTextColor: gs.centerText?.color ?? "",
		centerTextFontSize: gs.centerText?.fontSize ?? null,
		centerTextYRatio: gs.centerText?.yRatio ?? null,
		centerTextMaxLines: gs.centerText?.maxLines ?? null,
		captionColor: gs.caption?.color ?? "",
		captionFontSize: gs.caption?.fontSize ?? null,
		captionYRatio: gs.caption?.yRatio ?? null,
		captionMaxLines: gs.caption?.maxLines ?? null,
		captionBoxEnabled: gs.caption?.box?.enabled ?? null,
		captionBoxColor: gs.caption?.box?.color ?? "",
		captionBoxPadding: gs.caption?.box?.padding ?? null,
	};
}

/** Fill missing colors from theme presets so preview updates live with form edits. */
export function resolveGlobalStyleForRender(globalStyle, projectWidth, projectHeight) {
	const aspect = aspectFromDimensions(projectWidth, projectHeight);
	const resolved = resolveBlogStylePreview(globalStyleToForm(globalStyle), aspect);
	return {
		theme: resolved.theme,
		background: { color: resolved.background },
		isGradientBackground: resolved.isGradientBackground,
		waveform: { ...resolved.waveform },
		centerText: { ...resolved.centerText },
		caption: { ...resolved.caption },
	};
}

export function applyThemePresetToGlobalStyle(theme, current = {}) {
	const preset = BLOG_THEME_PRESETS[theme] || BLOG_THEME_PRESETS.dark_blue;
	return {
		...current,
		theme,
		background: { color: preset.background },
		waveform: {
			...current.waveform,
			colors: [...preset.waveColors],
			mode: current.waveform?.mode ?? "cline",
			yRatio: current.waveform?.yRatio ?? 0.5,
			widthRatio: current.waveform?.widthRatio ?? 0.86,
			heightRatio: current.waveform?.heightRatio ?? 0.14,
		},
		centerText: {
			...current.centerText,
			color: preset.centerTextColor,
			yRatio: current.centerText?.yRatio ?? 0.16,
		},
		caption: {
			...current.caption,
			color: preset.captionColor,
			yRatio: current.caption?.yRatio ?? 0.885,
			box: {
				enabled: current.caption?.box?.enabled ?? true,
				color: preset.captionBoxColor,
				padding: current.caption?.box?.padding ?? 10,
			},
		},
	};
}

export function fillCanvasBackground(ctx, w, h, globalStyle, frame, projectWidth, projectHeight) {
	const resolved = resolveGlobalStyleForRender(
		globalStyle,
		projectWidth ?? w,
		projectHeight ?? h,
	);
	const bg =
		frame?.style?.background?.color ??
		resolved.background?.color ??
		"#1a1a2e";
	if (resolved.isGradientBackground && !frame?.style?.background?.color) {
		const g = ctx.createLinearGradient(0, 0, w, h);
		g.addColorStop(0, "#0f172a");
		g.addColorStop(0.5, "#1e3a5f");
		g.addColorStop(1, "#0c4a6e");
		ctx.fillStyle = g;
	} else {
		ctx.fillStyle = bg;
	}
	ctx.fillRect(0, 0, w, h);
}

/** Resolve layer from frame.style.layers or global_style fallbacks. */
export function getLayer(frame, layerId, globalStyle) {
	const layers = frame?.style?.layers;
	if (Array.isArray(layers)) {
		const found = layers.find((l) => l.id === layerId);
		if (found) return found;
	}
	if (layerId === "center_text" && globalStyle?.centerText) {
		return {
			id: "center_text",
			type: "text",
			x: 0.5,
			y: globalStyle.centerText.yRatio ?? 0.16,
			anchor: "center",
			width: 0.9,
			font_size: globalStyle.centerText.fontSize ?? 32,
			color: globalStyle.centerText.color ?? "#ffffff",
			max_lines: globalStyle.centerText.maxLines ?? 4,
		};
	}
	if (layerId === "waveform" && globalStyle?.waveform) {
		const wf = globalStyle.waveform;
		return {
			id: "waveform",
			type: "waveform",
			x: 0.5,
			y: wf.yRatio ?? 0.5,
			width: wf.widthRatio ?? 0.86,
			height: wf.heightRatio ?? 0.14,
			colors: wf.colors ?? ["#4fc3f7", "#81d4fa"],
			mode: wf.mode ?? "cline",
		};
	}
	if (layerId === "caption" && globalStyle?.caption) {
		const cap = globalStyle.caption;
		return {
			id: "caption",
			type: "caption",
			x: 0.5,
			y: cap.yRatio ?? 0.885,
			font_size: cap.fontSize ?? 20,
			color: cap.color ?? "#eceff1",
			max_lines: cap.maxLines ?? 2,
			box: cap.box ?? { enabled: true, color: "rgba(0,0,0,0.55)", padding: 10 },
		};
	}
	return null;
}

export function frameBackgroundColor(frame, globalStyle, projectWidth, projectHeight) {
	if (frame?.style?.background?.color) return frame.style.background.color;
	const resolved = resolveGlobalStyleForRender(globalStyle, projectWidth, projectHeight);
	return resolved.background?.color ?? "#1a1a2e";
}

export function wrapText(ctx, text, maxWidth, maxLines) {
	const words = String(text || "").split(/\s+/).filter(Boolean);
	if (!words.length) return [];
	const lines = [];
	let line = "";
	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (ctx.measureText(test).width > maxWidth && line) {
			lines.push(line);
			line = w;
		} else {
			line = test;
		}
		if (lines.length >= maxLines) break;
	}
	if (line && lines.length < maxLines) lines.push(line);
	return lines.slice(0, maxLines);
}

export function decodeWavBase64(b64) {
	if (!b64) return null;
	try {
		const bin = atob(b64);
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		return bytes.buffer;
	} catch {
		return null;
	}
}

/** Sample waveform peaks from decoded audio buffer. */
export async function sampleWaveformPeaks(audioBase64, barCount = 48) {
	const buf = decodeWavBase64(audioBase64);
	if (!buf) return null;
	try {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const audioBuffer = await ctx.decodeAudioData(buf.slice(0));
		const ch = audioBuffer.getChannelData(0);
		const block = Math.floor(ch.length / barCount) || 1;
		const peaks = [];
		for (let i = 0; i < barCount; i++) {
			let max = 0;
			const start = i * block;
			for (let j = start; j < start + block && j < ch.length; j++) {
				max = Math.max(max, Math.abs(ch[j]));
			}
			peaks.push(max);
		}
		await ctx.close?.();
		return peaks;
	} catch {
		return null;
	}
}

export function drawWaveformBars(ctx, peaks, x, y, w, h, colors, mode) {
	if (!peaks?.length) return;
	const barW = w / peaks.length;
	const c1 = colors?.[0] || "#4fc3f7";
	const c2 = colors?.[1] || c1;
	for (let i = 0; i < peaks.length; i++) {
		const amp = peaks[i];
		const bh = Math.max(2, amp * h * 0.95);
		const bx = x + i * barW;
		const by = y + (h - bh) / 2;
		ctx.fillStyle = i % 2 === 0 ? c1 : c2;
		if (mode === "cline") {
			ctx.beginPath();
			ctx.roundRect?.(bx + 1, by, Math.max(2, barW - 2), bh, 2);
			ctx.fill();
		} else {
			ctx.fillRect(bx + 1, by, Math.max(1, barW - 2), bh);
		}
	}
}

/** Animated waveform when audio peaks are unavailable (style preview / playback). */
export function drawAnimatedWaveform(ctx, x, y, w, h, colors, mode, phase = 0) {
	const c1 = colors?.[0] || "#4fc3f7";
	const c2 = colors?.[1] || c1;
	const bars = 40;
	const barW = w / bars;
	const cy = y + h / 2;
	for (let i = 0; i < bars; i++) {
		const t = i / bars;
		const amp =
			Math.abs(Math.sin(t * Math.PI * 8 + phase * 3)) * 0.55 +
			Math.abs(Math.sin(t * Math.PI * 14 + phase * 2)) * 0.35;
		const bh = Math.max(3, amp * h * 0.9);
		const bx = x + i * barW;
		const by = cy - bh / 2;
		ctx.fillStyle = i % 2 === 0 ? c1 : c2;
		if (mode === "cline" || mode === "line") {
			ctx.beginPath();
			ctx.roundRect?.(bx + 1, by, Math.max(2, barW - 2), bh, 2);
			ctx.fill();
		} else {
			ctx.fillRect(bx + 1, by, Math.max(1, barW - 2), bh);
		}
	}
}
