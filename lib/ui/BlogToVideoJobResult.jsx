import { useMemo, useState } from "react";
import { CheckCircle, Film, Download, ExternalLink } from "lucide-react";
import StudioVideoPlayer from "../../app/components/StudioVideoPlayer";
import VideoEditorCanvas from "./videoEditor/VideoEditorCanvas";
import VideoEditorModal from "./videoEditor/VideoEditorModal";

function DetailRow({ label, value }) {
	if (!value) return null;
	return (
		<div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm">
			<span className="text-zinc-500 shrink-0">{label}</span>
			<span className="text-zinc-800 font-medium break-all">{value}</span>
		</div>
	);
}

export default function BlogToVideoJobResult({ job, onEditorPersist }) {
	const [editorOpen, setEditorOpen] = useState(false);

	const hasEditor =
		job?.status === "done" &&
		((Array.isArray(job.editorFrames) && job.editorFrames.length) ||
			(Array.isArray(job.editorFramesStored) && job.editorFramesStored.length) ||
			job.videoEditorProjectId ||
			job.blogToVideoId);

	const frames = useMemo(
		() =>
			job?.editorFrames?.length
				? job.editorFrames
				: job?.editorFramesStored ?? [],
		[job?.editorFrames, job?.editorFramesStored],
	);

	const w = job?.editorProject?.width ?? job?.videoWidth ?? 1080;
	const h = job?.editorProject?.height ?? job?.videoHeight ?? 1920;
	const globalStyle = job?.globalStyle || job?.style || {};
	const previewFrame = frames[0] ?? null;
	const videoSrc = job?.resultUrl || null;

	if (hasEditor) {
		return (
			<>
				<div className="space-y-4 rounded-xl border border-orange-200/60 bg-gradient-to-b from-orange-50/80 to-white p-5">
					<div className="flex items-center gap-2 text-sm font-medium text-orange-700">
						<CheckCircle className="w-4 h-4" />
						Blog video ready
					</div>

					{videoSrc ? (
						<StudioVideoPlayer src={videoSrc} footerLabel="Exported video" />
					) : previewFrame ? (
						<div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950">
							<div className="h-[min(52vh,420px)]">
								<VideoEditorCanvas
									frame={previewFrame}
									globalStyle={globalStyle}
									projectWidth={w}
									projectHeight={h}
									fillContainer
									className="h-full w-full"
								/>
							</div>
							<p className="px-3 py-2 text-xs text-zinc-500 bg-white border-t border-zinc-100">
								Static preview — open the editor and press Play to preview all frames with
								audio, or export MP4.
							</p>
						</div>
					) : null}

					<div className="space-y-2 pt-1 border-t border-orange-100/80">
						<DetailRow label="Title" value={job?.title} />
						<DetailRow label="Source" value={job?.blogUrl} />
						<DetailRow
							label="Frames"
							value={
								frames.length
									? `${frames.length} · ${w}×${h}`
									: null
							}
						/>
						<DetailRow
							label="Theme"
							value={(globalStyle?.theme || "dark_blue").replace(/_/g, " ")}
						/>
						<DetailRow label="Voice" value={job?.ttsVoice} />
						<DetailRow label="Duration target" value={job?.targetDuration} />
					</div>

					<div className="flex flex-wrap gap-2 pt-1">
						<button
							type="button"
							onClick={() => setEditorOpen(true)}
							className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm shadow-orange-200/50"
						>
							<Film className="w-4 h-4" />
							Video editor
						</button>
						{videoSrc ? (
							<>
								<a
									href={videoSrc}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
								>
									<ExternalLink className="w-4 h-4" />
									Open
								</a>
								<a
									href={videoSrc}
									download
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
								>
									<Download className="w-4 h-4" />
									Download
								</a>
							</>
						) : null}
					</div>
				</div>

				<VideoEditorModal
					open={editorOpen}
					onClose={() => setEditorOpen(false)}
					projectId={job.videoEditorProjectId || job.blogToVideoId}
					initialProject={job.editorProject}
					initialFrames={frames}
					initialGlobalStyle={globalStyle}
					initialExportUrl={videoSrc?.startsWith("blob:") ? videoSrc : null}
					styleThemes={job.styleThemes ?? []}
					onPersist={onEditorPersist}
				/>
			</>
		);
	}

	return (
		<div className="space-y-3 py-6 text-center">
			<CheckCircle className="w-8 h-8 text-orange-600 mx-auto" />
			<p className="text-sm font-medium text-zinc-800">
				{job?.title || "Project ready"}
			</p>
			<p className="text-xs text-zinc-500">
				Frame data is loading — refresh or reopen this project in a moment.
			</p>
		</div>
	);
}
