import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Film, Search } from "lucide-react";
import Fuse from "fuse.js";
import { workspaceVideoLabel } from "../api/workspaceVideos";

/**
 * Searchable dropdown to pick a previously uploaded / saved workspace video URL.
 */
export default function WorkspaceVideoPicker({
	videos = [],
	value,
	onChange,
	disabled = false,
	className = "",
	placeholder = "Choose from workspace…",
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const rootRef = useRef(null);

	const fuse = useMemo(
		() =>
			new Fuse(videos, {
				keys: ["name", "url"],
				threshold: 0.35,
			}),
		[videos],
	);

	const filtered = useMemo(() => {
		const q = query.trim();
		if (!q) return videos;
		return fuse.search(q).map((r) => r.item);
	}, [videos, query, fuse]);

	const selected = useMemo(
		() => videos.find((v) => v.url === value) ?? null,
		[videos, value],
	);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (rootRef.current && !rootRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	if (!videos.length) return null;

	return (
		<div ref={rootRef} className={`relative ${className}`}>
			<label className="block text-xs font-medium text-zinc-500 mb-1">
				Workspace video
			</label>
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen((o) => !o)}
				className={`w-full min-h-[42px] px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white shadow-sm flex items-center justify-between gap-2 text-left text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors ${
					disabled ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-400"
				}`}
			>
				<span className="flex items-center gap-2 min-w-0">
					<Film className="w-4 h-4 text-orange-600 shrink-0" />
					<span className={`truncate ${selected ? "text-zinc-900" : "text-zinc-400"}`}>
						{selected ? workspaceVideoLabel(selected) : placeholder}
					</span>
				</span>
				<ChevronDown
					className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute z-50 mt-1.5 w-full rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
					<div className="p-2 border-b border-zinc-100">
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
							<input
								autoFocus
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search videos…"
								className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
							/>
						</div>
					</div>
					<ul className="max-h-56 overflow-y-auto p-1">
						{filtered.length === 0 ? (
							<li className="px-3 py-4 text-sm text-zinc-400 text-center">
								No matching videos
							</li>
						) : (
							filtered.map((v) => {
								const isSel = v.url === value;
								return (
									<li key={v.id}>
										<button
											type="button"
											onClick={() => {
												onChange?.(v.url, v);
												setOpen(false);
												setQuery("");
											}}
											className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
												isSel
													? "bg-orange-50 text-orange-800"
													: "text-zinc-700 hover:bg-zinc-50"
											}`}
										>
											<div className="w-12 h-8 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
												<video
													src={v.url}
													className="w-full h-full object-cover"
													muted
													preload="metadata"
												/>
											</div>
											<div className="min-w-0 flex-1">
												<p className="font-medium truncate">{workspaceVideoLabel(v)}</p>
												<p className="text-[11px] text-zinc-400 truncate">{v.url}</p>
											</div>
										</button>
									</li>
								);
							})
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
