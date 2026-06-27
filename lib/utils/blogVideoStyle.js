export const BLOG_THEME_OPTIONS = [
	{ value: "dark_blue", label: "Dark blue" },
	{ value: "dark", label: "Dark" },
	{ value: "light", label: "Light" },
	{ value: "minimal", label: "Minimal" },
	{ value: "tech", label: "Tech" },
	{ value: "gradient_blue", label: "Gradient blue" },
];

export const BLOG_WAVEFORM_MODE_OPTIONS = [
	{ value: "cline", label: "Smooth line (recommended)" },
	{ value: "line", label: "Classic waveform" },
	{ value: "p2p", label: "Point to point" },
];

export const DEFAULT_BLOG_STYLE_THEME = "dark_blue";

/** Theme defaults used for preview when form fields are Auto. */
export const BLOG_THEME_PRESETS = {
	dark_blue: {
		background: "#1a1a2e",
		waveColors: ["#4fc3f7", "#81d4fa"],
		centerTextColor: "#ffffff",
		captionColor: "#eceff1",
		captionBoxColor: "rgba(0,0,0,0.55)",
	},
	dark: {
		background: "#0f0f0f",
		waveColors: ["#a78bfa", "#c4b5fd"],
		centerTextColor: "#fafafa",
		captionColor: "#e4e4e7",
		captionBoxColor: "rgba(0,0,0,0.6)",
	},
	light: {
		background: "#f5f5f5",
		waveColors: ["#2563eb", "#60a5fa"],
		centerTextColor: "#1a1a2e",
		captionColor: "#333333",
		captionBoxColor: "rgba(255,255,255,0.85)",
	},
	minimal: {
		background: "#ffffff",
		waveColors: ["#71717a", "#a1a1aa"],
		centerTextColor: "#18181b",
		captionColor: "#52525b",
		captionBoxColor: "rgba(250,250,250,0.9)",
	},
	tech: {
		background: "#0a1628",
		waveColors: ["#22d3ee", "#06b6d4"],
		centerTextColor: "#e0f2fe",
		captionColor: "#bae6fd",
		captionBoxColor: "rgba(10,22,40,0.75)",
	},
	gradient_blue: {
		background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
		waveColors: ["#38bdf8", "#7dd3fc"],
		centerTextColor: "#f0f9ff",
		captionColor: "#e0f2fe",
		captionBoxColor: "rgba(15,23,42,0.6)",
	},
};

export function getAspectStyleDefaults(aspect) {
	if (aspect === "9:16") {
		return {
			waveformWidthRatio: 0.86,
			waveformHeightRatio: 0.14,
			waveformYRatio: 0.5,
			centerTextYRatio: 0.16,
			centerTextFontSize: 28,
			centerTextMaxLines: 4,
			captionYRatio: 0.885,
			captionFontSize: 20,
			captionMaxLines: 2,
			captionBoxPadding: 10,
		};
	}
	if (aspect === "1:1") {
		return {
			waveformWidthRatio: 0.8,
			waveformHeightRatio: 0.12,
			waveformYRatio: 0.52,
			centerTextYRatio: 0.18,
			centerTextFontSize: 26,
			centerTextMaxLines: 4,
			captionYRatio: 0.87,
			captionFontSize: 18,
			captionMaxLines: 2,
			captionBoxPadding: 10,
		};
	}
	return {
		waveformWidthRatio: 0.72,
		waveformHeightRatio: 0.18,
		waveformYRatio: 0.55,
		centerTextYRatio: 0.2,
		centerTextFontSize: 32,
		centerTextMaxLines: 5,
		captionYRatio: 0.88,
		captionFontSize: 22,
		captionMaxLines: 2,
		captionBoxPadding: 10,
	};
}

