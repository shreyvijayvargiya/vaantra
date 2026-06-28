import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LoginModal from "../lib/ui/LoginModal";
import {
	FeedbackCreditProvider,
	FeedbackCreditTrigger,
} from "../lib/ui/FeedbackCreditLauncher";
import TopTargetLanguagesSection from "../app/components/TopTargetLanguagesSection";
import { TranslationGroupStatsPanel } from "../app/components/TranslationGroupStats";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import StudioVideoPlayer from "../app/components/StudioVideoPlayer";
import StudioYouTubePreview from "../app/components/StudioYouTubePreview";
import TranslationExamplesSection from "../app/components/TranslationExamplesSection";
import HomePage from "../app/components/Home";
import VideoToolsTabBar from "../lib/ui/VideoToolsTabBar";
import WorkspaceVideoPicker from "../lib/ui/WorkspaceVideoPicker";
import WorkspacePage from "../app/components/WorkspacePage";
import { getBlockedVideoUrlWarning } from "../lib/utils/blockedVideoUrl";
import VideoCaptionPanel from "../lib/ui/VideoCaptionPanel";
import ViralClipCutPanel from "../lib/ui/ViralClipCutPanel";
import VideoToolsStatusProgress from "../lib/ui/VideoToolsStatusProgress";
import VideoCaptionJobResult from "../lib/ui/VideoCaptionJobResult";
import ViralClipsJobResult from "../lib/ui/ViralClipsJobResult";
import { fetchCaptionJobOnce, fetchClipJobOnce } from "../lib/videoToolsJob";
import { startCaptionJob } from "../lib/videoToolsApi";
import { onAuthStateChange } from "../lib/api/auth";
import {
	deleteTranslationGroupDoc,
	upsertTranslationGroup,
} from "../lib/api/translationHistory";
import {
	getPublicShareUrl,
	publishPublicShare,
} from "../lib/api/publicShare";
import { auth } from "../lib/config/firebase";
import {
	QUERY_KEY_TRANSLATION_GROUPS,
	useTranslationGroups,
} from "../lib/hooks/useTranslationHistory";
import { useWorkspaceVideos, QUERY_KEY_WORKSPACE_VIDEOS } from "../lib/hooks/useWorkspaceVideos";
import { ensureWorkspaceVideoFromJob } from "../lib/api/workspaceVideos";
import {
	resolveReuseVideoUrl,
	getFollowUpTabOrderForGroupType,
	getInitialFollowUpTabForGroupType,
} from "../lib/utils/videoToolsTabs";
import {
	dedupeVideosById,
	inferTranslationGroupType,
	loadVideosForUser,
	saveVideos,
} from "../lib/utils/translationStorage";
import {
	incrementUserUsageMinutesClient,
	QUERY_KEY_USER_USAGE,
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
	FREE_STARTER_MINUTES,
	PRICE_PER_MINUTE_INR,
	PRICE_PER_MINUTE_USD,
	sliderIndexForAtLeastMinutes,
	USAGE_MINUTE_STEPS,
} from "../lib/utils/usagePricing";
import {
	formatDurationClock,
	probeAudioDurationSeconds,
	probeVideoDurationSeconds,
	secondsToBillableMinutes,
} from "../lib/utils/videoDuration";
import {
	getYouTubeVideoId,
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
} from "../lib/translateApi";
import { LANGS, LANG_GROUPS, flagForLanguageName, languageNameToApiCode } from "../lib/utils/languages";
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
	CreditCard,
	ArrowRightIcon,
	Play,
	Pause,
	Maximize2,
	LayoutGrid,
	Share2,
} from "lucide-react";

// ─── Contact & billing (UI only; API later) ───────────────────────────────────
const CONTACT_EMAIL = "shreyvijayvargiya26@gmail.com";

/** Dashboard video file upload cap */
const VIDEO_UPLOAD_MAX_MB = 500;
const VIDEO_UPLOAD_MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024;

