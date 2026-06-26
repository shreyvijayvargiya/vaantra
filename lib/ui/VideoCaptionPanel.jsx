import { useState, useRef, useEffect } from "react";
import {
	Upload,
	Loader2,
	AlertCircle,
} from "lucide-react";
import {
	startCaptionJob,
	CAPTION_MODEL_OPTIONS,
	CAPTION_STATUS_LABELS,
} from "../videoToolsApi";
import { auth } from "../config/firebase";
import FormAnimatedDropdown from "./FormAnimatedDropdown";
import LangSingleSelect from "./LangSingleSelect";
import { languageNameToApiCode } from "../utils/languages";
import VideoCaptionJobResult from "./VideoCaptionJobResult";
import { extractCaptionJobFields } from "../videoToolsJob";
import { getBlockedVideoUrlWarning } from "../utils/blockedVideoUrl";
import BlockedUrlWarning from "./BlockedUrlWarning";

const CAPTION_STYLE_OPTIONS = [
	{ value: "bottom", label: "Bottom" },
	{ value: "top", label: "Top" },
];

const VIDEO_UPLOAD_MAX_MB = 500;
const VIDEO_UPLOAD_MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024;

const inputClass =
	"w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 shadow-sm";

export default function VideoCaptionPanel({
	requireAuthOnSubmit,
	onRequireAuth,
	onJobCreated,
}) {
	const [mode, setMode] = useState("url");
	const [videoUrl, setVideoUrl] = useState("");
	const [file, setFile] = useState(null);
	const [languageName, setLanguageName] = useState("English");
	const [captionStyle, setCaptionStyle] = useState("bottom");
	const [burnCaptions, setBurnCaptions] = useState(true);
	const [model, setModel] = useState("gemini");
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
			const payload = {
				language: languageNameToApiCode(languageName),
				burn_captions: burnCaptions,
				caption_style: captionStyle,
				model,
			};
			if (mode === "url") payload.video_url = videoUrl.trim();

			const videoCaptionId = await startCaptionJob(payload, {
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
					type: "caption",
					label: file?.name
						? `Captions · ${file.name}`
						: `Captions · ${languageName}`,
					sourceVideoUrl: sourceUrl,
					createdAt: new Date().toISOString(),
					jobs: [
						{
							id: videoCaptionId,
							videoCaptionId,
							lang: languageName,
							status: "queued",
							apiStatus: "pending",
							createdAt: new Date().toISOString(),
							sourceVideoUrl: sourceUrl,
							burnCaptions,
							captionStyle,
							model,
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
			const { pollCaptionJob } = await import("../videoToolsApi");
			const job = await pollCaptionJob(videoCaptionId, {
				signal: ac.signal,
				onStatus: (s) => setStatus(s),
			});
			setResult(job);
			setStatus("success");
		} catch (e) {
			if (e?.name === "AbortError") return;
			const msg = String(e?.message || "Caption generation failed");
			if (/INSUFFICIENT_CREDITS/i.test(msg) || e?.code === "INSUFFICIENT_CREDITS") {
				setError("Not enough credits — upgrade to continue.");
			} else if (e?.status === 401 || e?.status === 403) {
				setError(msg);
			} else {
				setError(msg);
			}
			setStatus("failed");
		} finally {
			setBusy(false);
		}
	};

	const resultJob = result ? extractCaptionJobFields(result) : null;
	const blockedUrlWarning =
		mode === "url" ? getBlockedVideoUrlWarning(videoUrl) : null;
	const canSubmitUrl = mode === "url" && videoUrl.trim() && !blockedUrlWarning;

	return (
		<div className="space-y-4">
			<p className="text-sm text-zinc-600">
				Upload a video or paste a URL — AI transcribes and burns captions into your video.
			</p>

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

			{mode === "url" ? (
				<div className="space-y-2">
					<input
						type="url"
						placeholder="https://utfs.io/f/your-video.mp4"
						value={videoUrl}
						onChange={(e) => setVideoUrl(e.target.value)}
						disabled={busy}
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
							<span className="text-xs text-zinc-400">Max ~10 min · {VIDEO_UPLOAD_MAX_MB} MB</span>
						</button>
					)}
				</div>
			)}

			<div className="grid sm:grid-cols-2 gap-3">
				<LangSingleSelect
					label="Language"
					value={languageName}
					onChange={setLanguageName}
					disabled={busy}
				/>
				<FormAnimatedDropdown
					label="Caption position"
					value={captionStyle}
					onChange={setCaptionStyle}
					options={CAPTION_STYLE_OPTIONS}
					disabled={busy}
				/>
				<FormAnimatedDropdown
					label="Model"
					value={model}
					onChange={setModel}
					options={CAPTION_MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.label }))}
					disabled={busy}
				/>
				<label className="flex items-center gap-2 pt-6 text-sm text-zinc-700 cursor-pointer">
					<input
						type="checkbox"
						checked={burnCaptions}
						onChange={(e) => setBurnCaptions(e.target.checked)}
						disabled={busy}
						className="rounded border-zinc-300 text-orange-600 focus:ring-orange-200"
					/>
					Burn captions into video
				</label>
			</div>

			{error && (
				<div className="flex items-start gap-2 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">
					<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
					{error}
				</div>
			)}

			{busy && status && (
				<div className="flex items-center gap-2 px-3 py-2.5 text-sm text-orange-800 bg-orange-50 border border-orange-100 rounded-xl">
					<Loader2 className="w-4 h-4 animate-spin shrink-0" />
					{CAPTION_STATUS_LABELS[status] || status}
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
						"Generate captions"
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
					<VideoCaptionJobResult job={resultJob} />
				</div>
			)}
		</div>
	);
}