/** Merge form + theme + aspect defaults for live preview. */
export function resolveBlogStylePreview(form, aspect = "16:9") {
	const themeKey = form?.theme || DEFAULT_BLOG_STYLE_THEME;
	const preset = BLOG_THEME_PRESETS[themeKey] || BLOG_THEME_PRESETS.dark_blue;
	const aspectDef = getAspectStyleDefaults(aspect);

	const bgOverride = String(form?.backgroundColor ?? "").trim();
	const background = bgOverride || preset.background;

	const w1 = String(form?.waveformColor1 ?? "").trim();
	const w2 = String(form?.waveformColor2 ?? "").trim();
	const waveColors =
		w1 && w2 ? [w1, w2] : w1 ? [w1, w1] : w2 ? [w2, w2] : preset.waveColors;

	return {
		theme: themeKey,
		background,
		isGradientBackground: !bgOverride && String(preset.background).includes("gradient"),
		waveform: {
			colors: waveColors,
			mode: form?.waveformMode || "cline",
			widthRatio:
				form?.waveformWidthRatio != null
					? clampRatio(form.waveformWidthRatio)
					: aspectDef.waveformWidthRatio,
			heightRatio:
				form?.waveformHeightRatio != null
					? clampRatio(form.waveformHeightRatio)
					: aspectDef.waveformHeightRatio,
			yRatio:
				form?.waveformYRatio != null
					? clampRatio(form.waveformYRatio)
					: aspectDef.waveformYRatio,
		},
		centerText: {
			color: form?.centerTextColor?.trim() || preset.centerTextColor,
			fontSize:
				clampFontSize(form?.centerTextFontSize) ?? aspectDef.centerTextFontSize,
			yRatio:
				form?.centerTextYRatio != null
					? clampRatio(form.centerTextYRatio)
					: aspectDef.centerTextYRatio,
			maxLines:
				clampMaxLines(form?.centerTextMaxLines, 8) ?? aspectDef.centerTextMaxLines,
		},
		caption: {
			color: form?.captionColor?.trim() || preset.captionColor,
			fontSize: clampFontSize(form?.captionFontSize) ?? aspectDef.captionFontSize,
			yRatio:
				form?.captionYRatio != null
					? clampRatio(form.captionYRatio)
					: aspectDef.captionYRatio,
			maxLines: clampMaxLines(form?.captionMaxLines, 4) ?? aspectDef.captionMaxLines,
			box: {
				enabled: form?.captionBoxEnabled ?? true,
				color: form?.captionBoxColor?.trim() || preset.captionBoxColor,
				padding:
					clampBoxPadding(form?.captionBoxPadding) ?? aspectDef.captionBoxPadding,
			},
		},
	};
}

export function getPreviewFrameSize(aspect, maxWidth = 280, maxHeight = 480) {
	const ratio =
		aspect === "9:16" ? 9 / 16 : aspect === "1:1" ? 1 : 16 / 9;
	let height = maxHeight;
	let width = Math.round(height * ratio);
	if (width > maxWidth) {
		width = maxWidth;
		height = Math.round(width / ratio);
	}
	return { width, height, aspectLabel: aspect };
}

export function hexForColorInput(value, fallback = "#1a1a2e") {
	const s = String(value ?? "").trim();
	if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
	if (/^0x([0-9a-f]{6})$/i.test(s)) return `#${s.slice(2)}`;
	const rgba = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgba) {
		const hex = (n) => Math.min(255, Math.max(0, Number(n))).toString(16).padStart(2, "0");
		return `#${hex(rgba[1])}${hex(rgba[2])}${hex(rgba[3])}`;
	}
	return fallback;
}

export function clampRatio(n) {
	const v = Number(n);
	if (!Number.isFinite(v)) return 0.5;
	return Math.min(0.95, Math.max(0.05, v));
}

export function clampFontSize(n) {
	const v = Number(n);
	if (!Number.isFinite(v)) return null;
	return Math.min(200, Math.max(8, Math.round(v)));
}

export function clampMaxLines(n, max = 8) {
	const v = Number(n);
	if (!Number.isFinite(v)) return null;
	return Math.min(max, Math.max(1, Math.round(v)));
}

export function clampBoxPadding(n) {
	const v = Number(n);
	if (!Number.isFinite(v)) return null;
	return Math.min(48, Math.max(0, Math.round(v)));
}

/** Empty form state — unset fields mean “Auto” (omitted from API payload). */
export function createEmptyBlogStyleForm(theme = DEFAULT_BLOG_STYLE_THEME) {
	return {
		theme,
		backgroundColor: "",
		waveformColor1: "",
		waveformColor2: "",
		waveformMode: "",
		waveformWidthRatio: null,
		waveformHeightRatio: null,
		waveformYRatio: null,
		centerTextColor: "",
		centerTextFontSize: null,
		centerTextYRatio: null,
		centerTextMaxLines: null,
		captionColor: "",
		captionFontSize: null,
		captionYRatio: null,
		captionMaxLines: null,
		captionBoxEnabled: null,
		captionBoxColor: "",
		captionBoxPadding: null,
	};
}

