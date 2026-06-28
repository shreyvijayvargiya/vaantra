import { useState } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import FormAnimatedDropdown from "../FormAnimatedDropdown";
import {
	BLOG_THEME_OPTIONS,
	BLOG_WAVEFORM_MODE_OPTIONS,
} from "../../utils/blogVideoStyle";
import { applyThemePresetToGlobalStyle } from "./editorUtils";
import { hexForColorInput } from "../../utils/blogVideoStyle";

const inputClass =
	"w-full px-2.5 py-2 text-sm border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-200";

function SliderRow({ label, value, onChange, min = 0.05, max = 0.95, step = 0.01 }) {
	return (
		<div>
			<label className="flex justify-between text-xs font-medium text-zinc-500 mb-1">
				<span>{label}</span>
				<span className="font-mono text-zinc-400">{Number(value).toFixed(2)}</span>
			</label>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value ?? min}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-orange-600"
			/>
		</div>
	);
}

function ColorRow({ label, value, onChange, fallback = "#ffffff" }) {
	return (
		<div>
			<label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
			<div className="flex gap-2 items-center">
				<input
					type="color"
					value={hexForColorInput(value, fallback)}
					onChange={(e) => onChange(e.target.value)}
					className="w-10 h-9 rounded-lg border border-zinc-200 cursor-pointer"
				/>
				<input
					type="text"
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					className={`${inputClass} flex-1 font-mono text-xs`}
					placeholder={fallback}
				/>
			</div>
		</div>
	);
}

