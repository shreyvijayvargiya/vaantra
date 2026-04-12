import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import LoginModal from "../lib/ui/LoginModal";
import BenefitsShortsSection from "../app/components/BenefitsShortsSection";
import LandingMarketingNav from "../app/components/LandingMarketingNav";
import LandingMarketingFooter from "../app/components/LandingMarketingFooter";
import { onAuthStateChange } from "../lib/api/auth";
import {
	deleteTranslationGroupDoc,
	upsertTranslationGroup,
} from "../lib/api/translationHistory";
import { auth } from "../lib/config/firebase";
import {
	QUERY_KEY_TRANSLATION_GROUPS,
	useTranslationGroups,
} from "../lib/hooks/useTranslationHistory";
import {
	dedupeVideosById,
	inferTranslationGroupType,
	loadVideosForUser,
	saveVideos,
} from "../lib/utils/translationStorage";
import {
	incrementUserUsageMinutesClient,
	subscribeUserUsage,
} from "../lib/api/userUsage";
import { UsagePricingPanel } from "../lib/ui/UsagePricingPanel";
import {
	GrowthBadgePillLight,
	GrowthBadgePillOrange,
	HeroSparkleIcon,
	HeroSocialCluster,
} from "../app/components/LandingHeroBadges";
import {
	PRICE_PER_MINUTE_USD,
	USAGE_MINUTE_STEPS,
} from "../lib/utils/usagePricing";
import {
	probeVideoDurationSeconds,
	secondsToBillableMinutes,
} from "../lib/utils/videoDuration";
import {
	normalizeYouTubeVideoUrl,
	PENDING_YOUTUBE_TRANSLATE_STORAGE_KEY,
} from "../lib/utils/youtubeUrl";
import {
	getTranslatePostUrl,
	parseVideoIdFromPostResponse,
	normalizeStatus,
	extractResultUrl,
	extractStatusField,
	getApiErrorMessage,
	extractJobFieldsFromGetResponse,
	subscribeCaptionStatusStream,
	fetchTranslateJobStatus,
	getVoiceTranslatePostUrl,
	extractVoiceTranslateResponse,
	extractVoiceTranslateBatchResponse,
	transcribeAudioBlob,
	TRANSLATE_LLM_OPTIONS,
	TRANSLATE_LLM_STORAGE_KEY,
} from "../lib/translateApi";
import {
	Upload,
	Globe,
	ChevronDown,
	X,
	CheckCircle,
	Loader2,
	AlertCircle,
	LogOut,
	Video,
	Plus,
	Clock,
	Film,
	Search,
	ChevronLeft,
	Trash2,
	Menu,
	ExternalLink,
	Zap,
	Shield,
	Mic2,
	Headphones,
	Layers,
	Languages,
	RefreshCw,
	BarChart2,
	ArrowRight,
	Mail,
	Copy,
	Check,
	Edit2,
	Download,
	Mic,
	Square,
} from "lucide-react";

// ─── Contact & billing (UI only; API later) ───────────────────────────────────
const CONTACT_EMAIL = "shreyvijayvargiya26@gmail.com";
const X_PROFILE_URL = "https://x.com/shreyvijayvargiya26";
const FREE_CREDITS_PER_MONTH = 10;
/** Dashboard video file upload cap */
const VIDEO_UPLOAD_MAX_MB = 5;
const VIDEO_UPLOAD_MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024;

// ─── Language list ──────────────────────────────────────────────────────────
const LANGS = [
	"English",
	"Spanish",
	"French",
	"Hindi",
	"Italian",
	"German",
	"Polish",
	"Portuguese",
	"Chinese",
	"Japanese",
	"Dutch",
	"Turkish",
	"Korean",
	"Danish",
	"Arabic",
	"Romanian",
	"Mandarin",
	"Filipino",
	"Swedish",
	"Indonesian",
	"Ukrainian",
	"Greek",
	"Czech",
	"Bulgarian",
	"Malay",
	"Slovak",
	"Croatian",
	"Tamil",
	"Finnish",
	"Russian",
	"Vietnamese",
	"Afrikaans (South Africa)",
	"Albanian (Albania)",
	"Amharic (Ethiopia)",
	"Arabic (Egypt)",
	"Arabic (Saudi Arabia)",
	"Arabic (United Arab Emirates)",
	"Armenian (Armenia)",
	"Bangla (Bangladesh)",
	"Bengali (India)",
	"Catalan",
	"Chinese (Mandarin, Simplified)",
	"Chinese (Cantonese, Traditional)",
	"Chinese (Taiwanese Mandarin, Traditional)",
	"Croatian (Croatia)",
	"Czech (Czechia)",
	"Danish (Denmark)",
	"Dutch (Netherlands)",
	"Dutch (Belgium)",
	"English (United States)",
	"English (UK)",
	"English (India)",
	"Filipino (Philippines)",
	"Finnish (Finland)",
	"French (France)",
	"French (Canada)",
	"German (Germany)",
	"German (Austria)",
	"Greek (Greece)",
	"Gujarati (India)",
	"Hebrew (Israel)",
	"Hindi (India)",
	"Hungarian (Hungary)",
	"Indonesian (Indonesia)",
	"Italian (Italy)",
	"Japanese (Japan)",
	"Kannada (India)",
	"Korean (Korea)",
	"Malay (Malaysia)",
	"Malayalam (India)",
	"Marathi (India)",
	"Norwegian Bokmål (Norway)",
	"Persian (Iran)",
	"Polish (Poland)",
	"Portuguese (Brazil)",
	"Portuguese (Portugal)",
	"Romanian (Romania)",
	"Russian (Russia)",
	"Spanish (Spain)",
	"Spanish (Mexico)",
	"Spanish (United States)",
	"Swedish (Sweden)",
	"Tamil (India)",
	"Telugu (India)",
	"Thai (Thailand)",
	"Turkish (Türkiye)",
	"Ukrainian (Ukraine)",
	"Urdu (India)",
	"Vietnamese (Vietnam)",
	"Welsh (United Kingdom)",
];

/** Quick-pick target languages (English → …) */
const SPOTLIGHT_TARGET_LANGS = [
	"Spanish",
	"French",
	"Hindi",
	"Italian",
	"German",
	"Japanese",
	"Portuguese",
	"Korean",
	"Arabic",
	"Chinese",
];

/** Flag emoji for language label (best-effort by name) */
function flagForLanguageName(name) {
	if (!name) return "🌐";
	if (LANG_FLAG_EXACT[name]) return LANG_FLAG_EXACT[name];
	const n = name.toLowerCase();
	if (n.includes("welsh")) return "🇬🇧";
	if (
		n.includes("english (india)") ||
		(n.includes("bengali") && n.includes("india"))
	)
		return "🇮🇳";
	if (n.includes("hindi")) return "🇮🇳";
	if (
		n.includes("english (uk)") ||
		(n.includes("united kingdom") && n.includes("english"))
	)
		return "🇬🇧";
	if (n.includes("english (united states)") || n.includes("english (us)"))
		return "🇺🇸";
	if (n.startsWith("english")) return "🇬🇧";
	if (n.includes("spanish"))
		return n.includes("mexico")
			? "🇲🇽"
			: n.includes("united states")
				? "🇪🇸"
				: "🇪🇸";
	if (n.includes("french"))
		return n.includes("canada") ? "🇨🇦" : n.includes("france") ? "🇫🇷" : "🇫🇷";
	if (n.includes("german")) return n.includes("austria") ? "🇦🇹" : "🇩🇪";
	if (n.includes("italian")) return "🇮🇹";
	if (n.includes("portuguese")) return n.includes("brazil") ? "🇧🇷" : "🇵🇹";
	if (n.includes("dutch")) return n.includes("belgium") ? "🇧🇪" : "🇳🇱";
	if (n.includes("polish")) return "🇵🇱";
	if (n.includes("russian")) return "🇷🇺";
	if (n.includes("ukrainian")) return "🇺🇦";
	if (n.includes("chinese"))
		return n.includes("taiwan") ? "🇹🇼" : n.includes("cantonese") ? "🇭🇰" : "🇨🇳";
	if (n.includes("mandarin")) return "🇨🇳";
	if (n.includes("japanese")) return "🇯🇵";
	if (n.includes("korean")) return "🇰🇷";
	if (n.includes("arabic"))
		return n.includes("egypt")
			? "🇪🇬"
			: n.includes("saudi")
				? "🇸🇦"
				: n.includes("uae")
					? "🇦🇪"
					: "🇸🇦";
	if (n.includes("hindi")) return "🇮🇳";
	if (n.includes("turkish")) return "🇹🇷";
	if (n.includes("vietnamese")) return "🇻🇳";
	if (n.includes("thai")) return "🇹🇭";
	if (n.includes("indonesian")) return "🇮🇩";
	if (n.includes("filipino") || n.includes("tagalog")) return "🇵🇭";
	if (n.includes("swedish")) return "🇸🇪";
	if (n.includes("norwegian")) return "🇳🇴";
	if (n.includes("danish")) return "🇩🇰";
	if (n.includes("finnish")) return "🇫🇮";
	if (n.includes("greek")) return "🇬🇷";
	if (n.includes("hebrew")) return "🇮🇱";
	if (n.includes("persian") || n.includes("farsi")) return "🇮🇷";
	if (n.includes("romanian")) return "🇷🇴";
	if (n.includes("czech")) return "🇨🇿";
	if (n.includes("hungarian")) return "🇭🇺";
	if (n.includes("croatian")) return "🇭🇷";
	if (n.includes("slovak")) return "🇸🇰";
	if (n.includes("bulgarian")) return "🇧🇬";
	if (n.includes("tamil")) return "🇮🇳";
	if (n.includes("telugu")) return "🇮🇳";
	if (n.includes("malayalam")) return "🇮🇳";
	if (n.includes("kannada")) return "🇮🇳";
	if (n.includes("marathi")) return "🇮🇳";
	if (n.includes("gujarati")) return "🇮🇳";
	if (n.includes("urdu")) return "🇵🇰";
	if (n.includes("bengali")) return "🇧🇩";
	if (n.includes("bangla")) return "🇧🇩";
	if (n.includes("malay")) return "🇲🇾";
	if (n.includes("afrikaans")) return "🇿🇦";
	if (n.includes("albanian")) return "🇦🇱";
	if (n.includes("amharic")) return "🇪🇹";
	if (n.includes("armenian")) return "🇦🇲";
	if (n.includes("catalan")) return "🇪🇸";
	if (n.includes("latin america")) return "🌐";
	return "🌐";
}

const LANG_FLAG_EXACT = {
	English: "🇬🇧",
	Spanish: "🇪🇸",
	French: "🇫🇷",
	Hindi: "🇮🇳",
	Italian: "🇮🇹",
	German: "🇩🇪",
	Polish: "🇵🇱",
	Portuguese: "🇵🇹",
	Chinese: "🇨🇳",
	Japanese: "🇯🇵",
	Dutch: "🇳🇱",
	Turkish: "🇹🇷",
	Korean: "🇰🇷",
	Danish: "🇩🇰",
	Arabic: "🇸🇦",
	Romanian: "🇷🇴",
	Mandarin: "🇨🇳",
	Filipino: "🇵🇭",
	Swedish: "🇸🇪",
	Indonesian: "🇮🇩",
	Ukrainian: "🇺🇦",
	Greek: "🇬🇷",
	Czech: "🇨🇿",
	Bulgarian: "🇧🇬",
	Malay: "🇲🇾",
	Slovak: "🇸🇰",
	Croatian: "🇭🇷",
	Tamil: "🇮🇳",
	Finnish: "🇫🇮",
	Russian: "🇷🇺",
	Vietnamese: "🇻🇳",
};

function aggregateJobStatus(jobs) {
	if (!jobs || !jobs.length) return "queued";
	if (jobs.some((j) => j.status === "error")) return "error";
	if (jobs.every((j) => j.status === "done")) return "done";
	return "processing";
}

function sidebarTitle(v) {
	if (v.label && String(v.label).trim()) return v.label.trim();
	const jobs = v.jobs || [];
	if (jobs.length === 0) return "Translation";
	if (jobs.length === 1) return jobs[0].lang || "Translation";
	return `${jobs[0].lang} +${jobs.length - 1}`;
}

// ─── Status steps config ─────────────────────────────────────────────────────
const STEPS = [
	{ key: "uploading", label: "Upload", Icon: Upload },
	{ key: "queued", label: "Queued", Icon: Clock },
	{ key: "processing", label: "Processing", Icon: Film },
	{ key: "translating", label: "Translating", Icon: Globe },
	{ key: "done", label: "Complete", Icon: CheckCircle },
];

