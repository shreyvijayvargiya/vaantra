import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	collection,
	getDocs,
	query,
	orderBy,
	limit,
} from "firebase/firestore";
import { db } from "../../../lib/config/firebase";
import TableSkeleton from "../../../lib/ui/TableSkeleton";
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
	TableEmpty,
} from "../../../lib/ui/Table";
import {
	Search,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Activity,
	ChevronDown,
	X,
	RefreshCw,
	Clock,
	CheckCircle,
	XCircle,
	Video,
	Mic2,
} from "lucide-react";

const LOGS_COLLECTION = "translation-api-logs";
const PAGE_SIZE = 200;

async function loadLogs() {
	const ref = collection(db, LOGS_COLLECTION);
	const q = query(ref, orderBy("created_at_ms", "desc"), limit(PAGE_SIZE));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── tiny custom filter dropdown ─────────────────────────────────────────────
function FilterDropdown({ label, value, onChange, options }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const h = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, []);

	const current = options.find((o) => o.value === value);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-1.5 text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-white hover:bg-zinc-50 transition-colors whitespace-nowrap"
			>
				<span className="text-zinc-500 font-medium">{label}:</span>
				<span className="text-zinc-900 font-semibold">
					{current?.label ?? value}
				</span>
				<ChevronDown
					className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute top-full left-0 mt-1 min-w-[140px] bg-white border border-zinc-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
					{options.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => {
								onChange(opt.value);
								setOpen(false);
							}}
							className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
								opt.value === value
									? "bg-orange-50 text-orange-700 font-semibold"
									: "text-zinc-700 hover:bg-zinc-50"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
	const n = Number(status) || 0;
	let cls =
		"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
	if (n >= 200 && n < 300)
		cls += " bg-green-100 text-green-700";
	else if (n >= 400 && n < 500)
		cls += " bg-yellow-100 text-yellow-700";
	else if (n >= 500)
		cls += " bg-red-100 text-red-700";
	else
		cls += " bg-zinc-100 text-zinc-600";
	return <span className={cls}>{n || "—"}</span>;
}

function SuccessBadge({ success }) {
	if (success)
		return (
			<span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
				<CheckCircle className="w-3.5 h-3.5" /> OK
			</span>
		);
	return (
		<span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
			<XCircle className="w-3.5 h-3.5" /> Fail
		</span>
	);
}

function ApiKindBadge({ kind }) {
	if (!kind) return <span className="text-zinc-400 text-xs">—</span>;
	if (kind === "video")
		return (
			<span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
				<Video className="w-3 h-3" /> video
			</span>
		);
	if (kind === "voice" || kind === "audio")
		return (
			<span className="inline-flex items-center gap-1 text-purple-600 text-xs font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
				<Mic2 className="w-3 h-3" /> voice
			</span>
		);
	return (
		<span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
			{kind}
		</span>
	);
}