// ─── Gemini TTS voice catalog (hardcoded) ────────────────────────────────────
const GEMINI_VOICES = [
	{ id: "gemini-zephyr", tts_voice: "Zephyr", label: "Zephyr — Bright", gender: "female", style: "Bright", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY2ThCL7yGv8aYwER3mjJuFHt4rhsTgi0foZBC" },
	{ id: "gemini-puck", tts_voice: "Puck", label: "Puck — Upbeat", gender: "male", style: "Upbeat", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY0yLh6IYHJXDfMBqh1rKpP6s9Z8AvNIlgE4xY" },
	{ id: "gemini-charon", tts_voice: "Charon", label: "Charon — Informative", gender: "male", style: "Informative", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYVYWbAxivTAZwfqQj6H0oWylU289IKdsLFgzJ" },
	{ id: "gemini-kore", tts_voice: "Kore", label: "Kore — Firm", gender: "female", style: "Firm", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYRWzs1YGOyknJ521FHVUurQvoE4zTaLctRISe" },
	{ id: "gemini-fenrir", tts_voice: "Fenrir", label: "Fenrir — Excitable", gender: "male", style: "Excitable", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY8wBmc7tvEgwNYVcQmlGtqB02iUuxpCSdbOjn" },
	{ id: "gemini-leda", tts_voice: "Leda", label: "Leda — Youthful", gender: "female", style: "Youthful", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYjeI605S6Fu1bQOM0p4lVUeY7JgB8RswZoWSE" },
	{ id: "gemini-orus", tts_voice: "Orus", label: "Orus — Firm", gender: "male", style: "Firm", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYL1DhH4XvTQ9SV28ZbINjYCotR7Ed3JziOWhF" },
	{ id: "gemini-aoede", tts_voice: "Aoede", label: "Aoede — Breezy", gender: "female", style: "Breezy", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYyo7128nwDYs1AMchQFyb07I84jWivdH9mO2R" },
	{ id: "gemini-callirrhoe", tts_voice: "Callirrhoe", label: "Callirrhoe — Easy-going", gender: "female", style: "Easy-going", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYsG7S4uEWbPeCnWz7wNuo4HVLUxSBGqrtDyAh" },
	{ id: "gemini-autonoe", tts_voice: "Autonoe", label: "Autonoe — Bright", gender: "female", style: "Bright", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY0jxsHuYHJXDfMBqh1rKpP6s9Z8AvNIlgE4xY" },
	{ id: "gemini-enceladus", tts_voice: "Enceladus", label: "Enceladus — Breathy", gender: "male", style: "Breathy", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYy84WoTnwDYs1AMchQFyb07I84jWivdH9mO2R" },
	{ id: "gemini-iapetus", tts_voice: "Iapetus", label: "Iapetus — Clear", gender: "male", style: "Clear", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYHUvSq58bhJv0eKBzRkf62Go4SDg8sQuOMrp9" },
	{ id: "gemini-umbriel", tts_voice: "Umbriel", label: "Umbriel — Easy-going", gender: "male", style: "Easy-going", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYRGtTm5OyknJ521FHVUurQvoE4zTaLctRISeY" },
	{ id: "gemini-algieba", tts_voice: "Algieba", label: "Algieba — Smooth", gender: "male", style: "Smooth", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYPrgl0eVfsZTC1GIbAa9pwgzENvjVoJ4eS0OW" },
	{ id: "gemini-despina", tts_voice: "Despina", label: "Despina — Smooth", gender: "female", style: "Smooth", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYXPUdvptmbVd2Mtl4Hmexp9KNSOJIvg1WqDs0" },
	{ id: "gemini-erinome", tts_voice: "Erinome", label: "Erinome — Clear", gender: "female", style: "Clear", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYdNDMWotB0mAHE68ivjy7GN4WZpIoQk2YdcgF" },
	{ id: "gemini-algenib", tts_voice: "Algenib", label: "Algenib — Gravelly", gender: "male", style: "Gravelly", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYA9DCCJEHGZL8fNSDOxQyIaCqpw719ilKV4ej" },
	{ id: "gemini-rasalgethi", tts_voice: "Rasalgethi", label: "Rasalgethi — Informative", gender: "male", style: "Informative", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY8IDtiMvEgwNYVcQmlGtqB02iUuxpCSdbOjny" },
	{ id: "gemini-laomedeia", tts_voice: "Laomedeia", label: "Laomedeia — Upbeat", gender: "female", style: "Upbeat", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY2aYpOFzyGv8aYwER3mjJuFHt4rhsTgi0foZB" },
	{ id: "gemini-achernar", tts_voice: "Achernar", label: "Achernar — Soft", gender: "female", style: "Soft", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYa0qh8fYjL8f2TNZdntqcJF3CAivOQGlMS0pr" },
	{ id: "gemini-alnilam", tts_voice: "Alnilam", label: "Alnilam — Firm", gender: "male", style: "Firm", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY35zBRwqCWeogKhF19bTi7I6zQ0q8EafskJrG" },
	{ id: "gemini-schedar", tts_voice: "Schedar", label: "Schedar — Even", gender: "male", style: "Even", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRY0rm6nYHJXDfMBqh1rKpP6s9Z8AvNIlgE4xYa" },
	{ id: "gemini-gacrux", tts_voice: "Gacrux", label: "Gacrux — Mature", gender: "female", style: "Mature", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYQInlrFR1Xc2ZbTm83KoAvS6kGPrDjlf5ROgY" },
	{ id: "gemini-pulcherrima", tts_voice: "Pulcherrima", label: "Pulcherrima — Forward", gender: "female", style: "Forward", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYwusYypcvoJNVKSmrBdMGYtLXHp4qkafZuOz1" },
	{ id: "gemini-achird", tts_voice: "Achird", label: "Achird — Friendly", gender: "male", style: "Friendly", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYi3wm1AFlKavenfPpi3Zb1mAg4d50CY2RWLOs" },
	{ id: "gemini-zubenelgenubi", tts_voice: "Zubenelgenubi", label: "Zubenelgenubi — Casual", gender: "male", style: "Casual", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYaukSGrjL8f2TNZdntqcJF3CAivOQGlMS0prw" },
	{ id: "gemini-vindemiatrix", tts_voice: "Vindemiatrix", label: "Vindemiatrix — Gentle", gender: "female", style: "Gentle", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYAVctuaEHGZL8fNSDOxQyIaCqpw719ilKV4ej" },
	{ id: "gemini-sadachbia", tts_voice: "Sadachbia", label: "Sadachbia — Lively", gender: "male", style: "Lively", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYt6BxuHIimOKe2MwDjzg4bqv9lnLGdNyJVHWX" },
	{ id: "gemini-sadaltager", tts_voice: "Sadaltager", label: "Sadaltager — Knowledgeable", gender: "male", style: "Knowledgeable", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYBq6MiPJt8W16NkSEspMAH9mbVJjylwPKQur5" },
	{ id: "gemini-sulafat", tts_voice: "Sulafat", label: "Sulafat — Warm", gender: "female", style: "Warm", audio_url: "https://b4fcijccdw.ufs.sh/f/mVUSE925dTRYTQup64H176gEYQeNBjdHDc0La8obWsmZnJPI" },
];
const GEMINI_DEFAULT_VOICE_ID = "gemini-puck";
const TTS_VOICE_STORAGE_KEY = "aantra_tts_voice_id";

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

function aggregateJobStatus(jobs) {
	if (!jobs || !jobs.length) return "queued";
	if (jobs.some((j) => j.status === "error")) return "error";
	if (jobs.every((j) => j.status === "done")) return "done";
	return "processing";
}

function sidebarTitle(v) {
	if (v.label && String(v.label).trim()) return v.label.trim();
	if (v.type === "caption") return "AI Captions";
	if (v.type === "clips") return "Viral Clips";
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
    .aantraa-font { font-family: 'Lora', Georgia, serif; }
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
    @keyframes landing-cta-border-spin {
      to { transform: rotate(360deg); }
    }
    .landing-hero-cta-shine-wrap {
      position: relative;
      display: inline-flex;
      border-radius: 0.75rem;
      padding: 2px;
      overflow: hidden;
      isolation: isolate;
    }
    .landing-hero-cta-shine-wrap::before {
      content: "";
      position: absolute;
      z-index: 0;
      width: 200%;
      height: 200%;
      left: 50%;
      top: 50%;
      margin-left: -100%;
      margin-top: -100%;
      background: conic-gradient(
        from 0deg,
        #ea580c,
        #fb923c,
        #fdba74,
        #fff7ed,
        #fef3c7,
        #fed7aa,
        #f97316,
        #ea580c,
        #fb923c
      );
      animation: landing-cta-border-spin 2.5s linear infinite;
    }
    .landing-hero-cta-shine-btn {
      position: relative;
      z-index: 1;
      border-radius: 0.625rem;
      border: none !important;
    }
  `}</style>
);

/** Multi-select target languages (checkboxes + search). */
function LangMultiSelect({
	selected,
	onChange,
	fullWidth = false,
	lockedLangs = [],
}) {
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
		if (lockedLangs.includes(lang)) return;
		if (selected.includes(lang)) onChange(selected.filter((x) => x !== lang));
		else onChange([...selected, lang]);
	};
	const summary =
		selected.length === 0
			? "Select languages"
			: selected.length === 1
				? selected[0]
				: `${selected.length} languages`;
	return (
		<div
			ref={ref}
			style={{ position: "relative"}}
			className="w-full"
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
					{selected.length === 1 ? flagForLanguageName(selected[0]) : "🏴"}
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
							overflow: "clip",
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
							{(() => {
								const renderLangButton = (lang) => {
									const locked = lockedLangs.includes(lang);
									const on = selected.includes(lang);
									return (
										<button
											key={lang}
											type="button"
											onClick={(e) => {
												e.preventDefault();
												toggle(lang);
											}}
											disabled={locked}
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
												cursor: locked ? "not-allowed" : "pointer",
												opacity: locked ? 0.85 : 1,
											}}
											onMouseEnter={(e) => {
												if (locked) return;
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
								};

								if (q) {
									// flat search results
									if (!filtered.length) {
										return (
											<p style={{ color: "#a1a1aa", fontSize: 13, padding: "10px 12px" }}>
												No results
											</p>
										);
									}
									return filtered.map(renderLangButton);
								}

								// grouped by continent
								return LANG_GROUPS.map(({ continent, langs }) => (
									<div key={continent}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 6,
												padding: "6px 10px 4px",
												position: "sticky",
												top: 0,
												background: "#fff",
												zIndex: 2,
											}}
										>
											<span
												style={{
													fontSize: 10,
													fontWeight: 700,
													letterSpacing: "0.08em",
													textTransform: "uppercase",
													color: "#a1a1aa",
													whiteSpace: "nowrap",
												}}
											>
												{continent}
											</span>
											<span
												style={{
													flex: 1,
													height: 1,
													background: "rgba(0,0,0,0.07)",
												}}
											/>
										</div>
										{langs.map(renderLangButton)}
									</div>
								));
							})()}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Status Progress Visualizer ──────────────────────────────────────────────
const STEP_PCTS = { uploading: 10, queued: 28, processing: 55, translating: 82, done: 100 };
const STEP_FLOORS = { uploading: 0, queued: 10, processing: 28, translating: 55 };
const STEP_DURATIONS = { uploading: 30, queued: 90, processing: 360, translating: 180 };

function StatusProgress({ status, jobId, createdAt, detectedDurationSec }) {
	const curIdx = STEPS.findIndex((s) => s.key === status);
	const isErr = status === "error";
	const isCancelled = status === "cancelled";
	const isActive = !isErr && !isCancelled && status !== "done";

	const [elapsed, setElapsed] = useState(() => {
		if (!createdAt || !isActive) return 0;
		return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
	});

	useEffect(() => {
		if (!isActive) return;
		const start = createdAt ? new Date(createdAt).getTime() : Date.now();
		setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
		const id = setInterval(
			() => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000))),
			1000,
		);
		return () => clearInterval(id);
	}, [status, createdAt, isActive]);

	let progressPct;
	if (status === "done") {
		progressPct = 100;
	} else if (isErr) {
		const frozenIdx = curIdx >= 0 ? curIdx : 1;
		progressPct = STEP_PCTS[STEPS[frozenIdx]?.key] ?? 15;
	} else if (isCancelled) {
		progressPct = STEP_PCTS[status] ?? 15;
	} else {
		const floor = STEP_FLOORS[status] ?? 0;
		const ceiling = STEP_PCTS[status] ?? 10;
		const dur = STEP_DURATIONS[status] ?? 60;
		const fraction = Math.min(0.92, elapsed / dur);
		progressPct = floor + fraction * (ceiling - floor);
	}

	const estimatedTotalSec = detectedDurationSec
		? Math.max(120, Math.round(detectedDurationSec * 0.55 + 90))
		: null;
	const remainingSec =
		estimatedTotalSec && isActive
			? Math.max(0, estimatedTotalSec - elapsed)
			: null;

	const elapsedLabel =
		elapsed > 0
			? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")} elapsed`
			: null;
	const etaLabel =
		remainingSec != null
			? `~${Math.max(1, Math.round(remainingSec / 60))} min left`
			: null;

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

		{/* Progress bar */}
		<div
			style={{
				margin: "0 2px 6px",
				height: 5,
				borderRadius: 3,
				background: "rgba(0,0,0,0.07)",
				overflow: "hidden",
			}}
		>
			<motion.div
				animate={{ width: `${progressPct}%` }}
				transition={{ duration: 0.9, ease: "easeInOut" }}
				style={{
					height: "100%",
					borderRadius: 3,
					background:
						isErr || isCancelled
							? "rgba(0,0,0,0.18)"
							: "linear-gradient(90deg, #fb923c, #ea580c)",
					boxShadow: isActive ? "0 0 7px rgba(234,88,12,0.4)" : "none",
				}}
			/>
		</div>

		{/* Elapsed + ETA row */}
		{(elapsedLabel || etaLabel) && (
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: 10.5,
					color: "#a1a1aa",
					marginBottom: 10,
					fontFamily: "'DM Mono', monospace",
					padding: "0 2px",
				}}
			>
				<span>{elapsedLabel ?? ""}</span>
				{etaLabel && <span>{etaLabel}</span>}
			</div>
		)}

		<motion.div
			key={status}
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			style={{
				padding: "18px 20px",
				borderRadius: 12,
				textAlign: "center",
				background: isCancelled
					? "rgba(0,0,0,0.03)"
					: isErr
						? "rgba(239,68,68,0.06)"
						: "rgba(0,0,0,0.03)",
				border: `1px solid ${
					isErr
						? "rgba(239,68,68,0.25)"
						: isCancelled
							? "rgba(0,0,0,0.08)"
							: "rgba(0,0,0,0.06)"
				}`,
			}}
		>
			{isCancelled ? (
				<>
					<X size={20} style={{ color: "#a1a1aa", marginBottom: 6 }} />
					<p style={{ color: "#71717a", fontWeight: 500, fontSize: 14 }}>
						Cancelled
					</p>
					<p style={{ color: "#a1a1aa", fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
						This job was cancelled. Use the Resume button to restart.
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
			) : isErr ? (
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
						<p
						 className="aantraa-font text-[10px] mt-2 text-zinc-400">You can close the window and came back later once finished</p>
					</>
				)}
			</motion.div>
		</div>
	);
}

function formatAudioClock(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "0:00";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${m}:${String(s).padStart(2, "0")}`;
}

function getLongMediaEtaLine(durationSec) {
	const minutes = Math.max(0, Number(durationSec) || 0) / 60;
	if (minutes <= 2) return null;
	const minWait = Math.max(3, Math.ceil(minutes * 0.9));
	const maxWait = Math.max(minWait + 2, Math.ceil(minutes * 1.7));
	return `Long media detected (~${Math.ceil(minutes)} min). Please wait about ${minWait}-${maxWait} minutes after clicking Translate.`;
}


function isHttpOrHttpsUrl(s) {
	try {
		const u = new URL(s.trim());
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

/** Numeric tweet id from x.com / twitter.com status URLs (for embed preview). */
function parseTweetStatusId(input) {
	if (!input || typeof input !== "string") return null;
	try {
		const u = new URL(input.trim());
		const host = u.hostname.replace(/^www\./, "").toLowerCase();
		if (
			host !== "x.com" &&
			host !== "twitter.com" &&
			host !== "mobile.twitter.com"
		)
			return null;
		const m = u.pathname.match(/\/status\/(\d+)/);
		return m && /^\d+$/.test(m[1]) ? m[1] : null;
	} catch {
		return null;
	}
}

/** Skip native video/audio for YouTube or X/Twitter page URLs — use embeds or open in a new tab. */
function shouldUseNativeMediaForUrl(url) {
	if (!url?.trim()) return false;
	const s = url.trim();
	if (getYouTubeVideoId(s)) return false;
	if (parseTweetStatusId(s)) return false;
	return isHttpOrHttpsUrl(s);
}

function SourceUrlLinkBar({ url }) {
	const [copied, setCopied] = useState(false);
	const trimmed = url?.trim();
	if (!trimmed || !isHttpOrHttpsUrl(trimmed)) return null;
	return (
		<div
			style={{
				marginTop: 10,
				padding: "12px 14px",
				borderRadius: 12,
				border: "1px solid rgba(0,0,0,0.08)",
			}}
		>
			<p
				style={{
					fontSize: 10,
					fontWeight: 700,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					color: "#71717a",
					margin: "0 0 8px",
				}}
			>
				Source URL
			</p>
			<a
				href={trimmed}
				target="_blank"
				rel="noopener noreferrer"
				style={{
					display: "block",
					fontSize: 13,
					color: "#c2410c",
					fontWeight: 500,
					wordBreak: "break-all",
					lineHeight: 1.45,
				}}
			>
				{trimmed}
			</a>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 10,
					marginTop: 10,
					alignItems: "center",
				}}
			>
				<button
					type="button"
					onClick={() => {
						void navigator.clipboard?.writeText(trimmed);
						setCopied(true);
						setTimeout(() => setCopied(false), 2000);
					}}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						padding: "8px 12px",
						borderRadius: 8,
						fontSize: 12,
						fontWeight: 600,
						border: "1px solid rgba(0,0,0,0.1)",
						background: "#fafafa",
						color: copied ? "#16a34a" : "#52525b",
						cursor: "pointer",
					}}
				>
					<Copy size={14} aria-hidden />
					{copied ? "Copied" : "Copy URL"}
				</button>
				<a
					href={trimmed}
					target="_blank"
					rel="noopener noreferrer"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						padding: "8px 12px",
						borderRadius: 8,
						fontSize: 12,
						fontWeight: 600,
						background: "rgba(234,88,12,0.1)",
						color: "#c2410c",
						border: "1px solid rgba(234,88,12,0.25)",
					}}
				>
					<ExternalLink size={14} aria-hidden />
					Open in new tab
				</a>
			</div>
		</div>
	);
}

function StudioTweetEmbedPreview({ tweetId }) {
	const embedSrc = `https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(tweetId)}&theme=light&dnt=true`;
	return (
		<div
			style={{
				borderRadius: 16,
				overflow: "hidden",
				background:
					"linear-gradient(145deg, #18181b 0%, #27272a 45%, #1c1917 100%)",
				border: "1px solid rgba(255,255,255,0.06)",

			}}
		>
			<div
				style={{
					borderRadius: 12,
					overflow: "hidden",
					position: "relative",
					background: "#fff",
					width: "100%",
					minHeight: 280,
					maxHeight: 520,
				}}
			>
				<iframe
					src={embedSrc}
					title="X post preview"
					sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
					referrerPolicy="strict-origin-when-cross-origin"
					style={{
						width: "100%",
						height: "420px",
						border: "none",
						display: "block",
					}}
				/>
			</div>
			<div
				style={{
					padding: "8px 12px",
					background: "rgba(0,0,0,0.45)",
					borderTop: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<span
					style={{
						fontSize: 11,
						fontFamily: "'DM Mono', monospace",
						color: "rgba(255,255,255,0.8)",
					}}
				>
					Preview · X / Twitter embed
				</span>
			</div>
		</div>
	);
}

/** YouTube iframe, X/Tweet embed, or native video — with optional URL strip below (dashboard). */
function OriginalSourceMediaPreview({
	url,
	footerLabel = "Source video",
	showLinkBar = true,
	youtubeDurationHintSec = 0,
}) {
	const trimmed = url?.trim();
	if (!trimmed) return null;
	const ytId = getYouTubeVideoId(trimmed);
	if (ytId) {
		return (
			<>
				<StudioYouTubePreview
					videoId={ytId}
					durationHintSec={youtubeDurationHintSec}
				/>
				{showLinkBar ? <SourceUrlLinkBar url={trimmed} /> : null}
			</>
		);
	}
	const tweetId = parseTweetStatusId(trimmed);
	if (tweetId) {
		return (
			<>
				<StudioTweetEmbedPreview tweetId={tweetId} />
				{showLinkBar ? <SourceUrlLinkBar url={trimmed} /> : null}
			</>
		);
	}
	return (
		<>
			<StudioVideoPlayer
				src={trimmed}
				footerLabel={footerLabel}
				showUrlOnError
			/>
			{showLinkBar ? <SourceUrlLinkBar url={trimmed} /> : null}
		</>
	);
}

/** Dark, Spotify-inspired player with animated waveform bars (voice translation). */
function VoiceStyleAudioPlayer({ src }) {
	const audioRef = useRef(null);
	const [playing, setPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		const a = audioRef.current;
		if (!a) return;
		setLoadError(false);
		const onTime = () => setCurrentTime(a.currentTime);
		const onDur = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
		const onEnded = () => setPlaying(false);
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onError = () => setLoadError(true);
		a.addEventListener("timeupdate", onTime);
		a.addEventListener("loadedmetadata", onDur);
		a.addEventListener("ended", onEnded);
		a.addEventListener("play", onPlay);
		a.addEventListener("pause", onPause);
		a.addEventListener("error", onError);
		return () => {
			a.removeEventListener("timeupdate", onTime);
			a.removeEventListener("loadedmetadata", onDur);
			a.removeEventListener("ended", onEnded);
			a.removeEventListener("play", onPlay);
			a.removeEventListener("pause", onPause);
			a.removeEventListener("error", onError);
		};
	}, [src]);

	const toggle = async () => {
		const a = audioRef.current;
		if (!a) return;
		try {
			if (a.paused) await a.play();
			else a.pause();
		} catch {
			setPlaying(false);
		}
	};

	const seek = (e) => {
		const a = audioRef.current;
		if (!a || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		a.currentTime = (x / rect.width) * duration;
	};

	const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
	const bars = 16;

	if (loadError) {
		return (
			<p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>
				Could not load audio.
			</p>
		);
	}

	return (
		<div
			style={{
				borderRadius: 16,
				overflow: "hidden",
				background:
					"linear-gradient(145deg, #18181b 0%, #27272a 45%, #1c1917 100%)",
				border: "1px solid rgba(255,255,255,0.06)",
				boxShadow: "0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
				padding: "14px 16px 16px",
			}}
		>
			<audio ref={audioRef} src={src} preload="metadata" />
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 14,
				}}
			>
				<motion.button
					type="button"
					onClick={() => void toggle()}
					aria-label={playing ? "Pause" : "Play"}
					whileHover={{ scale: 1.06 }}
					whileTap={{ scale: 0.94 }}
					style={{
						width: 52,
						height: 52,
						borderRadius: "50%",
						border: "none",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
						background:
							playing
								? "linear-gradient(145deg, #f97316, #ea580c)"
								: "linear-gradient(145deg, #3f3f46, #27272a)",
						color: "#fff",
						boxShadow: playing
							? "0 8px 24px rgba(234,88,12,0.45)"
							: "0 4px 14px rgba(0,0,0,0.35)",
						cursor: "pointer",
					}}
				>
					{playing ? (
						<Pause size={22} strokeWidth={2.4} color="currentColor" />
					) : (
						<Play
							size={22}
							strokeWidth={2.4}
							color="currentColor"
							style={{ marginLeft: 3 }}
						/>
					)}
				</motion.button>

				<div
					style={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						gap: 10,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "flex-end",
							justifyContent: "center",
							gap: 3,
							height: 36,
							padding: "0 4px",
						}}
					>
						{Array.from({ length: bars }, (_, i) => (
							<motion.div
								key={i}
								animate={
									playing
										? {
												height: [
													6,
													10 + (i % 5) * 5,
													14,
													8 + (i % 7) * 4,
													22 + (i % 4) * 2,
													6,
												],
											}
										: { height: 5 }
								}
								transition={
									playing
										? {
												repeat: Infinity,
												duration: 0.85 + (i % 5) * 0.08,
												ease: "easeInOut",
												delay: i * 0.04,
											}
										: { duration: 0.25 }
								}
								style={{
									width: 3,
									borderRadius: 2,
									background: playing
										? "linear-gradient(180deg, #fef3c7, #ea580c)"
										: "rgba(255,255,255,0.12)",
									alignSelf: "flex-end",
								}}
							/>
						))}
					</div>

					<button
						type="button"
						onClick={seek}
						style={{
							width: "100%",
							padding: 0,
							border: "none",
							background: "transparent",
							cursor: "pointer",
							borderRadius: 4,
						}}
					>
						<div
							style={{
								height: 5,
								borderRadius: 3,
								background: "rgba(255,255,255,0.1)",
								overflow: "hidden",
							}}
						>
							<motion.div
								style={{
									height: "100%",
									width: `${pct}%`,
									borderRadius: 3,
									background:
										"linear-gradient(90deg, #fb923c, #ea580c, #f97316)",
									boxShadow: "0 0 12px rgba(234,88,12,0.5)",
								}}
							/>
						</div>
					</button>

					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 11,
							fontFamily: "'DM Mono', monospace",
							color: "rgba(255,255,255,0.45)",
							letterSpacing: "0.02em",
						}}
					>
						<span>{formatAudioClock(currentTime)}</span>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 5,
								color: "rgba(255,255,255,0.35)",
								fontSize: 10,
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							<Headphones size={12} aria-hidden />
							Now playing
						</span>
						<span>{formatAudioClock(duration)}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function CopyTextBlock({
	label,
	text,
	audioSrc,
	audioDownloadName,
	audioPreviewLabel,
	animatedAudio = false,
	/** When false, header download still works but no player under the label (e.g. voice detail has a main player). */
	showInlineAudio = true,
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
			{audioSrc && showInlineAudio ? (
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
					{animatedAudio ? (
						<VoiceStyleAudioPlayer src={audioSrc} />
					) : (
						<audio
							controls
							src={audioSrc}
							preload="metadata"
							style={{ width: "100%", height: 40, borderRadius: 8 }}
						>
							Your browser does not support audio playback.
						</audio>
					)}
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

async function getTranslateAuthHeaders() {
	const headers = {};
	try {
		const u = auth.currentUser;
		if (u) {
			const idToken = await u.getIdToken();
			if (idToken) {
				headers.Authorization = `Bearer ${idToken}`;
				return headers;
			}
		}
	} catch {
		// fall back to static token
	}
	const env = process.env.NEXT_PUBLIC_TRANSLATE_API_TOKEN?.trim();
	if (env) {
		const t = env.replace(/^Bearer\s+/i, "");
		headers.Authorization = `Bearer ${t}`;
	}
	return headers;
}

/**
 * One job: caption SSE (`/api/groq/video-translate/caption?stream=1`) for progress + result.
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

// Module-level reference so any playing audio is stopped when a new one starts.
let _narratorAudio = null;

function NarratorVoiceSelect({ value, onChange, fullWidth = false }) {
	const [open, setOpen] = useState(false);
	const [playingId, setPlayingId] = useState(null);
	const ref = useRef(null);

	useEffect(() => {
		const h = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, []);

	// stop audio on unmount
	useEffect(() => {
		return () => {
			if (_narratorAudio) {
				_narratorAudio.pause();
				_narratorAudio = null;
			}
		};
	}, []);

	const selected =
		GEMINI_VOICES.find((v) => v.id === value) ||
		GEMINI_VOICES.find((v) => v.id === GEMINI_DEFAULT_VOICE_ID);

	const playPreview = (e, voice) => {
		e.stopPropagation();
		if (_narratorAudio) {
			_narratorAudio.pause();
			_narratorAudio = null;
		}
		if (playingId === voice.id) {
			setPlayingId(null);
			return;
		}
		const audio = new Audio(voice.audio_url);
		_narratorAudio = audio;
		setPlayingId(voice.id);
		audio.onended = () => {
			setPlayingId(null);
			_narratorAudio = null;
		};
		audio.onerror = () => {
			setPlayingId(null);
			_narratorAudio = null;
		};
		audio.play().catch(() => setPlayingId(null));
	};

	const femaleVoices = GEMINI_VOICES.filter((v) => v.gender === "female").sort(
		(a, b) => a.tts_voice.localeCompare(b.tts_voice),
	);
	const maleVoices = GEMINI_VOICES.filter((v) => v.gender === "male").sort(
		(a, b) => a.tts_voice.localeCompare(b.tts_voice),
	);

	const renderRow = (voice) => {
		const isSelected = voice.id === value;
		const isPlaying = playingId === voice.id;
		return (
			<div
				key={voice.id}
				onClick={() => {
					onChange(voice.id);
					try {
						localStorage.setItem(TTS_VOICE_STORAGE_KEY, voice.id);
					} catch {}
					setOpen(false);
				}}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "7px 10px",
					borderRadius: 8,
					cursor: "pointer",
					background: isSelected ? "rgba(234,88,12,0.08)" : "transparent",
					transition: "background 0.1s",
				}}
				onMouseEnter={(e) => {
					if (!isSelected)
						e.currentTarget.style.background = "rgba(0,0,0,0.04)";
				}}
				onMouseLeave={(e) => {
					if (!isSelected) e.currentTarget.style.background = "transparent";
				}}
			>
				{/* play button */}
				<button
					type="button"
					aria-label={`Preview ${voice.tts_voice} voice`}
					onClick={(e) => playPreview(e, voice)}
					style={{
						width: 26,
						height: 26,
						borderRadius: "50%",
						border: "1px solid rgba(0,0,0,0.12)",
						background: isPlaying
							? "rgba(234,88,12,0.15)"
							: "rgba(0,0,0,0.04)",
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
						cursor: "pointer",
						color: isPlaying ? "#ea580c" : "#71717a",
						transition: "background 0.15s, color 0.15s",
					}}
				>
					{isPlaying ? (
						<Pause size={11} strokeWidth={2.5} />
					) : (
						<Play size={11} strokeWidth={2.5} />
					)}
				</button>

				{/* name */}
				<span
					style={{
						flex: 1,
						fontSize: 13,
						color: isSelected ? "#c2410c" : "#18181b",
						fontWeight: isSelected ? 600 : 400,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{voice.tts_voice}
				</span>

				{/* style tag */}
				<span
					style={{
						fontSize: 10,
						padding: "2px 6px",
						borderRadius: 6,
						background: "rgba(0,0,0,0.05)",
						color: "#71717a",
						whiteSpace: "nowrap",
						flexShrink: 0,
					}}
				>
					{voice.style}
				</span>

				{/* selected tick */}
				{isSelected && (
					<Check size={12} strokeWidth={3} color="#ea580c" style={{ flexShrink: 0 }} />
				)}
			</div>
		);
	};

	return (
		<div ref={ref} style={{ position: "relative", width: fullWidth ? "100%" : "auto" }}>
			{/* trigger */}
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					width: fullWidth ? "100%" : 220,
					padding: "10px 12px",
					borderRadius: 12,
					background: "#fff",
					border: "1px solid rgba(0,0,0,0.1)",
					cursor: "pointer",
					fontSize: 13,
					color: "#18181b",
				}}
			>
				<span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }} aria-hidden>
					🎙
				</span>
				<span style={{ flex: 1, textAlign: "left" }}>
					{selected ? selected.tts_voice : "Select voice"}
				</span>
				{selected && (
					<span
						style={{
							fontSize: 10,
							padding: "2px 6px",
							borderRadius: 6,
							background: "rgba(234,88,12,0.1)",
							color: "#c2410c",
							whiteSpace: "nowrap",
							flexShrink: 0,
						}}
					>
						{selected.style}
					</span>
				)}
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

			{/* dropdown */}
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
							width: fullWidth ? "100%" : 260,
							zIndex: 300,
							background: "#fff",
							border: "1px solid rgba(0,0,0,0.1)",
							borderRadius: 14,
							overflow: "clip",
							boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
						}}
					>
						{/* header label */}
						<div
							style={{
								padding: "8px 12px 6px",
								borderBottom: "1px solid rgba(0,0,0,0.06)",
							}}
						>
							<p
								style={{
									fontSize: 10,
									fontWeight: 600,
									letterSpacing: "0.06em",
									textTransform: "uppercase",
									color: "#a1a1aa",
									margin: 0,
								}}
							>
								Narrator voice
							</p>
						</div>
						<div style={{ maxHeight: 280, overflowY: "auto", padding: "4px 6px 6px" }}>
							{/* Female group */}
							<div
								style={{
									padding: "6px 10px 2px",
									fontSize: 10,
									fontWeight: 700,
									letterSpacing: "0.07em",
									textTransform: "uppercase",
									color: "#c2410c",
									display: "flex",
									alignItems: "center",
									gap: 6,
									position: "sticky",
									top: 0,
									background: "#fff",
									zIndex: 2,
								}}
							>
								♀ Female
								<span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
							</div>
							{femaleVoices.map(renderRow)}

							{/* Male group */}
							<div
								style={{
									padding: "8px 10px 2px",
									fontSize: 10,
									fontWeight: 700,
									letterSpacing: "0.07em",
									textTransform: "uppercase",
									color: "#2563eb",
									display: "flex",
									alignItems: "center",
									gap: 6,
									position: "sticky",
									top: 0,
									background: "#fff",
									zIndex: 2,
								}}
							>
								♂ Male
								<span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
							</div>
							{maleVoices.map(renderRow)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function EstimateCurrencyTabs({ value, onChange }) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "flex-start",
				marginBottom: 10,
			}}
		>
			<div
				role="tablist"
				aria-label="Estimate currency"
				style={{
					display: "inline-flex",
					padding: 3,
					gap: 2,
					background: "rgba(255,255,255,0.75)",
					borderRadius: 10,
					border: "1px solid rgba(0,0,0,0.08)",
					boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
				}}
			>
				{[
					{ code: "usd", label: "USD" },
					{ code: "inr", label: "INR" },
				].map(({ code, label }) => (
					<button
						key={code}
						type="button"
						role="tab"
						aria-selected={value === code}
						onClick={() => onChange(code)}
						style={{
							padding: "7px 14px",
							borderRadius: 8,
							fontSize: 12,
							fontWeight: 600,
							border: "none",
							cursor: "pointer",
							transition: "background 0.15s, color 0.15s",
							background:
								value === code
									? "rgba(234,88,12,0.18)"
									: "transparent",
							color: value === code ? "#c2410c" : "#71717a",
						}}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}

/** @param {"usd" | "inr"} currency */
function formatEstimateMoneyTotal(minutes, currency) {
	const m = Number(minutes);
	if (!Number.isFinite(m) || m <= 0) return null;
	if (currency === "inr") {
		const total = m * PRICE_PER_MINUTE_INR;
		return `₹${total.toLocaleString("en-IN")}`;
	}
	const total = m * PRICE_PER_MINUTE_USD;
	return `$${total.toFixed(2)}`;
}

/** @param {"usd" | "inr"} currency */
function estimateRateLabel(currency) {
	return currency === "inr"
		? `₹${PRICE_PER_MINUTE_INR}/min`
		: `$${PRICE_PER_MINUTE_USD.toFixed(2)}/min`;
}

function VoiceTranslateForm({
	compact = false,
	onVoiceJobCreated,
	usageMinutesUsed,
	usageMinutesCredited,
}) {
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
	const [audioDurationSec, setAudioDurationSec] = useState(0);
	const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
	const [estimateCurrency, setEstimateCurrency] = useState("usd");
	const [showCreditsModal, setShowCreditsModal] = useState(false);
	const [creditsModalDetail, setCreditsModalDetail] = useState(null);
	const submitAbortRef = useRef(null);
	const submitInFlightRef = useRef(false); // synchronous double-submit guard
	const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
		try {
			return localStorage.getItem(TTS_VOICE_STORAGE_KEY) || GEMINI_DEFAULT_VOICE_ID;
		} catch {
			return GEMINI_DEFAULT_VOICE_ID;
		}
	});

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

	useEffect(() => {
		const media = uploadedFile || recordedBlob;
		if (!media) {
			setAudioDurationSec(0);
			return;
		}
		const audioEl = document.createElement("audio");
		audioEl.preload = "metadata";
		const objectUrl = URL.createObjectURL(media);
		audioEl.src = objectUrl;
		const onLoaded = () => {
			setAudioDurationSec(
				Number.isFinite(audioEl.duration) ? audioEl.duration : 0,
			);
			URL.revokeObjectURL(objectUrl);
		};
		const onError = () => {
			setAudioDurationSec(0);
			URL.revokeObjectURL(objectUrl);
		};
		audioEl.addEventListener("loadedmetadata", onLoaded);
		audioEl.addEventListener("durationchange", onLoaded);
		audioEl.addEventListener("error", onError);
		audioEl.load();
		return () => {
			audioEl.removeEventListener("loadedmetadata", onLoaded);
			audioEl.removeEventListener("durationchange", onLoaded);
			audioEl.removeEventListener("error", onError);
			URL.revokeObjectURL(objectUrl);
		};
	}, [uploadedFile, recordedBlob]);

	useEffect(() => {
		const media = uploadedFile || recordedBlob;
		if (!media) {
			setAudioPreviewUrl("");
			return;
		}
		const objectUrl = URL.createObjectURL(media);
		setAudioPreviewUrl(objectUrl);
		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [uploadedFile, recordedBlob]);

	const submit = async () => {
		if (submitInFlightRef.current) return; // prevent double-submit before re-render
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

		const durationSecForCredits = hasAudio ? audioDurationSec : 0;
		const perJobBillableMin =
			durationSecForCredits > 0
				? secondsToBillableMinutes(durationSecForCredits)
				: 0;
		const estimatedTotalMinutes =
			perJobBillableMin > 0 ? perJobBillableMin * langs.length : 0;
		const usageProvided =
			typeof usageMinutesUsed === "number" &&
			typeof usageMinutesCredited === "number";
		if (
			auth.currentUser &&
			usageProvided &&
			estimatedTotalMinutes > 0
		) {
			const remaining = Math.max(
				0,
				usageMinutesCredited - usageMinutesUsed,
			);
			if (estimatedTotalMinutes > remaining) {
				setCreditsModalDetail({
					estimatedTotalMinutes,
					remainingMinutes: remaining,
					needMoreMinutes: estimatedTotalMinutes - remaining,
					perJobMinutes: perJobBillableMin,
					langCount: langs.length,
				});
				setShowCreditsModal(true);
				return;
			}
		}

		submitInFlightRef.current = true;
		setBusy(true);
		setErr(null);
		setResults(null);
		const url = getVoiceTranslatePostUrl();
		const ac = new AbortController();
		submitAbortRef.current = ac;
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
			fd.append("tts_engine", "openrouter");
			fd.append("brand_voice_id", selectedVoiceId);
			if (hasText) fd.append("text", text.trim());
			const auth = await getTranslateAuthHeaders();
			res = await fetch(url, {
				method: "POST",
				headers: auth,
				body: fd,
				signal: ac.signal,
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
					tts_engine: "openrouter",
					brand_voice_id: selectedVoiceId,
				}),
				signal: ac.signal,
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
				const voiceDurMin =
					hasAudio && audioDurationSec > 0
						? secondsToBillableMinutes(audioDurationSec)
						: null;
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
				durationMinutes: voiceDurMin,
				brandVoiceId: selectedVoiceId,
			}));
				onVoiceJobCreated({
					id: gid,
					type: "audio",
					label: `Voice · ${batch.map((b) => b.lang).join(", ")}`,
					jobs,
					createdAt: new Date().toISOString(),
					sourceVideoUrl: null,
					sourceText: hasText ? text.trim() : null,
				});
			}
		} catch (e) {
			if (e?.name === "AbortError") {
				setErr("Translation cancelled.");
				return;
			}
			console.error(e);
			setErr(e?.message || "Something went wrong");
		} finally {
			submitAbortRef.current = null;
			submitInFlightRef.current = false;
			setBusy(false);
		}
	};

	const hasAudio = Boolean(uploadedFile || recordedBlob);
	const isFreeUser = !auth.currentUser;
	const freeDurationLimitSec = 30;
	const freeDurationBlocked =
		isFreeUser &&
		audioDurationSec > freeDurationLimitSec;
	const canSubmit = Boolean(
		(text.trim() || hasAudio) &&
		selectedLangs.length > 0 &&
		!busy &&
		!transcribing &&
		!freeDurationBlocked,
	);
	const longMediaEta = getLongMediaEtaLine(audioDurationSec);
	const audioBillableMin =
		hasAudio && audioDurationSec > 0
			? secondsToBillableMinutes(audioDurationSec)
			: null;
	const voiceEstimateTotalMin =
		audioBillableMin != null && selectedLangs.length > 0
			? audioBillableMin * selectedLangs.length
			: null;

	return (
		<div>
			
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
			{audioPreviewUrl && (
				<div
					style={{
						marginBottom: 14,
						padding: "10px 12px 12px",
						borderRadius: 14,
						background: "rgba(0,0,0,0.02)",
						border: "1px solid rgba(0,0,0,0.06)",
					}}
				>
					<p style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>
						Audio preview
					</p>
					<VoiceStyleAudioPlayer src={audioPreviewUrl} />
				</div>
			)}
			{(hasAudio || text.trim()) && (
				<div
					style={{
						marginBottom: 14,
						padding: "14px 16px",
						borderRadius: 14,
						background: "linear-gradient(180deg, rgba(254,243,232,0.65), rgba(234,88,12,0.06))",
						border: "1px solid rgba(234,88,12,0.22)",
						boxShadow: "0 2px 12px rgba(234,88,12,0.06)",
					}}
				>
					<div
						style={{
							fontSize: 13,
							fontWeight: 700,
							color: "#c2410c",
							letterSpacing: "0.02em",
							marginBottom: 2,
						}}
					>
						Estimate
					</div>
					{audioBillableMin != null ? (
						<EstimateCurrencyTabs
							value={estimateCurrency}
							onChange={setEstimateCurrency}
						/>
					) : (
						<div style={{ height: 8 }} />
					)}
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							alignItems: "center",
							gap: "8px 14px",
							fontSize: 13,
							color: "#52525b",
							lineHeight: 1.5,
						}}
					>
						{audioBillableMin != null ? (
							selectedLangs.length > 0 ? (
								<>
									<span>
										Source ~{formatDurationClock(audioDurationSec)} (
										{audioBillableMin} min billed / language)
									</span>
									<span style={{ color: "#d4d4d8" }} aria-hidden>
										·
									</span>
									<span>
										{selectedLangs.length} language
										{selectedLangs.length !== 1 ? "s" : ""}
									</span>
									<span style={{ color: "#d4d4d8" }} aria-hidden>
										·
									</span>
									<span style={{ fontWeight: 600, color: "#18181b" }}>
										~{voiceEstimateTotalMin} min credit total
									</span>
									<span style={{ color: "#d4d4d8" }} aria-hidden>
										·
									</span>
									<span style={{ fontWeight: 600, color: "#18181b" }}>
										~
										{formatEstimateMoneyTotal(
											voiceEstimateTotalMin,
											estimateCurrency,
										) ?? "—"}{" "}
										<span style={{ fontWeight: 500, color: "#71717a" }}>
											{estimateCurrency === "inr" ? "INR" : "USD"}
										</span>
									</span>
									<span style={{ color: "#a1a1aa", fontSize: 12 }}>
										(at {estimateRateLabel(estimateCurrency)})
									</span>
								</>
							) : (
								<>
									<span>
										Source ~{formatDurationClock(audioDurationSec)} (
										{audioBillableMin} min billed per language)
									</span>
									<span style={{ color: "#d4d4d8" }} aria-hidden>
										·
									</span>
									<span style={{ color: "#71717a" }}>
										Select target languages to see total minutes and cost.
									</span>
									<span style={{ color: "#a1a1aa", fontSize: 12 }}>
										({estimateRateLabel(estimateCurrency)} each)
									</span>
								</>
							)
						) : hasAudio ? (
							<span style={{ color: "#71717a" }}>Reading audio length…</span>
						) : Boolean(text.trim()) && !hasAudio ? (
							<span style={{ color: "#71717a" }}>
								Text-only: billed minutes follow the generated audio length once
								the job completes.
							</span>
						) : (
							<span style={{ color: "#71717a" }}>
								Upload or record audio to see minutes and cost before you run.
							</span>
						)}
					</div>
					{longMediaEta ? (
						<p
							style={{
								marginTop: 12,
								marginBottom: 0,
								fontSize: 12,
								lineHeight: 1.5,
								color: "#9a3412",
								padding: "10px 12px",
								background: "rgba(234,88,12,0.08)",
								borderRadius: 10,
								border: "1px solid rgba(234,88,12,0.18)",
							}}
						>
							{longMediaEta}
						</p>
					) : null}
				</div>
			)}
			<div className="my-2">
			<p className="text-xs text-zinc-400 mb-2">Languages</p>	
				<LangMultiSelect
					selected={selectedLangs}
					onChange={setSelectedLangs}
					fullWidth
				/>
			</div>
			{/* Narrator voice */}
			<div>
				<p className="text-xs text-zinc-400 mb-2">Narrator voice</p>
				<NarratorVoiceSelect
					value={selectedVoiceId}
					onChange={setSelectedVoiceId}
					fullWidth
				/>
			</div>


		{freeDurationBlocked && (
			<p
				style={{
					fontSize: 12,
					color: "#b91c1c",
					background: "rgba(239,68,68,0.08)",
					border: "1px solid rgba(239,68,68,0.2)",
					borderRadius: 10,
					padding: "8px 10px",
					marginBottom: 10,
				}}
			>
				Free plan supports audio up to 30 seconds. Upgrade to translate longer clips.
			</p>
		)}
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
				className="my-4"
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
			{busy && (
				<button
					type="button"
					onClick={() => submitAbortRef.current?.abort()}
					style={{
						width: "100%",
						padding: "10px 14px",
						borderRadius: 10,
						fontSize: 13,
						fontWeight: 600,
						color: "#b91c1c",
						background: "rgba(239,68,68,0.08)",
						border: "1px solid rgba(239,68,68,0.25)",
					}}
				>
					Cancel translation
				</button>
			)}
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
									<div style={{ marginBottom: 12 }}>
										<VoiceStyleAudioPlayer src={r.audioUrl} />
									</div>
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
			<InsufficientCreditsModal
				open={showCreditsModal}
				onClose={() => {
					setShowCreditsModal(false);
					setCreditsModalDetail(null);
				}}
				detail={creditsModalDetail}
			/>
		</div>
	);
}

function NewTranslationPanel({
	addVideo,
	tab: controlledTab,
	onTabChange,
	showTabs = true,
	usageMinutesUsed,
	usageMinutesCredited,
	requireAuthOnSubmit = false,
	onRequireAuth,
	prefillVideoUrl = null,
	lockPrefilledUrl = false,
	workspaceVideos = [],
	followUpMode = false,
}) {
	const [internalTab, setInternalTab] = useState("video");
	const tab = controlledTab ?? internalTab;
	const setTab = onTabChange ?? setInternalTab;
	return (
		<>
			{showTabs && (
				<VideoToolsTabBar value={tab} onChange={setTab} className="mb-4" />
			)}
			{tab === "video" ? (
				<>
					{!followUpMode && (
					<p className="text-sm text-zinc-600 my-4">
						Upload a video or paste a URL to get started
					</p>
					)}
					{followUpMode && (
					<p className="text-sm text-zinc-600 my-4">
						Same video is ready — pick languages and start. This opens a new project.
					</p>
					)}
					{!followUpMode && (
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
					)}
					<TranslateForm
						onJobCreated={addVideo}
						compact
						requireAuthOnSubmit={requireAuthOnSubmit}
						onRequireAuth={onRequireAuth}
						prefillVideoUrl={prefillVideoUrl}
						lockPrefilledUrl={lockPrefilledUrl}
						workspaceVideos={workspaceVideos}
						urlOnly={followUpMode}
						usageMinutesUsed={usageMinutesUsed}
						usageMinutesCredited={usageMinutesCredited}
					/>
				</>
			) : tab === "voice" ? (
				<>
					<p className="text-sm text-zinc-600 my-4">
						Record, upload, or paste text to translate audio quickly
					</p>
					<VoiceTranslateForm
						compact
						onVoiceJobCreated={addVideo}
						usageMinutesUsed={usageMinutesUsed}
						usageMinutesCredited={usageMinutesCredited}
					/>
				</>
			) : tab === "caption" ? (
				<div className={followUpMode ? "" : "mt-4"}>
				<VideoCaptionPanel
					requireAuthOnSubmit={requireAuthOnSubmit}
					onRequireAuth={onRequireAuth}
					onJobCreated={addVideo}
					prefillVideoUrl={prefillVideoUrl}
					lockPrefilledUrl={lockPrefilledUrl}
					workspaceVideos={workspaceVideos}
					urlOnly={followUpMode}
				/>
				</div>
			) : (
				<div className={followUpMode ? "" : "mt-4"}>
				<ViralClipCutPanel
					requireAuthOnSubmit={requireAuthOnSubmit}
					onRequireAuth={onRequireAuth}
					onJobCreated={addVideo}
					prefillVideoUrl={prefillVideoUrl}
					lockPrefilledUrl={lockPrefilledUrl}
					workspaceVideos={workspaceVideos}
					urlOnly={followUpMode}
				/>
				</div>
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
	usageMinutesUsed,
	usageMinutesCredited,
	workspaceVideos = [],
	urlOnly = false,
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
	const [fileDurationSec, setFileDurationSec] = useState(0);
	const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
	const [urlDurationSec, setUrlDurationSec] = useState(0);
	const [youtubeDurationSec, setYoutubeDurationSec] = useState(0);
	const [estimateCurrency, setEstimateCurrency] = useState("usd");
	const fileRef = useRef();
	const localTrackRef = useRef(null);
	const submitAbortRef = useRef(null);
	const submitInFlightRef = useRef(false); // synchronous double-submit guard
	localTrackRef.current = localTrack;
	const [showCreditsModal, setShowCreditsModal] = useState(false);
	const [creditsModalDetail, setCreditsModalDetail] = useState(null);
	const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
		try {
			return localStorage.getItem(TTS_VOICE_STORAGE_KEY) || GEMINI_DEFAULT_VOICE_ID;
		} catch {
			return GEMINI_DEFAULT_VOICE_ID;
		}
	});

	useEffect(() => {
		if (!urlOnly) return;
		setMode("url");
		setFile(null);
		setFileError(null);
	}, [urlOnly]);

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



	useEffect(() => {
		if (!file) {
			setFileDurationSec(0);
			return;
		}
		const videoEl = document.createElement("video");
		videoEl.preload = "metadata";
		const objectUrl = URL.createObjectURL(file);
		videoEl.src = objectUrl;
		const onLoaded = () => {
			setFileDurationSec(
				Number.isFinite(videoEl.duration) ? videoEl.duration : 0,
			);
			URL.revokeObjectURL(objectUrl);
		};
		const onError = () => {
			setFileDurationSec(0);
			URL.revokeObjectURL(objectUrl);
		};
		videoEl.addEventListener("loadedmetadata", onLoaded);
		videoEl.addEventListener("durationchange", onLoaded);
		videoEl.addEventListener("error", onError);
		videoEl.load();
		return () => {
			videoEl.removeEventListener("loadedmetadata", onLoaded);
			videoEl.removeEventListener("durationchange", onLoaded);
			videoEl.removeEventListener("error", onError);
			URL.revokeObjectURL(objectUrl);
		};
	}, [file]);

	useEffect(() => {
		if (!file) {
			setVideoPreviewUrl("");
			return;
		}
		const objectUrl = URL.createObjectURL(file);
		setVideoPreviewUrl(objectUrl);
		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [file]);

	useEffect(() => {
		if (mode !== "url") {
			setUrlDurationSec(0);
			return;
		}
		const trimmed = url.trim();
		if (!trimmed) {
			setUrlDurationSec(0);
			return;
		}
		if (getYouTubeVideoId(trimmed)) {
			setUrlDurationSec(0);
			return;
		}
		let cancelled = false;
		const t = setTimeout(() => {
			void probeVideoDurationSeconds(trimmed).then((sec) => {
				if (!cancelled) setUrlDurationSec(Number.isFinite(sec) ? sec : 0);
			});
		}, 350);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [mode, url]);

	useEffect(() => {
		if (mode !== "url") {
			setYoutubeDurationSec(0);
			return;
		}
		const trimmed = url.trim();
		if (!getYouTubeVideoId(trimmed)) {
			setYoutubeDurationSec(0);
			return;
		}
		let cancelled = false;
		const t = setTimeout(() => {
			void fetch(
				`/api/youtube-duration?url=${encodeURIComponent(trimmed)}`,
			)
				.then((r) => r.json())
				.then((d) => {
					const sec = Number(d?.durationSec);
					if (!cancelled)
						setYoutubeDurationSec(
							Number.isFinite(sec) && sec > 0 ? sec : 0,
						);
				})
				.catch(() => {
					if (!cancelled) setYoutubeDurationSec(0);
				});
		}, 400);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [mode, url]);

	/** Landing: realtime caption SSE per in-flight job (no dashboard callback) */
	useEffect(() => {
		if (!localTrack || onJobCreated) return;
		const prev = localTrackRef.current;
		if (!prev?.jobs?.length) return;
		const pending = prev.jobs.filter(
			(j) =>
				j.status !== "done" &&
				j.status !== "error" &&
				j.status !== "cancelled" &&
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
		if (submitInFlightRef.current) return; // prevent double-submit before re-render
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
		submitInFlightRef.current = true;

		const durationSecForCredits =
			mode === "file"
				? fileDurationSec
				: Math.max(urlDurationSec, youtubeDurationSec);
		const perJobBillableMin =
			durationSecForCredits > 0
				? secondsToBillableMinutes(durationSecForCredits)
				: 0;
		const clientDurationMinutesHint =
			durationSecForCredits > 0 ? perJobBillableMin : null;
		const estimatedTotalMinutes =
			perJobBillableMin > 0
				? perJobBillableMin * selectedLangs.length
				: 0;
		const usageProvided =
			typeof usageMinutesUsed === "number" &&
			typeof usageMinutesCredited === "number";
		if (
			auth.currentUser &&
			usageProvided &&
			estimatedTotalMinutes > 0
		) {
			const remaining = Math.max(
				0,
				usageMinutesCredited - usageMinutesUsed,
			);
			if (estimatedTotalMinutes > remaining) {
				setCreditsModalDetail({
					estimatedTotalMinutes,
					remainingMinutes: remaining,
					needMoreMinutes: estimatedTotalMinutes - remaining,
					perJobMinutes: perJobBillableMin,
					langCount: selectedLangs.length,
				});
				setShowCreditsModal(true);
				return;
			}
		}

		setBusy(true);
		const postUrl = getTranslatePostUrl();
		const langs = [...selectedLangs].sort();
		const ac = new AbortController();
		submitAbortRef.current = ac;
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
						tts_engine: "openrouter",
						brand_voice_id: selectedVoiceId,
					};
					res = await fetch(postUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(await getTranslateAuthHeaders()),
						},
						body: JSON.stringify(body),
						signal: ac.signal,
					});
				} else {
					const fd = new FormData();
					fd.append("video", file);
					fd.append("output_language", lang);
					fd.append("tts_engine", "openrouter");
					fd.append("brand_voice_id", selectedVoiceId);
					res = await fetch(postUrl, {
						method: "POST",
						headers: await getTranslateAuthHeaders(),
						body: fd,
						signal: ac.signal,
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
				sourceVideoUrl:
					postFields.sourceVideoUrl ??
					(mode === "url" ? url.trim() : null),
				videoTranslateId: postFields.videoTranslateId ?? videoId,
				durationMinutes:
					postFields.durationMinutes ?? clientDurationMinutesHint ?? null,
				brandVoiceId: selectedVoiceId,
			});
			}

		const anyOk = jobs.some((j) => !String(j.id).startsWith("failed_"));
		if (!anyOk) {
			setBusy(false);
			setLocalTrack({ groupId, jobs, _sourceUrl: mode === "url" ? url.trim() : null });
			return;
		}

		const sourceVideoUrl =
			jobs.find((j) => j.sourceVideoUrl)?.sourceVideoUrl ??
			(mode === "url" ? url.trim() : null);

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
			setLocalTrack({ groupId, jobs, _sourceUrl: mode === "url" ? url.trim() : null });
		}
		} catch (e) {
			if (e?.name === "AbortError") {
				console.info("Translation cancelled by user.");
				return;
			}
			console.error(e);
		} finally {
			submitAbortRef.current = null;
			submitInFlightRef.current = false;
			setBusy(false);
		}
	};

	const reset = () => {
		setLocalTrack(null);
		setFile(null);
		setUrl("");
		setSelectedLangs([]);
	};

	const cancelLocalJob = (jobId) => {
		setLocalTrack((t) =>
			t
				? {
						...t,
						jobs: t.jobs.map((j) =>
							j.id === jobId ? { ...j, status: "cancelled" } : j,
						),
					}
				: t,
		);
	};

	const resumeLocalJob = async (job) => {
		const sourceUrl = localTrack?._sourceUrl;
		if (!sourceUrl || !job?.lang) {
			toast.error("Source URL not available for resume.");
			return;
		}
		const postUrl = getTranslatePostUrl();
		try {
			const res = await fetch(postUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(await getTranslateAuthHeaders()),
				},
				body: JSON.stringify({ video_url: sourceUrl, output_language: job.lang }),
			});
			const data = await res.json().catch(() => ({}));
			const apiErr = getApiErrorMessage(data);
			if (apiErr || !res.ok) {
				toast.error(apiErr || "Failed to resume translation.");
				return;
			}
			const videoId = parseVideoIdFromPostResponse(data);
			if (!videoId) {
				toast.error("Could not restart translation.");
				return;
			}
			const initial = normalizeStatus(extractStatusField(data));
			const postFields = extractJobFieldsFromGetResponse(data);
			const newJob = {
				id: videoId,
				lang: job.lang,
				status: initial,
				createdAt: new Date().toISOString(),
				...postFields,
				resultUrl: postFields.resultUrl ?? extractResultUrl(data) ?? null,
				sourceVideoUrl: postFields.sourceVideoUrl ?? sourceUrl,
				videoTranslateId: postFields.videoTranslateId ?? videoId,
			};
			setLocalTrack((t) =>
				t
					? {
							...t,
							jobs: t.jobs.map((j) => (j.id === job.id ? newJob : j)),
						}
					: t,
			);
		} catch (e) {
			toast.error(e?.message || "Failed to resume.");
		}
	};

	const isUrlInvalid =
		mode === "url" &&
		Boolean(url.trim()) &&
		!isHttpOrHttpsUrl(url.trim());

	// Domains whose videos cannot be fetched by the API
	const blockedDomainWarning =
		mode === "url" ? getBlockedVideoUrlWarning(url) : null;

	const canSubmit =
		selectedLangs.length > 0 &&
		(mode === "url" ? url.trim() && !isUrlInvalid && !blockedDomainWarning : file) &&
		!busy;
	const detectedDurationSec =
		mode === "file"
			? fileDurationSec
			: Math.max(urlDurationSec, youtubeDurationSec);
	const isYouTubeUrl =
		mode === "url" && Boolean(normalizeYouTubeVideoUrl(url.trim()));
	const isFreeUser = requireAuthOnSubmit || !auth.currentUser;
	const freeDurationBlocked = isFreeUser && detectedDurationSec > 30;
	const canSubmitWithLimits = canSubmit && !freeDurationBlocked;
	const longMediaEta =
		getLongMediaEtaLine(detectedDurationSec) ||
		(isYouTubeUrl && detectedDurationSec === 0
			? "YouTube URL detected. If this video is longer than 2 minutes, processing can take several minutes after you click Translate."
			: null);

	const estimatePerJobMin =
		detectedDurationSec > 0
			? secondsToBillableMinutes(detectedDurationSec)
			: null;
	const estimateTotalBillableMin =
		estimatePerJobMin != null && selectedLangs.length > 0
			? estimatePerJobMin * selectedLangs.length
			: null;

	const trimmedUrlForPreview = mode === "url" ? url.trim() : "";
	const ytPreviewId = trimmedUrlForPreview
		? getYouTubeVideoId(trimmedUrlForPreview)
		: null;
	const showUrlVideoPreview =
		mode === "url" &&
		Boolean(trimmedUrlForPreview) &&
		(Boolean(ytPreviewId) || isHttpOrHttpsUrl(trimmedUrlForPreview));

	const hasVideoSourceForEstimate =
		(mode === "url" && Boolean(url.trim()) && !isUrlInvalid) ||
		(mode === "file" && Boolean(file));

	const showForm = !localTrack;

	return (
		<div>
			{showForm ? (
				<>
					{/* Mode tabs */}
					{!urlOnly && (
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
					)}

					{/* Input area */}
					{mode === "url" ? (
						<>
						{workspaceVideos.length > 0 && !urlOnly && (
							<WorkspaceVideoPicker
								videos={workspaceVideos}
								value={url}
								onChange={(nextUrl) => {
									setUrl(nextUrl);
									setUrlLocked(false);
								}}
								disabled={busy || urlLocked}
								className="mb-3"
							/>
						)}
						<input
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://example.com/video.mp4"
							readOnly={urlLocked}
							disabled={busy || urlLocked}
							style={{
								width: "100%",
								padding: "11px 14px",
								borderRadius: 10,
								fontSize: 13,
								marginBottom: isUrlInvalid ? 6 : 12,
								background: "#fff",
								border: isUrlInvalid
									? "1px solid rgba(239,68,68,0.6)"
									: "1px solid rgba(0,0,0,0.1)",
								color: "#18181b",
								outline: "none",
								transition: "border-color 0.2s",
							}}
							onFocus={(e) =>
								(e.target.style.borderColor = isUrlInvalid
									? "rgba(239,68,68,0.8)"
									: "rgba(234,88,12,0.5)")
							}
							onBlur={(e) =>
								(e.target.style.borderColor = isUrlInvalid
									? "rgba(239,68,68,0.6)"
									: "rgba(0,0,0,0.1)")
							}
						/>
						{isUrlInvalid && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									marginBottom: 12,
									padding: "8px 12px",
									borderRadius: 9,
									background: "rgba(239,68,68,0.07)",
									border: "1px solid rgba(239,68,68,0.22)",
								}}
							>
								<AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
								<span style={{ fontSize: 12.5, color: "#b91c1c", lineHeight: 1.4 }}>
									Invalid URL — please enter a valid{" "}
									<code style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5 }}>
										https://
									</code>{" "}
									link or a YouTube URL.
								</span>
							</div>
						)}
					{/* Blocked-domain warning */}
					{blockedDomainWarning && (
						<div
							style={{
								display: "flex",
								alignItems: "flex-start",
								gap: 8,
								marginBottom: 12,
								padding: "10px 12px",
								borderRadius: 10,
								background: "rgba(239,68,68,0.07)",
								border: "1px solid rgba(239,68,68,0.22)",
							}}
						>
							<AlertCircle
								size={15}
								style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
							/>
							<div>
								<p
									style={{
										fontSize: 12.5,
										fontWeight: 600,
										color: "#b91c1c",
										marginBottom: 2,
									}}
								>
									This URL can't be translated
								</p>
								<p
									style={{
										fontSize: 12,
										color: "#b91c1c",
										lineHeight: 1.5,
										margin: 0,
									}}
								>
									{blockedDomainWarning}
								</p>
							</div>
						</div>
					)}

					{showUrlVideoPreview && !blockedDomainWarning && (
							<div
								style={{
									marginBottom: 12,
									padding: "10px 12px 12px",
									borderRadius: 14,
									border: "1px solid rgba(0,0,0,0.06)",
								}}
							>
								<p
									style={{
										fontSize: 12,
										color: "#71717a",
										marginBottom: 8,
									}}
								>
									Video preview
								</p>
								<OriginalSourceMediaPreview
									url={trimmedUrlForPreview}
									footerLabel="Preview"
									showLinkBar={false}
									youtubeDurationHintSec={youtubeDurationSec}
								/>
							</div>
						)}
						</>
					) : (
						<>
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
							{videoPreviewUrl && (
								<div
									style={{
										marginBottom: 12,
										padding: "10px 12px 12px",
										borderRadius: 14,
										background: "rgba(0,0,0,0.02)",
										border: "1px solid rgba(0,0,0,0.06)",
									}}
								>
									<p style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>
										Video preview
									</p>
									<StudioVideoPlayer src={videoPreviewUrl} footerLabel="Preview" />
								</div>
							)}
						</>
					)}
					{hasVideoSourceForEstimate && (
							<div
								style={{
									marginBottom: 14,
									padding: "14px 16px",
									borderRadius: 14,
									background:
										"linear-gradient(180deg, rgba(254,243,232,0.65), rgba(234,88,12,0.06))",
									border: "1px solid rgba(234,88,12,0.22)",
									boxShadow: "0 2px 12px rgba(234,88,12,0.06)",
								}}
							>
								<div
									style={{
										fontSize: 13,
										fontWeight: 700,
										color: "#c2410c",
										letterSpacing: "0.02em",
										marginBottom: 2,
									}}
								>
									Estimate
								</div>
								{estimatePerJobMin != null ? (
									<EstimateCurrencyTabs
										value={estimateCurrency}
										onChange={setEstimateCurrency}
									/>
								) : (
									<div style={{ height: 8 }} />
								)}
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										alignItems: "center",
										gap: "8px 14px",
										fontSize: 13,
										color: "#52525b",
										lineHeight: 1.5,
									}}
								>
									{estimatePerJobMin != null ? (
										selectedLangs.length > 0 ? (
											<>
												<span>
													Source ~{formatDurationClock(detectedDurationSec)} (
													{estimatePerJobMin} min billed / language)
												</span>
												<span style={{ color: "#d4d4d8" }} aria-hidden>
													·
												</span>
												<span>
													{selectedLangs.length} language
													{selectedLangs.length !== 1 ? "s" : ""}
												</span>
												<span style={{ color: "#d4d4d8" }} aria-hidden>
													·
												</span>
												<span style={{ fontWeight: 600, color: "#18181b" }}>
													~{estimateTotalBillableMin} min total
												</span>
												<span style={{ color: "#d4d4d8" }} aria-hidden>
													·
												</span>
												<span style={{ fontWeight: 600, color: "#18181b" }}>
													~
													{formatEstimateMoneyTotal(
														estimateTotalBillableMin,
														estimateCurrency,
													) ?? "—"}{" "}
													<span style={{ fontWeight: 500, color: "#71717a" }}>
														{estimateCurrency === "inr" ? "INR" : "USD"}
													</span>
												</span>
												<span style={{ color: "#a1a1aa", fontSize: 12 }}>
													(at {estimateRateLabel(estimateCurrency)})
												</span>
											</>
										) : (
											<>
												<span>
													Source ~{formatDurationClock(detectedDurationSec)} (
													{estimatePerJobMin} min billed per language)
												</span>
												<span style={{ color: "#d4d4d8" }} aria-hidden>
													·
												</span>
												<span style={{ color: "#71717a" }}>
													Select target languages to see total minutes and cost.
												</span>
												<span style={{ color: "#a1a1aa", fontSize: 12 }}>
													({estimateRateLabel(estimateCurrency)} each)
												</span>
											</>
										)
									) : mode === "file" && file ? (
										<span style={{ color: "#71717a" }}>
											Reading video length…
										</span>
									) : mode === "url" && url.trim() ? (
										<span style={{ color: "#71717a" }}>
											{isYouTubeUrl && youtubeDurationSec === 0
												? "Fetching YouTube duration…"
												: "Detecting video length… (direct URLs need CORS; use upload if this stays blank.)"}
										</span>
									) : (
										<span style={{ color: "#71717a" }}>
											Duration not available — try upload or a YouTube link.
										</span>
									)}
								</div>
								{longMediaEta ? (
									<p
										style={{
											marginTop: 12,
											marginBottom: 0,
											fontSize: 12,
											lineHeight: 1.5,
											color: "#9a3412",
											padding: "10px 12px",
											background: "rgba(234,88,12,0.08)",
											borderRadius: 10,
											border: "1px solid rgba(234,88,12,0.18)",
										}}
									>
										{longMediaEta}
									</p>
								) : null}
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

				{/* Language + Submit row */}
				<div className="my-2">
					<p className="text-xs text-zinc-400 my-2">Languages</p>
					<div className="w-full">
						<LangMultiSelect
							selected={selectedLangs}
							onChange={setSelectedLangs}
							fullWidth
						/>
					</div>
				</div>
				{/* Narrator voice */}
				<div className="my-2">
					<p className="text-xs text-zinc-400 my-2">Narrator voice</p>
					<NarratorVoiceSelect
						value={selectedVoiceId}
						onChange={setSelectedVoiceId}
						fullWidth
					/>
				</div>

				{freeDurationBlocked && (
						<p
							style={{
								fontSize: 12,
								color: "#b91c1c",
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.2)",
								borderRadius: 10,
								padding: "8px 10px",
								marginBottom: 10,
							}}
						>
							Free plan supports videos up to 30 seconds. Upgrade to translate longer videos.
						</p>
					)}
					<button
						onClick={submit}
						disabled={!canSubmitWithLimits}
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
							opacity: canSubmitWithLimits ? 1 : 0.35,
							transition: "opacity 0.2s, transform 0.1s",
							flexShrink: 0,
						}}
						className="my-2 w-full"
						onMouseEnter={(e) => {
							if (canSubmitWithLimits)
								e.currentTarget.style.transform = "scale(1.03)";
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
					{busy && (
						<button
							type="button"
							onClick={() => submitAbortRef.current?.abort()}
							style={{
								width: "100%",
								marginTop: 4,
								padding: "10px 14px",
								borderRadius: 10,
								fontSize: 13,
								fontWeight: 600,
								color: "#b91c1c",
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.25)",
							}}
						>
							Cancel translation
						</button>
					)}
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
							<StatusProgress
								status={j.status}
								jobId={j.id}
								createdAt={j.createdAt}
								detectedDurationSec={
									j.durationMinutes ? j.durationMinutes * 60 : null
								}
							/>
							{/* Per-job cancel button */}
							{j.status !== "done" &&
								j.status !== "error" &&
								j.status !== "cancelled" &&
								!String(j.id).startsWith("failed_") && (
									<button
										type="button"
										onClick={() => cancelLocalJob(j.id)}
										style={{
											width: "100%",
											marginTop: 8,
											padding: "8px 14px",
											borderRadius: 9,
											fontSize: 12.5,
											fontWeight: 500,
											color: "#b91c1c",
											background: "rgba(239,68,68,0.07)",
											border: "1px solid rgba(239,68,68,0.2)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 7,
										}}
									>
										<X size={13} aria-hidden />
										Cancel
									</button>
								)}
							{/* Per-job resume button */}
							{j.status === "cancelled" && localTrack?._sourceUrl && (
								<button
									type="button"
									onClick={() => resumeLocalJob(j)}
									style={{
										width: "100%",
										marginTop: 8,
										padding: "8px 14px",
										borderRadius: 9,
										fontSize: 12.5,
										fontWeight: 600,
										color: "#fff",
										background: "#ea580c",
										border: "none",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 7,
									}}
								>
									<RefreshCw size={13} aria-hidden />
									Resume
								</button>
							)}
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
			
			<InsufficientCreditsModal
				open={showCreditsModal}
				onClose={() => {
					setShowCreditsModal(false);
					setCreditsModalDetail(null);
				}}
				detail={creditsModalDetail}
			/>
		</div>
	);
}

/** Opens from TranslateForm when estimated billable minutes exceed remaining balance. */
function InsufficientCreditsModal({ open, onClose, detail }) {
	const suggestedIdx =
		detail != null
			? sliderIndexForAtLeastMinutes(detail.needMoreMinutes)
			: 0;
	return (
		<AnimatePresence>
			{open && detail ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 220,
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
							maxHeight: "90vh",
							overflowY: "auto",
							borderRadius: 18,
							padding: "28px 24px",
							background: "#fff",
							border: "1px solid rgba(0,0,0,0.08)",
							boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
						}}
						className="hidescrollbar"
					>
						<h3
							className="aantraa-font"
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#18181b",
								marginBottom: 8,
							}}
						>
							Add credits
						</h3>
						<p
							style={{
								fontSize: 14,
								color: "#71717a",
								marginBottom: 12,
								lineHeight: 1.5,
							}}
						>
							This run may use about{" "}
							<strong>{detail.estimatedTotalMinutes}</strong> minutes
							{detail.langCount > 1 ? (
								<>
									{" "}
									({detail.langCount} languages × ~{detail.perJobMinutes}{" "}
									min each)
								</>
							) : null}
							. You have{" "}
							<strong>{detail.remainingMinutes.toFixed(1)}</strong> minutes
							remaining.
						</p>
						<p
							style={{
								fontSize: 13,
								color: "#52525b",
								marginBottom: 14,
								lineHeight: 1.45,
							}}
						>
							Buy at least{" "}
							<strong>{Math.ceil(detail.needMoreMinutes)}</strong> more minutes
							with the slider, complete checkout, then try Translate again.
						</p>
						<UsagePricingPanel
							key={`${detail.needMoreMinutes}-${detail.estimatedTotalMinutes}`}
							compact
							suggestedSliderIndex={suggestedIdx}
							onRequireLogin={() => {}}
						/>
						<button
							type="button"
							onClick={onClose}
							style={{
								width: "100%",
								marginTop: 14,
								padding: "10px 14px",
								borderRadius: 10,
								fontSize: 13,
								fontWeight: 600,
								color: "#52525b",
								background: "rgba(0,0,0,0.04)",
								border: "1px solid rgba(0,0,0,0.1)",
								cursor: "pointer",
							}}
						>
							Close
						</button>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}

/** Centered confirm dialog before removing a translation from history (sidebar / detail). */
function DeleteTranslationConfirmModal({ open, title, onClose, onConfirm }) {
	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 230,
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
							maxWidth: 400,
							borderRadius: 18,
							padding: "26px 22px",
							background: "#fff",
							border: "1px solid rgba(0,0,0,0.08)",
							boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
						}}
					>
						<h3
							className="aantraa-font"
							style={{
								fontSize: 20,
								fontWeight: 700,
								color: "#18181b",
								marginBottom: 10,
							}}
						>
							Delete this translation?
						</h3>
						<p
							style={{
								fontSize: 14,
								color: "#71717a",
								lineHeight: 1.55,
								marginBottom: 22,
							}}
						>
							{title ? (
								<>
									This will permanently remove{" "}
									<strong style={{ color: "#18181b" }}>{title}</strong> from
									your history. This cannot be undone.
								</>
							) : (
								"This will permanently remove this translation from your history. This cannot be undone."
							)}
						</p>
						<div
							style={{
								display: "flex",
								gap: 10,
								flexWrap: "wrap",
								justifyContent: "flex-end",
							}}
						>
							<button
								type="button"
								onClick={onClose}
								style={{
									padding: "10px 18px",
									borderRadius: 10,
									fontSize: 13.5,
									fontWeight: 600,
									color: "#52525b",
									background: "rgba(0,0,0,0.04)",
									border: "1px solid rgba(0,0,0,0.1)",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={onConfirm}
								style={{
									padding: "10px 18px",
									borderRadius: 10,
									fontSize: 13.5,
									fontWeight: 600,
									color: "#fff",
									background: "#dc2626",
									border: "none",
									cursor: "pointer",
									boxShadow: "0 4px 14px rgba(220,38,38,0.35)",
								}}
							>
								Delete
							</button>
						</div>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
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
							className="aantraa-font"
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#18181b",
								marginBottom: 6,
							}}
						>
							Pay per use
						</h3>
						<p style={{ fontSize: 14, color: "#71717a", marginBottom: 10 }}>
							Choose how many minutes of video you want to translate and pay for it.
						</p>
						<UsagePricingPanel
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
						
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ─── Translation Example Row ──────────────────────────────────────────────────
// ─── Landing Page ─────────────────────────────────────────────────────────────
function Landing() {
	const [showLogin, setShowLogin] = useState(false);
	const [faqOpen, setFaqOpen] = useState(null);
	const [heroToolTab, setHeroToolTab] = useState("video");
	const [landingPricingCurrency, setLandingPricingCurrency] = useState("usd");
	const router = useRouter();

	const payPerUsePlan = useMemo(
		() => ({
			kind: "usage",
			name: "Pay per use",
			price:
				landingPricingCurrency === "inr"
					? `₹${PRICE_PER_MINUTE_INR.toLocaleString("en-IN")}`
					: `$${PRICE_PER_MINUTE_USD.toFixed(2)}`,
			unit:
				landingPricingCurrency === "inr"
					? "per minute of video or audio (INR)"
					: "per minute of video or audio (USD)",
			highlight: true,
			features: [
				`One-time ${FREE_STARTER_MINUTES} free starter minutes for new accounts (not a monthly reset)`,
				`Slider: pick minutes (${USAGE_MINUTE_STEPS[0]}–${USAGE_MINUTE_STEPS[USAGE_MINUTE_STEPS.length - 1]}) — same packs as checkout; pay the total shown`,
				"Powered by Polar checkout",
				"Fair use: usage tracked in minutes per completed job",
			],
			cta: "Get started",
		}),
		[landingPricingCurrency],
	);

	const pricingPlans = useMemo(
		() => [
			payPerUsePlan,
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
		],
		[payPerUsePlan],
	);



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
			a: "Yes — aantraa uses voice cloning to maintain the original speaker's timbre and rhythm in the translated dub.",
		},
		{
			q: "Can I translate to multiple languages at the same time?",
			a: "You can add several target languages and run multiple translation jobs in parallel so nothing blocks the rest of your queue. Advanced multi-language batch options are also available on Pro and Studio plans.",
		},
		{
			q: "What happens to my videos after translation?",
			a: "Translated videos are stored for 30 days (Free) or 1 year (Pro/Studio). You can download or delete them anytime.",
		},
		{
			q: "Can I choose the narrator voice for my translation?",
			a: "Yes. Every translation job lets you pick from 30 Gemini TTS voices — each with a distinct style like Upbeat, Firm, Breezy, Warm, or Knowledgeable. Hit the play button next to any voice in the dropdown to hear a live preview before you commit.",
		},
		{
			q: "How is aantraa different from ElevenLabs or other TTS tools?",
			a: "ElevenLabs and similar services charge per character or per minute of audio generated — costs add up fast for long videos or multiple languages. aantraa bundles translation + voice synthesis into one flat per-minute rate, so you pay for the source video duration, not the output. A 5-minute video translated into 3 languages costs the same per-minute rate as translating it into 1.",
		},
		{
			q: "What voices are available and who powers them?",
			a: "aantraa uses Google Gemini TTS (via OpenRouter) to deliver 30 studio-quality voices across a range of styles and genders — Puck, Kore, Zephyr, Sulafat, and more. These are the same neural voices used in Google's latest AI products, now available at a fraction of the standalone API cost.",
		},
		{
			q: "Can I preview a voice before translating?",
			a: "Yes — every voice in the narrator dropdown has a ▶ play button. Clicking it streams a short audio sample so you can compare tone and style before submitting your job. Only one preview plays at a time; starting a new one stops the previous automatically.",
		},
		{
			q: "Is my selected voice saved for future jobs?",
			a: "Yes. Your last chosen voice is stored locally in your browser. Every new translation or language you add defaults to that voice so you don't have to reselect it each time.",
		},
		{
			q: "How does aantraa compare in price to ElevenLabs, HeyGen, or Murf?",
			a: "Most competitors bill separately for translation, dubbing, and TTS — often $0.10–$0.30 per minute per service. aantraa bundles all three into one pipeline starting from a few cents per minute of source video. There are no per-character limits, no separate voice-cloning fees, and no surprise overage charges.",
		},
		{
			q: "Does the translated audio sync with the original video timing?",
			a: "Yes. The dubbing pipeline aligns translated speech to the original speaker's pacing and adjusts speed to fit within the same time windows, so the dubbed audio stays in sync with on-screen action.",
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

			<Navbar variant="marketing" onSignIn={() => setShowLogin(true)} />

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
							className="aantraa-font"
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
							aantraa<span style={{ color: "#ea580c" }}>.</span>
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
							<span style={{ display: "flex", justifyContent: "flex-start", alignItems:"center" }}>
								Upload audio or video, or <GrowthBadgePillLight />
							</span>
							<span style={{ display: "flex", justifyContent: "flex-start", alignItems:"center" }}>
								record directly, <HeroSparkleIcon /> and
							</span>
							<span style={{ display: "flex", justifyContent: "flex-start", alignItems:"center" }}>
								get translated <span className="ml-2 p-1 rounded-full bg-emerald-100">
									<Languages />
								</span>
							</span>
							<span style={{ display: "flex", justifyContent: "flex-start", alignItems:"center" }}>
								audio MP3 + text output in minutes
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
								Aantraa translates audio, text, and video into 90+ languages with
								voice-cloned output.
							</p>
						</div>

						<motion.div
							className="flex flex-wrap items-center gap-3"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, delay: 0.12 }}
						>
							<motion.div className="landing-hero-cta-shine-wrap">
								<motion.button
									type="button"
									onClick={() => router.push("/login")}
									className="landing-hero-cta-shine-btn flex items-center gap-2 py-2 px-4 text-zinc-50 text-lg font-semibold group bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 hover:shadow-xl transition-all duration-200"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									Get Started
									<ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
								</motion.button>
							</motion.div>
							<Link
								href="/examples"
								className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-base font-semibold text-zinc-800 shadow-sm transition-all duration-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
							>
								Check demo examples
							</Link>
						</motion.div>

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
						<div className="flex justify-between items-start my-2 w-full px-2">
							<motion.button
								className="landing-hero-trial w-fit p-1 text-xs border border-orange-400 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.45, duration: 0.45 }}
								onClick={() => router.push("/login")}
							>
								Start with {FREE_STARTER_MINUTES} free starter minutes
							</motion.button>
							<div className="flex items-center gap-2">
								<img className="h-6" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOCAyOCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZDVkNWQ1IiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0xOS40MDEgMy4zNzhhLjc1Ljc1IDAgMCAwLTEuMDIzLS4yOEMxMy4wNzIgNi4xMzIgMTMgMTEuMjY5IDEzIDE0Ljc1djcuNjlsLTQuNzItNC43MmEuNzUuNzUgMCAxIDAtMS4wNiAxLjA2bDYgNmEuNzUuNzUgMCAwIDAgMS4wNiAwbDYtNmEuNzUuNzUgMCAwIDAtMS4wNi0xLjA2bC00LjcyIDQuNzJ2LTcuNjljMC0zLjUxOC4xMjgtNy43OCA0LjYyMi0xMC4zNDlhLjc1Ljc1IDAgMCAwIC4yOC0xLjAyMyIvPjwvc3ZnPg==" />
								<span className="text-sm text-zinc-400">Try demo</span>
							</div>
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
							<VideoToolsTabBar
								value={heroToolTab}
								onChange={setHeroToolTab}
								className="mb-3"
							/>
							<NewTranslationPanel
								tab={heroToolTab}
								onTabChange={setHeroToolTab}
								showTabs={false}
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
								className="aantraa-font"
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
						className="aantraa-font"
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

			<TopTargetLanguagesSection />

			<TranslationExamplesSection />


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
						className="aantraa-font"
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
						{pricingPlans.map((plan) => (
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
										className="aantraa-font"
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
										defaultCurrency={landingPricingCurrency}
										onCurrencyChange={setLandingPricingCurrency}
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
											window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("More credits — aantraa")}&body=${encodeURIComponent("Hi,\n\nI'd like to discuss volume credits or a team plan.\n\n")}`;
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
						className="aantraa-font"
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

			<Footer variant="marketing" />

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
					{[1, 2, 3, 4].map(i => {
						return (
								<div
								className="my-2 app-skeleton-pulse"
								key={i}
								style={{
									height: 180,
									borderRadius: 16,
									background: "rgba(0,0,0,0.06)",
									maxWidth: 560,
									margin: "0 auto",
								}}
							/>
						);
					})}
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
	const [jobsAccordionOpen, setJobsAccordionOpen] = useState(true);
	const [localFallback, setLocalFallback] = useState([]);
	const [storageHydrated, setStorageHydrated] = useState(false);
	const [selected, setSelected] = useState(null);
	const [detailTab, setDetailTab] = useState(0);
	const [stagedLangs, setStagedLangs] = useState([]);
	const [appendBusy, setAppendBusy] = useState(null);
	const appendBusyRef = useRef(null); // synchronous guard — mirrors appendBusy state
	const [appendVoiceId, setAppendVoiceId] = useState(() => {
		try {
			return localStorage.getItem(TTS_VOICE_STORAGE_KEY) || GEMINI_DEFAULT_VOICE_ID;
		} catch {
			return GEMINI_DEFAULT_VOICE_ID;
		}
	});
	const [editingSidebarId, setEditingSidebarId] = useState(null);
	const [editingName, setEditingName] = useState("");
	const [viewNew, setViewNew] = useState(true);
	const [newTranslationTab, setNewTranslationTab] = useState("video");
	const [followUpTab, setFollowUpTab] = useState("video");
	const [showUpgrade, setShowUpgrade] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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

	const { data: workspaceVideos = [] } = useWorkspaceVideos(uid, videos);

	const pendingDeleteGroup = useMemo(() => {
		if (!deleteConfirmId) return null;
		return videos.find((v) => v.id === deleteConfirmId) ?? null;
	}, [deleteConfirmId, videos]);

	const pendingDeleteTitle = pendingDeleteGroup
		? pendingDeleteGroup.label?.trim() || sidebarTitle(pendingDeleteGroup)
		: "";

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
				if (group.jobs?.some((j) => j.status === "done")) {
					void publishPublicShare(uid, group);
				}
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

	const isStatsRoute = router.pathname === "/app/[id]/stats";
	const isWorkspaceRoute = router.pathname === "/app/workspace";

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
				queryClient.setQueryData(QUERY_KEY_USER_USAGE(uid), {
					used: 0,
					credited: 0,
				});
				return;
			}
			const nextUsage = {
				used: data.usageMinutesUsed,
				credited: data.usageMinutesCredited,
			};
			setUsageMinutes(nextUsage);
			queryClient.setQueryData(QUERY_KEY_USER_USAGE(uid), nextUsage);
		});
	}, [uid, queryClient]);

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

	/** Workspace route — no group selected */
	useEffect(() => {
		if (!router.isReady || !isWorkspaceRoute) return;
		setSelected(null);
		setViewNew(false);
	}, [router.isReady, isWorkspaceRoute]);

	/** Keep selection in sync with /app vs /app/[id] (group / Firestore doc id in URL). */
	useEffect(() => {
		if (!pageReady || routeVideoId === undefined) return;
		const prev = prevRouteVideoIdRef.current;
		prevRouteVideoIdRef.current = routeVideoId;

		if (routeVideoId) {
			// Prefer list data; fall back to in-memory selection when the React Query list
			// has not caught up yet right after `addVideo` + `router.push` (avoids bouncing to /app).
			const fromList = videos.find((x) => x.id === routeVideoId);
			const fromRef =
				selectedRef.current?.id === routeVideoId
					? selectedRef.current
					: null;
			const v = fromList ?? fromRef;
			if (v) {
				setSelected(fromList ?? fromRef);
				setViewNew(false);
			} else {
				setSelected(null);
				setViewNew(true);
				// Stats page loads the group via its own query; avoid bouncing to /app while history is still loading.
				if (router.pathname !== "/app/[id]/stats") {
					router.replace("/app");
				}
			}
			return;
		}
		if (router.pathname === "/app" && prev) {
			setSelected(null);
			setViewNew(true);
		}
	}, [routeVideoId, videos, router, pageReady, router.pathname]);

	const isVoiceTranslationGroup = useMemo(() => {
		if (!selected?.jobs?.length) return false;
		return selected.jobs.some((j) => String(j.id).startsWith("voice_"));
	}, [selected?.jobs]);

	const isCaptionGroup = selected?.type === "caption";
	const isClipsGroup = selected?.type === "clips";

	const jobsForTabs = useMemo(() => {
		if (!selected) return [];
		const real = selected.jobs || [];
		const staged = stagedLangs.map((lang) => ({
			id: `staged_${lang}`,
			lang,
			status: "staged",
			isStaged: true,
			createdAt: new Date().toISOString(),
		}));
		return [...real, ...staged];
	}, [selected, stagedLangs]);

	const selectedDetail = useMemo(() => {
		if (!selected) return null;
		const jobs = jobsForTabs;
		if (!jobs.length) return null;
		const realJobs = jobs.filter((j) => !j.isStaged);
		const agg = realJobs.length ? aggregateJobStatus(realJobs) : "queued";
		const idx = Math.min(detailTab, Math.max(0, jobs.length - 1));
		return {
			jobs,
			agg,
			idx,
			j: jobs[idx],
			hasTabs: jobs.length > 1,
		};
	}, [selected, jobsForTabs, detailTab]);

	useEffect(() => {
		setDetailTab(0);
		setStagedLangs([]);
		if (selected?.type) {
			setFollowUpTab(getInitialFollowUpTabForGroupType(selected.type));
		}
	}, [selected?.id, selected?.type]);

	const reuseVideoUrl = useMemo(
		() => resolveReuseVideoUrl(selected),
		[selected],
	);

	const followUpTabOrder = useMemo(
		() => getFollowUpTabOrderForGroupType(selected?.type),
		[selected?.type],
	);

	const showFollowUpTools = Boolean(
		reuseVideoUrl &&
			selectedDetail?.j?.status === "done" &&
			!selectedDetail?.j?.isStaged &&
			!isVoiceTranslationGroup,
	);

	useEffect(() => {
		if (!followUpTabOrder.includes(followUpTab)) {
			setFollowUpTab(followUpTabOrder[0] || "video");
		}
	}, [followUpTabOrder, followUpTab]);

	useEffect(() => {
		setDetailTab((d) =>
			Math.min(d, Math.max(0, jobsForTabs.length - 1)),
		);
	}, [jobsForTabs.length]);

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

	/** Bill usage when a job reaches `done` (video via SSE/updateJob; voice often created already done). */
	const billUsageForJobId = useCallback(
		async (jobId, groupId) => {
			if (!uid || !jobId) return;
			if (recordedJobIdsRef.current.has(jobId)) return;
			const list =
				queryClient.getQueryData(QUERY_KEY_TRANSLATION_GROUPS(uid)) || [];
			const group = list.find(
				(g) =>
					(groupId && g.id === groupId) ||
					g.jobs?.some((j) => j.id === jobId),
			);
			const job = group?.jobs?.find((j) => j.id === jobId);
			if (!job || job.status !== "done") return;
			recordedJobIdsRef.current.add(jobId);
			const isVoice = String(job.id).startsWith("voice_");
			let minutes = job.durationMinutes;
			if (minutes == null) {
				if (isVoice && job.resultUrl) {
					const sec = await probeAudioDurationSeconds(job.resultUrl);
					minutes = secondsToBillableMinutes(sec);
					if (group) {
						patchVideos((prev) =>
							prev.map((g) => {
								if (g.id !== group.id) return g;
								const jobs = g.jobs.map((j) =>
									j.id === jobId ? { ...j, durationMinutes: minutes } : j,
								);
								const out = { ...g, jobs };
								void upsertTranslationGroup(uid, out);
								return out;
							}),
						);
					}
				} else if (!isVoice && job.sourceVideoUrl) {
					const sec = await probeVideoDurationSeconds(job.sourceVideoUrl);
					minutes = secondsToBillableMinutes(sec);
					if (group) {
						patchVideos((prev) =>
							prev.map((g) => {
								if (g.id !== group.id) return g;
								const jobs = g.jobs.map((j) =>
									j.id === jobId ? { ...j, durationMinutes: minutes } : j,
								);
								const out = { ...g, jobs };
								void upsertTranslationGroup(uid, out);
								return out;
							}),
						);
					}
				} else {
					minutes = 1;
				}
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
		},
		[uid, queryClient, patchVideos],
	);

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
				videoCaptionId: j.videoCaptionId ?? null,
				viralClipCutId: j.viralClipCutId ?? null,
				srtUrl: j.srtUrl ?? null,
				timedCaptions: j.timedCaptions ?? null,
				clips: j.clips ?? null,
				summary: j.summary ?? null,
				titles: j.titles ?? null,
				thumbnailTexts: j.thumbnailTexts ?? null,
				hooks: j.hooks ?? null,
				apiStatus: j.apiStatus ?? null,
				errorMessage: j.errorMessage ?? null,
				burnCaptions: j.burnCaptions ?? null,
				captionStyle: j.captionStyle ?? null,
				model: j.model ?? null,
				prompt: j.prompt ?? null,
				targetAspect: j.targetAspect ?? null,
				durationMinutes: j.durationMinutes ?? null,
			}));
			const v = {
				id: groupId,
				label: payload.label ?? null,
				jobs,
				createdAt: payload.createdAt || new Date().toISOString(),
				sourceVideoUrl:
					payload.sourceVideoUrl ?? jobs[0]?.sourceVideoUrl ?? null,
				sourceText:
					typeof payload.sourceText === "string" ? payload.sourceText : null,
				type:
					payload.type ??
					inferTranslationGroupType({
						...payload,
						id: groupId,
						jobs,
					}),
			};
			patchVideos((prev) =>
				dedupeVideosById([v, ...prev.filter((x) => x.id !== v.id)]),
			);
			void upsertTranslationGroup(uid, v);
			const srcUrl = v.sourceVideoUrl;
			if (uid && srcUrl) {
				void ensureWorkspaceVideoFromJob(uid, {
					url: srcUrl,
					name: v.label || "From job",
					groupId: v.id,
				}).then(() => {
					void queryClient.invalidateQueries({
						queryKey: ["workspaceVideos", uid],
					});
				});
			}
			setSelected(v);
			setViewNew(false);
			router.push(`/app/${encodeURIComponent(v.id)}`);
			queueMicrotask(() => {
				for (const job of v.jobs || []) {
					if (job.status === "done") {
						void billUsageForJobId(job.id, v.id);
					}
				}
				if (v.jobs?.some((j) => j.status === "done")) {
					void publishPublicShare(uid, v);
				}
			});
		},
		[router, uid, patchVideos, billUsageForJobId, queryClient],
	);

	const addFollowUpToolJob = useCallback(
		(payload) => {
			const sourceUrl =
				payload.sourceVideoUrl ??
				payload.jobs?.find((j) => j.sourceVideoUrl)?.sourceVideoUrl ??
				reuseVideoUrl;
			addVideo({
				...payload,
				sourceVideoUrl: sourceUrl,
				jobs: (payload.jobs || []).map((j) => ({
					...j,
					sourceVideoUrl: j.sourceVideoUrl ?? sourceUrl ?? null,
				})),
			});
		},
		[addVideo, reuseVideoUrl],
	);

	const handleShareProject = useCallback(async () => {
		if (!uid || !selected?.id) return;
		const hasDone = selected.jobs?.some((j) => j.status === "done");
		if (!hasDone) {
			toast.error("Finish at least one language before sharing.");
			return;
		}
		try {
			await publishPublicShare(uid, selected);
			const url = getPublicShareUrl(selected.id);
			await navigator.clipboard.writeText(url);
			toast.success("Public share link copied!");
		} catch (e) {
			console.error(e);
			toast.error("Could not publish share link.");
		}
	}, [uid, selected]);

	const appendSourceVideoUrl = useMemo(() => {
		if (!selected) return null;
		if (selected.sourceVideoUrl) return selected.sourceVideoUrl;
		const j0 = selected.jobs?.find((j) => j.sourceVideoUrl);
		return j0?.sourceVideoUrl ?? null;
	}, [selected]);

	/** Original text for voice “add language” (group field or any voice job). */
	const appendVoiceSourceText = useMemo(() => {
		if (!selected) return null;
		const fromGroup =
			typeof selected.sourceText === "string" && selected.sourceText.trim()
				? selected.sourceText.trim()
				: null;
		if (fromGroup) return fromGroup;
		const j = selected.jobs?.find(
			(j) =>
				String(j.id).startsWith("voice_") &&
				typeof j.transcriptOriginal === "string" &&
				j.transcriptOriginal.trim(),
		);
		return j?.transcriptOriginal?.trim() ?? null;
	}, [selected]);

	const existingJobLangs = useMemo(() => {
		if (!selected?.jobs?.length) return [];
		const langs = selected.jobs.map((j) => j.lang).filter(Boolean);
		return [...new Set(langs)];
	}, [selected?.jobs]);

	const langPickerSelected = useMemo(
		() => [...new Set([...existingJobLangs, ...stagedLangs])].sort(),
		[existingJobLangs, stagedLangs],
	);

	const setLangPickerSelected = useCallback(
		(next) => {
			const staged = next.filter((l) => !existingJobLangs.includes(l));
			setStagedLangs(staged);
		},
		[existingJobLangs],
	);

	/** Drop a staged language tab (translation not started yet) and fix active tab index. */
	const removeStagedLanguageAt = useCallback((tabIndex, lang) => {
		setStagedLangs((prev) => prev.filter((l) => l !== lang));
		setDetailTab((d) => {
			if (tabIndex < d) return d - 1;
			if (tabIndex === d) return Math.max(0, d - 1);
			return d;
		});
	}, []);

	const submitAppendTranslation = useCallback(
		async (lang) => {
			// synchronous guard — prevents double-click before React re-render
			if (appendBusyRef.current) return;
			if (!selected?.id || !appendSourceVideoUrl) {
				toast.error("Source video URL is missing.");
				return;
			}
			// dedup: skip if an active (non-failed, non-cancelled) job already exists for this lang
			const alreadyActive = (selected?.jobs || []).some(
				(j) =>
					j.lang === lang &&
					j.status !== "error" &&
					j.status !== "cancelled" &&
					!String(j.id).startsWith("failed_"),
			);
			if (alreadyActive) {
				toast.error(`A translation for ${lang} is already running or done.`);
				return;
			}
			appendBusyRef.current = lang;
			setAppendBusy(lang);
			const postUrl = getTranslatePostUrl();
			const groupId = selected.id;
			try {
				const body = {
					video_url: appendSourceVideoUrl,
					output_language: lang,
					tts_engine: "openrouter",
					brand_voice_id: appendVoiceId,
				};
				const res = await fetch(postUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(await getTranslateAuthHeaders()),
					},
					body: JSON.stringify(body),
				});
				const data = await res.json().catch(() => ({}));
				const apiErr = getApiErrorMessage(data);
				if (apiErr || !res.ok) {
					toast.error(apiErr || "Translation request failed.");
					return;
				}
				const videoId = parseVideoIdFromPostResponse(data);
				if (!videoId) {
					toast.error("Could not start translation.");
					return;
				}
				const initial = normalizeStatus(extractStatusField(data));
				const postFields = extractJobFieldsFromGetResponse(data);
			const newJob = {
				id: videoId,
				lang,
				status: initial,
				createdAt: new Date().toISOString(),
				...postFields,
				resultUrl: postFields.resultUrl ?? extractResultUrl(data) ?? null,
				sourceVideoUrl: postFields.sourceVideoUrl ?? appendSourceVideoUrl,
				videoTranslateId: postFields.videoTranslateId ?? videoId,
				brandVoiceId: appendVoiceId,
			};
			patchVideos((prev) => {
				const next = prev.map((g) => {
					if (g.id !== groupId) return g;
					const jobs = [...(g.jobs || []), newJob];
					const out = {
						...g,
						jobs,
						sourceVideoUrl: g.sourceVideoUrl || appendSourceVideoUrl,
					};
						out.type = inferTranslationGroupType(out);
						return out;
					});
					const touched = next.find((g) => g.id === groupId);
					if (touched) scheduleUpsertGroup(touched);
					return next;
				});
				setSelected((s) => {
					if (!s || s.id !== groupId) return s;
					const jobs = [...(s.jobs || []), newJob];
					const out = {
						...s,
						jobs,
						sourceVideoUrl: s.sourceVideoUrl || appendSourceVideoUrl,
					};
					out.type = inferTranslationGroupType(out);
					return out;
				});
			setStagedLangs((prev) => prev.filter((l) => l !== lang));
			setDetailTab(selected.jobs?.length || 0);
		} catch (e) {
			toast.error(e?.message || "Something went wrong.");
		} finally {
			appendBusyRef.current = null;
			setAppendBusy(null);
		}
	},
	[
		selected?.id,
		selected?.jobs?.length,
		appendSourceVideoUrl,
		appendVoiceId,
		patchVideos,
		scheduleUpsertGroup,
	],
);

	const captionOptionsFromGroup = useCallback((group) => {
		const ref =
			group?.jobs?.find((j) => j.burnCaptions != null) || group?.jobs?.[0];
		return {
			burnCaptions: ref?.burnCaptions ?? true,
			captionStyle: ref?.captionStyle ?? "bottom",
			model: ref?.model ?? "gemini",
		};
	}, []);

	const appendCaptionForLanguage = useCallback(
		async (lang, { replaceJobId = null } = {}) => {
			if (appendBusyRef.current) return;
			if (!selected?.id) return;
			if (!appendSourceVideoUrl) {
				toast.error(
					"Source video URL is not ready yet. Wait for the first caption to finish.",
				);
				return;
			}
			const alreadyActive = (selected?.jobs || []).some(
				(j) =>
					j.lang === lang &&
					j.id !== replaceJobId &&
					j.status !== "error" &&
					j.status !== "cancelled" &&
					!String(j.id).startsWith("failed_"),
			);
			if (alreadyActive) {
				toast.error(`Captions for ${lang} are already running or done.`);
				return;
			}
			appendBusyRef.current = lang;
			setAppendBusy(lang);
			const groupId = selected.id;
			const opts = captionOptionsFromGroup(selected);
			try {
				const videoCaptionId = await startCaptionJob({
					video_url: appendSourceVideoUrl,
					language: languageNameToApiCode(lang),
					burn_captions: opts.burnCaptions,
					caption_style: opts.captionStyle,
					model: opts.model,
				});
				const newJob = {
					id: videoCaptionId,
					videoCaptionId,
					lang,
					status: "queued",
					apiStatus: "pending",
					createdAt: new Date().toISOString(),
					sourceVideoUrl: appendSourceVideoUrl,
					...opts,
				};
				const mergeJobs = (jobs) => {
					if (replaceJobId) {
						const next = [...jobs];
						let idx = next.findIndex((j) => j.id === replaceJobId);
						if (idx < 0) {
							idx = next.findIndex(
								(j) => j.lang === lang && j.status === "error",
							);
						}
						if (idx < 0) return [...jobs, newJob];
						next[idx] = newJob;
						return next;
					}
					return [...jobs, newJob];
				};
				patchVideos((prev) => {
					const next = prev.map((g) => {
						if (g.id !== groupId) return g;
						const jobs = mergeJobs(g.jobs || []);
						const out = {
							...g,
							jobs,
							sourceVideoUrl: g.sourceVideoUrl || appendSourceVideoUrl,
							type: "caption",
						};
						return out;
					});
					const touched = next.find((g) => g.id === groupId);
					if (touched) scheduleUpsertGroup(touched);
					return next;
				});
				setSelected((s) => {
					if (!s || s.id !== groupId) return s;
					const jobs = mergeJobs(s.jobs || []);
					return {
						...s,
						jobs,
						sourceVideoUrl: s.sourceVideoUrl || appendSourceVideoUrl,
						type: "caption",
					};
				});
				setStagedLangs((prev) => prev.filter((l) => l !== lang));
				if (!replaceJobId) {
					setDetailTab(selected.jobs?.length || 0);
				}
			} catch (e) {
				toast.error(e?.message || "Could not start caption job.");
			} finally {
				appendBusyRef.current = null;
				setAppendBusy(null);
			}
		},
		[
			selected?.id,
			selected?.jobs,
			appendSourceVideoUrl,
			captionOptionsFromGroup,
			patchVideos,
			scheduleUpsertGroup,
		],
	);

	const submitAppendCaption = useCallback(
		(lang) => appendCaptionForLanguage(lang),
		[appendCaptionForLanguage],
	);

const submitAppendVoiceTranslation = useCallback(
	async (lang) => {
		if (appendBusyRef.current) return; // synchronous double-submit guard
		if (!selected?.id || !appendVoiceSourceText) {
			toast.error(
				"Original text is not available. Include text with your voice submission to add more languages.",
			);
			return;
		}
		// dedup: skip if an active job already exists for this lang
		const alreadyActive = (selected?.jobs || []).some(
			(j) =>
				j.lang === lang &&
				j.status !== "error" &&
				j.status !== "cancelled" &&
				!String(j.id).startsWith("failed_"),
		);
		if (alreadyActive) {
			toast.error(`A translation for ${lang} is already running or done.`);
			return;
		}
		appendBusyRef.current = lang;
		setAppendBusy(lang);
			const url = getVoiceTranslatePostUrl();
			const groupId = selected.id;
			try {
			const body = {
				text: appendVoiceSourceText,
				languages: [lang],
				include_audio: true,
				tts_engine: "openrouter",
				brand_voice_id: appendVoiceId,
			};
				const res = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(await getTranslateAuthHeaders()),
					},
					body: JSON.stringify(body),
				});
				const data = await res.json().catch(() => ({}));
				const apiErr = getApiErrorMessage(data);
				if (apiErr || !res.ok) {
					toast.error(apiErr || "Voice translation failed.");
					return;
				}
				let batch = extractVoiceTranslateBatchResponse(data);
				if (!batch.length) {
					const one = extractVoiceTranslateResponse(data);
					if (one.transcript || one.audioUrl) {
						batch = [
							{
								lang: one.outputLanguage || lang,
								transcript: one.transcript,
								audioUrl: one.audioUrl,
							},
						];
					}
				}
				const r =
					batch.find(
						(x) =>
							String(x.lang || "")
								.toLowerCase()
								.includes(String(lang).toLowerCase()) || x.lang === lang,
					) || batch[0];
				if (!r || (!r.transcript && !r.audioUrl)) {
					toast.error("Could not read translation from the API.");
					return;
				}
				const outLang = r.lang || lang;
				const newJobId = `voice_${groupId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
			const newJob = {
				id: newJobId,
				lang: outLang,
				status: "done",
				createdAt: new Date().toISOString(),
				resultUrl: r.audioUrl ?? null,
				translatedTranscript: r.transcript ?? null,
				caption: r.transcript ?? null,
				outputLanguage: outLang,
				transcriptOriginal: appendVoiceSourceText,
				sourceVideoUrl: null,
				videoTranslateId: newJobId,
				brandVoiceId: appendVoiceId,
			};
				patchVideos((prev) => {
					const next = prev.map((g) => {
						if (g.id !== groupId) return g;
						const jobs = [...(g.jobs || []), newJob];
						const out = {
							...g,
							jobs,
							sourceText: g.sourceText || appendVoiceSourceText,
						};
						out.type = inferTranslationGroupType(out);
						return out;
					});
					const touched = next.find((g) => g.id === groupId);
					if (touched) scheduleUpsertGroup(touched);
					return next;
				});
				setSelected((s) => {
					if (!s || s.id !== groupId) return s;
					const jobs = [...(s.jobs || []), newJob];
					const out = {
						...s,
						jobs,
						sourceText: s.sourceText || appendVoiceSourceText,
					};
					out.type = inferTranslationGroupType(out);
					return out;
				});
				setStagedLangs((prev) => prev.filter((l) => l !== lang));
				setDetailTab(selected.jobs?.length || 0);
				queueMicrotask(() => {
					void billUsageForJobId(newJobId, groupId);
				});
		} catch (e) {
			toast.error(e?.message || "Something went wrong.");
		} finally {
			appendBusyRef.current = null;
			setAppendBusy(null);
		}
	},
	[
		selected?.id,
		selected?.jobs?.length,
		appendVoiceSourceText,
		appendVoiceId,
		patchVideos,
		scheduleUpsertGroup,
		billUsageForJobId,
	],
	);

	const cancelJob = useCallback(
		(job) => {
			if (!selected?.id || !job?.lang) return;
			const groupId = selected.id;
			const applyCancel = (g) => {
				if (g.id !== groupId) return g;
				const jobs = (g.jobs || []).map((j) =>
					j.id === job.id ? { ...j, status: "cancelled" } : j,
				);
				const out = { ...g, jobs };
				out.type = inferTranslationGroupType(out);
				return out;
			};
			patchVideos((prev) => {
				const next = prev.map(applyCancel);
				const touched = next.find((g) => g.id === groupId);
				if (touched) scheduleUpsertGroup(touched);
				return next;
			});
			setSelected((s) => (s ? applyCancel(s) : s));
		},
		[selected?.id, patchVideos, scheduleUpsertGroup],
	);

	const retryFailedTranslation = useCallback(
		async (failedJob) => {
			if (appendBusyRef.current) return; // synchronous double-click guard
			if (
				!selected?.id ||
				!failedJob?.lang ||
				(failedJob.status !== "error" && failedJob.status !== "cancelled")
			) {
				toast.error("Cannot retry this translation.");
				return;
			}
			if (isVoiceTranslationGroup) {
				toast.error("Retry from the new translation screen for voice jobs.");
				return;
			}
			if (isCaptionGroup) {
				await appendCaptionForLanguage(failedJob.lang, {
					replaceJobId: failedJob.id,
				});
				return;
			}
			if (!appendSourceVideoUrl) {
				toast.error("Source video URL is missing.");
				return;
			}
			const lang = failedJob.lang;
			const oldJobId = failedJob.id;
			appendBusyRef.current = lang;
			setAppendBusy(lang);
			const postUrl = getTranslatePostUrl();
			const groupId = selected.id;
			try {
			const body = {
				video_url: appendSourceVideoUrl,
				output_language: lang,
				tts_engine: "openrouter",
				brand_voice_id: appendVoiceId,
			};
			const res = await fetch(postUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(await getTranslateAuthHeaders()),
				},
				body: JSON.stringify(body),
			});
			const data = await res.json().catch(() => ({}));
			const apiErr = getApiErrorMessage(data);
			if (apiErr || !res.ok) {
				toast.error(apiErr || "Translation request failed.");
				return;
			}
			const videoId = parseVideoIdFromPostResponse(data);
			if (!videoId) {
				toast.error("Could not start translation.");
				return;
			}
			const initial = normalizeStatus(extractStatusField(data));
			const postFields = extractJobFieldsFromGetResponse(data);
		const newJob = {
			id: videoId,
			lang,
			status: initial,
			createdAt: new Date().toISOString(),
			...postFields,
			resultUrl: postFields.resultUrl ?? extractResultUrl(data) ?? null,
			sourceVideoUrl: postFields.sourceVideoUrl ?? appendSourceVideoUrl,
			videoTranslateId: postFields.videoTranslateId ?? videoId,
			brandVoiceId: appendVoiceId,
		};
			patchVideos((prev) => {
				const next = prev.map((g) => {
					if (g.id !== groupId) return g;
					const jobs = [...(g.jobs || [])];
					let idx = jobs.findIndex((j) => j.id === oldJobId);
						if (idx < 0)
							idx = jobs.findIndex(
								(j) => j.lang === lang && j.status === "error",
							);
						if (idx < 0) return g;
						jobs[idx] = newJob;
						const out = {
							...g,
							jobs,
							sourceVideoUrl: g.sourceVideoUrl || appendSourceVideoUrl,
						};
						out.type = inferTranslationGroupType(out);
						return out;
					});
					const touched = next.find((g) => g.id === groupId);
					if (touched) scheduleUpsertGroup(touched);
					return next;
				});
				setSelected((s) => {
					if (!s || s.id !== groupId) return s;
					const jobs = [...(s.jobs || [])];
					let idx = jobs.findIndex((j) => j.id === oldJobId);
					if (idx < 0)
						idx = jobs.findIndex(
							(j) => j.lang === lang && j.status === "error",
						);
					if (idx < 0) return s;
					jobs[idx] = newJob;
					const out = {
						...s,
						jobs,
						sourceVideoUrl: s.sourceVideoUrl || appendSourceVideoUrl,
					};
					out.type = inferTranslationGroupType(out);
					return out;
				});
		} catch (e) {
			toast.error(e?.message || "Something went wrong.");
		} finally {
			appendBusyRef.current = null;
			setAppendBusy(null);
		}
	},
	[
		selected?.id,
		appendSourceVideoUrl,
		isVoiceTranslationGroup,
		isCaptionGroup,
		appendCaptionForLanguage,
		appendVoiceId,
		patchVideos,
		scheduleUpsertGroup,
	],
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
					void billUsageForJobId(jobId, groupId);
				});
			}
		},
		[uid, patchVideos, scheduleUpsertGroup, billUsageForJobId],
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
		if (sel.type === "caption" || sel.type === "clips") return;
	const pending = sel.jobs.filter(
		(j) =>
			j.status !== "done" &&
			j.status !== "error" &&
			j.status !== "cancelled" &&
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

	/** Poll video caption / viral clip jobs while viewing that project. */
	useEffect(() => {
		const sel = selectedRef.current;
		if (!sel?.id || !sel.jobs?.length) return;
		if (sel.type !== "caption" && sel.type !== "clips") return;

		const pending = sel.jobs.filter(
			(j) =>
				j.status !== "done" &&
				j.status !== "error" &&
				j.status !== "cancelled",
		);
		if (!pending.length) return;

		let cancelled = false;
		const groupId = sel.id;
		const tool = sel.type;

		const tick = async () => {
			const current = selectedRef.current;
			if (!current?.id || current.id !== groupId) return;
			const stillPending = (current.jobs || []).filter(
				(j) =>
					j.status !== "done" &&
					j.status !== "error" &&
					j.status !== "cancelled",
			);
			for (const job of stillPending) {
				if (cancelled) return;
				try {
					const fields =
						tool === "caption"
							? await fetchCaptionJobOnce(job.videoCaptionId || job.id)
							: await fetchClipJobOnce(job.viralClipCutId || job.id);
					if (fields.status === "error") {
						updateJob({
							groupId,
							jobId: job.id,
							lang: job.lang,
							...fields,
						});
						continue;
					}
					updateJob({
						groupId,
						jobId: job.id,
						lang: job.lang,
						...fields,
					});
				} catch {
					updateJob({
						groupId,
						jobId: job.id,
						status: "error",
						errorMessage: "Could not load job status.",
					});
				}
			}
		};

		void tick();
		const interval = setInterval(() => void tick(), 2500);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [selected?.id, selected?.type, selected?.jobs, updateJob]);

	const performDeleteTranslation = useCallback(
		(id) => {
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
					<img
						src="/aantra-logo.png"
						alt="aantraa"
						style={{ height: 28, width: "auto", display: "block" }}
					/>
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

			{/* New + Workspace */}
			<div style={{ padding: "10px 10px 4px", display: "flex", flexDirection: "column", gap: 4 }}>
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
							viewNew && !selected && !isWorkspaceRoute
								? "rgba(234,88,12,0.1)"
								: "rgba(0,0,0,0.03)",
						border:
							viewNew && !selected && !isWorkspaceRoute
								? "1px solid rgba(234,88,12,0.3)"
								: "1px solid transparent",
						color:
							viewNew && !selected && !isWorkspaceRoute
								? "#c2410c"
								: "#71717a",
						transition: "all 0.15s",
					}}
				>
					<Plus size={14} /> New Translation
				</button>
				<button
					onClick={() => {
						router.push("/app/workspace");
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
						background: isWorkspaceRoute
							? "rgba(234,88,12,0.1)"
							: "rgba(0,0,0,0.03)",
						border: isWorkspaceRoute
							? "1px solid rgba(234,88,12,0.3)"
							: "1px solid transparent",
						color: isWorkspaceRoute ? "#c2410c" : "#71717a",
						transition: "all 0.15s",
					}}
				>
					<LayoutGrid size={14} /> Workspace
				</button>
			</div>

			{/* History accordion */}
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
				<button
					type="button"
					onClick={() => setJobsAccordionOpen((o) => !o)}
					style={{
						width: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "8px 6px",
						marginBottom: 4,
						border: "none",
						background: "transparent",
						cursor: "pointer",
						fontSize: 11,
						fontWeight: 700,
						letterSpacing: "0.06em",
						textTransform: "uppercase",
						color: "#a1a1aa",
					}}
				>
					<span>Your jobs ({videos.length})</span>
					<motion.span
						animate={{ rotate: jobsAccordionOpen ? 180 : 0 }}
						transition={{ duration: 0.2 }}
						style={{ display: "flex" }}
					>
						<ChevronDown size={14} />
					</motion.span>
				</button>

				<AnimatePresence initial={false}>
					{jobsAccordionOpen && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.22, ease: "easeInOut" }}
							style={{ overflow: "hidden" }}
						>
				
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
										<FeedbackCreditTrigger variant="icon" />
										<button
											type="button"
											title="Delete"
											onClick={(e) => {
												e.stopPropagation();
												setDeleteConfirmId(v.id);
											}}
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
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Credits & usage */}
			<div
				style={{
					padding: "14px 14px 12px",
					borderBottom: "1px solid rgba(0,0,0,0.06)",
				}}
				className="p-1 border border-zinc-200/80 rounded-xl m-2"
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
						alignItems: "center",
						marginBottom: 8,
					}}
				>
					<span style={{ fontSize: 12, color: "#52525b" }}>Usage</span>
					<span style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>
						{usageMinutes.used.toFixed(1)}/{usageMinutes.credited.toFixed(1)} min
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
				<FeedbackCreditTrigger variant="sidebar" />
			</div>
			{/* User */}
			<div
				style={{
					padding: "12px 14px",
					borderTop: "1px solid rgba(0,0,0,0.06)",
				}}
			>
				<button
					type="button"
					onClick={() => {
						router.push("/account");
						if (isMobile) setSidebarOpen(false);
					}}
					style={{
						width: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 7,
						padding: "8px 10px",
						marginBottom: 10,
						borderRadius: 9,
						fontSize: 12.5,
						fontWeight: 600,
						background: "rgba(0,0,0,0.03)",
						border: "1px solid rgba(0,0,0,0.08)",
						color: "#52525b",
						cursor: "pointer",
					}}
				>
					<ExternalLink size={13} />
					Account
				</button>
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
		<FeedbackCreditProvider user={user}>
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
						{isStatsRoute
							? "Usage stats"
							: isWorkspaceRoute
								? "Workspace"
								: viewNew && !selected
									? "New Translation"
									: selected
										? selected.label || sidebarTitle(selected)
										: "Dashboard"}
					</span>
					<div style={{ flex: 1 }} />
					{!sidebarOpen && (
						<img
							src="/aantra-logo.png"
							alt="aantraa"
							style={{ height: 26, width: "auto", display: "block" }}
						/>
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
						{isWorkspaceRoute ? (
							<motion.div
								key="workspace"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								style={{ width: "100%" }}
							>
								<WorkspacePage uid={uid} translationGroups={videos} />
							</motion.div>
						) : isStatsRoute ? (
							routeVideoId ? (
								<motion.div
									key="stats"
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									style={{ width: "100%" }}
								>
									<TranslationGroupStatsPanel
										uid={uid}
										groupId={routeVideoId}
										onBack={() =>
											router.push(
												`/app/${encodeURIComponent(routeVideoId)}`,
											)
										}
									/>
								</motion.div>
							) : (
								<motion.div
									key="stats-loading"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									style={{ color: "#71717a", fontSize: 14 }}
								>
									Loading…
								</motion.div>
							)
						) : viewNew && !selected ? (
							<motion.div
								key="new"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className="max-w-2xl mx-auto"
							>
								<VideoToolsTabBar
									value={newTranslationTab}
									onChange={setNewTranslationTab}
									className="mb-3"
								/>
								<div className="rounded-xl p-7 px-6 bg-white border border-zinc-200/80">
									<div className="flex items-start justify-start flex-col">
									<h2 className="aantraa-font text-2xl font-bold text-zinc-900 mb-1.5">
										New Translation
									</h2>
									</div>
									{pageReady ? (
										<NewTranslationPanel
											addVideo={addVideo}
											tab={newTranslationTab}
											onTabChange={setNewTranslationTab}
											showTabs={false}
											workspaceVideos={workspaceVideos}
											usageMinutesUsed={usageMinutes.used}
											usageMinutesCredited={usageMinutes.credited}
										/>
									) : (
										<NewTranslationFormSkeleton />
									)}
								
								</div>
								<div
									className="flex-col flex justify-end mt-10"
									>
										<div className="">
											<span>For long form videos or APIs </span>
											<img className="h-6" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOCAyOCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZDVkNWQ1IiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0xOS40MDEgMy4zNzhhLjc1Ljc1IDAgMCAwLTEuMDIzLS4yOEMxMy4wNzIgNi4xMzIgMTMgMTEuMjY5IDEzIDE0Ljc1djcuNjlsLTQuNzItNC43MmEuNzUuNzUgMCAxIDAtMS4wNiAxLjA2bDYgNmEuNzUuNzUgMCAwIDAgMS4wNiAwbDYtNmEuNzUuNzUgMCAwIDAtMS4wNi0xLjA2bC00LjcyIDQuNzJ2LTcuNjljMC0zLjUxOC4xMjgtNy43OCA0LjYyMi0xMC4zNDlhLjc1Ljc1IDAgMCAwIC4yOC0xLjAyMyIvPjwvc3ZnPg==" />
										</div>
										<a
											href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Long-form video / Enterprise — aantraa")}&body=${encodeURIComponent("Hi,\n\nI'm interested in long-form video translation or an enterprise plan.\n\n")}`}
											className="flex items-center gap-2 p-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
										>
											<Mail size={15} aria-hidden />
											Contact us
										</a>
										
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
													flexWrap: "wrap",
												}}
											>
												<div style={{ minWidth: 0, flex: "1 1 200px" }}>
													<h2
														className="aantraa-font"
														style={{
															fontSize: 22,
															fontWeight: 700,
															color: "#18181b",
															marginBottom: 4,
														}}
													>
														{selected.label || sidebarTitle(selected)}
													</h2>
												</div>
												<div
													style={{
														display: "flex",
														alignItems: "flex-start",
														gap: 10,
														flexWrap: "wrap",
														justifyContent: "flex-end",
														flex: "1 1 240px",
													}}
												>
													{selected?.id &&
													selectedDetail?.agg === "done" ? (
														<button
															type="button"
															onClick={() => void handleShareProject()}
															style={{
																display: "inline-flex",
																alignItems: "center",
																gap: 6,
																padding: "10px 14px",
																borderRadius: 10,
																fontSize: 13,
																fontWeight: 600,
																border: "1px solid rgba(234,88,12,0.25)",
																background: "rgba(234,88,12,0.08)",
																color: "#c2410c",
																cursor: "pointer",
																whiteSpace: "nowrap",
															}}
														>
															<Share2 size={16} aria-hidden />
															Share
														</button>
													) : null}
													{selected?.id &&
													!isCaptionGroup &&
													!isClipsGroup ? (
														<button
															type="button"
															onClick={() =>
																router.push(
																	`/app/${encodeURIComponent(selected.id)}/stats`,
																)
															}
															style={{
																display: "inline-flex",
																alignItems: "center",
																gap: 6,
																padding: "10px 14px",
																borderRadius: 10,
																fontSize: 13,
																fontWeight: 600,
																border: "1px solid rgba(0,0,0,0.1)",
																background: "#fafafa",
																color: "#3f3f46",
																cursor: "pointer",
																whiteSpace: "nowrap",
															}}
														>
															<BarChart2 size={16} aria-hidden />
															Stats
														</button>
													) : null}
												{isCaptionGroup && selected?.jobs?.length > 0 && (
													<div style={{ flex: "1 1 200px", minWidth: 180 }}>
														<LangMultiSelect
															selected={langPickerSelected}
															onChange={setLangPickerSelected}
															lockedLangs={existingJobLangs}
															fullWidth
														/>
													</div>
												)}
												{!isCaptionGroup &&
													!isClipsGroup &&
													((!isVoiceTranslationGroup && appendSourceVideoUrl) ||
													(isVoiceTranslationGroup &&
														appendVoiceSourceText)) && (
													<>
														<div style={{ flex: "1 1 200px", minWidth: 180 }}>
															<LangMultiSelect
																selected={langPickerSelected}
																onChange={setLangPickerSelected}
																lockedLangs={existingJobLangs}
																fullWidth
															/>
														</div>
														<div style={{ flex: "1 1 180px", minWidth: 160 }}>
															<NarratorVoiceSelect
																value={appendVoiceId}
																onChange={(id) => {
																	setAppendVoiceId(id);
																	try {
																		localStorage.setItem(
																			TTS_VOICE_STORAGE_KEY,
																			id,
																		);
																	} catch {}
																}}
																fullWidth
															/>
														</div>
													</>
												)}
												</div>
											</div>

											
											{isVoiceTranslationGroup && !appendVoiceSourceText && (
												<div
													style={{
														marginBottom: 20,
														padding: "12px 14px",
														borderRadius: 12,
														background: "rgba(0,0,0,0.04)",
														border: "1px solid rgba(0,0,0,0.06)",
													}}
												>
													<p
														style={{
															fontSize: 12,
															color: "#71717a",
															margin: 0,
															lineHeight: 1.45,
														}}
													>
														To add more languages here, include the original text in the
														voice form (or use a submission that stored it). Audio-only
														entries without text cannot be extended from this screen.
													</p>
												</div>
											)}

											{isCaptionGroup && !appendSourceVideoUrl && (
												<div
													style={{
														marginBottom: 20,
														padding: "12px 14px",
														borderRadius: 12,
														background: "rgba(0,0,0,0.04)",
														border: "1px solid rgba(0,0,0,0.06)",
													}}
												>
													<p
														style={{
															fontSize: 12,
															color: "#71717a",
															margin: 0,
															lineHeight: 1.45,
														}}
													>
														Wait for the first caption to finish before generating
														other languages (source video URL is still processing).
													</p>
												</div>
											)}

											{selectedDetail.hasTabs && (
												<div
													style={{
														display: "flex",
														gap: 4,
														flexWrap: "wrap",
														marginBottom: 20,
														borderBottom: "1px solid rgba(0,0,0,0.1)",
														paddingBottom: 2,
													}}
												>
													{selectedDetail.jobs.map((job, i) => {
														const isActive = detailTab === i;
														const tabShellStyle = {
															display: "inline-flex",
															alignItems: "stretch",
															borderRadius: "10px 10px 0 0",
															borderBottom: `2px solid ${isActive ? "#ea580c" : "transparent"}`,
															background: isActive
																? "rgba(234,88,12,0.08)"
																: "transparent",
															overflow: "hidden",
														};
														return (
															<div key={job.id} style={tabShellStyle}>
																<button
																	type="button"
																	onClick={() => setDetailTab(i)}
																	style={{
																		padding: "10px 12px",
																		fontSize: 13,
																		fontWeight: 600,
																		border: "none",
																		background: "transparent",
																		color: isActive ? "#c2410c" : "#52525b",
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
																	{job.isStaged && (
																		<span
																			style={{
																				fontSize: 10,
																				fontWeight: 600,
																				color: "#a1a1aa",
																			}}
																		>
																			· Not started
																		</span>
																	)}
																	{!job.isStaged &&
																		job.status !== "done" &&
																		job.status !== "error" &&
																		!String(job.id).startsWith(
																			"failed_",
																		) && (
																			<Loader2 size={12} className="spin" />
																		)}
																</button>
																{job.isStaged ? (
																	<button
																		type="button"
																		aria-label={`Remove ${job.lang} — translation not started`}
																		title="Remove language (not started)"
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			removeStagedLanguageAt(i, job.lang);
																		}}
																		style={{
																			display: "flex",
																			alignItems: "center",
																			justifyContent: "center",
																			padding: "0 10px",
																			border: "none",
																			borderLeft:
																				"1px solid rgba(0,0,0,0.06)",
																			background: "transparent",
																			color: "#a1a1aa",
																			cursor: "pointer",
																			flexShrink: 0,
																		}}
																		onMouseEnter={(e) => {
																			e.currentTarget.style.color =
																				"#dc2626";
																			e.currentTarget.style.background =
																				"rgba(239,68,68,0.06)";
																		}}
																		onMouseLeave={(e) => {
																			e.currentTarget.style.color =
																				"#a1a1aa";
																			e.currentTarget.style.background =
																				"transparent";
																		}}
																	>
																		<X size={14} strokeWidth={2.25} />
																	</button>
																) : null}
															</div>
														);
													})}
												</div>
											)}

											{selectedDetail.j.isStaged &&
												!isCaptionGroup &&
												!isClipsGroup &&
												isVoiceTranslationGroup && (
												<div style={{ marginBottom: 24 }}>
													{appendVoiceSourceText ? (
														<>
															<p
																style={{
																	fontSize: 13,
																	color: "#52525b",
																	marginBottom: 12,
																	lineHeight: 1.5,
																}}
															>
																Translate to{" "}
																<strong>{selectedDetail.j.lang}</strong> using your
																saved source text.
															</p>
															<div
																style={{
																	borderRadius: 12,
																	padding: "12px 14px",
																	marginBottom: 16,
																	background: "#fafaf9",
																	border: "1px solid rgba(0,0,0,0.08)",
																	maxHeight: 160,
																	overflow: "auto",
																	fontSize: 13,
																	lineHeight: 1.55,
																	color: "#3f3f46",
																}}
															>
																{appendVoiceSourceText}
															</div>
															<button
																type="button"
																onClick={() =>
																	submitAppendVoiceTranslation(
																		selectedDetail.j.lang,
																	)
																}
																disabled={appendBusy === selectedDetail.j.lang}
																style={{
																	display: "inline-flex",
																	alignItems: "center",
																	justifyContent: "center",
																	gap: 8,
																	padding: "12px 22px",
																	borderRadius: 10,
																	fontSize: 14,
																	fontWeight: 600,
																	background: "#ea580c",
																	color: "#fff",
																	border: "none",
																	cursor:
																		appendBusy === selectedDetail.j.lang
																			? "wait"
																			: "pointer",
																	opacity:
																		appendBusy === selectedDetail.j.lang
																			? 0.85
																			: 1,
																}}
															>
																{appendBusy === selectedDetail.j.lang ? (
																	<>
																		<Loader2 size={16} className="spin" aria-hidden />
																		Starting…
																	</>
																) : (
																	"Translate"
																)}
															</button>
														</>
													) : (
														<p style={{ fontSize: 13, color: "#71717a" }}>
															Original text is not available for this project.
														</p>
													)}
												</div>
											)}

											{selectedDetail.j.isStaged && isCaptionGroup && (
												<div style={{ marginBottom: 24 }}>
													<p
														style={{
															fontSize: 13,
															color: "#52525b",
															marginBottom: 12,
															lineHeight: 1.5,
														}}
													>
														Generate captions in{" "}
														<strong>{selectedDetail.j.lang}</strong> using the same
														source video.
													</p>
													{appendSourceVideoUrl ? (
														<div style={{ marginBottom: 16 }}>
															<OriginalSourceMediaPreview
																url={appendSourceVideoUrl}
																footerLabel="Source preview"
															/>
														</div>
													) : null}
													<button
														type="button"
														onClick={() =>
															submitAppendCaption(selectedDetail.j.lang)
														}
														disabled={
															appendBusy === selectedDetail.j.lang ||
															!appendSourceVideoUrl
														}
														style={{
															display: "inline-flex",
															alignItems: "center",
															justifyContent: "center",
															gap: 8,
															padding: "12px 22px",
															borderRadius: 10,
															fontSize: 14,
															fontWeight: 600,
															background: "#ea580c",
															color: "#fff",
															border: "none",
															cursor:
																appendBusy === selectedDetail.j.lang ||
																!appendSourceVideoUrl
																	? "not-allowed"
																	: "pointer",
															opacity:
																appendBusy === selectedDetail.j.lang ||
																!appendSourceVideoUrl
																	? 0.85
																	: 1,
														}}
													>
														{appendBusy === selectedDetail.j.lang ? (
															<>
																<Loader2 size={16} className="spin" aria-hidden />
																Starting…
															</>
														) : (
															"Generate captions"
														)}
													</button>
												</div>
											)}

											{selectedDetail.j.isStaged &&
												!isCaptionGroup &&
												!isClipsGroup &&
												!isVoiceTranslationGroup && (
												<div style={{ marginBottom: 24 }}>
													<p
														style={{
															fontSize: 13,
															color: "#52525b",
															marginBottom: 12,
															lineHeight: 1.5,
														}}
													>
														Translate to{" "}
														<strong>{selectedDetail.j.lang}</strong> using the same
														source video.
													</p>
													<div style={{ marginBottom: 16 }}>
														<OriginalSourceMediaPreview
															url={appendSourceVideoUrl}
															footerLabel="Source preview"
														/>
													</div>
													<button
														type="button"
														onClick={() =>
															submitAppendTranslation(selectedDetail.j.lang)
														}
														disabled={appendBusy === selectedDetail.j.lang}
														style={{
															display: "inline-flex",
															alignItems: "center",
															justifyContent: "center",
															gap: 8,
															padding: "12px 22px",
															borderRadius: 10,
															fontSize: 14,
															fontWeight: 600,
															background: "#ea580c",
															color: "#fff",
															border: "none",
															cursor:
																appendBusy === selectedDetail.j.lang
																	? "wait"
																	: "pointer",
															opacity: appendBusy === selectedDetail.j.lang ? 0.85 : 1,
														}}
													>
														{appendBusy === selectedDetail.j.lang ? (
															<>
																<Loader2 size={16} className="spin" aria-hidden />
																Starting…
															</>
														) : (
															"Translate"
														)}
													</button>
												</div>
											)}

											{!selectedDetail.j.isStaged &&
											selectedDetail.j.status !== "done" &&
											selectedDetail.j.status !== "error" && (
												<>
													{isCaptionGroup || isClipsGroup ? (
														<VideoToolsStatusProgress
															tool={isClipsGroup ? "clips" : "caption"}
															apiStatus={selectedDetail.j.apiStatus}
															status={selectedDetail.j.status}
															createdAt={selectedDetail.j.createdAt}
														/>
													) : (
														<>
													<StatusProgress
														status={selectedDetail.j.status}
														jobId={selectedDetail.j.id}
														createdAt={selectedDetail.j.createdAt}
														detectedDurationSec={
															selectedDetail.j.durationMinutes
																? selectedDetail.j.durationMinutes * 60
																: null
														}
													/>
													{/* Cancel button — shown for active in-progress jobs */}
													{selectedDetail.j.status !== "cancelled" && (
														<button
															type="button"
															onClick={() => cancelJob(selectedDetail.j)}
															disabled={appendBusy === selectedDetail.j.lang}
															style={{
																width: "100%",
																marginTop: 10,
																padding: "9px 16px",
																borderRadius: 10,
																fontSize: 13,
																fontWeight: 500,
																color: "#b91c1c",
																background: "rgba(239,68,68,0.07)",
																border: "1px solid rgba(239,68,68,0.2)",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																gap: 7,
																cursor: appendBusy === selectedDetail.j.lang ? "not-allowed" : "pointer",
																opacity: appendBusy === selectedDetail.j.lang ? 0.5 : 1,
															}}
														>
															<X size={14} aria-hidden />
															Cancel translation
														</button>
													)}
													{/* Resume button — shown only for cancelled jobs */}
													{selectedDetail.j.status === "cancelled" &&
														!isVoiceTranslationGroup &&
														appendSourceVideoUrl && (
															<button
																type="button"
																onClick={() =>
																	retryFailedTranslation(selectedDetail.j)
																}
																disabled={appendBusy === selectedDetail.j.lang}
																style={{
																	width: "100%",
																	marginTop: 10,
																	padding: "9px 16px",
																	borderRadius: 10,
																	fontSize: 13,
																	fontWeight: 600,
																	color: "#fff",
																	background:
																		appendBusy === selectedDetail.j.lang
																			? "rgba(234,88,12,0.5)"
																			: "#ea580c",
																	border: "none",
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	gap: 7,
																	cursor:
																		appendBusy === selectedDetail.j.lang
																			? "wait"
																			: "pointer",
																}}
															>
																{appendBusy === selectedDetail.j.lang ? (
																	<>
																		<Loader2
																			size={14}
																			className="spin"
																			aria-hidden
																		/>
																		Resuming…
																	</>
																) : (
																	<>
																		<RefreshCw size={14} aria-hidden />
																		Resume translation
																	</>
																)}
															</button>
														)}
														</>
													)}
												</>
											)}

											{selectedDetail.j.status === "done" &&
												(isCaptionGroup ? (
													<VideoCaptionJobResult job={selectedDetail.j} />
												) : isClipsGroup ? (
													<ViralClipsJobResult job={selectedDetail.j} />
												) : isVoiceTranslationGroup ? (
													<div>
														{/* Top: translated audio + translated script */}
														<div
															style={{
																borderRadius: 14,
																border: "1px solid rgba(234, 88, 12, 0.2)",
																background:
																	"linear-gradient(180deg, rgba(254,243,232,0.65) 0%, #fff 48px)",
																padding: "18px 18px 20px",
																marginBottom: 20,
															}}
														>
															<div
																style={{
																	marginBottom: 14,
																	paddingBottom: 12,
																	borderBottom: "1px solid rgba(234, 88, 12, 0.12)",
																}}
															>
																
																<p
																	style={{
																		fontSize: 15,
																		fontWeight: 700,
																		color: "#18181b",
																		margin: 0,
																	}}
																>
																	Translation ·{" "}
																	{selectedDetail.j.outputLanguage ||
																		selectedDetail.j.lang}
																</p>
															</div>
															<div
																style={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	gap: 10,
																	marginBottom: 10,
																	flexWrap: "wrap",
																}}
															>
															<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
																<span
																	style={{
																		fontSize: 12,
																		fontWeight: 600,
																		color: "#52525b",
																	}}
																>
																	Translated audio
																</span>
																{selectedDetail.j.brandVoiceId && (() => {
																	const v = GEMINI_VOICES.find(x => x.id === selectedDetail.j.brandVoiceId);
																	return v ? (
																		<span
																			style={{
																				display: "inline-flex",
																				alignItems: "center",
																				gap: 4,
																				fontSize: 11,
																				fontWeight: 500,
																				color: "#c2410c",
																				background: "rgba(234,88,12,0.08)",
																				border: "1px solid rgba(234,88,12,0.15)",
																				borderRadius: 20,
																				padding: "2px 8px",
																				whiteSpace: "nowrap",
																			}}
																		>
																			🎙 {v.tts_voice} · {v.style}
																		</span>
																	) : null;
																})()}
															</div>
															{selectedDetail.j.resultUrl ? (
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
																		}}
																	>
																		<Download size={14} aria-hidden />
																		Download
																	</a>
																) : null}
															</div>
															<div style={{ marginBottom: 18 }}>
																{selectedDetail.j.resultUrl ? (
																	<VoiceStyleAudioPlayer
																		src={selectedDetail.j.resultUrl}
																	/>
																) : (
																	<p
																		style={{
																			color: "#a1a1aa",
																			fontSize: 13,
																			margin: 0,
																		}}
																	>
																		Audio URL not available yet.
																	</p>
																)}
															</div>
															{(selectedDetail.j.translatedTranscript ||
																selectedDetail.j.caption) && (
																<div style={{ marginBottom: 4 }}>
																	{selectedDetail.j.translatedTranscript && (
																		<CopyTextBlock
																			label="Translated transcript"
																			text={
																				selectedDetail.j.translatedTranscript
																			}
																			audioSrc={
																				selectedDetail.j.resultUrl ||
																				undefined
																			}
																			audioDownloadName={`voice-translated-${(selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output").replace(/[^\w-]+/g, "_")}.mp3`}
																			audioPreviewLabel="Translated audio (dubbed)"
																			showInlineAudio={false}
																		/>
																	)}
																	{selectedDetail.j.caption &&
																		selectedDetail.j.caption !==
																			selectedDetail.j.translatedTranscript && (
																			<CopyTextBlock
																				label={`Caption (${selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output"})`}
																				text={selectedDetail.j.caption}
																				audioSrc={
																					selectedDetail.j.resultUrl ||
																					undefined
																				}
																				audioDownloadName={`voice-caption-${(selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output").replace(/[^\w-]+/g, "_")}.mp3`}
																				audioPreviewLabel="Caption language audio"
																				showInlineAudio={false}
																			/>
																		)}
																</div>
															)}
														</div>

														{/* Bottom: original transcript */}
														<div
															style={{
																borderRadius: 14,
																border: "1px solid rgba(0,0,0,0.08)",
																background: "#fafaf9",
																padding: "18px 18px 20px",
																marginBottom: 20,
															}}
														>
															<div style={{ marginBottom: 14 }}>
																<p
																	style={{
																		fontSize: 10,
																		fontWeight: 700,
																		letterSpacing: "0.12em",
																		textTransform: "uppercase",
																		color: "#71717a",
																		margin: "0 0 4px",
																	}}
																>
																	Source
																</p>
																<p
																	style={{
																		fontSize: 15,
																		fontWeight: 700,
																		color: "#18181b",
																		margin: 0,
																	}}
																>
																	Original transcript
																</p>
															</div>
															{selectedDetail.j.transcriptOriginal ? (
																<CopyTextBlock
																	label="Original transcript"
																	text={selectedDetail.j.transcriptOriginal}
																/>
															) : (
																<p
																	style={{
																		fontSize: 13,
																		color: "#a1a1aa",
																		margin: 0,
																	}}
																>
																	No original text was stored (e.g. audio-only
																	input).
																</p>
															)}
														</div>

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
																Open translated audio
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
												) : (
													<div>
														{/* Top: this tab’s translation (dubbed + translated text) */}
														<div
															style={{
																borderRadius: 14,
																border: "1px solid rgba(234, 88, 12, 0.2)",
																background:
																	"linear-gradient(180deg, rgba(254,243,232,0.65) 0%, #fff 48px)",
																padding: "18px 18px 20px",
																marginBottom: 20,
															}}
														>
															
															<div
																style={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	gap: 10,
																	marginBottom: 10,
																	flexWrap: "wrap",
																}}
															>
															<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
																<span
																	style={{
																		fontSize: 12,
																		fontWeight: 600,
																		color: "#52525b",
																	}}
																>
																	Dubbed video
																</span>
																{selectedDetail.j.brandVoiceId && (() => {
																	const v = GEMINI_VOICES.find(x => x.id === selectedDetail.j.brandVoiceId);
																	return v ? (
																		<span
																			style={{
																				display: "inline-flex",
																				alignItems: "center",
																				gap: 4,
																				fontSize: 11,
																				fontWeight: 500,
																				color: "#c2410c",
																				background: "rgba(234,88,12,0.08)",
																				border: "1px solid rgba(234,88,12,0.15)",
																				borderRadius: 20,
																				padding: "2px 8px",
																				whiteSpace: "nowrap",
																			}}
																		>
																			🎙 {v.tts_voice} · {v.style}
																		</span>
																	) : null;
																})()}
															</div>

															{selectedDetail.j.resultUrl ? (
																	<div className="flex gap-2">
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
																			className={`flex gap-1 items-center ${selectedDetail.j.resultUrl ? "bg-orange-600 p-1.5 text-white text-sm rounded" : "bg-zinc-50"}`}
																		>
																			<ExternalLink size={14} aria-hidden />
																			Open dubbed video
																		</button>
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
																		}}
																	>
																		<Download size={14} aria-hidden />
																		Download
																	</a>
																	</div>
																) : null}
															</div>
															<div style={{ marginBottom: 18 }}>
																{selectedDetail.j.resultUrl ? (
																	<StudioVideoPlayer
																		src={selectedDetail.j.resultUrl}
																		footerLabel="Dubbed output"
																	/>
																) : (
																	<div
																		style={{
																			borderRadius: 12,
																			minHeight: 160,
																			display: "flex",
																			alignItems: "center",
																			justifyContent: "center",
																			color: "#a1a1aa",
																			fontSize: 13,
																			padding: 16,
																			background: "#fafaf9",
																			border: "1px solid rgba(0,0,0,0.06)",
																		}}
																	>
																		Dubbed file URL not available yet
																	</div>
																)}
															</div>
															{(selectedDetail.j.translatedTranscript ||
																selectedDetail.j.caption) && (
																<div style={{ marginBottom: 4 }}>
																	{selectedDetail.j.translatedTranscript && (
																		<CopyTextBlock
																			label="Translated transcript"
																			text={
																				selectedDetail.j.translatedTranscript
																			}
																			audioSrc={
																				selectedDetail.j.resultUrl ||
																				undefined
																			}
																			audioDownloadName={`dubbed-transcript-${(selectedDetail.j.outputLanguage || selectedDetail.j.lang || "output").replace(/[^\w-]+/g, "_")}.mp4`}
																			audioPreviewLabel="Translated audio (dubbed)"
																			animatedAudio
																		/>
																	)}
																	
																</div>
															)}
															{selectedDetail.j.captionUrl && (
																<div
																	style={{
																		fontSize: 13,
																		marginTop: 8,
																		marginBottom: 0,
																	}}
																>
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
																</div>
															)}
														</div>

														{/* Bottom: original source + original transcript */}
														<div
															style={{
																borderRadius: 14,
																border: "1px solid rgba(0,0,0,0.08)",
																background: "#fafaf9",
																padding: "18px 18px 20px",
																marginBottom: 20,
															}}
														>
															<div style={{ marginBottom: 14 }}>
																<p
																	style={{
																		fontSize: 10,
																		fontWeight: 700,
																		letterSpacing: "0.12em",
																		textTransform: "uppercase",
																		color: "#71717a",
																		margin: "0 0 4px",
																	}}
																>
																	Source
																</p>
																<p
																	style={{
																		fontSize: 15,
																		fontWeight: 700,
																		color: "#18181b",
																		margin: 0,
																	}}
																>
																	Original video & transcript
																</p>
															</div>
															
															<div style={{ marginBottom: 18 }}>
																{selected.sourceVideoUrl ||
																selectedDetail.j.sourceVideoUrl ? (
																	<OriginalSourceMediaPreview
																		url={
																			selected.sourceVideoUrl ||
																			selectedDetail.j.sourceVideoUrl
																		}
																		footerLabel="Source video"
																	/>
																) : (
																	<div
																		style={{
																			borderRadius: 12,
																			minHeight: 160,
																			display: "flex",
																			alignItems: "center",
																			justifyContent: "center",
																			color: "#a1a1aa",
																			fontSize: 13,
																			padding: 16,
																			background: "#fafaf9",
																			border: "1px solid rgba(0,0,0,0.06)",
																		}}
																	>
																		Source URL not available yet
																	</div>
																)}
															</div>
															
														</div>

														<div
															style={{
																display: "flex",
																gap: 10,
																flexWrap: "wrap",
															}}
														>
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
														width: "100%",
													}}
												>
													<AlertCircle size={44} style={{ color: "#ef4444" }} />
													<p
														style={{
															color: "#ef4444",
															fontWeight: 500,
														}}
													>
														{isCaptionGroup
															? "Caption generation failed"
															: isClipsGroup
																? "Clip generation failed"
																: `Translation failed (${selectedDetail.j.lang})`}
													</p>
													{selectedDetail.j.errorMessage ? (
														<p
															style={{
																color: "#71717a",
																fontSize: 13.5,
																textAlign: "center",
															}}
														>
															{selectedDetail.j.errorMessage}
														</p>
													) : (
													<p
														style={{
															color: "#71717a",
															fontSize: 13.5,
															textAlign: "center",
														}}
													>
														{isCaptionGroup || isClipsGroup
															? "Retry with the same source video, or add another language from the dropdown above."
															: "Retry with the same source video, or start a new translation."}
													</p>
													)}
													<div
														style={{
															display: "flex",
															flexWrap: "wrap",
															gap: 10,
															justifyContent: "center",
															marginTop: 4,
														}}
													>
														{isCaptionGroup && appendSourceVideoUrl && (
															<button
																type="button"
																onClick={() =>
																	retryFailedTranslation(selectedDetail.j)
																}
																disabled={
																	appendBusy === selectedDetail.j.lang
																}
																style={{
																	display: "inline-flex",
																	alignItems: "center",
																	justifyContent: "center",
																	gap: 8,
																	padding: "9px 20px",
																	borderRadius: 10,
																	fontSize: 13.5,
																	fontWeight: 600,
																	background: "#ea580c",
																	color: "#fff",
																	border: "none",
																	cursor:
																		appendBusy === selectedDetail.j.lang
																			? "wait"
																			: "pointer",
																	opacity:
																		appendBusy === selectedDetail.j.lang
																			? 0.85
																			: 1,
																}}
															>
																{appendBusy === selectedDetail.j.lang ? (
																	<>
																		<Loader2
																			size={14}
																			className="spin"
																			aria-hidden
																		/>
																		Retrying…
																	</>
																) : (
																	<>
																		<RefreshCw size={14} aria-hidden />
																		Retry captions
																	</>
																)}
															</button>
														)}
														{!isCaptionGroup &&
															!isClipsGroup &&
															!isVoiceTranslationGroup &&
															appendSourceVideoUrl && (
															<button
																type="button"
																onClick={() =>
																	retryFailedTranslation(selectedDetail.j)
																}
																disabled={
																	appendBusy === selectedDetail.j.lang
																}
																style={{
																	display: "inline-flex",
																	alignItems: "center",
																	justifyContent: "center",
																	gap: 8,
																	padding: "9px 20px",
																	borderRadius: 10,
																	fontSize: 13.5,
																	fontWeight: 600,
																	background: "#ea580c",
																	color: "#fff",
																	border: "none",
																	cursor:
																		appendBusy === selectedDetail.j.lang
																			? "wait"
																			: "pointer",
																	opacity:
																		appendBusy === selectedDetail.j.lang
																			? 0.85
																			: 1,
																}}
															>
																{appendBusy === selectedDetail.j.lang ? (
																	<>
																		<Loader2
																			size={16}
																			className="spin"
																			aria-hidden
																		/>
																		Starting…
																	</>
																) : (
																	"Retry"
																)}
															</button>
														)}
														<button
															type="button"
															onClick={() => {
																setViewNew(true);
																setSelected(null);
															}}
															style={{
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
												</div>
											)}

{showFollowUpTools && (
												<div
													style={{
														marginBottom: 28,
														paddingBottom: 24,
														borderBottom: "1px solid rgba(0,0,0,0.06)",
													}}
												>
													<h3
														className="aantraa-font"
														style={{
															fontSize: 17,
															fontWeight: 700,
															color: "#18181b",
															marginTop: 20,
														}}
													>
														Use this video in another tool
													</h3>
													<p
														style={{
															fontSize: 13,
															color: "#71717a",
															marginBottom: 14,
															lineHeight: 1.5,
														}}
													>
														Pick translate, captions, or clips — the video URL
														is already filled. Each run creates a{" "}
														<strong>new project</strong> and opens it when
														processing starts.
													</p>
													<VideoToolsTabBar
														value={followUpTab}
														onChange={setFollowUpTab}
														tabOrder={followUpTabOrder}
														className="mb-4"
													/>
													<div
														style={{
															borderRadius: 14,
															padding: "20px 18px",
															background: "rgba(254,243,232,0.35)",
															border: "1px solid rgba(234,88,12,0.15)",
														}}
													>
														<NewTranslationPanel
															addVideo={addFollowUpToolJob}
															tab={followUpTab}
															onTabChange={setFollowUpTab}
															showTabs={false}
															followUpMode
															prefillVideoUrl={reuseVideoUrl}
															lockPrefilledUrl
															workspaceVideos={workspaceVideos}
															usageMinutesUsed={usageMinutes.used}
															usageMinutesCredited={usageMinutes.credited}
														/>
													</div>
												</div>
											)}

										</>
									)}
								</div>

								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: 8,
										marginTop: 10,
										flexWrap: "wrap",
									}}
								>
									<FeedbackCreditTrigger variant="inline" />
									<button
										type="button"
										onClick={() => setDeleteConfirmId(selected.id)}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 5,
											padding: "6px 12px",
											borderRadius: 8,
											fontSize: 12.5,
											color: "#a1a1aa",
											border: "1px solid rgba(0,0,0,0.08)",
											cursor: "pointer",
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
									className="aantraa-font"
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
			
			<FeedbackCreditTrigger variant="fixed" />
			<UpgradePriceModal
				open={showUpgrade}
				onClose={() => setShowUpgrade(false)}
			/>
			<DeleteTranslationConfirmModal
				open={Boolean(deleteConfirmId)}
				title={pendingDeleteTitle}
				onClose={() => setDeleteConfirmId(null)}
				onConfirm={() => {
					if (deleteConfirmId) performDeleteTranslation(deleteConfirmId);
					setDeleteConfirmId(null);
				}}
			/>
		</div>
		</FeedbackCreditProvider>
	);
}

// ─── Landing route (/) — signed-in users are sent to /app ───────────────────
export default function Home() {
	return <HomePage LandingComponent={Landing} GlobalStylesComponent={GlobalStyles} />;
}
