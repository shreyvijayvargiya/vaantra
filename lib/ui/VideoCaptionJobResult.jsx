import { CheckCircle, Download } from "lucide-react";
import { formatMsRange } from "../videoToolsApi";

export default function VideoCaptionJobResult({ job }) {
	const videoSrc = job?.resultUrl || null;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-sm font-medium text-orange-700">
				<CheckCircle className="w-4 h-4" />
				Captions ready
			</div>

			{videoSrc ? (
				<video
					src={videoSrc}
					controls
					className="w-full rounded-xl border border-zinc-200 bg-black max-h-80"
				/>
			) : null}

			<div className="flex flex-wrap gap-2">
				{videoSrc ? (
					<a
						href={videoSrc}
						download
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
					>
						<Download className="w-3.5 h-3.5" />
						Captioned MP4
					</a>
				) : null}
				{job?.captionUrl ? (
					<a
						href={job.captionUrl}
						download
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
					>
						<Download className="w-3.5 h-3.5" />
						VTT
					</a>
				) : null}
				{job?.srtUrl ? (
					<a
						href={job.srtUrl}
						download
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
					>
						<Download className="w-3.5 h-3.5" />
						SRT
					</a>
				) : null}
			</div>

			{(job?.transcript || job?.caption) && (
				<div>
					<p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Transcript</p>
					<p className="text-sm text-zinc-700 whitespace-pre-wrap bg-zinc-50 border border-zinc-100 rounded-xl p-3 max-h-40 overflow-y-auto">
						{job.transcript || job.caption}
					</p>
				</div>
			)}

			{Array.isArray(job?.timedCaptions) && job.timedCaptions.length > 0 && (
				<div>
					<p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
						Timed captions
					</p>
					<ul className="space-y-1.5 max-h-48 overflow-y-auto text-sm">
						{job.timedCaptions.map((c, i) => (
							<li
								key={i}
								className="flex gap-2 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl"
							>
								<span className="text-xs text-zinc-400 shrink-0 font-mono">
									{formatMsRange(c.start_ms, c.end_ms)}
								</span>
								<span className="text-zinc-700">{c.text}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
