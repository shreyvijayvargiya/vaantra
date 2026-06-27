import { CheckCircle, Download, ExternalLink } from "lucide-react";
import StudioVideoPlayer from "../../app/components/StudioVideoPlayer";

function DetailBlock({ title, children }) {
	if (!children) return null;
	return (
		<details className="border border-zinc-200 rounded-xl overflow-hidden">
			<summary className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer bg-zinc-50">
				{title}
			</summary>
			<div className="px-3 py-3 text-sm text-zinc-700">{children}</div>
		</details>
	);
}

export default function BlogToVideoJobResult({ job }) {
	const videoUrl = job?.resultUrl || job?.sourceVideoUrl;
	const isAudioOnly =
		!job?.sourceVideoUrl &&
		job?.audioUrl &&
		/\.(mp3|wav|m4a|ogg)(\?|$)/i.test(String(job.audioUrl));

	return (
		<div className="space-y-5">
			<div className="flex items-center gap-2 text-sm font-medium text-orange-700">
				<CheckCircle className="w-4 h-4" />
				{job?.title || "Blog video ready"}
			</div>

			{job?.summary ? (
				<p className="text-sm text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-xl p-3">
					{job.summary}
				</p>
			) : null}

			{videoUrl && !isAudioOnly ? (
				<div className="rounded-2xl border border-orange-200/40 bg-gradient-to-b from-orange-50/70 to-white p-4">
					<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
						<p className="text-sm font-semibold text-zinc-700">Generated video</p>
						<div className="flex gap-2">
							<a
								href={videoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700"
							>
								<ExternalLink className="w-3.5 h-3.5" />
								Open
							</a>
							<a
								href={videoUrl}
								download
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
							>
								<Download className="w-3.5 h-3.5" />
								Download
							</a>
						</div>
					</div>
					<StudioVideoPlayer src={videoUrl} footerLabel="Blog video" />
				</div>
			) : job?.audioUrl ? (
				<div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
					<p className="text-xs font-semibold text-zinc-500 mb-2">Generated audio</p>
					<audio controls className="w-full" src={job.audioUrl} preload="metadata" />
				</div>
			) : null}

			{job?.targetAudience ? (
				<div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
					<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
						Target audience
					</p>
					<p className="text-sm text-zinc-700">{job.targetAudience}</p>
				</div>
			) : null}

			{job?.script ? (
				<div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
					<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
						Script
					</p>
					<p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
						{job.script}
					</p>
				</div>
			) : null}

			{job?.segments?.length ? (
				<DetailBlock title={`Narration segments (${job.segments.length})`}>
					<ol className="list-decimal pl-4 space-y-2">
						{job.segments.map((seg, i) => (
							<li key={i} className="text-sm">
								{typeof seg === "string"
									? seg
									: seg?.text || seg?.narration || JSON.stringify(seg)}
							</li>
						))}
					</ol>
				</DetailBlock>
			) : null}

			{job?.captions?.length ? (
				<DetailBlock title={`Captions (${job.captions.length})`}>
					<pre className="text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
						{JSON.stringify(job.captions, null, 2)}
					</pre>
				</DetailBlock>
			) : null}

			{job?.scenes ? (
				<DetailBlock title="Scenes / render plan">
					<pre className="text-xs whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
						{JSON.stringify(job.scenes ?? job.renderPlan, null, 2)}
					</pre>
				</DetailBlock>
			) : null}

			{job?.style ? (
				<DetailBlock title="Applied video style">
					<pre className="text-xs whitespace-pre-wrap font-mono max-h-56 overflow-y-auto">
						{JSON.stringify(job.style, null, 2)}
					</pre>
				</DetailBlock>
			) : null}

			{job?.blogUrl ? (
				<p className="text-xs text-zinc-400 break-all">
					Source:{" "}
					<a
						href={job.blogUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-orange-600 hover:underline"
					>
						{job.blogUrl}
					</a>
				</p>
			) : null}
		</div>
	);
}