// ─── Global styles injected once ────────────────────────────────────────────
export const GlobalStyles = () => (
	<style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #f5f4f0; color: #18181b; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse-amber { 0%,100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.25); } 50% { box-shadow: 0 0 0 8px rgba(234,88,12,0); } }
    .spin { animation: spin 1s linear infinite; }
    .pulse { animation: pulse-amber 1.8s ease-in-out infinite; }
    .vaantra-font { font-family: 'Lora', Georgia, serif; }
    .sans { font-family: 'DM Sans', system-ui, sans-serif; }
    .mono { font-family: 'DM Mono', 'Courier New', monospace; }
    a { text-decoration: none; color: inherit; }
    button { cursor: pointer; border: none; background: none; font-family: inherit; }
    input, textarea { font-family: inherit; }
    .hover-amber:hover { background: rgba(234,88,12,0.12) !important; }
    .hover-surface:hover { background: rgba(0,0,0,0.04) !important; }
    .upload-limits-details summary::-webkit-details-marker { display: none; }
    .upload-limits-details summary .accordion-chevron { transition: transform 0.2s ease; }
    .upload-limits-details[open] summary .accordion-chevron { transform: rotate(180deg); }
    @keyframes app-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
    .app-skeleton-pulse { animation: app-skeleton-pulse 1.1s ease-in-out infinite; }
  `}</style>
);

/** LLM dropdown for video + voice translate (uses {@link TRANSLATE_LLM_OPTIONS}). */
function LlmModelSelect({ id, value, onChange }) {
	return (
		<div style={{ marginBottom: 12 }}>
			<label
				htmlFor={id}
				style={{
					display: "block",
					fontSize: 12,
					color: "#52525b",
					marginBottom: 8,
				}}
			>
				Translation model
			</label>
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					width: "100%",
					padding: "10px 12px",
					borderRadius: 10,
					fontSize: 13,
					fontWeight: 500,
					background: "#fff",
					border: "1px solid rgba(0,0,0,0.1)",
					color: "#18181b",
					outline: "none",
					cursor: "pointer",
					appearance: "none",
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
					backgroundRepeat: "no-repeat",
					backgroundPosition: "right 10px center",
					paddingRight: 36,
				}}
				onFocus={(e) => (e.target.style.borderColor = "rgba(234,88,12,0.45)")}
				onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
			>
				{TRANSLATE_LLM_OPTIONS.map((o) => (
					<option key={o.id} value={o.id}>
						{o.label}
						{o.hint ? ` — ${o.hint}` : ""}
					</option>
				))}
			</select>
			<p
				style={{
					fontSize: 11,
					color: "#a1a1aa",
					marginTop: 6,
					lineHeight: 1.45,
				}}
			>
				Gemini is the default when no model is sent. Other options use
				OpenRouter-style model ids.
			</p>
		</div>
	);
}

/** Multi-select target languages (checkboxes + search). */
function LangMultiSelect({ selected, onChange, fullWidth = false }) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const filtered = LANGS.filter((l) =>
		l.toLowerCase().includes(q.toLowerCase()),
	);
	const ref = useRef(null);
	useEffect(() => {
		const h = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, []);
	const toggle = (lang) => {
		if (selected.includes(lang)) onChange(selected.filter((x) => x !== lang));
		else onChange([...selected, lang]);
	};
	const summary =
		selected.length === 0
			? "Target languages"
			: selected.length === 1
				? selected[0]
				: `${selected.length} languages`;
	return (
		<div
			ref={ref}
			style={{ position: "relative", width: fullWidth ? "100%" : undefined }}
		>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					width: fullWidth ? "100%" : 220,
					padding: "11px 14px",
					borderRadius: 12,
					background: "#fff",
					border: "1px solid rgba(0,0,0,0.1)",
					color: selected.length ? "#18181b" : "#71717a",
					fontSize: 14,
				}}
			>
				<span
					style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}
					aria-hidden
				>
					{selected.length === 1 ? flagForLanguageName(selected[0]) : "🌐"}
				</span>
				<span
					style={{
						flex: 1,
						textAlign: "left",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{summary}
				</span>
				<ChevronDown
					size={13}
					style={{
						color: "#71717a",
						flexShrink: 0,
						transform: open ? "rotate(180deg)" : "none",
						transition: "transform 0.2s",
					}}
				/>
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -6, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -6, scale: 0.97 }}
						transition={{ duration: 0.14 }}
						style={{
							position: "absolute",
							top: "calc(100% + 6px)",
							left: 0,
							width: fullWidth ? "100%" : 280,
							zIndex: 200,
							background: "#fff",
							border: "1px solid rgba(0,0,0,0.1)",
							borderRadius: 14,
							overflow: "hidden",
							boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
						}}
					>
						<div style={{ padding: "8px 8px 4px" }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									background: "rgba(0,0,0,0.04)",
									borderRadius: 8,
									padding: "7px 10px",
								}}
							>
								<Search size={12} style={{ color: "#71717a" }} />
								<input
									autoFocus
									value={q}
									onChange={(e) => setQ(e.target.value)}
									placeholder="Search…"
									style={{
										background: "none",
										border: "none",
										outline: "none",
										color: "#18181b",
										fontSize: 13,
										width: "100%",
									}}
								/>
							</div>
						</div>
						<div
							style={{
								maxHeight: 230,
								overflowY: "auto",
								padding: "4px 6px 6px",
							}}
						>
							{filtered.map((lang) => {
								const on = selected.includes(lang);
								return (
									<button
										key={lang}
										type="button"
										onClick={(e) => {
											e.preventDefault();
											toggle(lang);
										}}
										style={{
											width: "100%",
											display: "flex",
											alignItems: "center",
											textAlign: "left",
											padding: "8px 10px",
											borderRadius: 8,
											fontSize: 13,
											color: on ? "#c2410c" : "#52525b",
											background: on ? "rgba(234,88,12,0.08)" : "transparent",
											transition: "background 0.1s",
											gap: 10,
										}}
										onMouseEnter={(e) => {
											if (!on)
												e.currentTarget.style.background = "rgba(0,0,0,0.04)";
										}}
										onMouseLeave={(e) => {
											if (!on) e.currentTarget.style.background = "transparent";
										}}
									>
										<span
											style={{
												width: 18,
												height: 18,
												borderRadius: 4,
												border: `2px solid ${on ? "#ea580c" : "rgba(0,0,0,0.2)"}`,
												background: on ? "#ea580c" : "transparent",
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center",
												flexShrink: 0,
											}}
											aria-hidden
										>
											{on && <Check size={11} strokeWidth={3} color="#fff" />}
										</span>
										<span style={{ marginRight: 4, fontSize: 15 }} aria-hidden>
											{flagForLanguageName(lang)}
										</span>
										<span style={{ flex: 1 }}>{lang}</span>
									</button>
								);
							})}
							{!filtered.length && (
								<p
									style={{
										color: "#a1a1aa",
										fontSize: 13,
										padding: "10px 12px",
									}}
								>
									No results
								</p>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Status Progress Visualizer ──────────────────────────────────────────────
function StatusProgress({ status, jobId }) {
	const curIdx = STEPS.findIndex((s) => s.key === status);
	const isErr = status === "error";
	return (
		<div style={{ padding: "20px 0 8px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					marginBottom: 20,
				}}
			>
				{STEPS.map(({ key, label, Icon }, i) => {
					const done = !isErr && (i < curIdx || status === "done");
					const active = !isErr && i === curIdx;
					const future = i > curIdx || isErr;
					return (
						<div
							key={key}
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 6,
								position: "relative",
							}}
						>
							{i > 0 && (
								<div
									style={{
										position: "absolute",
										top: 16,
										right: "50%",
										width: "100%",
										height: 2,
										background: done
											? "linear-gradient(90deg, #ea580c, #ea580c)"
											: "rgba(0,0,0,0.08)",
										transition: "background 0.6s",
										zIndex: 0,
									}}
								/>
							)}
							<motion.div
								animate={active ? { scale: [1, 1.12, 1] } : {}}
								transition={{ repeat: Infinity, duration: 1.8 }}
								style={{
									width: 34,
									height: 34,
									borderRadius: "50%",
									zIndex: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: done
										? "#ea580c"
										: active
											? "rgba(234,88,12,0.15)"
											: "rgba(0,0,0,0.04)",
									border: `2px solid ${done ? "#ea580c" : active ? "#ea580c" : "rgba(0,0,0,0.1)"}`,
									transition: "all 0.4s",
									...(active
										? { animation: "pulse-amber 1.8s ease-in-out infinite" }
										: {}),
								}}
							>
								{active ? (
									<Loader2
										size={13}
										style={{ color: "#ea580c" }}
										className="spin"
									/>
								) : (
									<Icon
										size={13}
										style={{
											color: done ? "#fff" : future ? "#d4d4d8" : "#ea580c",
										}}
									/>
								)}
							</motion.div>
							<span
								style={{
									fontSize: 10,
									fontWeight: 600,
									letterSpacing: "0.06em",
									textTransform: "uppercase",
									color: done || active ? "#ea580c" : "#a1a1aa",
									fontFamily: "'DM Mono', monospace",
									whiteSpace: "nowrap",
								}}
							>
								{label}
							</span>
						</div>
					);
				})}
			</div>

			<motion.div
				key={status}
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				style={{
					padding: "18px 20px",
					borderRadius: 12,
					textAlign: "center",
					background: isErr ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.03)",
					border: `1px solid ${isErr ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.06)"}`,
				}}
			>
				{isErr ? (
					<>
						<AlertCircle
							size={22}
							style={{ color: "#ef4444", marginBottom: 6 }}
						/>
						<p style={{ color: "#ef4444", fontWeight: 500, fontSize: 14 }}>
							Translation failed
						</p>
						<p style={{ color: "#71717a", fontSize: 13, marginTop: 4 }}>
							Check the video URL or try again
						</p>
					</>
				) : status === "done" ? (
					<>
						<CheckCircle
							size={22}
							style={{ color: "#ea580c", marginBottom: 6 }}
						/>
						<p style={{ color: "#c2410c", fontWeight: 500, fontSize: 14 }}>
							Translation complete!
						</p>
						{jobId && (
							<p
								style={{
									color: "#71717a",
									fontSize: 11,
									marginTop: 4,
									fontFamily: "DM Mono",
								}}
							>
								job: {jobId}
							</p>
						)}
					</>
				) : (
					<>
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								gap: 4,
								marginBottom: 10,
							}}
						>
							{[0, 1, 2].map((i) => (
								<motion.div
									key={i}
									animate={{ opacity: [0.2, 1, 0.2] }}
									transition={{
										repeat: Infinity,
										duration: 1.4,
										delay: i * 0.2,
									}}
									style={{
										width: 5,
										height: 5,
										borderRadius: "50%",
										background: "#ea580c",
									}}
								/>
							))}
						</div>
						<p style={{ color: "#52525b", fontSize: 13 }}>
							{status === "uploading" && "Uploading your video…"}
							{status === "queued" && "Waiting in the translation queue…"}
							{status === "processing" && "Analyzing speech and audio tracks…"}
							{status === "translating" && "Dubbing with AI voice cloning…"}
						</p>
						<p
							style={{
								color: "#a1a1aa",
								fontSize: 12,
								marginTop: 8,
								lineHeight: 1.4,
							}}
						>
							This can take a few minutes—hang tight.
						</p>
						{jobId && (
							<p
								style={{
									color: "#71717a",
									fontSize: 11,
									marginTop: 6,
									fontFamily: "DM Mono",
								}}
							>
								{jobId}
							</p>
						)}
					</>
				)}
			</motion.div>
		</div>
	);
}

function CopyTextBlock({
	label,
	text,
	audioSrc,
	audioDownloadName,
	audioPreviewLabel,
}) {
	const [copied, setCopied] = useState(false);
	return (
		<div style={{ marginBottom: 16 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 8,
					flexWrap: "wrap",
					gap: 8,
				}}
			>
				<span style={{ fontSize: 12, fontWeight: 600, color: "#52525b" }}>
					{label}
				</span>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<button
						type="button"
						onClick={() => {
							navigator.clipboard?.writeText(text || "");
							setCopied(true);
							setTimeout(() => setCopied(false), 2000);
						}}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							fontSize: 12,
							fontWeight: 500,
							color: copied ? "#16a34a" : "#ea580c",
						}}
					>
						<Copy size={14} />
						{copied ? "Copied" : "Copy"}
					</button>
					{audioSrc ? (
						<a
							href={audioSrc}
							download={audioDownloadName || "audio"}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 6,
								fontSize: 12,
								fontWeight: 500,
								color: "#c2410c",
							}}
						>
							<Download size={14} aria-hidden />
							Download audio
						</a>
					) : null}
				</div>
			</div>
			{audioSrc ? (
				<div style={{ marginBottom: 10 }}>
					{audioPreviewLabel ? (
						<p
							style={{
								fontSize: 11,
								fontWeight: 600,
								color: "#71717a",
								marginBottom: 6,
							}}
						>
							{audioPreviewLabel}
						</p>
					) : null}
					<audio
						controls
						src={audioSrc}
						preload="metadata"
						style={{ width: "100%", height: 40, borderRadius: 8 }}
					>
						Your browser does not support audio playback.
					</audio>
				</div>
			) : null}
			<textarea
				readOnly
				value={text || ""}
				style={{
					width: "100%",
					minHeight: 120,
					padding: "12px 14px",
					borderRadius: 10,
					border: "1px solid rgba(0,0,0,0.1)",
					fontSize: 13,
					lineHeight: 1.55,
					color: "#18181b",
					background: "#fafaf9",
					resize: "vertical",
				}}
			/>
		</div>
	);
}

// ─── Translate Form ──────────────────────────────────────────────────────────
/**
 * Video-translate API auth: `NEXT_PUBLIC_TRANSLATE_API_URL` optional static Bearer,
 * otherwise Firebase ID token. Adds `X-User-Id` when a user is signed in.
 */
async function getTranslateAuthHeaders() {
	const env = process.env.NEXT_PUBLIC_TRANSLATE_API_TOKEN?.trim();
	const headers = {};
	if (env) {
		headers.Authorization = `Bearer ${env}`;
	}
	const user = auth.currentUser;
	if (user) {
		if (!env) {
			const idToken = await user.getIdToken();
			headers.Authorization = `Bearer ${idToken}`;
		}
		headers["X-User-Id"] = user.uid;
	}
	return headers;
}

/**
 * One job: caption SSE (`/api/video-translate/caption?stream=1`) for progress + result.
 * `applyPatch` receives `{ jobId, lang, ...partialJob }`.
 */
function runCaptionSseForJob({
	jobId,
	lang,
	getTranslateAuthHeaders,
	applyPatch,
	signal,
}) {
	let merged = {};
	let latestStatus = "queued";

	return subscribeCaptionStatusStream(
		jobId,
		getTranslateAuthHeaders,
		{
			onProgress: (raw) => {
				latestStatus = normalizeStatus(raw);
				applyPatch({ jobId, lang, status: latestStatus });
			},
			onCaption: (_evt, inner) => {
				const fields = extractJobFieldsFromGetResponse({ data: inner });
				merged = { ...merged, ...fields };
				applyPatch({
					jobId,
					lang,
					status: latestStatus || "translating",
					...fields,
				});
			},
			onError: () => {},
			onDone: async (ok, meta) => {
				if (ok) {
					if (!merged.resultUrl) {
						try {
							const j = await fetchTranslateJobStatus(
								jobId,
								getTranslateAuthHeaders,
							);
							merged = { ...merged, ...j.fields };
						} catch {
							/* keep merged */
						}
					}
					applyPatch({
						jobId,
						lang,
						status: "done",
						...merged,
					});
				} else {
					if (meta?.incomplete) {
						try {
							const j = await fetchTranslateJobStatus(
								jobId,
								getTranslateAuthHeaders,
							);
							if (j.status === "done" || j.fields.resultUrl) {
								applyPatch({
									jobId,
									lang,
									status: j.status,
									...j.fields,
								});
								return;
							}
						} catch {
							/* fall through */
						}
					}
					applyPatch({
						jobId,
						lang,
						status: "error",
						resultUrl: null,
					});
				}
			},
		},
		signal,
	).catch((e) => {
		if (e?.name === "AbortError") return;
		console.error(e);
		void (async () => {
			try {
				const j = await fetchTranslateJobStatus(jobId, getTranslateAuthHeaders);
				applyPatch({
					jobId,
					lang,
					status: j.status,
					...j.fields,
				});
			} catch {
				applyPatch({
					jobId,
					lang,
					status: "error",
					resultUrl: null,
				});
			}
		})();
	});
}

/**
 * Text and/or audio → transcript + TTS per language via `POST /api/voice-translate`.
 * Persists completed jobs to the same list as video jobs (localStorage) when `onVoiceJobCreated` is set.
 */
function mergeTranscriptIntoPrompt(prev, incoming) {
	const p = (prev || "").trim();
	const t = (incoming || "").trim();
	if (!t) return prev || "";
	if (!p) return t;
	if (p.includes(t)) return p;
	return `${p}\n\n${t}`;
}

