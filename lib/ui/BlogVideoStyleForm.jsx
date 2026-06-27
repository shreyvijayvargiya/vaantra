import { useMemo } from "react";
import { Monitor, Smartphone, Square } from "lucide-react";
import FormAnimatedDropdown from "./FormAnimatedDropdown";
import { BLOG_ASPECT_OPTIONS } from "../videoToolsApi";
import {
	BLOG_THEME_OPTIONS,
	BLOG_WAVEFORM_MODE_OPTIONS,
	clampRatio,
	clampFontSize,
	clampMaxLines,
	clampBoxPadding,
	hexForColorInput,
} from "../utils/blogVideoStyle";

const inputClass =
	"w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 shadow-sm";

const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

const DIMENSION_ICONS = {
	"16:9": Monitor,
	"9:16": Smartphone,
	"1:1": Square,
};

function DimensionPicker({ value, onChange, disabled }) {
	return (
		<div className="rounded-xl border border-zinc-200/80 overflow-hidden bg-white p-3 space-y-2">
			<p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
				Video dimension
			</p>
			<div className="grid grid-cols-3 gap-2">
				{BLOG_ASPECT_OPTIONS.map(({ id }) => {
					const Icon = DIMENSION_ICONS[id] || Monitor;
					const active = value === id;
					const short =
						id === "16:9" ? "Landscape" : id === "9:16" ? "Portrait" : "Square";
					return (
						<button
							key={id}
							type="button"
							disabled={disabled}
							onClick={() => onChange(id)}
							className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all ${
								active
									? "border-orange-400 bg-orange-50 text-orange-800 shadow-sm"
									: "border-zinc-200 bg-zinc-50/80 text-zinc-600 hover:border-zinc-300 hover:bg-white"
							} disabled:opacity-50`}
						>
							<Icon className={`w-5 h-5 ${active ? "text-orange-600" : "text-zinc-400"}`} />
							<span className="text-[11px] font-bold leading-none">{id}</span>
							<span className="text-[10px] font-medium opacity-80 leading-none">{short}</span>
						</button>
					);
				})}
			</div>
			<p className="text-[10px] text-zinc-400 leading-relaxed">
				Preview updates instantly. Layout defaults adjust for portrait vs landscape.
			</p>
		</div>
	);
}

function Section({ title, children, defaultOpen = false }) {
	return (
		<details
			className="border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50/50"
			open={defaultOpen}
		>
			<summary className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 cursor-pointer select-none bg-white border-b border-zinc-100">
				{title}
			</summary>
			<div className="p-3 space-y-3 bg-white">{children}</div>
		</details>
	);
}

function ColorField({ label, value, onChange, disabled, placeholder = "Auto (theme default)" }) {
	const textValue = value ?? "";
	const pickerHex = hexForColorInput(textValue, "#1a1a2e");

	return (
		<div>
			<label className={labelClass}>{label}</label>
			<div className="flex gap-2 items-center">
				<input
					type="color"
					value={pickerHex}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					className="h-10 w-11 shrink-0 rounded-lg border border-zinc-200 cursor-pointer disabled:opacity-40 p-0.5 bg-white"
					title="Pick color"
				/>
				<input
					type="text"
					value={textValue}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					placeholder={placeholder}
					className={`${inputClass} flex-1 min-w-0`}
				/>
				{textValue ? (
					<button
						type="button"
						disabled={disabled}
						onClick={() => onChange("")}
						className="shrink-0 text-[10px] font-semibold text-zinc-500 hover:text-orange-600 px-2 py-1 rounded-lg border border-zinc-200 hover:border-orange-200 disabled:opacity-40"
					>
						Auto
					</button>
				) : null}
			</div>
		</div>
	);
}

function RatioSlider({ label, value, onChange, disabled, hint }) {
	const isAuto = value == null || value === "";
	const display = isAuto ? 0.5 : clampRatio(value);
	return (
		<div>
			<div className="flex items-center justify-between gap-2 mb-1">
				<label className={labelClass}>{label}</label>
				<button
					type="button"
					disabled={disabled}
					onClick={() => onChange(null)}
					className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-40"
				>
					{isAuto ? "Auto" : "Reset to auto"}
				</button>
			</div>
			<input
				type="range"
				min={0.05}
				max={0.95}
				step={0.01}
				value={display}
				disabled={disabled}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-orange-600"
			/>
			<p className="text-[10px] text-zinc-400 mt-0.5">
				{isAuto ? "Auto — uses aspect defaults" : `${Number(display).toFixed(2)}${hint ? ` · ${hint}` : ""}`}
			</p>
		</div>
	);
}

function OptionalNumber({
	label,
	value,
	onChange,
	disabled,
	min,
	max,
	placeholder = "Auto",
}) {
	return (
		<div>
			<label className={labelClass}>{label}</label>
			<input
				type="number"
				min={min}
				max={max}
				value={value ?? ""}
				onChange={(e) => {
					const raw = e.target.value;
					onChange(raw === "" ? null : Number(raw));
				}}
				disabled={disabled}
				placeholder={placeholder}
				className={inputClass}
			/>
		</div>
	);
}

export default function BlogVideoStyleForm({
	value,
	onChange,
	disabled = false,
	themeOptions = BLOG_THEME_OPTIONS,
	aspect = "16:9",
	onAspectChange,
	compact = false,
}) {
	const isPortrait = aspect === "9:16";

	const set = (patch) => onChange({ ...value, ...patch });

	const themeDropdownOptions = useMemo(() => {
		if (!themeOptions?.length) return BLOG_THEME_OPTIONS;
		return themeOptions.map((t) =>
			typeof t === "string" ? { value: t, label: t.replace(/_/g, " ") } : t,
		);
	}, [themeOptions]);

	return (
		<div className="space-y-3">
			{onAspectChange ? (
				<DimensionPicker value={aspect} onChange={onAspectChange} disabled={disabled} />
			) : null}

			{!compact ? (
				<p className="text-xs text-zinc-500 leading-relaxed">
					Optional visual style for the generated video. Leave fields on Auto to use theme
					defaults for {isPortrait ? "portrait" : aspect === "1:1" ? "square" : "landscape"}{" "}
					({aspect}).
				</p>
			) : null}

			<Section title="Theme & background" defaultOpen>
				<FormAnimatedDropdown
					label="Theme preset"
					value={value.theme}
					onChange={(v) => set({ theme: v })}
					options={themeDropdownOptions}
					disabled={disabled}
				/>
				<ColorField
					label="Background color override"
					value={value.backgroundColor}
					onChange={(v) => set({ backgroundColor: v })}
					disabled={disabled}
				/>
			</Section>

			<Section title="Waveform">
				<div className="grid sm:grid-cols-2 gap-3">
					<ColorField
						label="Wave color 1"
						value={value.waveformColor1}
						onChange={(v) => set({ waveformColor1: v })}
						disabled={disabled}
					/>
					<ColorField
						label="Wave color 2"
						value={value.waveformColor2}
						onChange={(v) => set({ waveformColor2: v })}
						disabled={disabled}
					/>
				</div>
				<FormAnimatedDropdown
					label="Waveform mode"
					value={value.waveformMode || ""}
					onChange={(v) => set({ waveformMode: v || "" })}
					options={[
						{ value: "", label: "Auto (smooth line / cline)" },
						...BLOG_WAVEFORM_MODE_OPTIONS,
					]}
					disabled={disabled}
				/>
				<RatioSlider
					label="Wave width"
					value={value.waveformWidthRatio}
					onChange={(v) => set({ waveformWidthRatio: v })}
					disabled={disabled}
					hint="0.05–0.95 of frame width"
				/>
				<RatioSlider
					label="Wave height"
					value={value.waveformHeightRatio}
					onChange={(v) => set({ waveformHeightRatio: v })}
					disabled={disabled}
					hint="0.05–0.95 of frame height"
				/>
				<RatioSlider
					label="Wave vertical position"
					value={value.waveformYRatio}
					onChange={(v) => set({ waveformYRatio: v })}
					disabled={disabled}
					hint="0 = top, 1 = bottom"
				/>
			</Section>

			<Section title="Center text">
				<ColorField
					label="Title & bullet color"
					value={value.centerTextColor}
					onChange={(v) => set({ centerTextColor: v })}
					disabled={disabled}
				/>
				<div className="grid sm:grid-cols-2 gap-3">
					<OptionalNumber
						label="Font size (px)"
						value={value.centerTextFontSize}
						onChange={(v) => set({ centerTextFontSize: clampFontSize(v) })}
						disabled={disabled}
						min={8}
						max={200}
					/>
					<OptionalNumber
						label="Max lines"
						value={value.centerTextMaxLines}
						onChange={(v) => set({ centerTextMaxLines: clampMaxLines(v, 8) })}
						disabled={disabled}
						min={1}
						max={8}
						placeholder={isPortrait ? "Auto (4)" : "Auto (5)"}
					/>
				</div>
				<RatioSlider
					label="Vertical position"
					value={value.centerTextYRatio}
					onChange={(v) => set({ centerTextYRatio: v })}
					disabled={disabled}
					hint="~0.16 portrait default"
				/>
			</Section>

			<Section title="Captions">
				<ColorField
					label="Caption text color"
					value={value.captionColor}
					onChange={(v) => set({ captionColor: v })}
					disabled={disabled}
				/>
				<div className="grid sm:grid-cols-2 gap-3">
					<OptionalNumber
						label="Font size (px)"
						value={value.captionFontSize}
						onChange={(v) => set({ captionFontSize: clampFontSize(v) })}
						disabled={disabled}
						min={8}
						max={200}
					/>
					<OptionalNumber
						label="Max lines"
						value={value.captionMaxLines}
						onChange={(v) => set({ captionMaxLines: clampMaxLines(v, 4) })}
						disabled={disabled}
						min={1}
						max={4}
						placeholder="Auto (2)"
					/>
				</div>
				<RatioSlider
					label="Vertical position"
					value={value.captionYRatio}
					onChange={(v) => set({ captionYRatio: v })}
					disabled={disabled}
					hint="~0.885 portrait default"
				/>
				<div className="pt-1 border-t border-zinc-100 space-y-3">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
						Caption box
					</p>
					<label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
						<input
							type="checkbox"
							checked={value.captionBoxEnabled ?? true}
							onChange={(e) => set({ captionBoxEnabled: e.target.checked })}
							disabled={disabled}
							className="rounded border-zinc-300 text-orange-600 focus:ring-orange-200"
						/>
						Show caption background box
					</label>
					<ColorField
						label="Box color"
						value={value.captionBoxColor}
						onChange={(v) => set({ captionBoxColor: v })}
						disabled={disabled}
						placeholder="Auto (theme default rgba)"
					/>
					<OptionalNumber
						label="Box padding (px)"
						value={value.captionBoxPadding}
						onChange={(v) => set({ captionBoxPadding: clampBoxPadding(v) })}
						disabled={disabled}
						min={0}
						max={48}
						placeholder="Auto (10)"
					/>
				</div>
			</Section>
		</div>
	);
}
