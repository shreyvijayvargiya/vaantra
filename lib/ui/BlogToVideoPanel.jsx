import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle, FileText, Palette } from "lucide-react";
import {
	startBlogToVideoJob,
	CAPTION_MODEL_OPTIONS,
	BLOG_TTS_VOICE_OPTIONS,
} from "../videoToolsApi";
import { auth } from "../config/firebase";
import FormAnimatedDropdown from "./FormAnimatedDropdown";
import LangSingleSelect from "./LangSingleSelect";
import BlogVideoStyleModal from "./BlogVideoStyleModal";
import {
	createEmptyBlogStyleForm,
	buildBlogStylePayload,
} from "../utils/blogVideoStyle";
import { languageNameToApiCode } from "../utils/languages";

const inputClass =
	"w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 shadow-sm";

function isHttpUrl(s) {
	try {
		const u = new URL(String(s).trim());
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

export default function BlogToVideoPanel({
	requireAuthOnSubmit,
	onRequireAuth,
	onJobCreated,
}) {
	const [mode, setMode] = useState("url");
	const [blogUrl, setBlogUrl] = useState("");
	const [content, setContent] = useState("");
	const [languageName, setLanguageName] = useState("English");
	const [targetDuration, setTargetDuration] = useState(60);
	const [model, setModel] = useState("gemini");
	const [ttsVoice, setTtsVoice] = useState("Puck");
	const [aspect, setAspect] = useState("16:9");
	const [styleForm, setStyleForm] = useState(() => createEmptyBlogStyleForm());
	const [styleModalOpen, setStyleModalOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const abortRef = useRef(null);

	const startMutation = useMutation({
		mutationFn: startBlogToVideoJob,
	});

	useEffect(() => {
		return () => abortRef.current?.abort();
	}, []);

	const submit = async () => {
		if (busy || startMutation.isPending) return;
		if (mode === "url" && !isHttpUrl(blogUrl)) {
			setError("Enter a valid blog URL (https://…).");
			return;
		}
		if (mode === "content" && !content.trim()) {
			setError("Paste article content or switch to URL mode.");
			return;
		}
		if (requireAuthOnSubmit && !auth.currentUser) {
			onRequireAuth?.();
			return;
		}

		setBusy(true);
		setError("");
		try {
			const payload = {
				target_duration: Number(targetDuration) || 60,
				language: languageNameToApiCode(languageName),
				model,
				tts_voice: ttsVoice,
				aspect,
				style: buildBlogStylePayload(styleForm),
			};
			if (mode === "url") payload.url = blogUrl.trim();
			else payload.content = content.trim();

			const blogToVideoId = await startMutation.mutateAsync(payload);

			if (onJobCreated) {
				const groupId =
					typeof crypto !== "undefined" && crypto.randomUUID
						? crypto.randomUUID()
						: `grp_${Date.now()}`;
				const labelSource =
					mode === "url"
						? (() => {
								try {
									return new URL(blogUrl.trim()).hostname;
								} catch {
									return "Blog";
								}
							})()
						: "Article";
				onJobCreated({
					id: groupId,
					type: "blog",
					label: `Blog video · ${labelSource}`,
					blogUrl: mode === "url" ? blogUrl.trim() : null,
					createdAt: new Date().toISOString(),
					jobs: [
						{
							id: blogToVideoId,
							blogToVideoId,
							lang: languageName,
							status: "queued",
							apiStatus: "pending",
							createdAt: new Date().toISOString(),
							blogUrl: mode === "url" ? blogUrl.trim() : null,
							targetDuration: Number(targetDuration) || 60,
							model,
							ttsVoice,
							aspect,
							style: payload.style,
						},
					],
				});
				setBlogUrl("");
				setContent("");
				return;
			}
		} catch (e) {
			if (e?.name === "AbortError") return;
			const msg = String(e?.message || "Blog-to-video failed");
			if (/INSUFFICIENT_CREDITS/i.test(msg) || e?.code === "INSUFFICIENT_CREDITS") {
				setError("Not enough credits — upgrade to continue.");
			} else if (e?.status === 401 || e?.status === 403) {
				setError(msg);
			} else {
				setError(msg);
			}
		} finally {
			setBusy(false);
		}
	};

	const submitting = busy || startMutation.isPending;
	const canSubmit =
		mode === "url" ? isHttpUrl(blogUrl) : Boolean(content.trim());

	return (
		<div className="space-y-4">
			<p className="text-sm text-zinc-600">
				Turn a blog post into a narrated video — paste a URL or raw article text.
			</p>

			<div className="flex gap-2 p-1 bg-zinc-100/80 border border-zinc-200/80 rounded-xl">
				{[
					{ id: "url", label: "Blog URL" },
					{ id: "content", label: "Paste content" },
				].map(({ id, label }) => (
					<button
						key={id}
						type="button"
						onClick={() => {
							setMode(id);
							setError("");
						}}
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
				<input
					type="url"
					placeholder="https://example.com/blog-post"
					value={blogUrl}
					onChange={(e) => setBlogUrl(e.target.value)}
					disabled={submitting}
					className={inputClass}
				/>
			) : (
				<textarea
					rows={5}
					placeholder="Paste article markdown or plain text (skips scrape — for testing)"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					disabled={submitting}
					className={`${inputClass} resize-y min-h-[120px]`}
				/>
			)}

			<div className="grid sm:grid-cols-2 gap-3">
				<LangSingleSelect
					label="Narration language"
					value={languageName}
					onChange={setLanguageName}
					disabled={submitting}
				/>
				<div>
					<label className="block text-xs font-medium text-zinc-500 mb-1">
						Target duration (sec)
					</label>
					<input
						type="number"
						min={15}
						max={600}
						value={targetDuration}
						onChange={(e) => setTargetDuration(Number(e.target.value))}
						disabled={submitting}
						className={inputClass}
					/>
				</div>
				<FormAnimatedDropdown
					label="Model"
					value={model}
					onChange={setModel}
					options={CAPTION_MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.label }))}
					disabled={submitting}
				/>
				<FormAnimatedDropdown
					label="TTS voice"
					value={ttsVoice}
					onChange={setTtsVoice}
					options={BLOG_TTS_VOICE_OPTIONS}
					disabled={submitting}
				/>
			</div>

			<button
				type="button"
				onClick={() => setStyleModalOpen(true)}
				disabled={submitting}
				className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200/80 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 transition-colors"
			>
				<span className="inline-flex items-center gap-2">
					<Palette className="w-4 h-4 text-orange-600" />
					Video style
				</span>
				<span className="text-xs font-normal text-zinc-500 capitalize truncate max-w-[50%]">
					{aspect} · {styleForm.theme.replace(/_/g, " ")}
				</span>
			</button>

			<BlogVideoStyleModal
				open={styleModalOpen}
				onClose={() => setStyleModalOpen(false)}
				value={styleForm}
				onChange={setStyleForm}
				aspect={aspect}
				onAspectChange={setAspect}
			/>

			{error && (
				<div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
					<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
					{error}
				</div>
			)}

			<button
				type="button"
				onClick={() => void submit()}
				disabled={submitting || !canSubmit}
				className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
			>
				{submitting ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						Starting…
					</>
				) : (
					<>
						<FileText className="w-4 h-4" />
						Generate video from blog
					</>
				)}
			</button>
		</div>
	);
}