function VoiceTranslateForm({ compact = false, onVoiceJobCreated }) {
	const [text, setText] = useState("");
	const [selectedLangs, setSelectedLangs] = useState([]);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);
	const [results, setResults] = useState(null);
	const [uploadedFile, setUploadedFile] = useState(null);
	const [recordedBlob, setRecordedBlob] = useState(null);
	const [isRecording, setIsRecording] = useState(false);
	const [transcribing, setTranscribing] = useState(false);
	const audioInputRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const streamRef = useRef(null);
	const recordChunksRef = useRef([]);
	const speechRecRef = useRef(null);
	const speechFinalRef = useRef("");
	const textAtRecordStartRef = useRef("");
	const speechHeardRef = useRef(false);
	const [llmChoice, setLlmChoice] = useState(() => {
		if (typeof window === "undefined") return "gemini";
		try {
			const s = localStorage.getItem(TRANSLATE_LLM_STORAGE_KEY);
			if (s && TRANSLATE_LLM_OPTIONS.some((o) => o.id === s)) return s;
		} catch {
			/* ignore */
		}
		return "gemini";
	});

	useEffect(() => {
		try {
			localStorage.setItem(TRANSLATE_LLM_STORAGE_KEY, llmChoice);
		} catch {
			/* ignore */
		}
	}, [llmChoice]);

	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((t) => t.stop());
			}
			try {
				speechRecRef.current?.stop?.();
			} catch {
				/* ignore */
			}
		};
	}, []);

	const startRecording = async () => {
		setErr(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			recordChunksRef.current = [];
			textAtRecordStartRef.current = text;
			speechFinalRef.current = "";
			speechHeardRef.current = false;

			const SR =
				typeof window !== "undefined" &&
				(window.SpeechRecognition || window.webkitSpeechRecognition);
			if (SR) {
				try {
					speechRecRef.current?.stop?.();
				} catch {
					/* ignore */
				}
				try {
					const rec = new SR();
					rec.continuous = true;
					rec.interimResults = true;
					rec.lang = navigator.language || "en-US";
					rec.onresult = (event) => {
						let interim = "";
						for (let i = event.resultIndex; i < event.results.length; i++) {
							const tr = event.results[i][0].transcript;
							if (event.results[i].isFinal) {
								speechFinalRef.current += tr;
								speechHeardRef.current = true;
							} else {
								interim += tr;
							}
						}
						const base = textAtRecordStartRef.current;
						const spoken = speechFinalRef.current + interim;
						if (spoken.trim().length) speechHeardRef.current = true;
						const sep =
							base && spoken.trim() ? (base.endsWith("\n") ? "" : "\n") : "";
						setText(base + sep + spoken);
					};
					rec.onerror = () => {};
					rec.start();
					speechRecRef.current = rec;
				} catch (srErr) {
					console.warn("Speech recognition:", srErr);
				}
			}

			const mime =
				typeof MediaRecorder !== "undefined" &&
				MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")
					? "audio/webm;codecs=opus"
					: "audio/webm";
			const mr = new MediaRecorder(stream, { mimeType: mime });
			mediaRecorderRef.current = mr;
			mr.ondataavailable = (e) => {
				if (e.data.size > 0) recordChunksRef.current.push(e.data);
			};
			mr.onstop = () => {
				const blob = new Blob(recordChunksRef.current, {
					type: mr.mimeType || "audio/webm",
				});
				setRecordedBlob(blob);
				setUploadedFile(null);
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((t) => t.stop());
					streamRef.current = null;
				}
				setIsRecording(false);
				try {
					speechRecRef.current?.stop?.();
				} catch {
					/* ignore */
				}
				speechRecRef.current = null;

				void (async () => {
					if (speechHeardRef.current) return;
					setTranscribing(true);
					try {
						const t = await transcribeAudioBlob(blob, getTranslateAuthHeaders);
						if (t) setText((prev) => mergeTranscriptIntoPrompt(prev, t));
					} catch {
						/* optional /api/transcribe */
					} finally {
						setTranscribing(false);
					}
				})();
			};
			mr.start(200);
			setIsRecording(true);
		} catch (e) {
			console.error(e);
			setErr("Microphone access denied or unavailable.");
		}
	};

	const stopRecording = () => {
		try {
			speechRecRef.current?.stop?.();
		} catch {
			/* ignore */
		}
		speechRecRef.current = null;
		const mr = mediaRecorderRef.current;
		if (mr && mr.state !== "inactive") mr.stop();
	};

	const onPickAudioFile = (e) => {
		const f = e.target.files?.[0];
		e.target.value = "";
		if (!f) return;
		setUploadedFile(f);
		setRecordedBlob(null);
		void (async () => {
			setTranscribing(true);
			setErr(null);
			try {
				const t = await transcribeAudioBlob(f, getTranslateAuthHeaders);
				if (t) setText((prev) => mergeTranscriptIntoPrompt(prev, t));
			} catch (err) {
				console.warn("Transcribe:", err);
			} finally {
				setTranscribing(false);
			}
		})();
	};

	const submit = async () => {
		const langs = [...selectedLangs].sort();
		if (langs.length === 0) {
			setErr("Select at least one target language.");
			return;
		}
		const hasText = Boolean(text.trim());
		const hasAudio = Boolean(uploadedFile || recordedBlob);
		if (!hasText && !hasAudio) {
			setErr("Enter text, record audio, or upload an audio file.");
			return;
		}

		setBusy(true);
		setErr(null);
		setResults(null);
		const url = getVoiceTranslatePostUrl();
		const llmOpt = TRANSLATE_LLM_OPTIONS.find((o) => o.id === llmChoice);
		const llmModel = llmOpt?.apiValue ?? null;
		try {
			let res;
			if (hasAudio) {
				const fd = new FormData();
				const file =
					uploadedFile ||
					new File([recordedBlob], "recording.webm", {
						type: recordedBlob.type || "audio/webm",
					});
				fd.append("audio", file);
				fd.append("languages", JSON.stringify(langs));
				fd.append("include_audio", "true");
				if (hasText) fd.append("text", text.trim());
				if (llmModel) {
					fd.append("llm_model", llmModel);
					fd.append("model", llmModel);
				}
				const auth = await getTranslateAuthHeaders();
				res = await fetch(url, {
					method: "POST",
					headers: auth,
					body: fd,
				});
			} else {
				res = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(await getTranslateAuthHeaders()),
					},
					body: JSON.stringify({
						text: text.trim(),
						languages: langs,
						include_audio: true,
						...(llmModel ? { llm_model: llmModel, model: llmModel } : {}),
					}),
				});
			}
			const data = await res.json().catch(() => ({}));
			const apiErr = getApiErrorMessage(data);
			if (apiErr || !res.ok) {
				setErr(apiErr || `Request failed (${res.status})`);
				return;
			}
			let batch = extractVoiceTranslateBatchResponse(data);
			if (!batch.length) {
				const one = extractVoiceTranslateResponse(data);
				if (one.transcript || one.audioUrl) {
					batch = [
						{
							lang: one.outputLanguage || langs[0] || "—",
							transcript: one.transcript,
							audioUrl: one.audioUrl,
						},
					];
				}
			}
			if (!batch.length) {
				setErr("Could not read transcript or audio from the API response.");
				return;
			}
			setResults(batch);

			if (onVoiceJobCreated) {
				const gid =
					typeof crypto !== "undefined" && crypto.randomUUID
						? crypto.randomUUID()
						: `grp_${Date.now()}`;
				const jobs = batch.map((r, idx) => ({
					id: `voice_${gid}_${idx}`,
					lang: r.lang,
					status: "done",
					createdAt: new Date().toISOString(),
					resultUrl: r.audioUrl ?? null,
					translatedTranscript: r.transcript ?? null,
					caption: r.transcript ?? null,
					outputLanguage: r.lang,
					transcriptOriginal: hasText ? text.trim() : null,
					sourceVideoUrl: null,
					videoTranslateId: `voice_${gid}_${idx}`,
				}));
				onVoiceJobCreated({
					id: gid,
					type: "audio",
					label: `Voice · ${batch.map((b) => b.lang).join(", ")}`,
					jobs,
					createdAt: new Date().toISOString(),
					sourceVideoUrl: null,
				});
			}
		} catch (e) {
			console.error(e);
			setErr(e?.message || "Something went wrong");
		} finally {
			setBusy(false);
		}
	};

	const hasAudio = Boolean(uploadedFile || recordedBlob);
	const canSubmit = Boolean(
		(text.trim() || hasAudio) &&
		selectedLangs.length > 0 &&
		!busy &&
		!transcribing,
	);

	return (
		<div>
			<label
				style={{
					display: "block",
					fontSize: 12,
					fontWeight: 600,
					color: "#52525b",
					marginBottom: 8,
				}}
			>
				Text to translate (optional if you use audio)
			</label>
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Type or paste text… While recording, live captions appear here (Chrome / Edge). Upload or finish recording to auto-fill from your server if configured."
				rows={compact ? 4 : 6}
				style={{
					width: "100%",
					padding: "12px 14px",
					borderRadius: 12,
					border: "1px solid rgba(0,0,0,0.1)",
					fontSize: 14,
					lineHeight: 1.5,
					resize: "vertical",
					marginBottom: 12,
					fontFamily: "inherit",
				}}
			/>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 8,
					marginBottom: 14,
					alignItems: "center",
				}}
			>
				{isRecording ? (
					<button
						type="button"
						onClick={stopRecording}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							padding: "9px 14px",
							borderRadius: 10,
							fontSize: 13,
							fontWeight: 600,
							background: "rgba(239,68,68,0.12)",
							color: "#b91c1c",
							border: "1px solid rgba(239,68,68,0.35)",
						}}
					>
						<Square size={14} fill="currentColor" aria-hidden />
						Stop recording
					</button>
				) : (
					<button
						type="button"
						onClick={startRecording}
						disabled={busy || transcribing}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							padding: "9px 14px",
							borderRadius: 10,
							fontSize: 13,
							fontWeight: 600,
							background: "rgba(234,88,12,0.1)",
							color: "#c2410c",
							border: "1px solid rgba(234,88,12,0.35)",
							opacity: busy || transcribing ? 0.5 : 1,
						}}
					>
						<Mic size={16} aria-hidden />
						Record audio
					</button>
				)}
				<button
					type="button"
					onClick={() => audioInputRef.current?.click()}
					disabled={busy || isRecording || transcribing}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 8,
						padding: "9px 14px",
						borderRadius: 10,
						fontSize: 13,
						fontWeight: 600,
						background: "rgba(0,0,0,0.04)",
						color: "#52525b",
						border: "1px solid rgba(0,0,0,0.1)",
						opacity: busy || isRecording || transcribing ? 0.5 : 1,
					}}
				>
					<Upload size={16} aria-hidden />
					Upload audio
				</button>
				<input
					ref={audioInputRef}
					type="file"
					accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
					style={{ display: "none" }}
					onChange={onPickAudioFile}
				/>
				{transcribing && (
					<span
						style={{
							fontSize: 12,
							color: "#c2410c",
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<Loader2 size={14} className="spin" aria-hidden />
						Transcribing…
					</span>
				)}
				{(uploadedFile || recordedBlob) && !transcribing && (
					<span style={{ fontSize: 12, color: "#71717a" }}>
						{uploadedFile?.name || "Recorded clip ready"}
					</span>
				)}
			</div>
			<LlmModelSelect
				id="voice-translate-llm-select"
				value={llmChoice}
				onChange={setLlmChoice}
			/>
			<label
				style={{
					display: "block",
					fontSize: 12,
					fontWeight: 600,
					color: "#52525b",
					marginBottom: 8,
				}}
			>
				Target languages
			</label>
			<div style={{ marginBottom: 16 }}>
				<LangMultiSelect
					selected={selectedLangs}
					onChange={setSelectedLangs}
					fullWidth
				/>
			</div>
			<button
				type="button"
				onClick={submit}
				disabled={!canSubmit}
				style={{
					width: "100%",
					padding: "12px 16px",
					borderRadius: 12,
					fontSize: 14,
					fontWeight: 600,
					background: canSubmit ? "#ea580c" : "rgba(0,0,0,0.08)",
					color: canSubmit ? "#fff" : "#a1a1aa",
					cursor: canSubmit ? "pointer" : "not-allowed",
				}}
			>
				{busy ? (
					<span
						style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
					>
						<Loader2 size={16} className="spin" />
						Generating…
					</span>
				) : (
					"Translate & generate audio"
				)}
			</button>
			{err && (
				<p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{err}</p>
			)}
			{results && results.length > 0 && (
				<div
					style={{
						marginTop: 20,
						display: "flex",
						flexDirection: "column",
						gap: 14,
					}}
				>
					{results.map((r, i) => (
						<div
							key={`${r.lang}-${i}`}
							style={{
								padding: 16,
								borderRadius: 12,
								background: "rgba(234,88,12,0.06)",
								border: "1px solid rgba(234,88,12,0.2)",
							}}
						>
							<p
								style={{
									fontSize: 11,
									fontWeight: 600,
									color: "#c2410c",
									marginBottom: 8,
									textTransform: "uppercase",
									letterSpacing: "0.06em",
								}}
							>
								{r.lang}
							</p>
							<p
								style={{
									fontSize: 14,
									lineHeight: 1.55,
									color: "#18181b",
									whiteSpace: "pre-wrap",
									marginBottom: r.audioUrl ? 12 : 0,
								}}
							>
								{r.transcript || "—"}
							</p>
							{r.audioUrl ? (
								<>
									<audio
										controls
										src={r.audioUrl}
										preload="metadata"
										style={{
											width: "100%",
											height: 40,
											borderRadius: 8,
											marginBottom: 8,
										}}
									/>
									<a
										href={r.audioUrl}
										download
										target="_blank"
										rel="noopener noreferrer"
										style={{
											display: "inline-flex",
											alignItems: "center",
											gap: 6,
											fontSize: 13,
											fontWeight: 600,
											color: "#c2410c",
										}}
									>
										<Download size={14} aria-hidden />
										Download audio
									</a>
								</>
							) : null}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function NewTranslationPanel({ addVideo }) {
	const [tab, setTab] = useState("video");
	const tabBtn = (id, label, Icon) => (
		<button
			key={id}
			type="button"
			onClick={() => setTab(id)}
			style={{
				flex: 1,
				minWidth: 140,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 8,
				padding: "10px 12px",
				borderRadius: 12,
				fontSize: 13,
				fontWeight: 600,
				border:
					tab === id
						? "1px solid rgba(234,88,12,0.45)"
						: "1px solid rgba(0,0,0,0.08)",
				background: tab === id ? "rgba(234,88,12,0.1)" : "rgba(0,0,0,0.02)",
				color: tab === id ? "#c2410c" : "#71717a",
				cursor: "pointer",
			}}
		>
			{Icon ? <Icon size={16} /> : null}
			{label}
		</button>
	);
	return (
		<>
			<div
				style={{
					display: "flex",
					gap: 8,
					marginBottom: 12,
					flexWrap: "wrap",
				}}
			>
				{tabBtn("video", "Video translation", Video)}
				{tabBtn("voice", "Voice & text", Mic2)}
			</div>
			{tab === "video" ? (
				<>
					<p style={{ fontSize: 14, color: "#71717a", marginBottom: 24 }}>
						Upload a video or paste a URL to get started
					</p>
					<TranslateForm onJobCreated={addVideo} compact />
				</>
			) : (
				<>
					<p style={{ fontSize: 14, color: "#71717a", marginBottom: 16 }}>
						Convert text or audio into one or more languages—transcript and
						spoken audio. Jobs are saved to the same history as video
						translations (browser storage).
					</p>
					<VoiceTranslateForm compact onVoiceJobCreated={addVideo} />
				</>
			)}
		</>
	);
}

function TranslateForm({
	onJobCreated,
	compact = false,
	requireAuthOnSubmit = false,
	onRequireAuth,
	prefillVideoUrl = null,
	lockPrefilledUrl = false,
}) {
	const [mode, setMode] = useState("url");
	const [url, setUrl] = useState("");
	const [urlLocked, setUrlLocked] = useState(false);
	const prefillAppliedRef = useRef(null);
	const [file, setFile] = useState(null);
	const [selectedLangs, setSelectedLangs] = useState([]);
	const [busy, setBusy] = useState(false);
	/** Landing-only: poll progress when `onJobCreated` is not used */
	const [localTrack, setLocalTrack] = useState(null);
	const [drag, setDrag] = useState(false);
	const [fileError, setFileError] = useState(null);
	const [llmChoice, setLlmChoice] = useState(() => {
		if (typeof window === "undefined") return "gemini";
		try {
			const s = localStorage.getItem(TRANSLATE_LLM_STORAGE_KEY);
			if (s && TRANSLATE_LLM_OPTIONS.some((o) => o.id === s)) return s;
		} catch {
			/* ignore */
		}
		return "gemini";
	});
	const fileRef = useRef();
	const localTrackRef = useRef(null);
	localTrackRef.current = localTrack;

	useEffect(() => {
		if (!prefillVideoUrl) return;
		if (prefillAppliedRef.current === prefillVideoUrl) return;
		prefillAppliedRef.current = prefillVideoUrl;
		setMode("url");
		setUrl(prefillVideoUrl);
		setUrlLocked(Boolean(lockPrefilledUrl));
		setFile(null);
		setFileError(null);
	}, [prefillVideoUrl, lockPrefilledUrl]);

	useEffect(() => {
		try {
			localStorage.setItem(TRANSLATE_LLM_STORAGE_KEY, llmChoice);
		} catch {
			/* ignore */
		}
	}, [llmChoice]);

	const pickVideoFile = (f) => {
		if (!f) return;
		if (
			!f.type?.includes?.("video") &&
			!f.name?.match(/\.(mp4|mov|webm|mkv)$/i)
		) {
			setFileError("Please choose a video file.");
			setFile(null);
			return;
		}
		if (f.size > VIDEO_UPLOAD_MAX_BYTES) {
			setFileError(
				`This file is ${(f.size / (1024 * 1024)).toFixed(1)} MB. Maximum upload size is ${VIDEO_UPLOAD_MAX_MB} MB.`,
			);
			setFile(null);
			return;
		}
		setFileError(null);
		setFile(f);
	};

	const toggleSpotlightLang = (langName) => {
		setSelectedLangs((prev) =>
			prev.includes(langName)
				? prev.filter((x) => x !== langName)
				: [...prev, langName],
		);
	};

	/** Landing: realtime caption SSE per in-flight job (no dashboard callback) */
	useEffect(() => {
		if (!localTrack || onJobCreated) return;
		const prev = localTrackRef.current;
		if (!prev?.jobs?.length) return;
		const pending = prev.jobs.filter(
			(j) =>
				j.status !== "done" &&
				j.status !== "error" &&
				!String(j.id).startsWith("failed_") &&
				!String(j.id).startsWith("voice_"),
		);
		if (pending.length === 0) return;
		const ac = new AbortController();
		let cancelled = false;
		let groupId = prev.groupId;

		const applyPatch = (patch) => {
			if (cancelled) return;
			const { jobId, lang: _lang, ...rest } = patch;
			setLocalTrack((t) => {
				if (!t || t.groupId !== groupId) return t;
				const jobs = t.jobs.map((j) =>
					j.id === jobId ? { ...j, ...rest } : j,
				);
				return { ...t, jobs };
			});
		};

		for (const job of pending) {
			void runCaptionSseForJob({
				jobId: job.id,
				lang: job.lang,
				getTranslateAuthHeaders,
				applyPatch,
				signal: ac.signal,
			});
		}

		return () => {
			cancelled = true;
			ac.abort();
		};
	}, [localTrack?.groupId, onJobCreated]);

	const submit = async () => {
		if (
			selectedLangs.length === 0 ||
			(mode === "url" && !url.trim()) ||
			(mode === "file" && !file)
		)
			return;
		if (requireAuthOnSubmit && onRequireAuth) {
			onRequireAuth();
			return;
		}
		setBusy(true);
		const postUrl = getTranslatePostUrl();
		const langs = [...selectedLangs].sort();
		const llmOpt = TRANSLATE_LLM_OPTIONS.find((o) => o.id === llmChoice);
		const llmModel = llmOpt?.apiValue ?? null;
		const groupId =
			typeof crypto !== "undefined" && crypto.randomUUID
				? crypto.randomUUID()
				: `grp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		try {
			const results = await Promise.all(
				langs.map(async (lang) => {
					let res;
					if (mode === "url") {
						const body = {
							video_url: url.trim(),
							output_language: lang,
						};
						if (llmModel) {
							body.llm_model = llmModel;
							body.model = llmModel;
						}
						res = await fetch(postUrl, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								...(await getTranslateAuthHeaders()),
							},
							body: JSON.stringify(body),
						});
					} else {
						const fd = new FormData();
						fd.append("video", file);
						fd.append("output_language", lang);
						if (llmModel) {
							fd.append("llm_model", llmModel);
							fd.append("model", llmModel);
						}
						res = await fetch(postUrl, {
							method: "POST",
							headers: await getTranslateAuthHeaders(),
							body: fd,
						});
					}
					const data = await res.json().catch(() => ({}));
					return { lang, res, data };
				}),
			);

			const jobs = [];
			for (const { lang, res, data } of results) {
				const apiErr = getApiErrorMessage(data);
				if (apiErr || !res.ok) {
					jobs.push({
						id: `failed_${groupId}_${lang}`,
						lang,
						status: "error",
						resultUrl: null,
						createdAt: new Date().toISOString(),
					});
					continue;
				}
				const videoId = parseVideoIdFromPostResponse(data);
				if (!videoId) {
					jobs.push({
						id: `failed_${groupId}_${lang}`,
						lang,
						status: "error",
						resultUrl: null,
						createdAt: new Date().toISOString(),
					});
					continue;
				}
				const initial = normalizeStatus(extractStatusField(data));
				const postFields = extractJobFieldsFromGetResponse(data);
				jobs.push({
					id: videoId,
					lang,
					status: initial,
					createdAt: new Date().toISOString(),
					...postFields,
					resultUrl: postFields.resultUrl ?? extractResultUrl(data) ?? null,
					sourceVideoUrl: postFields.sourceVideoUrl ?? null,
					videoTranslateId: postFields.videoTranslateId ?? videoId,
				});
			}

			const anyOk = jobs.some((j) => !String(j.id).startsWith("failed_"));
			if (!anyOk) {
				setBusy(false);
				setLocalTrack({ groupId, jobs });
				return;
			}

			const sourceVideoUrl =
				jobs.find((j) => j.sourceVideoUrl)?.sourceVideoUrl ?? null;

			if (onJobCreated) {
				onJobCreated({
					id: groupId,
					label: null,
					jobs,
					createdAt: new Date().toISOString(),
					sourceVideoUrl,
				});
				setFile(null);
				setUrl("");
				setSelectedLangs([]);
			} else {
				setLocalTrack({ groupId, jobs });
			}
		} catch (e) {
			console.error(e);
		} finally {
			setBusy(false);
		}
	};

	const reset = () => {
		setLocalTrack(null);
		setFile(null);
		setUrl("");
		setSelectedLangs([]);
	};

	const canSubmit =
		selectedLangs.length > 0 && (mode === "url" ? url.trim() : file) && !busy;

	const showForm = !localTrack;

	return (
		<div>
			{showForm ? (
				<>
					{/* Mode tabs */}
					<div
						style={{
							display: "flex",
							gap: 4,
							padding: 4,
							background: "rgba(0,0,0,0.04)",
							borderRadius: 10,
							marginBottom: 14,
						}}
					>
						{["url", "file"].map((m) => (
							<button
								key={m}
								type="button"
								onClick={() => {
									setMode(m);
									setFileError(null);
								}}
								style={{
									flex: 1,
									padding: "8px 0",
									borderRadius: 7,
									fontSize: 13,
									fontWeight: 500,
									background:
										mode === m ? "rgba(234,88,12,0.12)" : "transparent",
									border:
										mode === m
											? "1px solid rgba(234,88,12,0.3)"
											: "1px solid transparent",
									color: mode === m ? "#c2410c" : "#71717a",
									transition: "all 0.15s",
								}}
							>
								{m === "url" ? "Video URL" : "Upload File"}
							</button>
						))}
					</div>

					{/* Input area */}
					{mode === "url" ? (
						<input
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://example.com/video.mp4"
							style={{
								width: "100%",
								padding: "11px 14px",
								borderRadius: 10,
								fontSize: 13,
								marginBottom: 12,
								background: "#fff",
								border: "1px solid rgba(0,0,0,0.1)",
								color: "#18181b",
								outline: "none",
								transition: "border-color 0.2s",
							}}
							onFocus={(e) =>
								(e.target.style.borderColor = "rgba(234,88,12,0.5)")
							}
							onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
						/>
					) : (
						<div
							onClick={() => fileRef.current?.click()}
							onDragOver={(e) => {
								e.preventDefault();
								setDrag(true);
							}}
							onDragLeave={() => setDrag(false)}
							onDrop={(e) => {
								e.preventDefault();
								setDrag(false);
								const f = e.dataTransfer.files[0];
								if (f) pickVideoFile(f);
							}}
							style={{
								marginBottom: 12,
								borderRadius: 12,
								cursor: "pointer",
								height: compact ? 72 : 104,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 6,
								border: `2px dashed ${drag ? "#ea580c" : file ? "rgba(234,88,12,0.45)" : "rgba(0,0,0,0.12)"}`,
								background: drag ? "rgba(234,88,12,0.06)" : "rgba(0,0,0,0.02)",
								transition: "all 0.2s",
							}}
						>
							{file ? (
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<Film size={15} style={{ color: "#ea580c" }} />
									<span
										style={{
											color: "#52525b",
											fontSize: 13,
											maxWidth: 200,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{file.name}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setFile(null);
										}}
										style={{ color: "#71717a", display: "flex" }}
									>
										<X size={13} />
									</button>
								</div>
							) : (
								<>
									<Upload size={18} style={{ color: "#a1a1aa" }} />
									<span style={{ color: "#71717a", fontSize: 12 }}>
										Drop MP4 here or click to browse
									</span>
								</>
							)}
							<input
								ref={fileRef}
								type="file"
								accept="video/*"
								style={{ display: "none" }}
								onChange={(e) => {
									const f = e.target.files?.[0];
									e.target.value = "";
									pickVideoFile(f);
								}}
							/>
						</div>
					)}
					{fileError && mode === "file" && (
						<p
							style={{
								color: "#ef4444",
								fontSize: 12,
								marginBottom: 12,
								lineHeight: 1.45,
							}}
						>
							{fileError}
						</p>
					)}

					<LlmModelSelect
						id="video-translate-llm-select"
						value={llmChoice}
						onChange={setLlmChoice}
					/>

					{/* Language + Submit row */}
					<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
						<div style={{ flex: 1, minWidth: 160 }}>
							<LangMultiSelect
								selected={selectedLangs}
								onChange={setSelectedLangs}
								fullWidth
							/>
						</div>
					</div>
					<button
						onClick={submit}
						disabled={!canSubmit}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 7,
							padding: "11px 20px",
							borderRadius: 12,
							fontSize: 14,
							fontWeight: 600,
							background: "#ea580c",
							color: "#fff",
							opacity: canSubmit ? 1 : 0.35,
							transition: "opacity 0.2s, transform 0.1s",
							flexShrink: 0,
						}}
						className="my-2 w-full"
						onMouseEnter={(e) => {
							if (canSubmit) e.currentTarget.style.transform = "scale(1.03)";
						}}
						onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
					>
						{busy ? (
							<Loader2 size={14} className="spin" />
						) : (
							<span style={{ fontSize: 15, lineHeight: 1 }} aria-hidden>
								{selectedLangs.length === 1
									? flagForLanguageName(selectedLangs[0])
									: "🌐"}
							</span>
						)}
						Translate
						{selectedLangs.length > 1 ? ` (${selectedLangs.length})` : ""}
					</button>
				</>
			) : (
				<>
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						{localTrack?.jobs.map((j) => (
							<div
								key={j.id}
								style={{
									paddingBottom: 8,
									borderBottom: "1px solid rgba(0,0,0,0.06)",
								}}
							>
								<p
									style={{
										fontSize: 12,
										fontWeight: 600,
										color: "#52525b",
										marginBottom: 8,
									}}
								>
									<span style={{ marginRight: 6 }} aria-hidden>
										{flagForLanguageName(j.lang)}
									</span>
									{j.lang}
									<span
										className="mono"
										style={{
											fontSize: 10,
											color: "#a1a1aa",
											marginLeft: 8,
											fontWeight: 500,
										}}
									>
										{String(j.id).startsWith("failed_") ? "" : j.id}
									</span>
								</p>
								<StatusProgress status={j.status} jobId={j.id} />
							</div>
						))}
					</div>
					{localTrack?.jobs.every(
						(j) => j.status === "done" || j.status === "error",
					) && (
						<button
							type="button"
							onClick={reset}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								margin: "12px auto 0",
								padding: "8px 16px",
								borderRadius: 8,
								fontSize: 13,
								color: "#71717a",
								border: "1px solid rgba(0,0,0,0.08)",
							}}
						>
							<RefreshCw size={13} /> New translation
						</button>
					)}
				</>
			)}
			
			<details
				className="upload-limits-details"
				style={{
					marginBottom: 14,
					marginTop: 14,
					borderRadius: 10,
					background: "rgba(0,0,0,0.03)",
					border: "1px solid rgba(0,0,0,0.08)",
					fontSize: 11.5,
					color: "#52525b",
					lineHeight: 1.55,
				}}
			>
				<summary
					style={{
						padding: "12px 14px",
						fontWeight: 600,
						fontSize: 12,
						color: "#18181b",
						cursor: "pointer",
						listStyle: "none",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 8,
						userSelect: "none",
					}}
				>
					<span>Upload limits &amp; estimated time</span>
					<ChevronDown
						className="accordion-chevron"
						size={16}
						style={{ color: "#a1a1aa", flexShrink: 0 }}
						aria-hidden
					/>
				</summary>
				<div
					style={{
						padding: "0 14px 12px",
						borderTop: "1px solid rgba(0,0,0,0.06)",
					}}
				>
					<p style={{ marginBottom: 10, marginTop: 10 }}>
						<strong>Maximum file size:</strong> {VIDEO_UPLOAD_MAX_MB} MB per
						upload.
					</p>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr auto",
							gap: "6px 20px",
							alignItems: "baseline",
							maxWidth: 400,
							fontSize: 11.5,
						}}
					>
						<span style={{ color: "#71717a", fontWeight: 600 }}>
							Approx. length
						</span>
						<span
							style={{
								color: "#71717a",
								fontWeight: 600,
								textAlign: "right",
							}}
						>
							Typical processing
						</span>
						<span>~1–5 min</span>
						<span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
							Often 1–5 min
						</span>
						<span>~3–10 min</span>
						<span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
							Often 3–10 min
						</span>
						<span>~5–15+ min</span>
						<span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
							Often 5–15+ min
						</span>
					</div>
					<p
						style={{
							marginTop: 10,
							fontSize: 10.5,
							color: "#a1a1aa",
							lineHeight: 1.45,
						}}
					>
						Uploads in this app are limited to {VIDEO_UPLOAD_MAX_MB} MB. The
						table is a rough guide by video length (minutes); actual time
						depends on quality, languages, and queue load.
					</p>
				</div>
			</details>
		</div>
	);
}

// ─── Upgrade modal (Polar usage checkout) ───────────────────────────────────
function UpgradePriceModal({ open, onClose }) {
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 200,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: 16,
						background: "rgba(0,0,0,0.45)",
					}}
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.94, opacity: 0, y: 12 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.94, opacity: 0, y: 12 }}
						transition={{ type: "spring", stiffness: 320, damping: 28 }}
						onClick={(e) => e.stopPropagation()}
						style={{
							width: "100%",
							maxWidth: 420,
							borderRadius: 18,
							padding: "28px 24px",
							background: "#fff",
							border: "1px solid rgba(0,0,0,0.08)",
							boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
						}}
					>
						<h3
							className="vaantra-font"
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#18181b",
								marginBottom: 6,
							}}
						>
							Add translation minutes
						</h3>
						<p style={{ fontSize: 14, color: "#71717a", marginBottom: 20 }}>
							Choose how many minutes of video you want to translate. Checkout
							is powered by Polar.
						</p>
						<UsagePricingPanel
							successReturnPath="/app"
							onRequireLogin={() => {}}
						/>
						<a
							href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("More credits / API access")}`}
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 8,
								fontSize: 13,
								fontWeight: 500,
								color: "#c2410c",
								marginTop: 16,
							}}
						>
							<Mail size={16} />
							Contact for volume or API
						</a>
						<button
							type="button"
							onClick={onClose}
							style={{
								width: "100%",
								padding: "11px",
								borderRadius: 10,
								fontSize: 14,
								fontWeight: 600,
								background: "rgba(0,0,0,0.06)",
								color: "#52525b",
								marginTop: 14,
							}}
						>
							Close
						</button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function Landing() {
	const [showLogin, setShowLogin] = useState(false);
	const [faqOpen, setFaqOpen] = useState(null);

	const features = [
		{
			Icon: Mic2,
			title: "Voice Cloning",
			desc: "Retains the original speaker's tone, cadence, and emotion — not just words — in every dubbed output.",
		},
		{
			Icon: Headphones,
			title: "Video & audio translation",
			desc: "Dub full videos or go audio-only: paste text, record a take, or upload MP3, WAV, WebM, and more—then get translated speech in any language.",
		},
		{
			Icon: Layers,
			title: "Parallel multi-language",
			desc: "Add several target languages and run multiple translation jobs at once. Queue work without waiting for each job to finish.",
		},
		{
			Icon: Globe,
			title: "90+ Languages",
			desc: "Spanish to Swahili, Mandarin to Malayalam. Covers virtually every major language and regional dialect.",
		},
		{
			Icon: Zap,
			title: "Fast Turnaround",
			desc: "Most videos under 10 min finish within 3–8 minutes. Distributed queues keep parallel jobs moving at scale.",
		},
		{
			Icon: Shield,
			title: "Private by Default",
			desc: "End-to-end encrypted uploads. Your content never trains our models without explicit consent.",
		},
	];

	const faqs = [
		{
			q: "What video formats are supported?",
			a: "Any publicly accessible MP4, MOV, or WebM URL works, as well as direct file uploads up to 2 GB.",
		},
		{
			q: "Can I translate audio without a video?",
			a: "Yes. Use the voice translation flow to paste text, record from your mic, or upload an audio file—you get transcripts and translated audio in your chosen languages, with jobs tracked alongside video work.",
		},
		{
			q: "How long does translation take?",
			a: "Most videos under 10 minutes complete in 3–8 minutes. Longer videos or multi-language jobs take proportionally more time. Parallel jobs each show their own progress.",
		},
		{
			q: "Is the original speaker's voice preserved?",
			a: "Yes — vaantra uses voice cloning to maintain the original speaker's timbre and rhythm in the translated dub.",
		},
		{
			q: "Can I translate to multiple languages at the same time?",
			a: "You can add several target languages and run multiple translation jobs in parallel so nothing blocks the rest of your queue. Advanced multi-language batch options are also available on Pro and Studio plans.",
		},
		{
			q: "What happens to my videos after translation?",
			a: "Translated videos are stored for 30 days (Free) or 1 year (Pro/Studio). You can download or delete them anytime.",
		},
	];

	return (
		<div className="sans" style={{ color: "#52525b", minHeight: "100vh" }}>
			{/* Ambient glow — slow drift, same palette */}
			<div
				style={{
					position: "fixed",
					inset: 0,
					pointerEvents: "none",
					zIndex: 0,
					overflow: "hidden",
				}}
			>
				<motion.div
					animate={{
						y: [0, 24, 0],
						x: [0, -16, 0],
						scale: [1, 1.04, 1],
						opacity: [0.85, 1, 0.85],
					}}
					transition={{
						duration: 14,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					style={{
						position: "absolute",
						top: -180,
						left: "50%",
						marginLeft: "-350px",
						width: 700,
						height: 700,
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)",
					}}
				/>
				<motion.div
					animate={{
						y: [0, -18, 0],
						x: [0, 22, 0],
						scale: [1, 1.06, 1],
						opacity: [0.65, 0.95, 0.65],
					}}
					transition={{
						duration: 18,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 1,
					}}
					style={{
						position: "absolute",
						bottom: "8%",
						right: "-8%",
						width: 480,
						height: 480,
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(194,65,12,0.06) 0%, transparent 68%)",
					}}
				/>
			</div>

			<LandingMarketingNav onSignIn={() => setShowLogin(true)} />

			{/* Hero */}
			<section
				style={{
					position: "relative",
					zIndex: 1,
					maxWidth: 1440,
					margin: "0 auto",
					padding: "clamp(60px,10vw,100px) clamp(20px,5vw,60px) 80px",
					overflow: "hidden",
				}}
			>
				{/* Hero-local mesh — same oranges / neutrals */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						zIndex: 0,
					}}
				>
					<motion.div
						animate={{
							opacity: [0.4, 0.7, 0.4],
							scale: [1, 1.03, 1],
						}}
						transition={{
							duration: 10,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						style={{
							position: "absolute",
							top: "-5%",
							left: "50%",
							transform: "translateX(-50%)",
							width: "min(900px, 120%)",
							height: 320,
							borderRadius: "50%",
							background:
								"radial-gradient(ellipse at center, rgba(234,88,12,0.09) 0%, transparent 72%)",
							filter: "blur(0px)",
						}}
					/>
					<motion.div
						animate={{ rotate: [0, 3, 0, -2, 0] }}
						transition={{
							duration: 22,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						style={{
							position: "absolute",
							bottom: "12%",
							left: "-12%",
							width: 280,
							height: 280,
							borderRadius: "50%",
							background:
								"radial-gradient(circle, rgba(234,88,12,0.05) 0%, transparent 70%)",
						}}
					/>
				</div>
				<motion.div
					className="landing-hero-split"
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
				>
					<div className="landing-hero-copy" style={{ flex: "1 1 340px", minWidth: 0 }}>
						<motion.h1
							className="vaantra-font"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
							style={{
								fontSize: "clamp(3.5rem, 12vw, 6.25rem)",
								lineHeight: 1.02,
								fontWeight: 700,
								color: "#18181b",
								letterSpacing: "-0.04em",
								marginBottom: "clamp(20px, 3vw, 28px)",
							}}
						>
							Vaantra<span style={{ color: "#ea580c" }}>.</span>
						</motion.h1>

						<motion.h2
							className="sans landing-hero-h2"
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
							style={{
								fontSize: "clamp(1.5rem, 3.8vw, 2.65rem)",
								lineHeight: 1.22,
								fontWeight: 700,
								color: "#27272a",
								marginBottom: 20,
								letterSpacing: "-0.02em",
								maxWidth: 620,
							}}
						>
							<span style={{ display: "block" }}>
								Boost your content <GrowthBadgePillLight /> with
							</span>
							<span style={{ display: "block" }}>
								seamless <HeroSparkleIcon /> audio/video
							</span>
							<span style={{ display: "block" }}>
								translation to uplift your  <HeroSocialCluster />
							</span>
							<span style={{ display: "block" }}>
								social game
							</span>
						</motion.h2>

						<div
							className="landing-hero-sub"
							style={{
								color: "#71717a",
								fontSize: "clamp(1rem, 2vw, 1.12rem)",
								lineHeight: 1.75,
								maxWidth: 520,
							}}
						>
							<p style={{ margin: "0 0 16px" }}>
								Vaantra translates audio, text, and video into 90+ languages with
								voice-cloned output.
							</p>
						</div>

						<motion.p
							className="landing-hero-trial"
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.45, duration: 0.45 }}
							style={{
								color: "#c2410c",
								fontSize: "clamp(0.9rem, 1.8vw, 1rem)",
								fontWeight: 600,
								marginTop: 8,
								marginBottom: 0,
								maxWidth: 520,
							}}
						>
							10 free translation jobs per month — no card required to try
						</motion.p>
					</div>

					<motion.div
						className="landing-hero-form-col"
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15, duration: 0.55 }}
						style={{
							flex: "1 1 min(100%, 440px)",
							minWidth: 0,
							maxWidth: 520,
							width: "100%",
						}}
					>
						<div className="flex justify-end items-start my-2 w-full px-4">
<img className="h-6" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOCAyOCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZDVkNWQ1IiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0xOS40MDEgMy4zNzhhLjc1Ljc1IDAgMCAwLTEuMDIzLS4yOEMxMy4wNzIgNi4xMzIgMTMgMTEuMjY5IDEzIDE0Ljc1djcuNjlsLTQuNzItNC43MmEuNzUuNzUgMCAxIDAtMS4wNiAxLjA2bDYgNmEuNzUuNzUgMCAwIDAgMS4wNiAwbDYtNmEuNzUuNzUgMCAwIDAtMS4wNi0xLjA2bC00LjcyIDQuNzJ2LTcuNjljMC0zLjUxOC4xMjgtNy43OCA0LjYyMi0xMC4zNDlhLjc1Ljc1IDAgMCAwIC4yOC0xLjAyMyIvPjwvc3ZnPg==" />
							<span className="text-sm text-zinc-400">Try demo</span>
						</div>
						<div
							style={{
								borderRadius: 20,
								padding: 24,
								background: "#fff",
								border: "1px solid rgba(0,0,0,0.08)",
								boxShadow:
									"0 24px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
							}}
						>
							<TranslateForm
								requireAuthOnSubmit
								onRequireAuth={() => setShowLogin(true)}
							/>
						</div>
					</motion.div>
				</motion.div>

				{/* Stats row */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.8 }}
					style={{
						display: "flex",
						justifyContent: "center",
						gap: "clamp(20px,5vw,60px)",
						marginTop: 56,
						flexWrap: "wrap",
					}}
				>
					{[
						["90+", "Languages"],
						["Parallel", "Multi-job queue"],
						["< 8min", "Avg. turnaround"],
					].map(([n, l]) => (
						<div key={l} style={{ textAlign: "center" }}>
							<div
								className="vaantra-font"
								style={{ fontSize: 28, fontWeight: 700, color: "#18181b" }}
							>
								{n}
							</div>
							<div style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>
								{l}
							</div>
						</div>
					))}
				</motion.div>
			</section>

			{/* Features */}
			<section
				id="features"
				style={{
					borderTop: "1px solid rgba(0,0,0,0.06)",
					padding: "80px clamp(20px,5vw,64px)",
				}}
			>
				<div style={{ maxWidth: 1000, margin: "0 auto" }}>
					<h2
						className="vaantra-font"
						style={{
							textAlign: "center",
							fontSize: "clamp(1.8rem,4vw,2.8rem)",
							fontWeight: 700,
							color: "#18181b",
							marginBottom: 12,
						}}
					>
						Everything you need to{" "}
						<span style={{ color: "#ea580c" }}>go global</span>
					</h2>
					<p
						style={{
							textAlign: "center",
							color: "#71717a",
							fontSize: 15,
							marginBottom: 48,
						}}
					>
						Video dubbing, audio translation, and parallel languages—no
						production studio required.
					</p>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
							gap: 12,
						}}
					>
						{features.map(({ Icon, title, desc }, i) => (
							<motion.div
								key={title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.08 }}
								style={{
									padding: "22px 20px",
									borderRadius: 16,
									background: "#fff",
									border: "1px solid rgba(0,0,0,0.06)",
									transition: "border-color 0.2s, background 0.2s",
								}}
								whileHover={{
									borderColor: "rgba(234,88,12,0.25)",
									backgroundColor: "rgba(234,88,12,0.04)",
								}}
							>
								<div
									style={{
										width: 38,
										height: 38,
										borderRadius: 10,
										background: "rgba(234,88,12,0.1)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										marginBottom: 14,
									}}
								>
									<Icon size={17} style={{ color: "#ea580c" }} />
								</div>
								<h3
									style={{
										fontWeight: 600,
										fontSize: 15,
										color: "#18181b",
										marginBottom: 8,
									}}
								>
									{title}
								</h3>
								<p
									style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.7 }}
								>
									{desc}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<BenefitsShortsSection />

			{/* Pricing */}
			<section
				id="pricing"
				style={{
					borderTop: "1px solid rgba(0,0,0,0.06)",
					padding: "80px clamp(20px,5vw,64px)",
				}}
			>
				<div style={{ maxWidth: 720, margin: "0 auto" }}>
					<h2
						className="vaantra-font"
						style={{
							textAlign: "center",
							fontSize: "clamp(1.8rem,4vw,2.8rem)",
							fontWeight: 700,
							color: "#18181b",
							marginBottom: 12,
						}}
					>
						Usage-based pricing
					</h2>
					<p
						style={{
							textAlign: "center",
							fontSize: 15,
							color: "#71717a",
							lineHeight: 1.65,
							maxWidth: 520,
							margin: "0 auto 40px",
						}}
					>
						Pay only for completed work (video or audio minutes)—no flat
						monthly fee. Need a larger credit pool or a team plan? Get in touch.
					</p>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
							gap: 16,
						}}
					>
						{[
							{
								kind: "usage",
								name: "Pay per use",
								price: `$${PRICE_PER_MINUTE_USD.toFixed(2)}`,
								unit: "per minute of video or audio (USD)",
								highlight: true,
								features: [
									`Includes ${FREE_CREDITS_PER_MONTH} free starter jobs / month`,
									"Slider: pick minutes (5–400) — pay the USD total shown",
									"Powered by Polar checkout",
									"Fair use: usage tracked in minutes per completed job",
								],
								cta: "Get started",
							},
							{
								kind: "contact",
								name: "More credits",
								price: "Custom",
								unit: "volume & teams",
								highlight: false,
								features: [
									"Bulk credit packs and discounted rates",
									"Studios, agencies, and education pricing",
									"API access and higher throughput",
									"Invoicing and custom agreements",
								],
								cta: "Contact us",
							},
						].map((plan) => (
							<motion.div
								key={plan.kind}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								style={{
									padding: "26px 22px",
									borderRadius: 18,
									display: "flex",
									flexDirection: "column",
									background: plan.highlight ? "rgba(234,88,12,0.06)" : "#fff",
									border: `1px solid ${plan.highlight ? "rgba(234,88,12,0.35)" : "rgba(0,0,0,0.08)"}`,
									boxShadow: plan.highlight
										? "0 8px 32px rgba(234,88,12,0.08)"
										: "0 1px 3px rgba(0,0,0,0.06)",
								}}
							>
								{plan.highlight && (
									<div style={{ marginBottom: 12 }}>
										<span
											style={{
												background: "#ea580c",
												color: "#fff",
												fontSize: 10,
												fontWeight: 700,
												letterSpacing: "0.08em",
												padding: "3px 10px",
												borderRadius: 20,
											}}
										>
											PAY AS YOU GO
										</span>
									</div>
								)}
								<div
									style={{
										fontWeight: 600,
										fontSize: 15,
										color: "#18181b",
										marginBottom: 4,
									}}
								>
									{plan.name}
								</div>
								<div
									style={{
										display: "flex",
										alignItems: "baseline",
										gap: 6,
										flexWrap: "wrap",
										marginBottom: 20,
									}}
								>
									<span
										className="vaantra-font"
										style={{
											fontSize: plan.kind === "contact" ? 32 : 38,
											fontWeight: 700,
											color: plan.highlight ? "#ea580c" : "#18181b",
										}}
									>
										{plan.price}
									</span>
									<span style={{ fontSize: 13, color: "#71717a" }}>
										{plan.unit}
									</span>
								</div>
								<ul
									style={{
										listStyle: "none",
										display: "flex",
										flexDirection: "column",
										gap: 8,
										marginBottom: plan.kind === "usage" ? 12 : 24,
										flex: 1,
									}}
								>
									{plan.features.map((f) => (
										<li
											key={f}
											style={{
												display: "flex",
												alignItems: "center",
												gap: 8,
												fontSize: 13.5,
												color: "#52525b",
											}}
										>
											<CheckCircle
												size={13}
												style={{
													color: plan.highlight ? "#ea580c" : "#a1a1aa",
													flexShrink: 0,
												}}
											/>
											{f}
										</li>
									))}
								</ul>
								{plan.kind === "usage" ? (
									<UsagePricingPanel
										compact
										successReturnPath="/"
										onRequireLogin={() => {
											try {
												sessionStorage.setItem("pendingUsagePurchase", "1");
											} catch {
												/* ignore */
											}
											setShowLogin(true);
										}}
									/>
								) : (
									<button
										type="button"
										onClick={() => {
											window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("More credits — vaantra")}&body=${encodeURIComponent("Hi,\n\nI'd like to discuss volume credits or a team plan.\n\n")}`;
										}}
										style={{
											padding: "11px",
											borderRadius: 11,
											fontSize: 13.5,
											fontWeight: 600,
											background: "rgba(0,0,0,0.04)",
											color: "#52525b",
											border: "1px solid rgba(0,0,0,0.1)",
											transition: "opacity 0.2s",
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.opacity = "0.85")
										}
										onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
									>
										{plan.cta}
									</button>
								)}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section
				id="faq"
				style={{
					borderTop: "1px solid rgba(0,0,0,0.06)",
					padding: "80px clamp(20px,5vw,64px)",
				}}
			>
				<div style={{ maxWidth: 680, margin: "0 auto" }}>
					<h2
						className="vaantra-font"
						style={{
							textAlign: "center",
							fontSize: "clamp(1.8rem,4vw,2.8rem)",
							fontWeight: 700,
							color: "#18181b",
							marginBottom: 40,
						}}
					>
						Questions?
					</h2>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						{faqs.map((faq, i) => (
							<motion.div
								key={i}
								layout
								style={{
									borderRadius: 12,
									border: "1px solid rgba(0,0,0,0.08)",
									background: "#fff",
									overflow: "hidden",
								}}
							>
								<button
									onClick={() => setFaqOpen(faqOpen === i ? null : i)}
									style={{
										width: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										padding: "16px 18px",
										color: "#18181b",
										gap: 12,
									}}
								>
									<span
										style={{
											fontWeight: 500,
											fontSize: 14.5,
											textAlign: "left",
										}}
									>
										{faq.q}
									</span>
									<ChevronDown
										size={15}
										style={{
											color: "#ea580c",
											flexShrink: 0,
											transform: faqOpen === i ? "rotate(180deg)" : "none",
											transition: "transform 0.22s",
										}}
									/>
								</button>
								<AnimatePresence>
									{faqOpen === i && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.22 }}
											style={{ overflow: "hidden" }}
										>
											<p
												style={{
													padding: "0 18px 18px",
													color: "#52525b",
													fontSize: 14,
													lineHeight: 1.75,
												}}
											>
												{faq.a}
											</p>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<LandingMarketingFooter />

			<LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
		</div>
	);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function SidebarHistorySkeleton() {
	return (
		<div style={{ padding: "6px 10px" }}>
			{[0, 1, 2, 3, 4].map((i) => (
				<div
					key={i}
					className="app-skeleton-pulse"
					style={{
						height: 44,
						borderRadius: 9,
						background: "rgba(0,0,0,0.06)",
						marginBottom: 8,
					}}
				/>
			))}
		</div>
	);
}

function NewTranslationFormSkeleton() {
	return (
		<div style={{ width: "100%" }}>
			<div
				className="app-skeleton-pulse"
				style={{
					height: 40,
					borderRadius: 12,
					background: "rgba(0,0,0,0.06)",
					marginBottom: 12,
					maxWidth: 280,
				}}
			/>
			<div
				className="app-skeleton-pulse"
				style={{
					height: 140,
					borderRadius: 14,
					background: "rgba(0,0,0,0.06)",
					marginBottom: 14,
				}}
			/>
			<div
				className="app-skeleton-pulse"
				style={{
					height: 44,
					borderRadius: 10,
					background: "rgba(0,0,0,0.06)",
					marginBottom: 12,
				}}
			/>
			<div
				className="app-skeleton-pulse"
				style={{
					height: 48,
					borderRadius: 12,
					background: "rgba(234,88,12,0.15)",
				}}
			/>
		</div>
	);
}

/** Full-app layout skeleton while Firebase auth resolves (used by `authenticatedAppShell`). */
export function AppAuthLoadingShell() {
	return (
		<div
			className="sans"
			style={{
				display: "flex",
				minHeight: "100vh",
				background: "#f5f4f0",
				overflow: "hidden",
			}}
		>
			<aside
				style={{
					width: 256,
					flexShrink: 0,
					background: "#fff",
					borderRight: "1px solid rgba(0,0,0,0.08)",
					padding: "16px 14px",
					display: "flex",
					flexDirection: "column",
					gap: 12,
				}}
			>
				<div
					className="app-skeleton-pulse"
					style={{
						height: 28,
						borderRadius: 8,
						background: "rgba(0,0,0,0.06)",
					}}
				/>
				<div
					className="app-skeleton-pulse"
					style={{
						height: 40,
						borderRadius: 10,
						background: "rgba(0,0,0,0.06)",
					}}
				/>
				{[0, 1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="app-skeleton-pulse"
						style={{
							height: 44,
							borderRadius: 9,
							background: "rgba(0,0,0,0.06)",
						}}
					/>
				))}
			</aside>
			<div style={{ flex: 1, padding: "24px 28px", minWidth: 0 }}>
				<div
					className="app-skeleton-pulse"
					style={{
						height: 48,
						maxWidth: 320,
						borderRadius: 12,
						background: "rgba(0,0,0,0.06)",
						marginBottom: 28,
					}}
				/>
				<div
					className="app-skeleton-pulse"
					style={{
						height: 180,
						borderRadius: 16,
						background: "rgba(0,0,0,0.06)",
						maxWidth: 560,
						margin: "0 auto",
					}}
				/>
			</div>
		</div>
	);
}

export function Dashboard({ user, onLogout }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const uid = user?.uid;
	const { data: queryVideos } = useTranslationGroups(uid);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [localFallback, setLocalFallback] = useState([]);
	const [storageHydrated, setStorageHydrated] = useState(false);
	const [selected, setSelected] = useState(null);
	const [detailTab, setDetailTab] = useState(0);
	const [editingSidebarId, setEditingSidebarId] = useState(null);
	const [editingName, setEditingName] = useState("");
	const [viewNew, setViewNew] = useState(true);
	const [showUpgrade, setShowUpgrade] = useState(false);
	const [windowW, setWindowW] = useState(
		typeof window !== "undefined" ? window.innerWidth : 1200,
	);
	const selectedRef = useRef(null);
	selectedRef.current = selected;
	const prevRouteVideoIdRef = useRef(undefined);
	const upsertDebounceRef = useRef({});
	const recordedJobIdsRef = useRef(new Set());
	const [usageMinutes, setUsageMinutes] = useState({
		used: 0,
		credited: 0,
	});

	const videos = useMemo(() => {
		if (!uid) return [];
		if (queryVideos !== undefined) return queryVideos;
		return localFallback;
	}, [uid, queryVideos, localFallback]);

	const patchVideos = useCallback(
		(updater) => {
			if (!uid) return;
			queryClient.setQueryData(QUERY_KEY_TRANSLATION_GROUPS(uid), (prev) => {
				const base = Array.isArray(prev) ? prev : loadVideosForUser(uid);
				const next =
					typeof updater === "function" ? updater(base) : updater;
				const deduped = dedupeVideosById(next);
				saveVideos(deduped, uid);
				return deduped;
			});
		},
		[uid, queryClient],
	);

	const scheduleUpsertGroup = useCallback(
		(group) => {
			if (!uid || !group?.id) return;
			const id = group.id;
			clearTimeout(upsertDebounceRef.current[id]);
			upsertDebounceRef.current[id] = setTimeout(() => {
				void upsertTranslationGroup(uid, group);
				delete upsertDebounceRef.current[id];
			}, 2000);
		},
		[uid],
	);

	useEffect(() => {
		return () => {
			Object.values(upsertDebounceRef.current).forEach(clearTimeout);
		};
	}, []);

	const routeVideoId = useMemo(() => {
		if (!router.isReady) return undefined;
		const raw = router.query.id;
		if (raw == null || raw === "") return null;
		return String(Array.isArray(raw) ? raw[0] : raw);
	}, [router.isReady, router.query.id]);

	const pageReady = router.isReady && storageHydrated;

	useEffect(() => {
		if (!uid) return;
		setLocalFallback(loadVideosForUser(uid));
		setStorageHydrated(true);
	}, [uid]);

	useEffect(() => {
		if (!uid) return;
		return subscribeUserUsage(uid, (data) => {
			if (!data) {
				setUsageMinutes({ used: 0, credited: 0 });
				return;
			}
			setUsageMinutes({
				used: data.usageMinutesUsed,
				credited: data.usageMinutesCredited,
			});
		});
	}, [uid]);

	useEffect(() => {
		if (!router.isReady) return;
		const q = router.query;
		if (q.upgrade === "1") {
			setShowUpgrade(true);
		}
		if (q.upgrade === "1" || q.usage_paid === "1") {
			router.replace("/app", undefined, { shallow: true });
		}
	}, [router.isReady, router.query?.upgrade, router.query?.usage_paid, router]);

	/** Keep selection in sync with /app vs /app/[id] (group / Firestore doc id in URL). */
	useEffect(() => {
		if (!pageReady || routeVideoId === undefined) return;
		const prev = prevRouteVideoIdRef.current;
		prevRouteVideoIdRef.current = routeVideoId;

		if (routeVideoId) {
			const v = videos.find((x) => x.id === routeVideoId);
			if (v) {
				setSelected(v);
				setViewNew(false);
			} else {
				setSelected(null);
				setViewNew(true);
				router.replace("/app");
			}
			return;
		}
		if (router.pathname === "/app" && prev) {
			setSelected(null);
			setViewNew(true);
		}
	}, [routeVideoId, videos, router, pageReady]);

	const selectedDetail = useMemo(() => {
		if (!selected) return null;
		const jobs = selected.jobs || [];
		if (!jobs.length) return null;
		const agg = aggregateJobStatus(jobs);
		const idx = Math.min(detailTab, Math.max(0, jobs.length - 1));
		return {
			jobs,
			agg,
			idx,
			j: jobs[idx],
			hasTabs: jobs.length > 1,
		};
	}, [selected, selected?.jobs, detailTab]);

	const isVoiceTranslationGroup = useMemo(() => {
		if (!selected?.jobs?.length) return false;
		return selected.jobs.some((j) => String(j.id).startsWith("voice_"));
	}, [selected?.jobs]);

	useEffect(() => {
		setDetailTab(0);
	}, [selected?.id]);

	const usedThisMonth = useMemo(() => {
		const now = new Date();
		let n = 0;
		for (const v of videos) {
			const jobs = v.jobs?.length ? v.jobs : [];
			for (const j of jobs) {
				if (j.status !== "done") continue;
				const d = new Date(j.createdAt || v.createdAt);
				if (
					d.getMonth() === now.getMonth() &&
					d.getFullYear() === now.getFullYear()
				)
					n++;
			}
		}
		return n;
	}, [videos]);

	useEffect(() => {
		const h = () => {
			setWindowW(window.innerWidth);
			if (window.innerWidth < 720) setSidebarOpen(false);
		};
		window.addEventListener("resize", h);
		if (window.innerWidth < 720) setSidebarOpen(false);
		return () => window.removeEventListener("resize", h);
	}, []);

	const isMobile = windowW < 720;

	const addVideo = useCallback(
		(payload) => {
			const groupId = payload.id || `grp_${Date.now()}`;
			const jobs = (payload.jobs || []).map((j) => ({
				id: j.id,
				lang: j.lang,
				status: j.status || "queued",
				createdAt: j.createdAt || new Date().toISOString(),
				resultUrl: j.resultUrl ?? null,
				sourceVideoUrl: j.sourceVideoUrl ?? null,
				transcriptOriginal: j.transcriptOriginal ?? null,
				translatedTranscript: j.translatedTranscript ?? null,
				captionUrl: j.captionUrl ?? null,
				caption: j.caption ?? null,
				outputLanguage: j.outputLanguage ?? null,
				videoTranslateId: j.videoTranslateId ?? j.id ?? null,
				durationMinutes: j.durationMinutes ?? null,
			}));
			const v = {
				id: groupId,
				label: payload.label ?? null,
				jobs,
				createdAt: payload.createdAt || new Date().toISOString(),
				sourceVideoUrl:
					payload.sourceVideoUrl ?? jobs[0]?.sourceVideoUrl ?? null,
				type: inferTranslationGroupType({
					...payload,
					id: groupId,
					jobs,
				}),
			};
			patchVideos((prev) =>
				dedupeVideosById([v, ...prev.filter((x) => x.id !== v.id)]),
			);
			void upsertTranslationGroup(uid, v);
			setSelected(v);
			setViewNew(false);
			router.push(`/app/${encodeURIComponent(v.id)}`);
		},
		[router, uid, patchVideos],
	);

	const updateJob = useCallback(
		(patch) => {
			const jobId = patch.jobId ?? patch.id;
			const groupId = patch.groupId;

			const mergeOne = (v) => {
				if (v.jobs?.length) {
					const matchesGroup = groupId && v.id === groupId;
					const matchesJob =
						!groupId && jobId && v.jobs.some((j) => j.id === jobId);
					if (!matchesGroup && !matchesJob) return v;
					const idx = v.jobs.findIndex((j) => j.id === jobId);
					if (idx < 0) return v;
					const rest = { ...patch };
					delete rest.groupId;
					delete rest.jobId;
					delete rest.id;
					const jobs = [...v.jobs];
					jobs[idx] = { ...jobs[idx], ...rest };
					const out = { ...v, jobs };
					if (patch.sourceVideoUrl != null)
						out.sourceVideoUrl = patch.sourceVideoUrl;
					return out;
				}
				if (v.id !== jobId) return v;
				const rest = { ...patch };
				delete rest.groupId;
				delete rest.jobId;
				delete rest.id;
				return { ...v, ...rest };
			};

			patchVideos((prev) => {
				const next = prev.map(mergeOne);
				const touched = next.find((g) => {
					if (groupId && g.id === groupId) return true;
					if (jobId && g.jobs?.some((j) => j.id === jobId)) return true;
					if (jobId && g.id === jobId) return true;
					return false;
				});
				if (touched) scheduleUpsertGroup(touched);
				return next;
			});
			setSelected((s) => (s ? mergeOne(s) : s));

			if (patch.status === "done" && uid && jobId) {
				queueMicrotask(() => {
					void (async () => {
						if (recordedJobIdsRef.current.has(jobId)) return;
						const list =
							queryClient.getQueryData(QUERY_KEY_TRANSLATION_GROUPS(uid)) ||
							[];
						const group = list.find(
							(g) =>
								(groupId && g.id === groupId) ||
								g.jobs?.some((j) => j.id === jobId),
						);
						const job = group?.jobs?.find((j) => j.id === jobId);
						if (
							!job ||
							String(job.id).startsWith("voice_") ||
							job.status !== "done"
						)
							return;
						recordedJobIdsRef.current.add(jobId);
						let minutes = job.durationMinutes;
						if (minutes == null && job.sourceVideoUrl) {
							const sec = await probeVideoDurationSeconds(job.sourceVideoUrl);
							minutes = secondsToBillableMinutes(sec);
							patchVideos((prev) =>
								prev.map((g) => {
									if (!group || g.id !== group.id) return g;
									const jobs = g.jobs.map((j) =>
										j.id === jobId
											? { ...j, durationMinutes: minutes }
											: j,
									);
									const out = { ...g, jobs };
									void upsertTranslationGroup(uid, out);
									return out;
								}),
							);
						} else if (minutes == null) {
							minutes = 1;
						}
						if (typeof minutes !== "number" || minutes <= 0) minutes = 1;
						try {
							if (!auth.currentUser?.uid) {
								recordedJobIdsRef.current.delete(jobId);
								return;
							}
							await incrementUserUsageMinutesClient(uid, minutes);
						} catch {
							recordedJobIdsRef.current.delete(jobId);
						}
					})();
				});
			}
		},
		[uid, patchVideos, scheduleUpsertGroup, queryClient],
	);

	const renameVideo = useCallback(
		(groupId, label) => {
			const trimmed = label.trim() || null;
			patchVideos((prev) => {
				const next = prev.map((v) =>
					v.id === groupId ? { ...v, label: trimmed } : v,
				);
				const g = next.find((x) => x.id === groupId);
				if (g) void upsertTranslationGroup(uid, g);
				return next;
			});
			setSelected((s) => (s?.id === groupId ? { ...s, label: trimmed } : s));
			setEditingSidebarId(null);
		},
		[uid, patchVideos],
	);

	/** Realtime caption SSE for each in-progress job while viewing a translation group. */
	useEffect(() => {
		const sel = selectedRef.current;
		if (!sel?.id || !sel.jobs?.length) return;
		const pending = sel.jobs.filter(
			(j) =>
				j.status !== "done" &&
				j.status !== "error" &&
				!String(j.id).startsWith("failed_") &&
				!String(j.id).startsWith("voice_"),
		);
		if (pending.length === 0) return;
		const ac = new AbortController();
		const groupId = sel.id;

		const applyPatch = (patch) => {
			const { jobId, lang, ...rest } = patch;
			updateJob({
				groupId,
				jobId,
				lang,
				...rest,
			});
		};

		for (const job of pending) {
			void runCaptionSseForJob({
				jobId: job.id,
				lang: job.lang,
				getTranslateAuthHeaders,
				applyPatch,
				signal: ac.signal,
			});
		}

		return () => {
			ac.abort();
		};
	}, [selected?.id, selected?.jobs, updateJob]);

	const deleteVideo = useCallback(
		(id, e) => {
			e?.stopPropagation();
			patchVideos((prev) => prev.filter((v) => v.id !== id));
			void deleteTranslationGroupDoc(uid, id);
			if (selected?.id === id) {
				setSelected(null);
				setViewNew(true);
				router.replace("/app");
			}
		},
		[selected, router, uid, patchVideos],
	);

	const statusColor = (s) =>
		s === "done" ? "#ea580c" : s === "error" ? "#ef4444" : "#71717a";
	const statusBg = (s) =>
		s === "done"
			? "rgba(234,88,12,0.1)"
			: s === "error"
				? "rgba(239,68,68,0.1)"
				: "rgba(0,0,0,0.05)";

	const SidebarContent = () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
				flex: 1,
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "16px 14px",
					borderBottom: "1px solid rgba(0,0,0,0.06)",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<div
						className="vaantra-font"
						style={{ fontSize: 20, fontWeight: 700, color: "#18181b" }}
					>
						vaantra<span style={{ color: "#ea580c" }}>.</span>
					</div>
					<span
						style={{
							fontSize: 9,
							fontWeight: 700,
							letterSpacing: "0.1em",
							padding: "4px 7px",
							borderRadius: 6,
							background: "rgba(234,88,12,0.12)",
							color: "#c2410c",
						}}
					>
						APP
					</span>
				</div>
				<button
					type="button"
					onClick={() => setSidebarOpen(false)}
					style={{ color: "#a1a1aa", display: "flex" }}
				>
					<ChevronLeft size={17} />
				</button>
			</div>

			{/* New button */}
			<div style={{ padding: "10px 10px 4px" }}>
				<button
					onClick={() => {
						router.push("/app");
						if (isMobile) setSidebarOpen(false);
					}}
					style={{
						width: "100%",
						display: "flex",
						alignItems: "center",
						gap: 7,
						padding: "9px 12px",
						borderRadius: 10,
						fontSize: 13,
						fontWeight: 600,
						background:
							viewNew && !selected ? "rgba(234,88,12,0.1)" : "rgba(0,0,0,0.03)",
						border:
							viewNew && !selected
								? "1px solid rgba(234,88,12,0.3)"
								: "1px solid transparent",
						color: viewNew && !selected ? "#c2410c" : "#71717a",
						transition: "all 0.15s",
					}}
				>
					<Plus size={14} /> New Translation
				</button>
			</div>

			{/* History — minHeight:0 so flex child can shrink and list scrolls (shows all items) */}
			<div
				style={{
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					overflowX: "hidden",
					WebkitOverflowScrolling: "touch",
					padding: "6px 10px",
				}}
			>
				<p
					className="mono"
					style={{
						fontSize: 10,
						letterSpacing: "0.07em",
						textTransform: "uppercase",
						color: "#a1a1aa",
						padding: "8px 6px 6px",
					}}
				>
					History
				</p>
				{!storageHydrated ? (
					<SidebarHistorySkeleton />
				) : videos.length === 0 ? (
					<p style={{ color: "#a1a1aa", fontSize: 12.5, padding: "8px 6px" }}>
						No translations yet
					</p>
				) : (
					videos.map((v) => {
						const jobs = v.jobs || [];
						const agg = aggregateJobStatus(jobs);
						const isSel = selected?.id === v.id;
						return (
							<div
								key={v.id}
								style={{
									marginBottom: 2,
									borderRadius: 9,
									background: isSel ? "rgba(234,88,12,0.08)" : "transparent",
									border: `1px solid ${isSel ? "rgba(234,88,12,0.2)" : "transparent"}`,
									transition: "all 0.12s",
								}}
								onMouseEnter={(e) => {
									if (!isSel)
										e.currentTarget.style.background = "rgba(0,0,0,0.04)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = isSel
										? "rgba(234,88,12,0.08)"
										: "transparent";
								}}
							>
								{editingSidebarId === v.id ? (
									<div style={{ padding: "6px 8px" }}>
										<input
											autoFocus
											value={editingName}
											onChange={(e) => setEditingName(e.target.value)}
											onBlur={() => renameVideo(v.id, editingName)}
											onKeyDown={(e) => {
												if (e.key === "Enter") renameVideo(v.id, editingName);
												if (e.key === "Escape") setEditingSidebarId(null);
											}}
											style={{
												width: "100%",
												padding: "6px 8px",
												borderRadius: 6,
												fontSize: 13,
												border: "1px solid rgba(234,88,12,0.35)",
												outline: "none",
											}}
										/>
									</div>
								) : (
									<div
										style={{
											display: "flex",
											alignItems: "stretch",
											gap: 0,
										}}
									>
										<button
											type="button"
											onClick={() => {
												router.push(`/app/${encodeURIComponent(v.id)}`);
												if (isMobile) setSidebarOpen(false);
											}}
											style={{
												flex: 1,
												textAlign: "left",
												padding: "8px 6px 8px 10px",
												border: "none",
												background: "transparent",
												minWidth: 0,
												borderRadius: 0,
											}}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													gap: 6,
												}}
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 6,
														minWidth: 0,
													}}
												>
													<Video
														size={12}
														style={{
															color: statusColor(agg),
															flexShrink: 0,
														}}
													/>
													<span
														style={{
															fontSize: 13,
															color: "#52525b",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{sidebarTitle(v)}
													</span>
												</div>
												<span
													style={{
														fontSize: 10,
														fontWeight: 600,
														padding: "2px 6px",
														borderRadius: 4,
														background: statusBg(agg),
														color: statusColor(agg),
														flexShrink: 0,
													}}
												>
													{agg}
												</span>
											</div>
											<p
												className="mono"
												style={{
													fontSize: 10.5,
													color: "#a1a1aa",
													marginTop: 2,
												}}
											>
												{new Date(v.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</p>
										</button>
										<button
											type="button"
											title="Rename"
											onClick={(e) => {
												e.stopPropagation();
												setEditingSidebarId(v.id);
												setEditingName(v.label || sidebarTitle(v));
											}}
											style={{
												padding: "8px 6px",
												border: "none",
												background: "transparent",
												color: "#a1a1aa",
												display: "flex",
												alignItems: "flex-start",
											}}
										>
											<Edit2 size={13} />
										</button>
										<button
											type="button"
											title="Delete"
											onClick={(e) => deleteVideo(v.id, e)}
											style={{
												padding: "8px 8px 8px 4px",
												border: "none",
												background: "transparent",
												color: "#a1a1aa",
												display: "flex",
												alignItems: "flex-start",
											}}
										>
											<Trash2 size={11} />
										</button>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Credits & usage */}
			<div
				style={{
					padding: "14px 14px 12px",
					borderBottom: "1px solid rgba(0,0,0,0.06)",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						marginBottom: 8,
					}}
				>
					<BarChart2 size={15} style={{ color: "#ea580c", flexShrink: 0 }} />
					<span
						className="mono"
						style={{
							fontSize: 10,
							letterSpacing: "0.07em",
							textTransform: "uppercase",
							color: "#a1a1aa",
						}}
					>
						Translation minutes
					</span>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "baseline",
						marginBottom: 6,
					}}
				>
					<span style={{ fontSize: 12, color: "#52525b" }}>Used (billed)</span>
					<span style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>
						{usageMinutes.used.toFixed(1)} min
					</span>
				</div>
				<div
					style={{
						height: 10,
						background: "rgba(0,0,0,0.06)",
						borderRadius: 6,
						overflow: "hidden",
						marginBottom: 10,
					}}
				>
					<div
						style={{
							width: `${Math.min(100, usageMinutes.credited > 0 ? (usageMinutes.used / usageMinutes.credited) * 100 : usageMinutes.used > 0 ? 100 : 0)}%`,
							height: "100%",
							background: "linear-gradient(90deg, #ea580c, #f97316)",
							borderRadius: 6,
							transition: "width 0.35s ease",
						}}
					/>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "baseline",
						marginBottom: 8,
					}}
				>
					<span style={{ fontSize: 12, color: "#52525b" }}>Purchased</span>
					<span style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>
						{usageMinutes.credited.toFixed(1)} min
					</span>
				</div>
				<div
					style={{
						height: 8,
						background: "rgba(234,88,12,0.12)",
						borderRadius: 6,
						overflow: "hidden",
						marginBottom: 8,
					}}
				>
					<div
						style={{
							width: `${usageMinutes.credited > 0 ? Math.min(100, (usageMinutes.used / usageMinutes.credited) * 100) : 0}%`,
							height: "100%",
							background: "rgba(234,88,12,0.45)",
							borderRadius: 6,
							transition: "width 0.35s ease",
						}}
					/>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "baseline",
						marginBottom: 6,
					}}
				>
					<span style={{ fontSize: 11, color: "#a1a1aa" }}>Free jobs / mo</span>
					<span style={{ fontSize: 12, fontWeight: 600, color: "#52525b" }}>
						{usedThisMonth} / {FREE_CREDITS_PER_MONTH}
					</span>
				</div>
				<p style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>
					${PRICE_PER_MINUTE_USD.toFixed(2)}/min packs via Polar ·{" "}
					{USAGE_MINUTE_STEPS[0]}–{USAGE_MINUTE_STEPS[USAGE_MINUTE_STEPS.length - 1]}{" "}
					min
				</p>
				<button
					type="button"
					onClick={() => setShowUpgrade(true)}
					style={{
						width: "100%",
						marginTop: 10,
						padding: "10px",
						borderRadius: 10,
						fontSize: 13,
						fontWeight: 600,
						background: "#ea580c",
						color: "#fff",
					}}
				>
					Upgrade
				</button>
			</div>
			{/* User */}
			<div
				style={{
					padding: "12px 14px",
					borderTop: "1px solid rgba(0,0,0,0.06)",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					{typeof user.avatar === "string" && user.avatar.startsWith("http") ? (
						<img
							src={user.avatar}
							alt=""
							style={{
								width: 30,
								height: 30,
								borderRadius: "50%",
								objectFit: "cover",
								flexShrink: 0,
							}}
						/>
					) : (
						<div
							style={{
								width: 30,
								height: 30,
								borderRadius: "50%",
								background: "rgba(234,88,12,0.15)",
								color: "#ea580c",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 13,
								fontWeight: 600,
								flexShrink: 0,
							}}
						>
							{typeof user.avatar === "string" && user.avatar.length === 1
								? user.avatar
								: user.name?.[0] || "U"}
						</div>
					)}
					<div style={{ flex: 1, minWidth: 0 }}>
						<p
							style={{
								fontSize: 13,
								fontWeight: 500,
								color: "#18181b",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{user.name}
						</p>
						<p
							style={{
								fontSize: 11,
								color: "#3a3860",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{user.email}
						</p>
					</div>
					<button
						onClick={onLogout}
						style={{
							color: "#a1a1aa",
							display: "flex",
							transition: "color 0.15s",
						}}
						onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
						onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
						title="Sign out"
					>
						<LogOut size={14} />
					</button>
				</div>
			</div>
		</div>
	);

	return (
		<div
			className="sans"
			style={{
				display: "flex",
				height: "100dvh",
				background: "#f5f4f0",
				overflow: "hidden",
				color: "#52525b",
			}}
		>
			{/* Mobile overlay */}
			<AnimatePresence>
				{sidebarOpen && isMobile && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setSidebarOpen(false)}
						style={{
							position: "fixed",
							inset: 0,
							zIndex: 40,
							background: "rgba(0,0,0,0.65)",
						}}
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<AnimatePresence initial={false}>
				{sidebarOpen && (
					<motion.aside
						key="sidebar"
						initial={{ x: -264 }}
						animate={{ x: 0 }}
						exit={{ x: -264 }}
						transition={{ type: "spring", stiffness: 320, damping: 32 }}
						style={{
							width: 256,
							flexShrink: 0,
							background: "#fff",
							borderRight: "1px solid rgba(0,0,0,0.08)",
							position: isMobile ? "fixed" : "relative",
							zIndex: isMobile ? 50 : "auto",
							height: "100dvh",
							minHeight: 0,
							top: 0,
							left: 0,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
						}}
					>
						<SidebarContent />
					</motion.aside>
				)}
			</AnimatePresence>

			{/* Main */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					minWidth: 0,
				}}
			>
				{/* Topbar */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 14,
						padding: "0 20px",
						height: 56,
						borderBottom: "1px solid rgba(0,0,0,0.06)",
						background: "rgba(255,255,255,0.9)",
						backdropFilter: "blur(12px)",
						flexShrink: 0,
					}}
				>
					<button
						onClick={() => setSidebarOpen((o) => !o)}
						style={{
							color: "#a1a1aa",
							display: "flex",
							transition: "color 0.15s",
						}}
						onMouseEnter={(e) => (e.currentTarget.style.color = "#18181b")}
						onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
					>
						<Menu size={17} />
					</button>
					<span style={{ fontSize: 15, fontWeight: 500, color: "#18181b" }}>
						{viewNew && !selected
							? "New Translation"
							: selected
								? selected.label || sidebarTitle(selected)
								: "Dashboard"}
					</span>
					<div style={{ flex: 1 }} />
					{!sidebarOpen && (
						<div
							className="vaantra-font"
							style={{ fontSize: 18, fontWeight: 700, color: "#18181b" }}
						>
							vaantra<span style={{ color: "#ea580c" }}>.</span>
						</div>
					)}
				</div>

				{/* Content */}
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						padding: "clamp(20px,4vw,40px) clamp(16px,4vw,40px)",
					}}
				>
					<AnimatePresence mode="wait">
						{viewNew && !selected ? (
							<motion.div
								key="new"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								style={{ maxWidth: 560, margin: "0 auto" }}
							>
								<div
									style={{
										borderRadius: 18,
										padding: "28px 24px",
										background: "#fff",
										border: "1px solid rgba(0,0,0,0.08)",
									}}
								>
									<h2
										className="vaantra-font"
										style={{
											fontSize: 24,
											fontWeight: 700,
											color: "#18181b",
											marginBottom: 6,
										}}
									>
										New Translation
									</h2>
									{pageReady ? (
										<NewTranslationPanel addVideo={addVideo} />
									) : (
										<NewTranslationFormSkeleton />
									)}
								</div>
							</motion.div>
						) : selected ? (
							<motion.div
								key={selected.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								style={{ maxWidth: 680, margin: "0 auto" }}
							>
								<div
									style={{
										borderRadius: 18,
										padding: "28px 24px",
										background: "#fff",
										border: "1px solid rgba(0,0,0,0.08)",
									}}
								>
									{!selectedDetail ? (
										<p style={{ color: "#ef4444", fontSize: 14 }}>
											No translation data for this item.
										</p>
									) : (
										<>
											<div
												style={{
													display: "flex",
													alignItems: "flex-start",
													justifyContent: "space-between",
													marginBottom: 24,
													gap: 12,
												}}
											>
												<div>
													<h2
														className="vaantra-font"
														style={{
															fontSize: 22,
															fontWeight: 700,
															color: "#18181b",
															marginBottom: 4,
														}}
													>
														{selected.label || sidebarTitle(selected)}
													</h2>
													<p
														className="mono"
														style={{ fontSize: 11, color: "#a1a1aa" }}
													>
														group: {selected.id}
														{selectedDetail.hasTabs &&
															` · ${selectedDetail.jobs.length} languages`}
													</p>
													<p
														className="mono"
														style={{ fontSize: 10, color: "#a1a1aa" }}
													>
														job: {selectedDetail.j.id}
													</p>
												</div>
												<span
													style={{
														padding: "4px 12px",
														borderRadius: 20,
														fontSize: 11.5,
														fontWeight: 600,
														flexShrink: 0,
														background: statusBg(selectedDetail.agg),
														color: statusColor(selectedDetail.agg),
													}}
												>
													{selectedDetail.agg}
												</span>
											</div>

											{selectedDetail.hasTabs && (
												<div
													style={{
														display: "flex",
														gap: 8,
														flexWrap: "wrap",
														marginBottom: 20,
													}}
												>
													{selectedDetail.jobs.map((job, i) => (
														<button
															key={job.id}
															type="button"
															onClick={() => setDetailTab(i)}
															style={{
																padding: "8px 12px",
																borderRadius: 10,
																fontSize: 13,
																fontWeight: 600,
																border: `1px solid ${detailTab === i ? "rgba(234,88,12,0.45)" : "rgba(0,0,0,0.1)"}`,
																background:
																	detailTab === i
																		? "rgba(234,88,12,0.1)"
																		: "#fff",
																color: detailTab === i ? "#c2410c" : "#52525b",
																display: "inline-flex",
																alignItems: "center",
																gap: 6,
																cursor: "pointer",
															}}
														>
															<span aria-hidden>
																{flagForLanguageName(job.lang)}
															</span>
															{job.lang}
															{job.status !== "done" &&
																job.status !== "error" &&
																!String(job.id).startsWith("failed_") && (
																	<Loader2 size={12} className="spin" />
																)}
														</button>
													))}
												</div>
											)}

											{selectedDetail.j.status !== "done" &&
												selectedDetail.j.status !== "error" && (
													<StatusProgress
														status={selectedDetail.j.status}
														jobId={selectedDetail.j.id}
													/>
												)}

											{selectedDetail.j.status === "done" &&
												(isVoiceTranslationGroup ? (
													<div>
														{selectedDetail.j.resultUrl ? (
															<div style={{ marginBottom: 24 }}>
																<p
																	style={{
																		fontSize: 12,
																		fontWeight: 600,
																		color: "#52525b",
																		marginBottom: 10,
																	}}
																>
																	Translated audio (
																	{selectedDetail.j.outputLanguage ||
																		selectedDetail.j.lang}
																	)
																</p>
																<audio
																	src={selectedDetail.j.resultUrl}
																	controls
																	style={{
																		width: "100%",
																		maxWidth: 480,
																		display: "block",
																		marginBottom: 14,
																	}}
																/>
																<a
																	href={selectedDetail.j.resultUrl}
																	download
																	target="_blank"
																	rel="noopener noreferrer"
																	style={{
																		display: "inline-flex",
																		alignItems: "center",
																		gap: 8,
																		fontSize: 14,
																		fontWeight: 600,
																		color: "#fff",
																		background: "#ea580c",
																		padding: "10px 18px",
																		borderRadius: 10,
																		textDecoration: "none",
																	}}
																>
																	<Download size={16} aria-hidden />
																	Download audio
																</a>
															</div>
														) : (
															<p
																style={{
																	color: "#71717a",
																	fontSize: 13,
																	marginBottom: 20,
																}}
															>
																Audio URL not available yet.
															</p>
														)}
														<button
															type="button"
															style={{
																padding: "10px 16px",
																borderRadius: 10,
																fontSize: 13.5,
																color: "#71717a",
																border: "1px solid rgba(0,0,0,0.1)",
															}}
															onClick={() => {
																setViewNew(true);
																setSelected(null);
																router.push("/app");
															}}
														>
															Translate another
														</button>
													</div>
												) : (
													<div>
														<p
															style={{
																fontSize: 12,
																color: "#a1a1aa",
																marginBottom: 16,
															}}
														>
															Status updates via repeated GET{" "}
															<span className="mono">
																/api/video-translate/:id
															</span>{" "}
															until complete.
														</p>
														<div
															style={{
																display: "grid",
																gridTemplateColumns:
																	"repeat(auto-fit, minmax(260px, 1fr))",
																gap: 16,
																marginBottom: 20,
															}}
														>
															<div>
																<p
																	style={{
																		fontSize: 12,
																		fontWeight: 600,
																		color: "#52525b",
																		marginBottom: 8,
																	}}
																>
																	Original source
																</p>
																<div
																	style={{
																		borderRadius: 12,
																		overflow: "hidden",
																		background: "#000",
																		aspectRatio: "16/9",
																		maxHeight: 320,
																	}}
																>
																	{selected.sourceVideoUrl ||
																	selectedDetail.j.sourceVideoUrl ? (
																		<video
																			src={
																				selected.sourceVideoUrl ||
																				selectedDetail.j.sourceVideoUrl
																			}
																			controls
																			style={{
																				width: "100%",
																				height: "100%",
																			}}
																		/>
																	) : (
																		<div
																			style={{
																				height: "100%",
																				minHeight: 160,
																				display: "flex",
																				alignItems: "center",
																				justifyContent: "center",
																				color: "#71717a",
																				fontSize: 13,
																				padding: 16,
																			}}
																		>
																			Source URL not available yet
																		</div>
																	)}
																</div>
															</div>
															<div>
																<div
																	style={{
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "space-between",
																		gap: 10,
																		marginBottom: 8,
																		flexWrap: "wrap",
																	}}
																>
																	<p
																		style={{
																			fontSize: 12,
																			fontWeight: 600,
																			color: "#52525b",
																			margin: 0,
																		}}
																	>
																		Dubbed (
																		{selectedDetail.j.outputLanguage ||
																			selectedDetail.j.lang}
																		)
																	</p>
																	{selectedDetail.j.resultUrl && (
																		<a
																			href={selectedDetail.j.resultUrl}
																			download
																			target="_blank"
																			rel="noopener noreferrer"
																			style={{
																				display: "inline-flex",
																				alignItems: "center",
																				gap: 6,
																				fontSize: 12,
																				fontWeight: 600,
																				color: "#fff",
																				background: "#ea580c",
																				padding: "6px 12px",
																				borderRadius: 8,
																				textDecoration: "none",
																				flexShrink: 0,
																			}}
																		>
																			<Download size={14} aria-hidden />
																			Download video
																		</a>
																	)}
																</div>
																<div
																	style={{
																		borderRadius: 12,
																		overflow: "hidden",
																		background: "#000",
																		aspectRatio: "16/9",
																		maxHeight: 320,
																	}}
																>
																	{selectedDetail.j.resultUrl ? (
																		<video
																			src={selectedDetail.j.resultUrl}
																			controls
																			style={{
																				width: "100%",
																				height: "100%",
																			}}
																		/>
																	) : (
																		<div
																			style={{
																				height: "100%",
																				minHeight: 160,
																				display: "flex",
																				alignItems: "center",
																				justifyContent: "center",
																				color: "#71717a",
																				fontSize: 13,
																				padding: 16,
																			}}
																		>
																			Dubbed file URL not available yet
																		</div>
																	)}
																</div>
															</div>
														</div>
														{(selectedDetail.j.transcriptOriginal ||
															selectedDetail.j.translatedTranscript ||
															selectedDetail.j.caption) && (
															<div style={{ marginBottom: 16 }}>
																{selectedDetail.j.transcriptOriginal && (
																	<CopyTextBlock
																		label="Original transcript"
																		text={selectedDetail.j.transcriptOriginal}
																		audioSrc={
																			selected.sourceVideoUrl ||
																			selectedDetail.j.sourceVideoUrl ||
																			undefined
																		}
																		audioDownloadName="original-source.mp4"
																		audioPreviewLabel="Original audio (from source video)"
																	/>
																)}
																{selectedDetail.j.translatedTranscript && (
																	<CopyTextBlock
																		label="Translated transcript"
																		text={selectedDetail.j.translatedTranscript}
																		audioSrc={
																			selectedDetail.j.resultUrl || undefined
																		}
																		audioDownloadName={`dubbed-transcript-${(selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output").replace(/[^\w-]+/g, "_")}.mp4`}
																		audioPreviewLabel="Translated audio (dubbed)"
																	/>
																)}
																{selectedDetail.j.caption && (
																	<CopyTextBlock
																		label={`Caption (${selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output"})`}
																		text={selectedDetail.j.caption}
																		audioSrc={
																			selectedDetail.j.resultUrl || undefined
																		}
																		audioDownloadName={`caption-audio-${(selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output").replace(/[^\w-]+/g, "_")}.mp4`}
																		audioPreviewLabel="Caption language audio (dubbed)"
																	/>
																)}
															</div>
														)}
														{selectedDetail.j.captionUrl && (
															<p style={{ fontSize: 13, marginBottom: 16 }}>
																<ExternalLink
																	size={14}
																	style={{
																		display: "inline",
																		verticalAlign: "middle",
																		marginRight: 6,
																	}}
																/>
																<a
																	href={selectedDetail.j.captionUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	style={{
																		color: "#c2410c",
																		fontWeight: 500,
																	}}
																>
																	Open caption file
																</a>
															</p>
														)}
														<div
															style={{
																display: "flex",
																gap: 10,
																flexWrap: "wrap",
															}}
														>
															<button
																type="button"
																onClick={() => {
																	if (selectedDetail.j.resultUrl)
																		window.open(
																			selectedDetail.j.resultUrl,
																			"_blank",
																			"noopener,noreferrer",
																		);
																}}
																disabled={!selectedDetail.j.resultUrl}
																style={{
																	flex: 1,
																	minWidth: 120,
																	padding: "10px",
																	borderRadius: 10,
																	fontSize: 13.5,
																	fontWeight: 600,
																	background: "#ea580c",
																	color: "#fff",
																	opacity: selectedDetail.j.resultUrl ? 1 : 0.45,
																	cursor: selectedDetail.j.resultUrl
																		? "pointer"
																		: "not-allowed",
																}}
															>
																Open dubbed video
															</button>
															<button
																type="button"
																style={{
																	padding: "10px 16px",
																	borderRadius: 10,
																	fontSize: 13.5,
																	color: "#71717a",
																	border: "1px solid rgba(0,0,0,0.1)",
																}}
																onClick={() => {
																	setViewNew(true);
																	setSelected(null);
																}}
															>
																Translate another
															</button>
														</div>
													</div>
												))}

											{selectedDetail.j.status === "error" && (
												<div
													style={{
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														gap: 10,
														padding: "28px 0",
													}}
												>
													<AlertCircle size={44} style={{ color: "#ef4444" }} />
													<p
														style={{
															color: "#ef4444",
															fontWeight: 500,
														}}
													>
														Translation failed ({selectedDetail.j.lang})
													</p>
													<p
														style={{
															color: "#71717a",
															fontSize: 13.5,
														}}
													>
														Please try again with a new translation
													</p>
													<button
														type="button"
														onClick={() => {
															setViewNew(true);
															setSelected(null);
														}}
														style={{
															marginTop: 4,
															padding: "9px 20px",
															borderRadius: 10,
															fontSize: 13.5,
															background: "rgba(234,88,12,0.1)",
															border: "1px solid rgba(234,88,12,0.25)",
															color: "#c2410c",
														}}
													>
														New Translation
													</button>
												</div>
											)}
										</>
									)}
								</div>

								<div
									style={{
										display: "flex",
										justifyContent: "flex-end",
										marginTop: 10,
									}}
								>
									<button
										onClick={() => deleteVideo(selected.id)}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 5,
											padding: "6px 12px",
											borderRadius: 8,
											fontSize: 12.5,
											color: "#a1a1aa",
											border: "1px solid rgba(0,0,0,0.08)",
										}}
									>
										<Trash2 size={12} /> Delete
									</button>
								</div>
							</motion.div>
						) : (
							<motion.div
								key="empty"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									paddingTop: "18vh",
									gap: 14,
								}}
							>
								<Languages size={52} style={{ color: "#d4d4d8" }} />
								<h3
									className="vaantra-font"
									style={{ fontSize: 20, fontWeight: 700, color: "#a1a1aa" }}
								>
									No translation selected
								</h3>
								<button
									onClick={() => setViewNew(true)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 7,
										padding: "10px 22px",
										borderRadius: 11,
										fontSize: 14,
										fontWeight: 600,
										background: "rgba(234,88,12,0.1)",
										border: "1px solid rgba(234,88,12,0.25)",
										color: "#c2410c",
									}}
								>
									<Plus size={14} /> New Translation
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
			<UpgradePriceModal
				open={showUpgrade}
				onClose={() => setShowUpgrade(false)}
			/>
		</div>
	);
}