/** Map API style / video_style → form state for pre-fill. */
export function blogStyleApiToForm(apiStyle) {
	const form = createEmptyBlogStyleForm();
	if (!apiStyle || typeof apiStyle !== "object") return form;

	if (apiStyle.theme) form.theme = String(apiStyle.theme);
	if (apiStyle.background?.color) form.backgroundColor = apiStyle.background.color;

	const wf = apiStyle.waveform;
	if (wf && typeof wf === "object") {
		if (Array.isArray(wf.colors)) {
			form.waveformColor1 = wf.colors[0] ?? "";
			form.waveformColor2 = wf.colors[1] ?? "";
		}
		if (wf.mode) form.waveformMode = wf.mode;
		if (wf.widthRatio != null) form.waveformWidthRatio = wf.widthRatio;
		if (wf.heightRatio != null) form.waveformHeightRatio = wf.heightRatio;
		if (wf.yRatio != null) form.waveformYRatio = wf.yRatio;
	}

	const ct = apiStyle.centerText;
	if (ct && typeof ct === "object") {
		if (ct.color) form.centerTextColor = ct.color;
		if (ct.fontSize != null) form.centerTextFontSize = ct.fontSize;
		if (ct.yRatio != null) form.centerTextYRatio = ct.yRatio;
		if (ct.maxLines != null) form.centerTextMaxLines = ct.maxLines;
	}

	const cap = apiStyle.caption;
	if (cap && typeof cap === "object") {
		if (cap.color) form.captionColor = cap.color;
		if (cap.fontSize != null) form.captionFontSize = cap.fontSize;
		if (cap.yRatio != null) form.captionYRatio = cap.yRatio;
		if (cap.maxLines != null) form.captionMaxLines = cap.maxLines;
		if (cap.box && typeof cap.box === "object") {
			if (cap.box.enabled != null) form.captionBoxEnabled = cap.box.enabled;
			if (cap.box.color) form.captionBoxColor = cap.box.color;
			if (cap.box.padding != null) form.captionBoxPadding = cap.box.padding;
		}
	}

	return form;
}

/** Build API `style` object — only includes fields the user set (plus theme). */
export function buildBlogStylePayload(form) {
	const style = { theme: form.theme || DEFAULT_BLOG_STYLE_THEME };

	const bg = String(form.backgroundColor ?? "").trim();
	if (bg) style.background = { color: bg };

	const wf = {};
	const c1 = String(form.waveformColor1 ?? "").trim();
	const c2 = String(form.waveformColor2 ?? "").trim();
	if (c1 || c2) {
		wf.colors = c1 && c2 ? [c1, c2] : c1 ? [c1] : [c2];
	}
	if (form.waveformMode) wf.mode = form.waveformMode;
	if (form.waveformWidthRatio != null) wf.widthRatio = clampRatio(form.waveformWidthRatio);
	if (form.waveformHeightRatio != null) wf.heightRatio = clampRatio(form.waveformHeightRatio);
	if (form.waveformYRatio != null) wf.yRatio = clampRatio(form.waveformYRatio);
	if (Object.keys(wf).length) style.waveform = wf;

	const ct = {};
	if (form.centerTextColor?.trim()) ct.color = form.centerTextColor.trim();
	const ctFs = clampFontSize(form.centerTextFontSize);
	if (ctFs != null) ct.fontSize = ctFs;
	if (form.centerTextYRatio != null) ct.yRatio = clampRatio(form.centerTextYRatio);
	const ctMl = clampMaxLines(form.centerTextMaxLines, 8);
	if (ctMl != null) ct.maxLines = ctMl;
	if (Object.keys(ct).length) style.centerText = ct;

	const cap = {};
	if (form.captionColor?.trim()) cap.color = form.captionColor.trim();
	const capFs = clampFontSize(form.captionFontSize);
	if (capFs != null) cap.fontSize = capFs;
	if (form.captionYRatio != null) cap.yRatio = clampRatio(form.captionYRatio);
	const capMl = clampMaxLines(form.captionMaxLines, 4);
	if (capMl != null) cap.maxLines = capMl;

	const box = {};
	if (form.captionBoxEnabled != null) box.enabled = Boolean(form.captionBoxEnabled);
	if (form.captionBoxColor?.trim()) box.color = form.captionBoxColor.trim();
	const pad = clampBoxPadding(form.captionBoxPadding);
	if (pad != null) box.padding = pad;
	if (Object.keys(box).length) cap.box = box;
	if (Object.keys(cap).length) style.caption = cap;

	return style;
}
