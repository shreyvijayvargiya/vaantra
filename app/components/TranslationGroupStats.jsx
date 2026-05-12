import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart2, Loader2 } from "lucide-react";
import {
	fetchTranslationGroupForUser,
	QUERY_KEY_TRANSLATION_GROUP_STATS,
} from "../../lib/api/translationGroupFetch";
import { PRICE_PER_MINUTE_USD } from "../../lib/utils/usagePricing";
import {
	getJobBillableMinutes,
	getJobCostUsd,
	getJobStatsTimestamp,
	getJobTokenEstimate,
	getStoredBillableMinutes,
} from "../../lib/utils/translationJobStats";
import {
	probeAudioDurationSeconds,
	probeVideoDurationSeconds,
	secondsToBillableMinutes,
} from "../../lib/utils/videoDuration";

/**
 * Stats table + back control for embedding in the main app shell (sidebar + topbar).
 */
export function TranslationGroupStatsPanel({ uid, groupId, onBack }) {
	const { data: group, isLoading, isError } = useQuery({
		queryKey: QUERY_KEY_TRANSLATION_GROUP_STATS(uid || "", groupId || ""),
		queryFn: () => fetchTranslationGroupForUser(uid, groupId),
		enabled: Boolean(uid && groupId),
		staleTime: 60_000,
	});

	const [probedMinutes, setProbedMinutes] = useState({});

	const probeKey = useMemo(() => {
		if (!group?.jobs?.length) return "";
		return group.jobs
			.map(
				(j) =>
					`${j.id}:${j.status}:${j.durationMinutes ?? ""}:${j.resultUrl ?? ""}:${j.sourceVideoUrl ?? ""}`,
			)
			.join("|");
	}, [group]);

	useEffect(() => {
		if (!group?.jobs?.length || typeof window === "undefined") return;
		let cancelled = false;
		void (async () => {
			const updates = {};
			for (const job of group.jobs) {
				if (job.status !== "done") continue;
				if (getStoredBillableMinutes(job) != null) continue;
				const isVoice = String(job.id).startsWith("voice_");
				const url = isVoice
					? job.resultUrl || job.audioUrl
					: job.sourceVideoUrl || group.sourceVideoUrl;
				if (!url || typeof url !== "string") continue;
				const sec = isVoice
					? await probeAudioDurationSeconds(url)
					: await probeVideoDurationSeconds(url);
				const m = secondsToBillableMinutes(sec);
				if (m > 0) updates[job.id] = m;
			}
			if (!cancelled && Object.keys(updates).length > 0) {
				setProbedMinutes((prev) => ({ ...prev, ...updates }));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [group, probeKey]);

	const rows = (group?.jobs || []).map((job) => {
		const isDone = job.status === "done";
		const minutes = isDone
			? getJobBillableMinutes(job, group, probedMinutes)
			: null;
		const costUsd = isDone
			? getJobCostUsd(job, group, probedMinutes)
			: null;
		const tok = isDone ? getJobTokenEstimate(job) : null;
		const ts = getJobStatsTimestamp(job, group);
		return {
			id: job.id,
			lang: job.lang || job.outputLanguage || "—",
			status: job.status,
			minutes,
			costUsd,
			tokens: tok,
			at: ts,
		};
	});

	return (
		<div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
			<button
				type="button"
				onClick={onBack}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 20,
					padding: "8px 12px",
					borderRadius: 10,
					fontSize: 13,
					fontWeight: 600,
					border: "1px solid rgba(0,0,0,0.1)",
					background: "#fafafa",
					color: "#3f3f46",
					cursor: "pointer",
				}}
			>
				<ArrowLeft size={16} aria-hidden />
				Back
			</button>

			{isLoading ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						color: "#71717a",
						fontSize: 14,
					}}
				>
					<Loader2 size={18} className="spin" aria-hidden />
					Loading project stats…
				</div>
			) : isError ? (
				<p style={{ color: "#ef4444", fontSize: 14 }}>
					Could not load stats. Try again later.
				</p>
			) : !group ? (
				<p style={{ color: "#71717a", fontSize: 14 }}>
					Project not found or you don&apos;t have access.
				</p>
			) : (
				<>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							marginBottom: 8,
						}}
					>
						<BarChart2 size={22} style={{ color: "#ea580c" }} aria-hidden />
						<h1
							className="aantraa-font"
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#18181b",
								margin: 0,
							}}
						>
							{group.label || "Translation project"}
						</h1>
					</div>
					<p style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>
						Per-language jobs: billable minutes, token estimate, and cost at $
						{PRICE_PER_MINUTE_USD.toFixed(2)}/min. Minutes come from your upload/URL
						when available, then the API, then a best-effort probe of the media URL
						in your browser. Token counts use API values when present; otherwise
						they are estimated from transcript length.
					</p>

					<div
						style={{
							borderRadius: 14,
							border: "1px solid rgba(0,0,0,0.08)",
							background: "#fff",
							overflow: "auto",
						}}
					>
						<table
							style={{
								width: "100%",
								minWidth: 640,
								borderCollapse: "collapse",
								fontSize: 13,
							}}
						>
							<thead>
								<tr style={{ background: "rgba(0,0,0,0.03)" }}>
									<th
										style={{
											textAlign: "left",
											padding: "12px 14px",
											fontWeight: 600,
											color: "#52525b",
										}}
									>
										Language
									</th>
									<th
										style={{
											textAlign: "left",
											padding: "12px 10px",
											fontWeight: 600,
											color: "#52525b",
										}}
									>
										Status
									</th>
									<th
										style={{
											textAlign: "right",
											padding: "12px 10px",
											fontWeight: 600,
											color: "#52525b",
										}}
									>
										Minutes
									</th>
									<th
										style={{
											textAlign: "right",
											padding: "12px 10px",
											fontWeight: 600,
											color: "#52525b",
										}}
									>
										Tokens
									</th>
									<th
										style={{
											textAlign: "right",
											padding: "12px 10px",
											fontWeight: 600,
											color: "#52525b",
										}}
									>
										Cost (USD)
									</th>
									<th
										style={{
											textAlign: "left",
											padding: "12px 14px",
											fontWeight: 600,
											color: "#52525b",
										}}
									>
										Time
									</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											style={{
												padding: "28px 14px",
												textAlign: "center",
												color: "#a1a1aa",
											}}
										>
											No jobs in this project.
										</td>
									</tr>
								) : (
									rows.map((r) => (
										<tr
											key={r.id}
											style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
										>
											<td
												style={{
													padding: "12px 14px",
													fontWeight: 600,
													color: "#18181b",
												}}
											>
												{r.lang}
											</td>
											<td style={{ padding: "12px 10px", color: "#52525b" }}>
												{r.status}
											</td>
											<td
												style={{
													padding: "12px 10px",
													textAlign: "right",
													fontVariantNumeric: "tabular-nums",
													color: "#3f3f46",
												}}
											>
												{r.minutes != null ? r.minutes.toFixed(1) : "—"}
											</td>
											<td
												style={{
													padding: "12px 10px",
													textAlign: "right",
													fontVariantNumeric: "tabular-nums",
													color: "#3f3f46",
												}}
												title={
													r.tokens?.isEstimate
														? "Estimated from transcript length"
														: undefined
												}
											>
												{r.tokens
													? `${r.tokens.value.toLocaleString()}${r.tokens.isEstimate ? " *" : ""}`
													: "—"}
											</td>
											<td
												style={{
													padding: "12px 10px",
													textAlign: "right",
													fontVariantNumeric: "tabular-nums",
													fontWeight: 600,
													color: "#18181b",
												}}
											>
												{r.costUsd != null ? `$${r.costUsd.toFixed(2)}` : "—"}
											</td>
											<td
												style={{
													padding: "12px 14px",
													color: "#52525b",
													whiteSpace: "nowrap",
												}}
											>
												{r.at ? r.at.toLocaleString() : "—"}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					<p style={{ fontSize: 11, color: "#a1a1aa", marginTop: 12 }}>
						* Estimated token count from transcript text (~4 characters per token).
					</p>
				</>
			)}
		</div>
	);
}