// ─── Landing route (/) — signed-in users are sent to /app ───────────────────
export default function Home() {
	const router = useRouter();
	const [user, setUser] = useState(null);
	const [authReady, setAuthReady] = useState(false);

	useEffect(() => {
		const unsub = onAuthStateChange((firebaseUser) => {
			setAuthReady(true);
			if (firebaseUser) {
				setUser({
					name:
						firebaseUser.displayName ||
						firebaseUser.email?.split("@")[0] ||
						"User",
					email: firebaseUser.email,
					avatar: firebaseUser.photoURL || firebaseUser.displayName?.[0] || "U",
					uid: firebaseUser.uid,
				});
			} else {
				setUser(null);
			}
		});
		return () => unsub();
	}, []);

	useEffect(() => {
		if (authReady && user) {
			let dest = "/app";
			try {
				if (sessionStorage.getItem("pendingUsagePurchase")) {
					sessionStorage.removeItem("pendingUsagePurchase");
					dest = "/app?upgrade=1";
				}
			} catch {
				/* ignore */
			}
			router.replace(dest);
		}
	}, [authReady, user, router]);

	if (!authReady) {
		return (
			<div
				style={{
					fontFamily: "'DM Sans', system-ui, sans-serif",
					background: "#f5f4f0",
					minHeight: "100vh",
				}}
			>
				<GlobalStyles />
			</div>
		);
	}

	if (user) {
		return (
			<div
				style={{
					fontFamily: "'DM Sans', system-ui, sans-serif",
					background: "#f5f4f0",
					minHeight: "100vh",
				}}
			>
				<GlobalStyles />
			</div>
		);
	}

	return (
		<div
			style={{
				fontFamily: "'DM Sans', system-ui, sans-serif",
				background: "#f5f4f0",
				minHeight: "100vh",
			}}
		>
			<GlobalStyles />
			<AnimatePresence mode="wait">
				<motion.div
					key="land"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<Landing />
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