export default function VideoEditorInspector({
	frame,
	globalStyle,
	onUpdateFrame,
	onUpdateGlobalStyle,
	styleApplyMode,
	onStyleApplyModeChange,
	flat = false,
}) {
	const [tab, setTab] = useStateTab("content");

	if (!frame) {
		return (
			<div
				className={`p-4 text-sm text-zinc-500 ${flat ? "" : "border border-zinc-200 rounded-xl bg-white"}`}
			>
				Select a frame to edit content and style.
			</div>
		);
	}

	const patchContent = (patch) => {
		onUpdateFrame(frame.id, {
			content: { ...frame.content, ...patch },
		});
	};

	const patchGlobal = (patch) => {
		const next =
			patch && typeof patch === "object" && "theme" in patch && "waveform" in patch
				? patch
				: { ...globalStyle, ...patch };
		onUpdateGlobalStyle(next);
	};

	const gs = globalStyle || {};

	const shellClass = flat
		? "overflow-hidden flex flex-col"
		: "border border-zinc-200 rounded-xl bg-white overflow-hidden flex flex-col max-h-[640px]";

	return (
		<div className={shellClass}>
			<div className="flex border-b border-zinc-100">
				{["content", "style"].map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						className={`flex-1 py-2.5 text-xs font-semibold capitalize ${
							tab === t
								? "text-orange-700 border-b-2 border-orange-500 bg-orange-50/50"
								: "text-zinc-500 hover:text-zinc-700"
						}`}
					>
						{t}
					</button>
				))}
			</div>

			<div className="p-3 overflow-y-auto space-y-3 flex-1">
				{tab === "content" ? (
					<>
						<div>
							<label className="block text-xs font-medium text-zinc-500 mb-1">Frame name</label>
							<input
								type="text"
								value={frame.name ?? ""}
								onChange={(e) => onUpdateFrame(frame.id, { name: e.target.value })}
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
							<input
								type="text"
								value={frame.content?.title ?? ""}
								onChange={(e) => patchContent({ title: e.target.value })}
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-zinc-500 mb-1">Narration</label>
							<textarea
								rows={3}
								value={frame.content?.narration ?? ""}
								onChange={(e) => patchContent({ narration: e.target.value })}
								className={`${inputClass} resize-y`}
							/>
							<p className="flex items-start gap-1.5 mt-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
								<AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
								Changing narration won&apos;t re-sync audio in v1.
							</p>
						</div>
						<div>
							<label className="block text-xs font-medium text-zinc-500 mb-1">Center lines</label>
							<div className="space-y-2">
								{(frame.content?.lines ?? []).map((line, i) => (
									<div key={i} className="flex gap-1">
										<input
											type="text"
											value={line}
											onChange={(e) => {
												const lines = [...(frame.content?.lines ?? [])];
												lines[i] = e.target.value;
												patchContent({ lines });
											}}
											className={`${inputClass} flex-1`}
										/>
										<button
											type="button"
											onClick={() => {
												const lines = (frame.content?.lines ?? []).filter((_, j) => j !== i);
												patchContent({ lines });
											}}
											className="p-2 text-zinc-400 hover:text-red-500"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								))}
								<button
									type="button"
									onClick={() =>
										patchContent({
											lines: [...(frame.content?.lines ?? []), ""],
										})
									}
									className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
								>
									<Plus className="w-3.5 h-3.5" />
									Add line
								</button>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="flex gap-2 p-1 bg-zinc-100 rounded-lg text-[10px] font-semibold">
							<button
								type="button"
								onClick={() => onStyleApplyModeChange("global")}
								className={`flex-1 py-1.5 rounded-md ${
									styleApplyMode === "global" ? "bg-white text-orange-700 shadow-sm" : "text-zinc-500"
								}`}
							>
								All frames
							</button>
							<button
								type="button"
								onClick={() => onStyleApplyModeChange("frame")}
								className={`flex-1 py-1.5 rounded-md ${
									styleApplyMode === "frame" ? "bg-white text-orange-700 shadow-sm" : "text-zinc-500"
								}`}
							>
								This frame
							</button>
						</div>

						<FormAnimatedDropdown
							label="Theme"
							value={gs.theme ?? "dark_blue"}
							onChange={(v) => patchGlobal(applyThemePresetToGlobalStyle(v, gs))}
							options={BLOG_THEME_OPTIONS}
						/>

						<ColorRow
							label="Background"
							value={gs.background?.color}
							onChange={(c) => patchGlobal({ background: { color: c } })}
						/>

						<p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pt-1">Waveform</p>
						<ColorRow
							label="Color 1"
							value={gs.waveform?.colors?.[0]}
							onChange={(c) =>
								patchGlobal({
									waveform: {
										...gs.waveform,
										colors: [c, gs.waveform?.colors?.[1] ?? c],
									},
								})
							}
						/>
						<ColorRow
							label="Color 2"
							value={gs.waveform?.colors?.[1]}
							onChange={(c) =>
								patchGlobal({
									waveform: {
										...gs.waveform,
										colors: [gs.waveform?.colors?.[0] ?? c, c],
									},
								})
							}
						/>
						<FormAnimatedDropdown
							label="Waveform mode"
							value={gs.waveform?.mode ?? "cline"}
							onChange={(v) => patchGlobal({ waveform: { ...gs.waveform, mode: v } })}
							options={BLOG_WAVEFORM_MODE_OPTIONS}
						/>
						<SliderRow
							label="Waveform Y"
							value={gs.waveform?.yRatio ?? 0.5}
							onChange={(v) => patchGlobal({ waveform: { ...gs.waveform, yRatio: v } })}
						/>
						<SliderRow
							label="Waveform width"
							value={gs.waveform?.widthRatio ?? 0.86}
							onChange={(v) => patchGlobal({ waveform: { ...gs.waveform, widthRatio: v } })}
						/>
						<SliderRow
							label="Waveform height"
							value={gs.waveform?.heightRatio ?? 0.14}
							onChange={(v) => patchGlobal({ waveform: { ...gs.waveform, heightRatio: v } })}
						/>

						<p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pt-1">Center text</p>
						<ColorRow
							label="Color"
							value={gs.centerText?.color}
							onChange={(c) => patchGlobal({ centerText: { ...gs.centerText, color: c } })}
						/>
						<SliderRow
							label="Y position"
							value={gs.centerText?.yRatio ?? 0.16}
							onChange={(v) => patchGlobal({ centerText: { ...gs.centerText, yRatio: v } })}
						/>

						<p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pt-1">Caption</p>
						<ColorRow
							label="Color"
							value={gs.caption?.color}
							onChange={(c) => patchGlobal({ caption: { ...gs.caption, color: c } })}
						/>
						<SliderRow
							label="Y position"
							value={gs.caption?.yRatio ?? 0.885}
							onChange={(v) => patchGlobal({ caption: { ...gs.caption, yRatio: v } })}
						/>
						<label className="flex items-center gap-2 text-sm text-zinc-700">
							<input
								type="checkbox"
								checked={gs.caption?.box?.enabled ?? true}
								onChange={(e) =>
									patchGlobal({
										caption: {
											...gs.caption,
											box: { ...gs.caption?.box, enabled: e.target.checked },
										},
									})
								}
								className="rounded border-zinc-300 text-orange-600"
							/>
							Caption box
						</label>
					</>
				)}
			</div>
		</div>
	);
}

function useStateTab(initial) {
	const [tab, setTab] = useState(initial);
	return [tab, setTab];
}