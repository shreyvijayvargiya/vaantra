import { useState, useRef, useEffect } from "react";
import {
	Upload,
	Loader2,
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Scissors,
} from "lucide-react";
import {
	startClipCutJob,
	CLIP_ASPECT_OPTIONS,
	CAPTION_MODEL_OPTIONS,
	CLIP_STATUS_LABELS,
} from "../videoToolsApi";
import { auth } from "../config/firebase";
import FormAnimatedDropdown from "./FormAnimatedDropdown";
import LangSingleSelect from "./LangSingleSelect";
import { languageNameToApiCode } from "../utils/languages";
import ViralClipsJobResult from "./ViralClipsJobResult";
import { extractClipJobFields } from "../videoToolsJob";
import { getBlockedVideoUrlWarning } from "../utils/blockedVideoUrl";
import BlockedUrlWarning from "./BlockedUrlWarning";
import WorkspaceVideoPicker from "./WorkspaceVideoPicker";

const VIDEO_UPLOAD_MAX_MB = 500;
const VIDEO_UPLOAD_MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024;

const inputClass =
	"w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 shadow-sm";

export default function ViralClipCutPanel({
	requireAuthOnSubmit,
	onRequireAuth,
	onJobCreated,
	prefillVideoUrl = null,
	lockPrefilledUrl = false,
	workspaceVideos = [],
	urlOnly = false,
}) {
	const [mode, setMode] = useState("url");
	const [videoUrl, setVideoUrl] = useState("");
	const [urlLocked, setUrlLocked] = useState(false);
	const prefillAppliedRef = useRef(null);
	const [file, setFile] = useState(null);
	const [prompt, setPrompt] = useState("");
	const [clipCount, setClipCount] = useState("");
	const [maxClips, setMaxClips] = useState("10");
	const [minClipSec, setMinClipSec] = useState("15");
	const [maxClipSec, setMaxClipSec] = useState("60");
	const [targetAspect, setTargetAspect] = useState("");
	const [languageName, setLanguageName] = useState("English");
	const [model, setModel] = useState("gemini");
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState("");
	const [error, setError] = useState("");
	const [result, setResult] = useState(null);
	const [drag, setDrag] = useState(false);
	const fileRef = useRef(null);
	const abortRef = useRef(null);

	useEffect(() => {
		return () => abortRef.current?.abort();
	}, []);

	useEffect(() => {
		if (!urlOnly) return;
		setMode("url");
		setFile(null);
		setError("");
	}, [urlOnly]);

	useEffect(() => {
		if (!prefillVideoUrl) return;
		if (prefillAppliedRef.current === prefillVideoUrl) return;
		prefillAppliedRef.current = prefillVideoUrl;
		setMode("url");
		setVideoUrl(prefillVideoUrl);
		setUrlLocked(Boolean(lockPrefilledUrl));
		setFile(null);
	}, [prefillVideoUrl, lockPrefilledUrl]);

	const pickFile = (f) => {
		if (!f) return;
		if (!f.type?.includes?.("video") && !f.name?.match(/\.(mp4|mov|webm|mkv)$/i)) {
			setError("Please choose a video file (MP4, MOV, WebM).");
			return;
		}
		if (f.size > VIDEO_UPLOAD_MAX_BYTES) {
			setError(`Max upload ${VIDEO_UPLOAD_MAX_MB} MB.`);
			return;
		}
		setError("");
		setFile(f);
	};

	const reset = () => {
		abortRef.current?.abort();
		setBusy(false);
		setStatus("");
		setError("");
		setResult(null);
		setFile(null);
		setVideoUrl("");
	};

	const buildPayload = () => {
		const payload = {
			language: languageNameToApiCode(languageName),
			model,
		};
		if (prompt.trim()) payload.prompt = prompt.trim();
		if (clipCount !== "") payload.clip_count = Number(clipCount);
		if (maxClips !== "") payload.max_clips = Number(maxClips);
		if (minClipSec !== "") payload.min_clip_sec = Number(minClipSec);
		if (maxClipSec !== "") payload.max_clip_sec = Number(maxClipSec);
		if (targetAspect) payload.target_aspect = targetAspect;
		if (mode === "url") payload.video_url = videoUrl.trim();
		return payload;
	};

	const submit = async () => {
		if (busy) return;
		if (mode === "url" && (!videoUrl.trim() || getBlockedVideoUrlWarning(videoUrl))) return;
		if (mode === "file" && !file) return;
		if (requireAuthOnSubmit && !auth.currentUser) {
			onRequireAuth?.();
			return;
		}

		setBusy(true);
		setError("");
		setResult(null);
		try {
			const viralClipCutId = await startClipCutJob(buildPayload(), {
				file: mode === "file" ? file : null,
			});

			if (onJobCreated) {
				const groupId =
					typeof crypto !== "undefined" && crypto.randomUUID
						? crypto.randomUUID()
						: `grp_${Date.now()}`;
				const sourceUrl = mode === "url" ? videoUrl.trim() : null;
				onJobCreated({
					id: groupId,
					type: "clips",
					label: file?.name
						? `Clips · ${file.name}`
						: `Viral clips · ${languageName}`,
					sourceVideoUrl: sourceUrl,
					createdAt: new Date().toISOString(),
					jobs: [
						{
							id: viralClipCutId,
							viralClipCutId,
							lang: languageName,
							status: "queued",
							apiStatus: "pending",
							createdAt: new Date().toISOString(),
							sourceVideoUrl: sourceUrl,
							model,
							prompt: prompt.trim() || null,
							targetAspect: targetAspect || null,
						},
					],
				});
				setFile(null);
				setVideoUrl("");
				return;
			}

			setStatus("pending");
			const ac = new AbortController();
			abortRef.current = ac;
			const { pollClipCutJob } = await import("../videoToolsApi");
			const job = await pollClipCutJob(viralClipCutId, {
				signal: ac.signal,
				onStatus: (s) => setStatus(s),
			});
			setResult(job);
			setStatus("success");
		} catch (e) {
			if (e?.name === "AbortError") return;
			const msg = String(e?.message || "Clip generation failed");
			if (/INSUFFICIENT_CREDITS/i.test(msg) || e?.code === "INSUFFICIENT_CREDITS") {
				setError("Not enough credits — upgrade to continue.");
			} else {
				setError(msg);
			}
			setStatus("failed");
		} finally {
			setBusy(false);
		}
	};

	const resultJob = result ? extractClipJobFields(result) : null;
	const blockedUrlWarning =
		mode === "url" ? getBlockedVideoUrlWarning(videoUrl) : null;
	const canSubmitUrl = mode === "url" && videoUrl.trim() && !blockedUrlWarning;

	return (
		<div className="space-y-4">
			<p className="text-sm text-zinc-600">
				AI finds viral moments in a long video and cuts ready-to-post clips.
			</p>

			{!urlOnly && (
			<div className="flex gap-2 p-1 bg-zinc-100/80 border border-zinc-200/80 rounded-xl">
				{[
					{ id: "url", label: "Video URL" },
					{ id: "file", label: "Upload file" },
				].map(({ id, label }) => (
					<button
						key={id}
						type="button"
						onClick={() => setMode(id)}
						className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
							mode === id
								? "bg-white text-orange-700 border border-orange-200/60 shadow-sm"
								: "text-zinc-500 hover:text-zinc-700"
						}`}
					>
						{label}
					</button>
				))}
			</div>
			)}

			{mode === "url" ? (
				<div className="space-y-2">
					{workspaceVideos.length > 0 && !urlOnly && (
						<WorkspaceVideoPicker
							videos={workspaceVideos}
							value={videoUrl}
							onChange={(url) => {
								setVideoUrl(url);
								setUrlLocked(false);
							}}
							disabled={busy || urlLocked}
						/>
					)}
					<input
						type="url"
						placeholder="https://utfs.io/f/your-long-video.mp4"
						value={videoUrl}
						onChange={(e) => setVideoUrl(e.target.value)}
						disabled={busy || urlLocked}
						readOnly={urlLocked}
						className={inputClass}
					/>
					<BlockedUrlWarning message={blockedUrlWarning} />
				</div>
			) : (
				<div
					onDragOver={(e) => {
						e.preventDefault();
						setDrag(true);
					}}
					onDragLeave={() => setDrag(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDrag(false);
						pickFile(e.dataTransfer.files?.[0]);
					}}
					className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
						drag ? "border-orange-400 bg-orange-50/50" : "border-zinc-200 bg-zinc-50/50"
					}`}
				>
					<input
						ref={fileRef}
						type="file"
						accept="video/*,.mp4,.mov,.webm"
						className="hidden"
						onChange={(e) => pickFile(e.target.files?.[0])}
					/>
					{file ? (
						<div className="space-y-2">
							<p className="text-sm font-medium text-zinc-900">{file.name}</p>
							<p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
							<button
								type="button"
								onClick={() => setFile(null)}
								className="text-xs text-orange-600 hover:underline"
							>
								Remove
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							className="inline-flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-700"
						>
							<Upload className="w-8 h-8" />
							<span className="text-sm font-medium">Drop MP4 or click to upload</span>
							<span className="text-xs text-zinc-400">Up to ~30 min · {VIDEO_UPLOAD_MAX_MB} MB</span>
						</button>
					)}
				</div>
			)}

			<div>
				<label className="block text-xs font-medium text-zinc-500 mb-1">
					Viral context (optional)
				</label>
				<textarea
					rows={2}
					placeholder="e.g. Focus on hot takes and punchlines for TikTok"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					disabled={busy}
					className={`${inputClass} resize-none`}
				/>
			</div>

			<div className="grid sm:grid-cols-2 gap-3">
				<div>
					<label className="block text-xs font-medium text-zinc-500 mb-1">
						Clip count (optional)
					</label>
					<input
						type="number"
						min="1"
						max="10"
						placeholder="Auto"
						value={clipCount}
						onChange={(e) => setClipCount(e.target.value)}
						disabled={busy}
						className={inputClass}
					/>
					<p className="text-[11px] text-zinc-400 mt-1">
						Leave empty for auto (~1 clip per 2 min)
					</p>
				</div>
				<FormAnimatedDropdown
					label="Aspect ratio"
					value={targetAspect}
					onChange={setTargetAspect}
					options={CLIP_ASPECT_OPTIONS.map((a) => ({ value: a.id, label: a.label }))}
					placeholder="Auto / original"
					disabled={busy}
				/>
				<LangSingleSelect
					label="Language"
					value={languageName}
					onChange={setLanguageName}
					disabled={busy}
				/>
				<FormAnimatedDropdown
					label="Model"
					value={model}
					onChange={setModel}
					options={CAPTION_MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.label }))}
					disabled={busy}
				/>
			</div>

			<button
				type="button"
				onClick={() => setShowAdvanced((v) => !v)}
				className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
			>
				{showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
				Advanced clip settings
			</button>

			{showAdvanced && (
				<div className="grid sm:grid-cols-3 gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
					<div>
						<label className="block text-xs font-medium text-zinc-500 mb-1">Max clips</label>
						<input
							type="number"
							min="1"
							max="10"
							value={maxClips}
							onChange={(e) => setMaxClips(e.target.value)}
							disabled={busy}
							className={inputClass}
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-zinc-500 mb-1">Min clip (sec)</label>
						<input
							type="number"
							min="5"
							value={minClipSec}
							onChange={(e) => setMinClipSec(e.target.value)}
							disabled={busy}
							className={inputClass}
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-zinc-500 mb-1">Max clip (sec)</label>
						<input
							type="number"
							min="10"
							value={maxClipSec}
							onChange={(e) => setMaxClipSec(e.target.value)}
							disabled={busy}
							className={inputClass}
						/>
					</div>
				</div>
			)}

			{error && (
				<div className="flex items-start gap-2 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">
					<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
					{error}
				</div>
			)}

			{busy && status && (
				<div className="flex items-center gap-2 px-3 py-2.5 text-sm text-orange-800 bg-orange-50 border border-orange-100 rounded-xl">
					<Loader2 className="w-4 h-4 animate-spin shrink-0" />
					{CLIP_STATUS_LABELS[status] || status}
				</div>
			)}

			<div className="flex gap-2">
				<button
					type="button"
					onClick={submit}
					disabled={busy || (mode === "url" ? !canSubmitUrl : !file)}
					className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					{busy ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Processing…
						</>
					) : (
						<>
							<Scissors className="w-4 h-4" />
							Create viral clips
						</>
					)}
				</button>
				{(result || error) && (
					<button
						type="button"
						onClick={reset}
						className="px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50"
					>
						Reset
					</button>
				)}
			</div>

			{result && status === "success" && resultJob && (
				<div className="pt-2 border-t border-zinc-100">
					<ViralClipsJobResult job={resultJob} />
				</div>
			)}
		</div>
	);
}