function DurationCell({ ms }) {
	if (ms == null) return <span className="text-zinc-400 text-xs">—</span>;
	const n = Number(ms);
	const cls =
		n < 3000
			? "text-green-600"
			: n < 10000
				? "text-yellow-600"
				: "text-red-500";
	const label =
		n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`;
	return <span className={`text-xs font-mono font-semibold ${cls}`}>{label}</span>;
}

function TtsVoiceCell({ tts }) {
	const voice = tts?.tts_voice;
	const engine = tts?.tts_engine;
	if (!voice && !engine)
		return <span className="text-zinc-400 text-xs">—</span>;
	return (
		<span className="text-xs">
			{voice ? (
				<span className="font-semibold text-orange-700">{voice}</span>
			) : null}
			{engine && (
				<span className="text-zinc-400 ml-1">· {engine}</span>
			)}
		</span>
	);
}

function formatTs(ms) {
	if (!ms) return "—";
	const d = new Date(ms);
	if (isNaN(d.getTime())) return "—";
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}

// ─── expandable JSON viewer ───────────────────────────────────────────────────
function JsonExpander({ label, data }) {
	const [open, setOpen] = useState(false);
	if (!data || (typeof data === "object" && Object.keys(data).length === 0))
		return <span className="text-zinc-400 text-xs">—</span>;
	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="text-xs text-blue-600 hover:underline font-medium"
			>
				{open ? "▲ hide" : `▼ ${label}`}
			</button>
			{open && (
				<pre className="mt-1.5 text-[10px] bg-zinc-50 border border-zinc-100 rounded-lg p-2 overflow-auto max-h-52 text-zinc-700 whitespace-pre-wrap leading-relaxed">
					{JSON.stringify(data, null, 2)}
				</pre>
			)}
		</div>
	);
}

// ─── main tab ─────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = {
	status: [
		{ value: "all", label: "All" },
		{ value: "success", label: "Success" },
		{ value: "failed", label: "Failed" },
	],
	apiKind: [
		{ value: "all", label: "All" },
		{ value: "video", label: "Video" },
		{ value: "voice", label: "Voice" },
	],
	authType: [
		{ value: "all", label: "All" },
		{ value: "firebase", label: "Firebase" },
		{ value: "api_key", label: "API Key" },
		{ value: "none", label: "No auth" },
	],
};

export default function TranslationLogsTab() {
	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterKind, setFilterKind] = useState("all");
	const [filterAuth, setFilterAuth] = useState("all");
	const [sortField, setSortField] = useState("created_at_ms");
	const [sortDir, setSortDir] = useState("desc");

	const {
		data: logs = [],
		isLoading,
		error,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["translation-api-logs"],
		queryFn: loadLogs,
		staleTime: 60_000,
	});

	// ── filter ──
	const filtered = logs.filter((log) => {
		if (search) {
			const q = search.toLowerCase();
			const hit =
				log.route?.toLowerCase().includes(q) ||
				log.path?.toLowerCase().includes(q) ||
				log.user_uid?.toLowerCase().includes(q) ||
				log.tts?.tts_voice?.toLowerCase().includes(q) ||
				log.error?.toLowerCase().includes(q) ||
				log.api_kind?.toLowerCase().includes(q) ||
				log.request_id?.toLowerCase().includes(q);
			if (!hit) return false;
		}
		if (filterStatus === "success" && !log.success) return false;
		if (filterStatus === "failed" && log.success) return false;
		if (filterKind !== "all") {
			const k = (log.api_kind || "").toLowerCase();
			if (filterKind === "voice" && !k.includes("voice")) return false;
			if (filterKind === "video" && !k.includes("video")) return false;
		}
		if (filterAuth !== "all") {
			const a = (log.auth_type || "none").toLowerCase();
			if (filterAuth === "none" && a !== "none" && a !== "") return false;
			if (filterAuth !== "none" && !a.includes(filterAuth)) return false;
		}
		return true;
	});

	// ── sort ──
	const sorted = [...filtered].sort((a, b) => {
		const mul = sortDir === "asc" ? 1 : -1;
		const av = a[sortField] ?? 0;
		const bv = b[sortField] ?? 0;
		if (typeof av === "string" && typeof bv === "string")
			return mul * av.localeCompare(bv);
		return mul * (Number(av) - Number(bv));
	});

	const handleSort = (field) => {
		if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else { setSortField(field); setSortDir("asc"); }
	};

	const getSortIcon = (field) => {
		if (sortField !== field)
			return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-zinc-400" />;
		return sortDir === "asc"
			? <ArrowUp className="w-3.5 h-3.5 ml-1 text-zinc-900" />
			: <ArrowDown className="w-3.5 h-3.5 ml-1 text-zinc-900" />;
	};

	const clearFilters = () => {
		setSearch("");
		setFilterStatus("all");
		setFilterKind("all");
		setFilterAuth("all");
	};

	const hasActiveFilters =
		search || filterStatus !== "all" || filterKind !== "all" || filterAuth !== "all";

	const successCount = logs.filter((l) => l.success).length;
	const failCount = logs.length - successCount;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex justify-between items-start mb-4 border-b border-zinc-200 px-4 pb-3 gap-3 flex-wrap">
				<div>
					<h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
						<Activity className="w-5 h-5 text-orange-500" />
						Translation API Logs
					</h2>
					<p className="text-sm text-zinc-500 mt-0.5">
						Last {PAGE_SIZE} requests · {logs.length} loaded ·{" "}
						<span className="text-green-600 font-medium">{successCount} ok</span>
						{" / "}
						<span className="text-red-500 font-medium">{failCount} failed</span>
					</p>
				</div>
				<button
					type="button"
					onClick={() => refetch()}
					disabled={isFetching}
					className="flex items-center gap-1.5 text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-white hover:bg-zinc-50 transition-colors disabled:opacity-60"
				>
					<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
					Refresh
				</button>
			</div>

			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2 px-4">
				{/* Search */}
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search route, uid, voice, error…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-100"
					/>
				</div>

				{/* Filter dropdowns */}
				<FilterDropdown
					label="Status"
					value={filterStatus}
					onChange={setFilterStatus}
					options={FILTER_OPTIONS.status}
				/>
				<FilterDropdown
					label="Kind"
					value={filterKind}
					onChange={setFilterKind}
					options={FILTER_OPTIONS.apiKind}
				/>
				<FilterDropdown
					label="Auth"
					value={filterAuth}
					onChange={setFilterAuth}
					options={FILTER_OPTIONS.authType}
				/>

				{hasActiveFilters && (
					<button
						type="button"
						onClick={clearFilters}
						className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-xl px-3 py-2 bg-white hover:bg-zinc-50 transition-colors"
					>
						<X className="w-3.5 h-3.5" /> Clear
					</button>
				)}

				<span className="text-xs text-zinc-400 ml-auto">
					{sorted.length} of {logs.length} rows
				</span>
			</div>

			{/* Table */}
			<div className="overflow-x-auto px-4">
				{isLoading ? (
					<TableSkeleton rows={8} columns={9} />
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead sortable onClick={() => handleSort("route")} className="min-w-[140px]">
									<div className="flex items-center">Route {getSortIcon("route")}</div>
								</TableHead>
								<TableHead sortable onClick={() => handleSort("http_status")} className="min-w-[80px]">
									<div className="flex items-center">Status {getSortIcon("http_status")}</div>
								</TableHead>
								<TableHead className="min-w-[60px]">OK</TableHead>
								<TableHead sortable onClick={() => handleSort("api_kind")} className="min-w-[80px]">
									<div className="flex items-center">Kind {getSortIcon("api_kind")}</div>
								</TableHead>
								<TableHead className="min-w-[100px]">Voice</TableHead>
								<TableHead className="min-w-[90px]">Auth</TableHead>
								<TableHead className="min-w-[140px]">User UID</TableHead>
								<TableHead sortable onClick={() => handleSort("duration_ms")} className="min-w-[80px]">
									<div className="flex items-center">
										<Clock className="w-3 h-3 mr-1" />
										Dur {getSortIcon("duration_ms")}
									</div>
								</TableHead>
								<TableHead className="min-w-[130px]">Error</TableHead>
								<TableHead className="min-w-[80px]">Details</TableHead>
								<TableHead sortable onClick={() => handleSort("created_at_ms")} className="min-w-[160px]">
									<div className="flex items-center">Time {getSortIcon("created_at_ms")}</div>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{error ? (
								<TableEmpty
									colSpan={11}
									message="Error loading logs. Check Firestore rules."
								/>
							) : sorted.length === 0 ? (
								<TableEmpty
									colSpan={11}
									icon={Activity}
									message={
										hasActiveFilters
											? "No logs match the current filters."
											: "No logs found in translation-api-logs."
									}
								/>
							) : (
								sorted.map((log) => (
									<TableRow key={log.id}>
										{/* Route */}
										<TableCell>
											<div className="flex flex-col gap-0.5">
												<span className="text-xs font-semibold text-zinc-800 font-mono">
													{log.route || "—"}
												</span>
												<span className="text-[10px] text-zinc-400 font-mono truncate max-w-[160px]">
													{log.path || ""}
												</span>
											</div>
										</TableCell>

										{/* HTTP status */}
										<TableCell>
											<StatusBadge status={log.http_status} />
										</TableCell>

										{/* Success */}
										<TableCell>
											<SuccessBadge success={log.success} />
										</TableCell>

										{/* API kind */}
										<TableCell>
											<ApiKindBadge kind={log.api_kind} />
										</TableCell>

										{/* TTS voice */}
										<TableCell>
											<TtsVoiceCell tts={log.tts} />
										</TableCell>

										{/* Auth */}
										<TableCell>
											<span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
												{log.auth_type || "—"}
											</span>
										</TableCell>

										{/* User UID */}
										<TableCell>
											<span
												className="text-[11px] font-mono text-zinc-500 truncate block max-w-[140px]"
												title={log.user_uid || ""}
											>
												{log.user_uid || "—"}
											</span>
										</TableCell>

										{/* Duration */}
										<TableCell>
											<DurationCell ms={log.duration_ms} />
										</TableCell>

										{/* Error */}
										<TableCell>
											{log.error ? (
												<span
													className="text-[11px] text-red-600 font-medium truncate block max-w-[140px]"
													title={String(log.error)}
												>
													{String(log.error).slice(0, 60)}
													{String(log.error).length > 60 ? "…" : ""}
												</span>
											) : (
												<span className="text-zinc-300 text-xs">—</span>
											)}
										</TableCell>

										{/* Expandable details */}
										<TableCell>
											<div className="flex flex-col gap-1">
												<JsonExpander label="params" data={log.request_params} />
												<JsonExpander label="pipeline" data={log.pipeline} />
												<JsonExpander label="llm" data={log.llm} />
												<JsonExpander label="tts" data={log.tts} />
											</div>
										</TableCell>

										{/* Timestamp */}
										<TableCell>
											<span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
												{formatTs(log.created_at_ms)}
											</span>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}
