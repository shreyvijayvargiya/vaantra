import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle, Clock, Film, Scissors, Upload, FileText, Sparkles, Clapperboard, LayoutTemplate, Video } from "lucide-react";
import { captionStatusLabel, clipStatusLabel, blogStatusLabel } from "../videoToolsJob";

const CAPTION_STEPS = [
	{ key: "pending", label: "Queued", Icon: Clock },
	{ key: "running", label: "Captions", Icon: Film },
	{ key: "success", label: "Done", Icon: CheckCircle },
];

const CLIP_STEPS = [
	{ key: "pending", label: "Queued", Icon: Clock },
	{ key: "analyzing", label: "Analyze", Icon: Film },
	{ key: "cutting", label: "Cut", Icon: Scissors },
	{ key: "uploading", label: "Upload", Icon: Upload },
	{ key: "success", label: "Done", Icon: CheckCircle },
];

const BLOG_STEPS = [
	{ key: "pending", label: "Queued", Icon: Clock },
	{ key: "scraping", label: "Scrape", Icon: FileText },
	{ key: "strategizing", label: "Plan", Icon: Sparkles },
	{ key: "directing", label: "Direct", Icon: Clapperboard },
	{ key: "planning", label: "Scenes", Icon: LayoutTemplate },
	{ key: "rendering", label: "Render", Icon: Video },
	{ key: "success", label: "Done", Icon: CheckCircle },
];

export default function VideoToolsStatusProgress({ tool, apiStatus, status, createdAt }) {
	const steps =
		tool === "blog" ? BLOG_STEPS : tool === "clips" ? CLIP_STEPS : CAPTION_STEPS;
	const isErr = status === "error";
	const isDone = status === "done";
	const currentKey = isDone ? "success" : isErr ? apiStatus : apiStatus || "pending";
	const curIdx = steps.findIndex((s) => s.key === currentKey);
	const activeIdx = curIdx >= 0 ? curIdx : isDone ? steps.length - 1 : 0;

	const [elapsed, setElapsed] = useState(0);
	useEffect(() => {
		if (!createdAt || isDone || isErr) return;
		const start = new Date(createdAt).getTime();
		const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [createdAt, isDone, isErr]);

	const label =
		tool === "blog"
			? blogStatusLabel(apiStatus)
			: tool === "clips"
				? clipStatusLabel(apiStatus)
				: captionStatusLabel(apiStatus);
	const elapsedLabel =
		elapsed > 0
			? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")} elapsed`
			: null;

	return (
		<div className="py-5">
			<div className="flex items-start justify-between mb-5 gap-1">
				{steps.map(({ key, label: stepLabel, Icon }, i) => {
					const done = !isErr && (i < activeIdx || isDone);
					const active = !isErr && !isDone && i === activeIdx;
					return (
						<div key={key} className="flex-1 flex flex-col items-center gap-1.5 relative">
							{i > 0 && (
								<div
									className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${
										done ? "bg-orange-500" : "bg-zinc-200"
									}`}
								/>
							)}
							<div
								className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
									done
										? "bg-orange-500 border-orange-500 text-white"
										: active
											? "bg-white border-orange-500 text-orange-600"
											: "bg-white border-zinc-200 text-zinc-400"
								}`}
							>
								{active && !isDone ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Icon className="w-3.5 h-3.5" />
								)}
							</div>
							<span
								className={`text-[10px] font-medium text-center ${
									active || done ? "text-zinc-800" : "text-zinc-400"
								}`}
							>
								{stepLabel}
							</span>
						</div>
					);
				})}
			</div>
			<div className="flex items-center justify-between gap-3 px-1">
				<p className="text-sm font-medium text-zinc-800 flex items-center gap-2">
					{isErr ? (
						<AlertCircle className="w-4 h-4 text-red-500" />
					) : isDone ? (
						<CheckCircle className="w-4 h-4 text-orange-600" />
					) : (
						<Loader2 className="w-4 h-4 animate-spin text-orange-600" />
					)}
					{isErr ? "Failed" : isDone ? "Complete" : label}
				</p>
				{elapsedLabel && !isDone && !isErr ? (
					<p className="text-xs text-zinc-400">{elapsedLabel}</p>
				) : null}
			</div>
		</div>
	);
}
