import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Download, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import VideoEditorFrameList from "./VideoEditorFrameList";
import VideoEditorInspector from "./VideoEditorInspector";
import VideoEditorPreviewPlayer from "./VideoEditorPreviewPlayer";
import { useFramePlayback } from "./useFramePlayback";
import {
	exportVideoEditorMp4,
	getVideoEditorProject,
	reorderFramesWithTiming,
	stripFramesForStorage,
} from "../../videoEditorApi";

const PERSIST_DEBOUNCE_MS = 500;

function EditorLayout({
	project,
	frames,
	globalStyle,
	selectedFrame,
	selectedFrameId,
	styleApplyMode,
	playing,
	playingFrameId,
	projectWidth,
	projectHeight,
	error,
	exporting,
	exportUrl,
	onSelectFrame,
	onReorder,
	onUpdateFrame,
	onUpdateGlobalStyle,
	onStyleApplyModeChange,
	onExport,
	onTogglePlay,
	onStop,
	embedded = false,
}) {
	return (
		<div
			className={`flex flex-col min-h-0 ${embedded ? "h-full" : "flex-1 max-h-[92vh]"}`}
		>
			<div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-zinc-200 shrink-0 bg-white">
				<div className="min-w-0">
					<h2 className="text-base font-bold text-zinc-900 truncate">
						{project?.title || "Video editor"}
					</h2>
					<p className="text-xs text-zinc-500 mt-0.5">
						{frames.length} frames · {projectWidth}×{projectHeight} ·{" "}
						{globalStyle?.theme ?? "dark_blue"}
					</p>
				</div>
				<button
					type="button"
					onClick={() => void onExport()}
					disabled={exporting || !frames.length}
					className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-50"
				>
					{exporting ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Download className="w-4 h-4" />
					)}
					Export MP4
				</button>
			</div>

			{error ? (
				<div className="mx-4 mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 shrink-0">
					<AlertCircle className="w-4 h-4 shrink-0" />
					{error}
				</div>
			) : null}

			<div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
				<div className="lg:w-[min(100%,400px)] xl:w-[420px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-200 min-h-0 max-h-[45vh] lg:max-h-none">
					<div className="p-4 space-y-4 overflow-y-auto flex-1">
						<VideoEditorFrameList
							frames={frames}
							selectedFrameId={selectedFrameId}
							playingFrameId={playingFrameId}
							onSelectFrame={onSelectFrame}
							onReorder={onReorder}
						/>
						<VideoEditorInspector
							frame={selectedFrame}
							globalStyle={globalStyle}
							onUpdateFrame={onUpdateFrame}
							onUpdateGlobalStyle={onUpdateGlobalStyle}
							styleApplyMode={styleApplyMode}
							onStyleApplyModeChange={onStyleApplyModeChange}
							flat
						/>
					</div>
				</div>

				<div className="flex-1 flex flex-col min-h-0 bg-zinc-100/80 p-4 sm:p-6">
					<VideoEditorPreviewPlayer
						frames={frames}
						globalStyle={globalStyle}
						projectWidth={projectWidth}
						projectHeight={projectHeight}
						selectedFrameId={selectedFrameId}
						playing={playing}
						playingFrameId={playingFrameId}
						exportVideoUrl={exportUrl}
						onTogglePlay={onTogglePlay}
						onStop={onStop}
					/>
				</div>
			</div>
		</div>
	);
}

function seedEditorState({
	initialProject,
	initialFrames,
	initialGlobalStyle,
	initialExportUrl,
}) {
	return {
		project: initialProject ?? null,
		frames: initialFrames?.length ? reorderFramesWithTiming(initialFrames) : [],
		globalStyle: initialGlobalStyle && Object.keys(initialGlobalStyle).length
			? initialGlobalStyle
			: {},
		selectedFrameId: initialFrames?.[0]?.id ?? null,
		exportUrl: initialExportUrl ?? null,
	};
}

