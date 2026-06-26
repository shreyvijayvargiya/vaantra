import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Upload,
	Loader2,
	Search,
	X,
	Film,
	Trash2,
	Calendar,
	HardDrive,
} from "lucide-react";
import Fuse from "fuse.js";
import { toast } from "sonner";
import {
	addWorkspaceVideo,
	deleteWorkspaceVideo,
	workspaceVideoLabel,
} from "../../lib/api/workspaceVideos";
import {
	useWorkspaceVideos,
	QUERY_KEY_WORKSPACE_VIDEOS,
} from "../../lib/hooks/useWorkspaceVideos";
import { uploadWorkspaceVideo } from "../../lib/uploadthing/client";
import { useQueryClient } from "@tanstack/react-query";
import FormAnimatedDropdown from "../../lib/ui/FormAnimatedDropdown";
import { flagForLanguageName } from "../../lib/utils/languages";

const SOURCE_FILTER_OPTIONS = [
	{ value: "all", label: "All sources" },
	{ value: "upload", label: "Uploaded" },
	{ value: "job", label: "From jobs" },
];

function formatDate(iso) {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

function formatBytes(n) {
	if (n == null || !Number.isFinite(n)) return "—";
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function probeVideoDuration(url) {
	return new Promise((resolve) => {
		const el = document.createElement("video");
		el.preload = "metadata";
		el.src = url;
		const done = (sec) => {
			el.removeAttribute("src");
			el.load();
			resolve(sec);
		};
		el.onloadedmetadata = () =>
			done(Number.isFinite(el.duration) ? el.duration : null);
		el.onerror = () => done(null);
		el.load();
	});
}

export default function WorkspacePage({ uid, translationGroups = [] }) {
	const { data: videos = [], isLoading } = useWorkspaceVideos(uid, translationGroups);
	const queryClient = useQueryClient();
	const fileRef = useRef(null);

	const [search, setSearch] = useState("");
	const [sourceFilter, setSourceFilter] = useState("all");
	const [languageFilter, setLanguageFilter] = useState("all");
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [detail, setDetail] = useState(null);
	const [deleting, setDeleting] = useState(false);

	const languageOptions = useMemo(() => {
		const langs = new Set();
		for (const v of videos) {
			for (const lang of v.langs || []) langs.add(lang);
		}
		return [
			{ value: "all", label: "All languages" },
			...[...langs].sort().map((lang) => ({
				value: lang,
				label: `${flagForLanguageName(lang)} ${lang}`,
			})),
		];
	}, [videos]);

	const filtered = useMemo(() => {
		let list = videos;
		if (sourceFilter !== "all") {
			list = list.filter((v) => v.source === sourceFilter);
		}
		if (languageFilter !== "all") {
			list = list.filter((v) => (v.langs || []).includes(languageFilter));
		}
		const q = search.trim();
		if (!q) return list;
		const fuse = new Fuse(list, {
			keys: ["name", "url", "langs"],
			threshold: 0.35,
		});
		return fuse.search(q).map((r) => r.item);
	}, [videos, search, sourceFilter, languageFilter]);

	const hasActiveFilters =
		search.trim() || sourceFilter !== "all" || languageFilter !== "all";

	const handleUpload = async (file) => {
		if (!file || !uid) return;
		if (!file.type?.includes?.("video") && !file.name?.match(/\.(mp4|mov|webm|mkv)$/i)) {
			toast.error("Please choose a video file (MP4, MOV, WebM).");
			return;
		}
		setUploading(true);
		setUploadProgress(0);
		try {
			const uploaded = await uploadWorkspaceVideo(file, {
				onProgress: (p) => setUploadProgress(Math.round(p)),
			});
			const durationSec = await probeVideoDuration(uploaded.url);
			const saved = await addWorkspaceVideo(uid, {
				name: uploaded.name || file.name,
				url: uploaded.url,
				sizeBytes: uploaded.size ?? file.size,
				durationSec,
				source: "upload",
			});
			queryClient.setQueryData(
				QUERY_KEY_WORKSPACE_VIDEOS(uid, translationGroups),
				(prev) => {
				const base = Array.isArray(prev) ? prev : [];
				if (base.some((v) => v.url === saved.url)) return base;
				return [saved, ...base];
			},
			);
			void queryClient.invalidateQueries({ queryKey: ["workspaceVideos", uid] });
			toast.success("Video added to workspace");
		} catch (e) {
			toast.error(e?.message || "Upload failed");
		} finally {
			setUploading(false);
			setUploadProgress(0);
			if (fileRef.current) fileRef.current.value = "";
		}
	};

	const handleDelete = async (video) => {
		if (!uid || !video?.id) return;
		if (!video.isPersisted) {
			toast.info("This video comes from a past job and stays in your list.");
			return;
		}
		setDeleting(true);
		try {
			await deleteWorkspaceVideo(uid, video.id);
			void queryClient.invalidateQueries({ queryKey: ["workspaceVideos", uid] });
			setDetail(null);
			toast.success("Video removed from workspace");
		} catch (e) {
			toast.error(e?.message || "Delete failed");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto w-full">
			<div className="mb-6">
				<h2 className="aantraa-font text-2xl font-bold text-zinc-900 mb-1">
					Workspace
				</h2>
				<p className="text-sm text-zinc-600">
					All your uploaded videos — from workspace uploads and past translation jobs.
				</p>
			</div>

			<div className="rounded-xl bg-white border border-zinc-200/80 overflow-hidden">
				<div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-zinc-100">
					<div className="relative flex-1 min-w-0">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by name or URL…"
							className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200"
						/>
					</div>
					<div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
						<FormAnimatedDropdown
							value={sourceFilter}
							onChange={setSourceFilter}
							options={SOURCE_FILTER_OPTIONS}
							placeholder="Source"
							className="w-[130px]"
						/>
						{languageOptions.length > 1 && (
							<FormAnimatedDropdown
								value={languageFilter}
								onChange={setLanguageFilter}
								options={languageOptions}
								placeholder="Language"
								className="w-[150px]"
							/>
						)}
						<input
							ref={fileRef}
							type="file"
							accept="video/*,.mp4,.mov,.webm,.mkv"
							className="hidden"
							onChange={(e) => handleUpload(e.target.files?.[0])}
						/>
						<button
							type="button"
							disabled={uploading}
							onClick={() => fileRef.current?.click()}
							className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 transition-colors whitespace-nowrap"
						>
							{uploading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									{uploadProgress > 0 ? `${uploadProgress}%` : "Uploading…"}
								</>
							) : (
								<>
									<Upload className="w-4 h-4" />
									Upload MP4
								</>
							)}
						</button>
					</div>
				</div>

				{isLoading ? (
					<div className="p-12 text-center text-sm text-zinc-500">Loading videos…</div>
				) : filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Film className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
						<p className="text-sm text-zinc-500 mb-4">
							{hasActiveFilters
								? "No videos match your filters."
								: "No workspace videos yet. Upload an MP4 to get started."}
						</p>
						{!hasActiveFilters && (
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								className="text-sm font-semibold text-orange-600 hover:text-orange-700"
							>
								Upload your first video
							</button>
						)}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
									<th className="px-4 py-3 w-24">Preview</th>
									<th className="px-4 py-3">Name</th>
									<th className="px-4 py-3 hidden md:table-cell">Source</th>
									<th className="px-4 py-3 hidden lg:table-cell">Languages</th>
									<th className="px-4 py-3 hidden sm:table-cell">Size</th>
									<th className="px-4 py-3">Created</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((v) => (
									<tr
										key={v.id}
										onClick={() => setDetail(v)}
										className="border-b border-zinc-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
									>
										<td className="px-4 py-3">
											<div className="w-16 h-10 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden">
												<video
													src={v.url}
													className="w-full h-full object-cover"
													muted
													preload="metadata"
												/>
											</div>
										</td>
										<td className="px-4 py-3 font-medium text-zinc-900 max-w-[200px] truncate">
											{workspaceVideoLabel(v)}
										</td>
										<td className="px-4 py-3 hidden md:table-cell">
											<span
												className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
													v.source === "upload"
														? "bg-blue-50 text-blue-700"
														: "bg-violet-50 text-violet-700"
												}`}
											>
												{v.source === "upload" ? "Upload" : "Job"}
											</span>
										</td>
										<td className="px-4 py-3 hidden lg:table-cell">
											{v.langs?.length ? (
												<div className="flex flex-wrap gap-1 max-w-[180px]">
													{v.langs.slice(0, 3).map((lang) => (
														<span
															key={lang}
															className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600"
														>
															<span aria-hidden>{flagForLanguageName(lang)}</span>
															{lang}
														</span>
													))}
													{v.langs.length > 3 && (
														<span className="text-[11px] text-zinc-400">
															+{v.langs.length - 3}
														</span>
													)}
												</div>
											) : (
												<span className="text-zinc-400 text-xs">—</span>
											)}
										</td>
										<td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
											{formatBytes(v.sizeBytes)}
										</td>
										<td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
											{formatDate(v.createdAt)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<AnimatePresence>
				{detail && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
						onClick={() => setDetail(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.96, y: 8 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: 8 }}
							className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
								<h3 className="font-semibold text-zinc-900 truncate pr-4">
									{workspaceVideoLabel(detail)}
								</h3>
								<button
									type="button"
									onClick={() => setDetail(null)}
									className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							<div className="p-5 space-y-4">
								<div className="rounded-xl overflow-hidden bg-black aspect-video">
									<video
										src={detail.url}
										controls
										className="w-full h-full"
										preload="metadata"
									/>
								</div>
								<dl className="grid grid-cols-1 gap-3 text-sm">
									<div className="flex items-start gap-2">
										<Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
										<div>
											<dt className="text-xs text-zinc-500">Created</dt>
											<dd className="text-zinc-800">{formatDate(detail.createdAt)}</dd>
										</div>
									</div>
									<div className="flex items-start gap-2">
										<HardDrive className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
										<div>
											<dt className="text-xs text-zinc-500">Size</dt>
											<dd className="text-zinc-800">{formatBytes(detail.sizeBytes)}</dd>
										</div>
									</div>
									<div>
										<dt className="text-xs text-zinc-500 mb-1">Languages</dt>
										<dd className="text-zinc-800">
											{detail.langs?.length ? (
												<div className="flex flex-wrap gap-1.5 mt-0.5">
													{detail.langs.map((lang) => (
														<span
															key={lang}
															className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700"
														>
															<span aria-hidden>{flagForLanguageName(lang)}</span>
															{lang}
														</span>
													))}
												</div>
											) : (
												"—"
											)}
										</dd>
									</div>
									<div>
										<dt className="text-xs text-zinc-500 mb-1">URL</dt>
										<dd className="text-xs text-zinc-600 break-all font-mono bg-zinc-50 p-2 rounded-lg border border-zinc-100">
											{detail.url}
										</dd>
									</div>
								</dl>
								{detail.isPersisted ? (
									<button
										type="button"
										disabled={deleting}
										onClick={() => handleDelete(detail)}
										className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
									>
										{deleting ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Trash2 className="w-4 h-4" />
										)}
										Remove from workspace
									</button>
								) : (
									<p className="text-xs text-zinc-500 text-center">
										From a past job — shown automatically from your translation history.
									</p>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
