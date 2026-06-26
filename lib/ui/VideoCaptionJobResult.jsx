import { useState, useCallback } from "react";
import { CheckCircle, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { formatMsRange } from "../videoToolsApi";

async function copyText(text, label = "Copied") {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(`${label} copied`);
		return true;
	} catch {
		toast.error("Failed to copy");
		return false;
	}
}

function CopyButton({ text, label = "Copy", className = "" }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		const ok = await copyText(text, label);
		if (ok) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [text, label]);

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
				copied
					? "border-green-200 bg-green-50 text-green-700"
					: "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
			} ${className}`}
		>
			{copied ? (
				<Check className="w-3 h-3" aria-hidden />
			) : (
				<Copy className="w-3 h-3" aria-hidden />
			)}
			{copied ? "Copied" : label}
		</button>
	);
}

function CopyableBlock({ title, text, copyLabel }) {
	if (!text?.trim()) return null;

	return (
		<div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
			<div className="flex items-center justify-between gap-2 mb-2">
				<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
					{title}
				</p>
				<CopyButton text={text} label={copyLabel || "Copy"} />
			</div>
			<p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
				{text}
			</p>
		</div>
	);
}

function CopyableList({ title, items, numbered = true }) {
	if (!items?.length) return null;

	const allText = items.join("\n");

	return (
		<div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
					{title}
					<span className="ml-1.5 font-normal normal-case text-zinc-400">
						({items.length})
					</span>
				</p>
				<CopyButton text={allText} label="Copy all" />
			</div>
			<ul className="space-y-2 max-h-56 overflow-y-auto">
				{items.map((item, i) => (
					<li
						key={`${i}-${item.slice(0, 24)}`}
						className="flex items-start justify-between gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2"
					>
						<span className="text-sm text-zinc-700 leading-snug min-w-0 flex-1">
							{numbered ? (
								<span className="text-zinc-400 font-mono text-xs mr-2">
									{i + 1}.
								</span>
							) : null}
							{item}
						</span>
						<CopyButton text={item} label="Copy" className="shrink-0" />
					</li>
				))}
			</ul>
		</div>
	);
}

export default function VideoCaptionJobResult({ job }) {
	const videoSrc = job?.resultUrl || null;
	const hasCreatorKit =
		job?.summary ||
		job?.titles?.length ||
		job?.thumbnailTexts?.length ||
		job?.hooks?.length;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-sm font-medium text-orange-700">
				<CheckCircle className="w-4 h-4" />
				Captions ready
			</div>

			<div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
				{videoSrc ? (
					<video
						src={videoSrc}
						controls
						className="w-full bg-black max-h-80 object-contain"
					/>
				) : null}

				<div className="p-3 sm:p-4 space-y-4 border-t border-zinc-100">
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

					{hasCreatorKit ? (
						<div className="space-y-3 pt-1 border-t border-zinc-100">
							<p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
								Publishing kit
							</p>
							<CopyableBlock
								title="Summary"
								text={job.summary}
								copyLabel="Copy summary"
							/>
							<CopyableList title="Titles" items={job.titles} />
							<CopyableList title="Thumbnail text" items={job.thumbnailTexts} />
							<CopyableList title="Hooks" items={job.hooks} />
						</div>
					) : null}

					{(job?.transcript || job?.caption) && (
						<div className="pt-1 border-t border-zinc-100">
							<div className="flex items-center justify-between gap-2 mb-2">
								<p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
									Transcript
								</p>
								<CopyButton
									text={job.transcript || job.caption}
									label="Copy transcript"
								/>
							</div>
							<p className="text-sm text-zinc-700 whitespace-pre-wrap bg-zinc-50 border border-zinc-100 rounded-xl p-3 max-h-40 overflow-y-auto">
								{job.transcript || job.caption}
							</p>
						</div>
					)}

					{Array.isArray(job?.timedCaptions) && job.timedCaptions.length > 0 && (
						<div className="pt-1 border-t border-zinc-100">
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
										<span className="text-zinc-700 min-w-0 flex-1">{c.text}</span>
										<CopyButton text={c.text} label="Copy" className="shrink-0" />
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
