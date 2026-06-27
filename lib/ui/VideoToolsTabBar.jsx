import { Video, Mic2, Subtitles, Scissors, FileText } from "lucide-react";

export const VIDEO_TOOLS_TABS = [
	{ id: "video", label: "Translate video", Icon: Video },
	{ id: "voice", label: "Translate audio", Icon: Mic2 },
	{ id: "caption", label: "AI captions", Icon: Subtitles },
	{ id: "blog", label: "Blog to video", Icon: FileText },
	{ id: "clips", label: "Viral clips", Icon: Scissors },
];

export default function VideoToolsTabBar({
	value,
	onChange,
	className = "",
	tabOrder,
}) {
	const tabs = tabOrder?.length
		? tabOrder
				.map((id) => VIDEO_TOOLS_TABS.find((t) => t.id === id))
				.filter(Boolean)
		: VIDEO_TOOLS_TABS;

	return (
		<div
			className={`grid gap-2 p-1.5 bg-zinc-100/80 border border-zinc-200/80 rounded-xl max-w-4xl mx-auto ${className}`}
			style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
		>
			{tabs.map(({ id, label, Icon }) => (
				<button
					key={id}
					type="button"
					onClick={() => onChange(id)}
					className={`flex items-center justify-center gap-2 min-w-0 px-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
						value === id
							? "border-orange-300/50 bg-gradient-to-b from-orange-100/90 to-orange-50/90 text-orange-700 shadow-sm shadow-orange-100/80"
							: "border-transparent bg-transparent text-zinc-500 hover:text-zinc-700 hover:bg-white/60"
					}`}
				>
					<Icon className="w-4 h-4 shrink-0" />
					<span className="truncate">{label}</span>
				</button>
			))}
		</div>
	);
}