export default function VideoEditorModal({
	open,
	onClose,
	projectId,
	initialProject,
	initialFrames = [],
	initialGlobalStyle = {},
	initialExportUrl = null,
	onPersist,
	embedded = false,
}) {
	const [project, setProject] = useState(initialProject);
	const [frames, setFrames] = useState(() => reorderFramesWithTiming(initialFrames));
	const [globalStyle, setGlobalStyle] = useState(initialGlobalStyle || {});
	const [selectedFrameId, setSelectedFrameId] = useState(initialFrames[0]?.id ?? null);
	const [styleApplyMode, setStyleApplyMode] = useState("global");
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [exportUrl, setExportUrl] = useState(initialExportUrl);
	const [error, setError] = useState("");

	const sessionKeyRef = useRef(null);
	const persistTimerRef = useRef(null);
	const wasActiveRef = useRef(false);
	const latestPersistRef = useRef({ frames, globalStyle, project });

	const isActive = open || embedded;

	useEffect(() => {
		latestPersistRef.current = { frames, globalStyle, project };
	}, [frames, globalStyle, project]);

	const selectedFrame = useMemo(
		() => frames.find((f) => f.id === selectedFrameId) ?? frames[0] ?? null,
		[frames, selectedFrameId],
	);

	const projectWidth = project?.width ?? 1080;
	const projectHeight = project?.height ?? 1920;

	const { playing, playingFrameId, togglePlay, stop } = useFramePlayback({
		frames,
		selectedFrameId,
		onSelectFrame: setSelectedFrameId,
	});

	const flushPersist = useCallback(() => {
		if (!onPersist) return;
		const { frames: f, globalStyle: g, project: p } = latestPersistRef.current;
		onPersist({
			editorFrames: f,
			editorFramesStored: stripFramesForStorage(f),
			globalStyle: g,
			editorProject: p,
		});
	}, [onPersist]);

	const schedulePersist = useCallback(
		(nextFrames, nextGlobalStyle, nextProject) => {
			latestPersistRef.current = {
				frames: nextFrames,
				globalStyle: nextGlobalStyle,
				project: nextProject,
			};
			if (!onPersist) return;
			if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
			persistTimerRef.current = setTimeout(flushPersist, PERSIST_DEBOUNCE_MS);
		},
		[onPersist, flushPersist],
	);

	// Seed local state once per open session — never re-sync from parent props while editing.
	useEffect(() => {
		if (!isActive) {
			sessionKeyRef.current = null;
			if (persistTimerRef.current) {
				clearTimeout(persistTimerRef.current);
				persistTimerRef.current = null;
			}
			return;
		}

		const sessionKey = `${embedded ? "embedded" : "modal"}:${projectId ?? "local"}`;
		if (sessionKeyRef.current === sessionKey) return;
		sessionKeyRef.current = sessionKey;

		const seeded = seedEditorState({
			initialProject,
			initialFrames,
			initialGlobalStyle,
			initialExportUrl,
		});
		setProject(seeded.project);
		setFrames(seeded.frames);
		setGlobalStyle(seeded.globalStyle);
		setSelectedFrameId(seeded.selectedFrameId);
		setExportUrl(seeded.exportUrl);
		setError("");
		// eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per session only
	}, [isActive, projectId, embedded]);

	useEffect(() => {
		if (!isActive) stop();
	}, [isActive, stop]);

	useEffect(
		() => () => {
			if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
		},
		[],
	);

	useEffect(() => {
		if (isActive) {
			wasActiveRef.current = true;
			return;
		}
		if (wasActiveRef.current) {
			wasActiveRef.current = false;
			flushPersist();
		}
	}, [isActive, flushPersist]);

	// Fetch full project (incl. audio) once per session — merge audio without resetting edits.
	useEffect(() => {
		if (!projectId || !isActive) return;
		let cancelled = false;
		setLoading(true);
		void getVideoEditorProject(projectId)
			.then((data) => {
				if (cancelled || !data) return;
				if (data.project) setProject((p) => p ?? data.project);
				if (Array.isArray(data.frames) && data.frames.length) {
					setFrames((prev) => {
						if (!prev.length) return reorderFramesWithTiming(data.frames);
						return prev.map((f) => {
							if (f?.audio?.data_base64) return f;
							const apiFrame = data.frames.find((af) => af.id === f.id);
							if (!apiFrame?.audio?.data_base64) return f;
							return { ...f, audio: apiFrame.audio };
						});
					});
					setSelectedFrameId((id) => id || data.frames[0]?.id);
				}
				if (data.global_style) {
					setGlobalStyle((prev) =>
						prev && Object.keys(prev).length ? prev : data.global_style,
					);
				}
			})
			.catch((e) => {
				if (!cancelled) setError(e?.message || "Could not load project");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [projectId, isActive]);

	useEffect(() => {
		if (!isActive) return;
		const onKey = (e) => {
			if (e.key === "Escape" && !embedded) onClose?.();
		};
		document.addEventListener("keydown", onKey);
		if (open && !embedded) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.removeEventListener("keydown", onKey);
				document.body.style.overflow = prev;
			};
		}
		return () => document.removeEventListener("keydown", onKey);
	}, [open, embedded, isActive, onClose]);

	const updateFrame = useCallback(
		(id, patch) => {
			setFrames((prev) => {
				const next = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
				schedulePersist(next, globalStyle, project);
				return next;
			});
		},
		[globalStyle, project, schedulePersist],
	);

	const updateGlobalStyle = useCallback(
		(nextStyle) => {
			setGlobalStyle(nextStyle);
			if (styleApplyMode === "global") {
				setFrames((prev) => {
					const next = prev.map((f) => ({
						...f,
						style: {
							...f.style,
							background: nextStyle.background
								? { ...f.style?.background, ...nextStyle.background }
								: f.style?.background,
						},
					}));
					schedulePersist(next, nextStyle, project);
					return next;
				});
			} else {
				schedulePersist(frames, nextStyle, project);
			}
		},
		[styleApplyMode, frames, project, schedulePersist],
	);

	const handleReorder = useCallback(
		(reordered) => {
			const next = reorderFramesWithTiming(reordered);
			setFrames(next);
			schedulePersist(next, globalStyle, project);
		},
		[globalStyle, project, schedulePersist],
	);

	const handleExport = async () => {
		setExporting(true);
		setError("");
		stop();
		try {
			const { blob } = await exportVideoEditorMp4({
				project: {
					width: projectWidth,
					height: projectHeight,
					fps: project?.fps ?? 30,
				},
				frames,
				global_style: globalStyle,
			});
			const url = URL.createObjectURL(blob);
			if (exportUrl?.startsWith("blob:")) URL.revokeObjectURL(exportUrl);
			setExportUrl(url);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${project?.title || "video-editor-export"}.mp4`;
			a.click();
			toast.success("MP4 exported");
			onPersist?.({ resultUrl: url, exportBlobReady: true });
		} catch (e) {
			const msg = e?.message || "Export failed";
			setError(msg);
			toast.error(msg);
		} finally {
			setExporting(false);
		}
	};

	const handleTogglePlay = useCallback(() => {
		void togglePlay(selectedFrameId);
	}, [togglePlay, selectedFrameId]);

	const handleStop = useCallback(() => {
		stop();
	}, [stop]);

	const editorBody =
		loading && !frames.length ? (
			<div className="flex items-center justify-center gap-2 py-20 text-zinc-500">
				<Loader2 className="w-5 h-5 animate-spin text-orange-600" />
				Loading editor…
			</div>
		) : (
			<EditorLayout
				project={project}
				frames={frames}
				globalStyle={globalStyle}
				selectedFrame={selectedFrame}
				selectedFrameId={selectedFrameId}
				styleApplyMode={styleApplyMode}
				playing={playing}
				playingFrameId={playingFrameId}
				projectWidth={projectWidth}
				projectHeight={projectHeight}
				error={error}
				exporting={exporting}
				exportUrl={exportUrl}
				onSelectFrame={setSelectedFrameId}
				onReorder={handleReorder}
				onUpdateFrame={updateFrame}
				onUpdateGlobalStyle={updateGlobalStyle}
				onStyleApplyModeChange={setStyleApplyMode}
				onExport={handleExport}
				onTogglePlay={handleTogglePlay}
				onStop={handleStop}
				embedded={embedded}
			/>
		);

	if (embedded) {
		return (
			<div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm h-[min(88vh,820px)] flex flex-col">
				{editorBody}
			</div>
		);
	}

	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
					onClick={onClose}
					role="dialog"
					aria-modal="true"
				>
					<motion.div
						initial={{ scale: 0.96, opacity: 0, y: 16 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.96, opacity: 0, y: 16 }}
						transition={{ type: "spring", damping: 26, stiffness: 320 }}
						onClick={(e) => e.stopPropagation()}
						className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden"
					>
						<button
							type="button"
							onClick={onClose}
							className="absolute top-3 right-3 z-10 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 bg-white/90"
							aria-label="Close editor"
						>
							<X className="w-5 h-5" />
						</button>
						{editorBody}
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
