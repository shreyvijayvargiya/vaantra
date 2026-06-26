import { Download, ExternalLink } from "lucide-react";
import StudioVideoPlayer from "./StudioVideoPlayer";
import VideoCaptionJobResult from "../../lib/ui/VideoCaptionJobResult";
import ViralClipsJobResult from "../../lib/ui/ViralClipsJobResult";

function TranscriptBlock({ title, text }) {
	if (!text?.trim()) return null;
	return (
		<div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
			<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
				{title}
			</p>
			<p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
				{text}
			</p>
		</div>
	);
}

function VideoTranslationResult({ job }) {
	return (
		<div className="space-y-5">
			<div className="rounded-2xl border border-orange-200/40 bg-gradient-to-b from-orange-50/70 to-white p-5">
				<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
					<p className="text-sm font-semibold text-zinc-700">
						Dubbed video · {job.outputLanguage || job.lang}
					</p>
					{job.resultUrl ? (
						<div className="flex flex-wrap gap-2">
							<a
								href={job.resultUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700"
							>
								<ExternalLink className="w-3.5 h-3.5" />
								Open
							</a>
							<a
								href={job.resultUrl}
								download
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
							>
								<Download className="w-3.5 h-3.5" />
								Download
							</a>
						</div>
					) : null}
				</div>
				{job.resultUrl ? (
					<StudioVideoPlayer src={job.resultUrl} footerLabel="Dubbed output" />
				) : (
					<p className="text-sm text-zinc-500">Video not available.</p>
				)}
			</div>
			<TranscriptBlock title="Translated transcript" text={job.translatedTranscript} />
			<TranscriptBlock title="Original transcript" text={job.transcriptOriginal} />
		</div>
	);
}

function AudioTranslationResult({ job }) {
	return (
		<div className="space-y-5">
			<div className="rounded-2xl border border-orange-200/40 bg-gradient-to-b from-orange-50/70 to-white p-5">
				<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
					<p className="text-sm font-semibold text-zinc-700">
						Translated audio · {job.outputLanguage || job.lang}
					</p>
					{job.resultUrl ? (
						<a
							href={job.resultUrl}
							download
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700"
						>
							<Download className="w-3.5 h-3.5" />
							Download
						</a>
					) : null}
				</div>
				{job.resultUrl ? (
					<audio controls className="w-full" src={job.resultUrl} preload="metadata" />
				) : (
					<p className="text-sm text-zinc-500">Audio not available.</p>
				)}
			</div>
			<TranscriptBlock title="Translated transcript" text={job.translatedTranscript} />
			<TranscriptBlock title="Original transcript" text={job.transcriptOriginal} />
		</div>
	);
}

export default function PublicShareJobResult({ type, job }) {
	if (!job) return null;

	if (type === "caption") return <VideoCaptionJobResult job={job} />;
	if (type === "clips") return <ViralClipsJobResult job={job} />;
	if (type === "audio" || String(job.id).startsWith("voice_")) {
		return <AudioTranslationResult job={job} />;
	}
	return <VideoTranslationResult job={job} />;
}
