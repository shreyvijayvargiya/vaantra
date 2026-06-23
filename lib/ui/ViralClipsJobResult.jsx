import { CheckCircle, Download } from "lucide-react";
import { formatMsRange } from "../videoToolsApi";

export default function ViralClipsJobResult({ job }) {
	const clips = job?.clips ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-sm font-medium text-orange-700">
				<CheckCircle className="w-4 h-4" />
				{clips.length} clip{clips.length !== 1 ? "s" : ""} ready
			</div>

			{job?.summary ? (
				<p className="text-sm text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-xl p-3">
					{job.summary}
				</p>
			) : null}

			{clips.length === 0 ? (
				<p className="text-sm text-zinc-500">No clips returned.</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{clips.map((clip) => {
						const src = clip.videoUrl || clip.video_url;
						return (
							<div
								key={clip.index ?? src}
								className="border border-zinc-200 rounded-xl overflow-hidden bg-white"
							>
								{src ? (
									<video
										src={src}
										controls
										className="w-full aspect-video bg-black object-contain"
									/>
								) : null}
								<div className="p-3 space-y-1.5">
									<p className="text-sm font-semibold text-zinc-900">{clip.title}</p>
									{clip.hook ? (
										<p className="text-xs text-orange-700 font-medium">{clip.hook}</p>
									) : null}
									{clip.reason ? (
										<p className="text-xs text-zinc-500">{clip.reason}</p>
									) : null}
									<div className="flex items-center justify-between gap-2 pt-1">
										<span className="text-[11px] text-zinc-400 font-mono">
											{formatMsRange(clip.start_ms, clip.end_ms)}
											{clip.virality_score != null ? (
												<span className="ml-2 text-orange-600">
													· {Math.round(clip.virality_score * 100)}% viral
												</span>
											) : null}
										</span>
										{src ? (
											<a
												href={src}
												download
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50"
											>
												<Download className="w-3 h-3" />
												Download
											</a>
										) : null}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{job?.transcript ? (
				<details className="border border-zinc-200 rounded-xl overflow-hidden">
					<summary className="px-3 py-2.5 text-xs font-medium text-zinc-600 cursor-pointer bg-zinc-50">
						Full transcript
					</summary>
					<p className="px-3 py-3 text-sm text-zinc-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
						{job.transcript}
					</p>
				</details>
			) : null}
		</div>
	);
}
