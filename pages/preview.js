import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import {
	LayoutDashboard,
	ClipboardList,
	Layers,
	MessageSquare,
	FileText,
	Share2,
	Plus,
	Check,
	Clock,
	DollarSign,
	User,
	Building2,
	Calendar,
	Link2,
	Copy,
	Eye,
	Send,
	AlertCircle,
	CheckCircle2,
	XCircle,
	ChevronRight,
	Sparkles,
	Lock,
	HelpCircle,
	ArrowRight,
	X,
	Download,
	PenLine,
	Wallet,
	Landmark,
	CreditCard,
	Trash2,
	Files,
	Code2,
	Palette,
	Megaphone,
	Lightbulb,
	Video,
	PenTool,
	Briefcase,
	Target,
	Flag,
	Wand2,
	ImagePlus,
	Loader2,
	Bot,
	ChevronDown,
	Mic,
	ImageIcon,
	Search,
	ExternalLink,
	Paperclip,
	Receipt,
	ChevronUp,
} from "lucide-react";

const INITIAL_PROJECTS = [
	{
		id: "p1",
		name: "E-commerce Redesign",
		client: "Bloom & Co.",
		contact: "Sarah Mitchell",
		email: "sarah@bloomco.com",
		status: "draft",
		budget: 18500,
		weeks: 8,
		hourlyRate: 95,
		shareId: "bloom-ecom-2026",
		category: "web-dev",
		pricingModel: "hourly",
		currency: "USD",
	},
	{
		id: "p2",
		name: "SaaS Admin Dashboard",
		client: "NexaFlow",
		contact: "James Chen",
		email: "james@nexaflow.io",
		status: "sent",
		budget: 24000,
		weeks: 10,
		hourlyRate: 95,
		shareId: "nexaflow-admin-2026",
		category: "web-dev",
		pricingModel: "hourly",
		currency: "USD",
	},
	{
		id: "p3",
		name: "Portfolio Website",
		client: "Alex Rivera",
		contact: "Alex Rivera",
		email: "alex@rivera.studio",
		status: "approved",
		budget: 4200,
		weeks: 3,
		hourlyRate: 85,
		shareId: "rivera-portfolio-2026",
		category: "design",
		pricingModel: "fixed",
		currency: "USD",
	},
];

const INITIAL_REQUIREMENTS = {
	p1: [
		{
			id: "r1",
			title: "Product catalog with filters",
			category: "must",
			status: "confirmed",
			source: "Kickoff call — Mar 12",
			hours: 40,
		},
		{
			id: "r2",
			title: "Stripe checkout integration",
			category: "must",
			status: "confirmed",
			source: "Kickoff call — Mar 12",
			hours: 24,
		},
		{
			id: "r3",
			title: "Customer wishlist",
			category: "nice",
			status: "proposed",
			source: "Follow-up email — Mar 15",
			hours: 16,
		},
		{
			id: "r4",
			title: "Native mobile app",
			category: "out",
			status: "declined",
			source: "Kickoff call — Mar 12",
			hours: 0,
		},
		{
			id: "r5",
			title: "Admin order management panel",
			category: "must",
			status: "confirmed",
			source: "Scope review — Mar 18",
			hours: 32,
		},
		{
			id: "r6",
			title: "Blog with CMS",
			category: "nice",
			status: "proposed",
			source: "Follow-up email — Mar 15",
			hours: 20,
		},
	],
	p2: [
		{
			id: "r7",
			title: "Role-based access control",
			category: "must",
			status: "confirmed",
			source: "Discovery — Feb 28",
			hours: 48,
		},
		{
			id: "r8",
			title: "Real-time analytics charts",
			category: "must",
			status: "confirmed",
			source: "Discovery — Feb 28",
			hours: 36,
		},
	],
	p3: [
		{
			id: "r9",
			title: "Responsive portfolio gallery",
			category: "must",
			status: "confirmed",
			source: "Initial call — Jan 5",
			hours: 24,
		},
	],
};

const INITIAL_TECH_STACK = {
	p1: [
		{ id: "t1", name: "Next.js 15", role: "Frontend", status: "locked", note: "Client approved — SSR for SEO" },
		{ id: "t2", name: "Tailwind CSS", role: "Styling", status: "locked", note: "Matches existing brand system" },
		{ id: "t3", name: "Stripe", role: "Payments", status: "locked", note: "Required for checkout" },
		{ id: "t4", name: "Sanity CMS", role: "Content", status: "discussing", note: "vs Contentful — awaiting client pick" },
		{ id: "t5", name: "Vercel", role: "Hosting", status: "locked", note: "Preview deployments for approvals" },
	],
	p2: [
		{ id: "t6", name: "React 18", role: "Frontend", status: "locked", note: "Team already uses React" },
		{ id: "t7", name: "Firebase", role: "Backend", status: "locked", note: "Existing infra" },
	],
	p3: [
		{ id: "t8", name: "Figma", role: "Design tool", status: "locked", note: "Source files included" },
		{ id: "t8b", name: "Responsive layouts", role: "Deliverable", status: "locked", note: "Mobile + desktop" },
		{ id: "t8c", name: "Dev handoff specs", role: "Deliverable", status: "discussing", note: "Optional for v1" },
	],
};

const INITIAL_CONVERSATIONS = {
	p1: [
		{
			id: "c1",
			date: "Mar 12, 2026",
			title: "Kickoff call",
			summary: "Discussed core e-commerce flows. Client wants modern redesign, mobile-first. Ruled out native app for v1.",
			requirementsAdded: 3,
		},
		{
			id: "c2",
			date: "Mar 15, 2026",
			title: "Follow-up email",
			summary: "Sarah asked about wishlist and blog. Mentioned competitor sites as reference. CMS preference still open.",
			requirementsAdded: 2,
		},
		{
			id: "c3",
			date: "Mar 18, 2026",
			title: "Scope review",
			summary: "Walked through admin panel needs. Agreed on order management. Deferred blog decision to next draft.",
			requirementsAdded: 1,
		},
	],
	p2: [
		{
			id: "c4",
			date: "Feb 28, 2026",
			title: "Discovery session",
			summary: "Mapped admin roles and analytics needs. Tech stack aligned with existing Firebase setup.",
			requirementsAdded: 2,
		},
	],
	p3: [
		{
			id: "c5",
			date: "Jan 5, 2026",
			title: "Initial call",
			summary: "Simple portfolio with case studies. Fast turnaround requested.",
			requirementsAdded: 1,
		},
	],
};

const INITIAL_PROPOSALS = {
	p1: [
		{
			id: "prop-p1-1",
			title: "Initial proposal",
			version: 1,
			status: "draft",
			shareId: "bloom-ecom-v1",
			weeks: 8,
			createdAt: "Mar 1, 2026",
			lineItems: [
				{ id: "l1", label: "Discovery & UX wireframes", hours: 24, rate: 95 },
				{ id: "l2", label: "Frontend development", hours: 80, rate: 95 },
				{ id: "l3", label: "Stripe & checkout integration", hours: 24, rate: 95 },
				{ id: "l4", label: "Admin panel", hours: 32, rate: 95 },
				{ id: "l5", label: "QA, deployment & handoff", hours: 16, rate: 95 },
			],
		},
	],
	p2: [
		{
			id: "prop-p2-1",
			title: "Initial proposal",
			version: 1,
			status: "revision",
			shareId: "nexaflow-admin-v1",
			weeks: 10,
			createdAt: "Feb 20, 2026",
			lineItems: [
				{ id: "l6", label: "Architecture & setup", hours: 32, rate: 95 },
				{ id: "l7", label: "Dashboard UI", hours: 120, rate: 95 },
				{ id: "l8", label: "Auth & RBAC", hours: 48, rate: 95 },
				{ id: "l9", label: "Testing & launch", hours: 32, rate: 95 },
			],
		},
		{
			id: "prop-p2-2",
			title: "Revision v2 — with analytics",
			version: 2,
			status: "sent",
			shareId: "nexaflow-admin-v2",
			weeks: 12,
			createdAt: "Mar 5, 2026",
			lineItems: [
				{ id: "l6b", label: "Architecture & setup", hours: 32, rate: 95 },
				{ id: "l7b", label: "Dashboard UI", hours: 120, rate: 95 },
				{ id: "l8b", label: "Auth & RBAC", hours: 48, rate: 95 },
				{ id: "l9b", label: "Real-time analytics module", hours: 40, rate: 95 },
				{ id: "l10b", label: "Testing & launch", hours: 32, rate: 95 },
			],
		},
	],
	p3: [
		{
			id: "prop-p3-1",
			title: "Initial proposal",
			version: 1,
			status: "approved",
			shareId: "rivera-portfolio-v1",
			weeks: 3,
			createdAt: "Jan 5, 2026",
			lineItems: [
				{ id: "l10", label: "Design & build", hours: 32, rate: 85 },
				{ id: "l11", label: "Content migration & launch", hours: 16, rate: 85 },
			],
		},
	],
};

const STATUS_CONFIG = {
	draft: { label: "Draft", color: "bg-zinc-100 text-zinc-700", icon: FileText },
	sent: { label: "Sent to client", color: "bg-amber-50 text-amber-700", icon: Send },
	approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
	revision: { label: "Revision requested", color: "bg-red-50 text-red-700", icon: AlertCircle },
};

const CATEGORY_CONFIG = {
	must: { label: "Must have", color: "bg-blue-50 text-blue-700 border-blue-100" },
	nice: { label: "Nice to have", color: "bg-zinc-50 text-zinc-700 border-zinc-100" },
	out: { label: "Out of scope", color: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

const REQ_STATUS_CONFIG = {
	confirmed: { label: "Confirmed", color: "text-emerald-600", icon: CheckCircle2 },
	proposed: { label: "Proposed", color: "text-amber-600", icon: HelpCircle },
	declined: { label: "Declined", color: "text-zinc-400", icon: XCircle },
};

const NAV_ITEMS = [
	{ id: "editor", label: "Proposal editor", icon: FileText },
	{ id: "invoice", label: "Invoice", icon: Receipt },
	{ id: "more", label: "Pro tools", icon: Layers },
];

const ADVANCED_NAV_ITEMS = [
	{ id: "overview", label: "Overview", icon: LayoutDashboard },
	{ id: "ai", label: "AI chat", icon: Wand2 },
	{ id: "brief", label: "Brief", icon: Target },
	{ id: "requirements", label: "Requirements", icon: ClipboardList },
	{ id: "deliverables", label: "Deliverables", icon: Layers },
	{ id: "milestones", label: "Milestones", icon: Flag },
	{ id: "media", label: "Media", icon: Mic },
	{ id: "conversations", label: "Conversations", icon: MessageSquare },
	{ id: "payments", label: "Payments", icon: Wallet },
];

const MEDIA_TYPE_CONFIG = {
	recording: { label: "Call recording", icon: Mic, color: "bg-violet-50 text-violet-700" },
	screenshot: { label: "Screenshot", icon: ImageIcon, color: "bg-sky-50 text-sky-700" },
	link: { label: "Link", icon: Link2, color: "bg-amber-50 text-amber-700" },
};

const INITIAL_PROJECT_MEDIA = {
	p1: [
		{
			id: "med-p1-1",
			type: "link",
			title: "Kickoff call recording (Loom)",
			url: "https://www.loom.com/share/example-kickoff",
			createdAt: "Mar 12, 2026",
		},
	],
};

const formatFileSize = (bytes) => {
	if (!bytes) return "—";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getUploadThingApiKey = () => {
	const raw = process.env.NEXT_PUBLIC_UPLOADTHING_TOKEN;
	if (!raw) return null;
	try {
		return JSON.parse(atob(raw.trim())).apiKey;
	} catch {
		return raw.trim();
	}
};

const inferMediaTypeFromFile = (file) => {
	if (file.type?.startsWith("image/")) return "screenshot";
	if (file.type?.startsWith("video/") || file.type?.startsWith("audio/")) return "recording";
	const ext = file.name.split(".").pop()?.toLowerCase();
	if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "screenshot";
	return "recording";
};

const uploadFileToUploadThing = async (file) => {
	const apiKey = getUploadThingApiKey();
	if (!apiKey) {
		throw new Error("Add UPLOADTHING_SECRET to .env.local and restart the dev server.");
	}

	const prepareRes = await fetch("https://api.uploadthing.com/v6/uploadFiles", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Uploadthing-Api-Key": apiKey,
		},
		body: JSON.stringify({
			files: [
				{
					name: file.name,
					size: file.size,
					type: file.type || "application/octet-stream",
				},
			],
			acl: "public-read",
			contentDisposition: "inline",
		}),
	});

	const prepareJson = await prepareRes.json();
	if (!prepareRes.ok) {
		throw new Error(
			prepareJson?.error?.message || prepareJson?.message || `UploadThing error (${prepareRes.status})`,
		);
	}

	const entry = prepareJson.data?.[0];
	if (!entry?.url) throw new Error("UploadThing did not return an upload URL.");

	const putRes = await fetch(entry.url, {
		method: "PUT",
		headers: { "Content-Type": file.type || "application/octet-stream" },
		body: file,
	});

	if (!putRes.ok) throw new Error("Failed to upload file to storage.");

	return {
		url: entry.fileUrl || entry.ufsUrl || `https://utfs.io/f/${entry.key}`,
		key: entry.key,
		name: file.name,
		size: file.size,
		mimeType: file.type,
	};
};

const deleteUploadThingFile = async (fileKey) => {
	const apiKey = getUploadThingApiKey();
	if (!apiKey || !fileKey) return;

	await fetch("https://api.uploadthing.com/v6/deleteFiles", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Uploadthing-Api-Key": apiKey,
		},
		body: JSON.stringify({ fileKeys: [fileKey] }),
	});
};

const PRICING_MODELS = [
	{ id: "hourly", label: "Hourly", description: "Bill by the hour" },
	{ id: "fixed", label: "Fixed price", description: "One total project fee" },
	{ id: "retainer", label: "Retainer", description: "Monthly ongoing engagement" },
	{ id: "package", label: "Package", description: "Bundled service tiers" },
];

const PROJECT_CATEGORIES = [
	{
		id: "web-dev",
		label: "Web & Software",
		icon: Code2,
		deliverablesLabel: "Tech stack & tools",
		deliverablesDesc: "Lock frameworks, hosting, and integrations once agreed with the client.",
		itemNamePlaceholder: "e.g. Next.js, Firebase",
		itemRolePlaceholder: "e.g. Frontend, API",
		tip: "When a client asks to switch platforms mid-project, point to the locked items in the shared proposal.",
		defaultDeliverables: [
			{ name: "Next.js", role: "Frontend", status: "locked", note: "SSR / app framework" },
			{ name: "Tailwind CSS", role: "Styling", status: "locked", note: "UI styling" },
		],
		defaultLineItem: { label: "Discovery & technical setup", hours: 8 },
		briefFields: [
			{ key: "productType", label: "Product type", placeholder: "SaaS, e-commerce, internal tool, landing page..." },
			{ key: "integrations", label: "Integrations", placeholder: "Stripe, auth, CMS, analytics..." },
		],
	},
	{
		id: "design",
		label: "UI/UX Design",
		icon: Palette,
		deliverablesLabel: "Tools & deliverables",
		deliverablesDesc: "Lock design tools, file formats, and handoff specs.",
		itemNamePlaceholder: "e.g. Figma, Prototype",
		itemRolePlaceholder: "e.g. UI kit, Wireframes",
		tip: "Clarify how many revision rounds and which formats are included before work starts.",
		defaultDeliverables: [
			{ name: "Figma", role: "Design tool", status: "locked", note: "Source files included" },
			{ name: "Interactive prototype", role: "Deliverable", status: "discussing", note: "Clickable flows for approval" },
		],
		defaultLineItem: { label: "Discovery & wireframes", hours: 12 },
		briefFields: [
			{ key: "scope", label: "Design scope", placeholder: "Full product UI, landing page, design system..." },
			{ key: "handoff", label: "Developer handoff", placeholder: "Specs, assets, component library..." },
		],
	},
	{
		id: "branding",
		label: "Branding & Identity",
		icon: Sparkles,
		deliverablesLabel: "Brand deliverables",
		deliverablesDesc: "Logo, guidelines, and asset formats included in scope.",
		itemNamePlaceholder: "e.g. Logo suite, Brand book",
		itemRolePlaceholder: "e.g. Primary mark, Guidelines",
		tip: "Define logo variations and usage rights upfront to avoid endless revision loops.",
		defaultDeliverables: [
			{ name: "Logo suite", role: "Primary deliverable", status: "locked", note: "Primary, secondary, icon mark" },
			{ name: "Brand guidelines PDF", role: "Deliverable", status: "discussing", note: "Colors, typography, usage" },
		],
		defaultLineItem: { label: "Brand discovery workshop", hours: 6 },
		briefFields: [
			{ key: "brandGoals", label: "Brand goals", placeholder: "Positioning, personality, competitors to avoid..." },
			{ key: "assetFormats", label: "Asset formats", placeholder: "SVG, PNG, social templates, stationery..." },
		],
	},
	{
		id: "marketing",
		label: "Marketing & Content",
		icon: Megaphone,
		deliverablesLabel: "Channels & formats",
		deliverablesDesc: "Lock platforms, content types, and publishing cadence.",
		itemNamePlaceholder: "e.g. Instagram, Blog SEO",
		itemRolePlaceholder: "e.g. Social, Content",
		tip: "Specify post count, revisions, and who approves content before scheduling.",
		defaultDeliverables: [
			{ name: "Social media kit", role: "Deliverable", status: "locked", note: "Templates + post formats" },
			{ name: "Content calendar", role: "Process", status: "discussing", note: "Monthly planning doc" },
		],
		defaultLineItem: { label: "Strategy & content audit", hours: 5 },
		briefFields: [
			{ key: "channels", label: "Channels", placeholder: "Instagram, LinkedIn, email, ads..." },
			{ key: "contentVolume", label: "Content volume", placeholder: "12 posts/month, 4 blogs, 2 emails..." },
		],
	},
	{
		id: "consulting",
		label: "Consulting & Strategy",
		icon: Lightbulb,
		deliverablesLabel: "Methods & outputs",
		deliverablesDesc: "Lock engagement format, sessions, and report deliverables.",
		itemNamePlaceholder: "e.g. Strategy deck, Audit report",
		itemRolePlaceholder: "e.g. Workshop, Document",
		tip: "Define session count, async support, and what the final recommendation includes.",
		defaultDeliverables: [
			{ name: "Discovery workshop", role: "Session", status: "locked", note: "2-hour kickoff" },
			{ name: "Strategy recommendation", role: "Deliverable", status: "discussing", note: "Written report + presentation" },
		],
		defaultLineItem: { label: "Discovery & stakeholder interviews", hours: 10 },
		briefFields: [
			{ key: "problemStatement", label: "Problem to solve", placeholder: "What decision or outcome the client needs..." },
			{ key: "engagementFormat", label: "Engagement format", placeholder: "Workshops, async review, weekly calls..." },
		],
	},
	{
		id: "video",
		label: "Video & Photo",
		icon: Video,
		deliverablesLabel: "Production specs",
		deliverablesDesc: "Lock resolution, length, revisions, and delivery formats.",
		itemNamePlaceholder: "e.g. 60s promo, Product photos",
		itemRolePlaceholder: "e.g. Video, Photography",
		tip: "Include revision rounds and raw vs. edited file delivery in the proposal.",
		defaultDeliverables: [
			{ name: "4K master edit", role: "Video deliverable", status: "locked", note: "Final cut + color grade" },
			{ name: "Social cut-downs", role: "Add-on", status: "discussing", note: "15s / 30s versions" },
		],
		defaultLineItem: { label: "Pre-production & scripting", hours: 8 },
		briefFields: [
			{ key: "deliverableSpecs", label: "Specs", placeholder: "Duration, aspect ratios, platforms..." },
			{ key: "shootLocation", label: "Location / shoot", placeholder: "On-site, studio, remote assets only..." },
		],
	},
	{
		id: "writing",
		label: "Writing & Copy",
		icon: PenTool,
		deliverablesLabel: "Content types",
		deliverablesDesc: "Lock page count, tone, SEO needs, and revision policy.",
		itemNamePlaceholder: "e.g. Website copy, Email sequence",
		itemRolePlaceholder: "e.g. Sales page, Blog",
		tip: "Define word counts and how many revision rounds are included per deliverable.",
		defaultDeliverables: [
			{ name: "Website copy", role: "Deliverable", status: "locked", note: "Home, about, 3 product pages" },
			{ name: "SEO meta descriptions", role: "Add-on", status: "discussing", note: "Per-page metadata" },
		],
		defaultLineItem: { label: "Content brief & research", hours: 4 },
		briefFields: [
			{ key: "toneOfVoice", label: "Tone of voice", placeholder: "Professional, playful, technical..." },
			{ key: "wordCounts", label: "Volume", placeholder: "5 pages ~500 words each, 10 emails..." },
		],
	},
	{
		id: "other",
		label: "Other / Custom",
		icon: Briefcase,
		deliverablesLabel: "Deliverables & tools",
		deliverablesDesc: "Define what's included, formats, and what's still open for discussion.",
		itemNamePlaceholder: "e.g. Custom deliverable",
		itemRolePlaceholder: "e.g. Type or category",
		tip: "List every deliverable explicitly — ambiguity causes the most revision cycles.",
		defaultDeliverables: [
			{ name: "Kickoff deliverable", role: "Phase 1", status: "locked", note: "Define in proposal" },
		],
		defaultLineItem: { label: "Discovery & scoping", hours: 4 },
		briefFields: [
			{ key: "projectType", label: "Project type", placeholder: "Describe the engagement..." },
			{ key: "successCriteria", label: "Success criteria", placeholder: "How the client measures done..." },
		],
	},
];

const getCategoryConfig = (categoryId) =>
	PROJECT_CATEGORIES.find((c) => c.id === categoryId) || PROJECT_CATEGORIES.find((c) => c.id === "other");

const EMPTY_BRIEF = {
	goals: "",
	targetAudience: "",
	deliverablesSummary: "",
	timelineNotes: "",
	revisionRounds: 2,
	customFields: {},
};

const INITIAL_PROJECT_BRIEFS = {
	p1: {
		goals: "Modernize e-commerce experience, improve mobile conversion, simplify checkout.",
		targetAudience: "Women 25–45, US & UK, mobile-first shoppers.",
		deliverablesSummary: "Redesigned storefront, admin panel, Stripe checkout, deployment.",
		timelineNotes: "Launch before Q3 sale season. Phased rollout acceptable.",
		revisionRounds: 2,
		customFields: {
			productType: "Headless e-commerce storefront",
			integrations: "Stripe, Sanity CMS, Klaviyo",
		},
	},
	p2: {
		goals: "Replace spreadsheet ops with a real admin dashboard for the SaaS team.",
		targetAudience: "Internal ops and customer success teams.",
		deliverablesSummary: "Role-based admin app with analytics and user management.",
		timelineNotes: "MVP in 10 weeks, analytics phase can follow.",
		revisionRounds: 3,
		customFields: {
			productType: "B2B SaaS admin dashboard",
			integrations: "Firebase, existing REST API",
		},
	},
	p3: {
		goals: "Showcase photography portfolio with case studies and easy contact flow.",
		targetAudience: "Creative directors and agency producers.",
		deliverablesSummary: "Responsive portfolio site, gallery, about, contact.",
		timelineNotes: "Fast turnaround — launch within 3 weeks.",
		revisionRounds: 2,
		customFields: {
			scope: "Portfolio site — 6 case study pages",
			handoff: "Static Next.js site, client updates copy via CMS later",
		},
	},
};

const INITIAL_MILESTONES = {
	p1: [
		{ id: "m1", title: "Discovery & wireframes", due: "Week 1–2", status: "pending" },
		{ id: "m2", title: "Design approval", due: "Week 3", status: "pending" },
		{ id: "m3", title: "Development sprint 1", due: "Week 4–6", status: "pending" },
		{ id: "m4", title: "QA & launch", due: "Week 7–8", status: "pending" },
	],
	p2: [
		{ id: "m5", title: "Architecture & auth", due: "Week 1–3", status: "pending" },
		{ id: "m6", title: "Dashboard MVP", due: "Week 4–8", status: "pending" },
		{ id: "m7", title: "Analytics module", due: "Week 9–12", status: "pending" },
	],
	p3: [
		{ id: "m8", title: "Concept & layout", due: "Week 1", status: "done" },
		{ id: "m9", title: "Build & content", due: "Week 2", status: "pending" },
		{ id: "m10", title: "Launch", due: "Week 3", status: "pending" },
	],
};

const CURRENCIES = [
	{ code: "USD", symbol: "$", flag: "🇺🇸", label: "US Dollar", locale: "en-US" },
	{ code: "EUR", symbol: "€", flag: "🇪🇺", label: "Euro", locale: "de-DE" },
	{ code: "GBP", symbol: "£", flag: "🇬🇧", label: "British Pound", locale: "en-GB" },
	{ code: "INR", symbol: "₹", flag: "🇮🇳", label: "Indian Rupee", locale: "en-IN" },
	{ code: "AUD", symbol: "A$", flag: "🇦🇺", label: "Australian Dollar", locale: "en-AU" },
	{ code: "CAD", symbol: "C$", flag: "🇨🇦", label: "Canadian Dollar", locale: "en-CA" },
	{ code: "JPY", symbol: "¥", flag: "🇯🇵", label: "Japanese Yen", locale: "ja-JP" },
	{ code: "AED", symbol: "د.إ", flag: "🇦🇪", label: "UAE Dirham", locale: "ar-AE" },
	{ code: "SGD", symbol: "S$", flag: "🇸🇬", label: "Singapore Dollar", locale: "en-SG" },
	{ code: "CHF", symbol: "CHF", flag: "🇨🇭", label: "Swiss Franc", locale: "de-CH" },
];

const getCurrencyMeta = (code) => CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

const formatCurrency = (n, currencyCode = "USD") => {
	const meta = getCurrencyMeta(currencyCode);
	return new Intl.NumberFormat(meta.locale, {
		style: "currency",
		currency: meta.code,
		maximumFractionDigits: meta.code === "JPY" ? 0 : 0,
	}).format(n);
};

const slugify = (name) =>
	`${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-6)}`;

const todayLabel = () =>
	new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const EMPTY_PROJECT_FORM = {
	name: "",
	client: "",
	contact: "",
	email: "",
	hourlyRate: 95,
	weeks: 4,
	category: "web-dev",
	pricingModel: "hourly",
	currency: "USD",
};

const buildDefaultDeliverables = (categoryId, projectId) => {
	const cat = getCategoryConfig(categoryId);
	return (cat?.defaultDeliverables || []).map((d, i) => ({
		...d,
		id: `t-${projectId}-${i}`,
	}));
};

const OPENROUTER_MODEL = "google/gemini-2.5-flash-lite";

const AI_SYSTEM_PROMPT = `You are ScopeDraft AI — an expert freelance proposal writer for developers, designers, marketers, consultants, video creators, writers, and solopreneurs.

From the user's description, chat history, and any images (mockups, briefs, screenshots), produce a complete client-ready project proposal.

RULES:
- Return ONLY valid JSON. No markdown fences, no commentary outside JSON.
- Use exact category ids: web-dev, design, branding, marketing, consulting, video, writing, other
- Use exact pricingModel ids: hourly, fixed, retainer, package
- Requirement category: must | nice | out
- Requirement status: confirmed | proposed | declined
- Deliverable status: locked | discussing
- Be realistic with hours, rates, and timelines for freelance work
- Include category-appropriate customFields in brief matching the project category
- assistantMessage: friendly 2-3 sentence summary of what you created

JSON schema:
{
  "project": { "name": "", "client": "", "contact": "", "email": "", "category": "", "pricingModel": "", "weeks": 0, "hourlyRate": 0 },
  "brief": { "goals": "", "targetAudience": "", "deliverablesSummary": "", "timelineNotes": "", "revisionRounds": 2, "customFields": {} },
  "requirements": [{ "title": "", "category": "must", "status": "proposed", "hours": 0 }],
  "deliverables": [{ "name": "", "role": "", "status": "locked", "note": "" }],
  "milestones": [{ "title": "", "due": "" }],
  "proposal": { "title": "", "weeks": 0, "lineItems": [{ "label": "", "description": "", "hours": 0, "rate": 0 }] },
  "conversationNote": "",
  "assistantMessage": ""
}

Include 5-8 requirements, 3-5 deliverables, 3-5 milestones, 4-7 proposal line items.`;

const parseAiJson = (raw) => {
	const trimmed = String(raw).trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
		if (fenced) return JSON.parse(fenced[1].trim());
		const start = trimmed.indexOf("{");
		const end = trimmed.lastIndexOf("}");
		if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
		throw new Error("AI returned invalid JSON. Try again with more detail.");
	}
};

const buildOpenRouterMessages = (chatMessages, systemPrompt) => {
	const messages = [{ role: "system", content: systemPrompt }];

	chatMessages.forEach((msg) => {
		if (msg.role === "assistant") {
			messages.push({ role: "assistant", content: msg.content });
			return;
		}

		const parts = [];
		if (msg.content) parts.push({ type: "text", text: msg.content });
		(msg.images || []).forEach((img) => {
			parts.push({ type: "image_url", image_url: { url: img.dataUrl } });
		});

		messages.push({
			role: "user",
			content: parts.length === 1 && parts[0].type === "text" ? msg.content : parts,
		});
	});

	return messages;
};

const callOpenRouter = async (chatMessages, systemPrompt) => {
	const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("Add OPENROUTER_API_KEY to .env.local and restart the dev server.");
	}

	const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
			"X-Title": "ScopeDraft",
		},
		body: JSON.stringify({
			model: OPENROUTER_MODEL,
			messages: buildOpenRouterMessages(chatMessages, systemPrompt),
			temperature: 0.35,
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `OpenRouter error (${response.status})`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;
	if (!content) throw new Error("Empty response from AI.");
	return content;
};

const DEFAULT_PAYMENT_DETAILS = {
	senderType: "individual",
	senderName: "",
	businessName: "Your Studio",
	businessEmail: "hello@yourstudio.com",
	phone: "",
	address: "",
	website: "",
	taxId: "",
	bankName: "",
	accountName: "",
	accountNumber: "",
	ifscSwift: "",
	upiId: "",
	paypalLink: "",
	stripeLink: "",
	polarLink: "",
	lemonSqueezyLink: "",
	dodoLink: "",
	razorpayLink: "",
	paddleLink: "",
	otherPayments: [],
};

const DEFAULT_INVOICE_META = {
	invoiceNumber: "INV-001",
	issueDate: "",
	dueDate: "",
	notes: "Thank you for your business. Payment is due within 14 days of invoice date.",
	taxRate: 0,
};

const inputClass =
	"w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100";

const PAYMENT_LINK_FIELDS = [
	{ key: "stripeLink", label: "Stripe", placeholder: "https://buy.stripe.com/..." },
	{ key: "polarLink", label: "Polar", placeholder: "https://polar.sh/checkout/..." },
	{ key: "lemonSqueezyLink", label: "Lemon Squeezy", placeholder: "https://yourstore.lemonsqueezy.com/checkout/..." },
	{ key: "dodoLink", label: "Dodo Payments", placeholder: "https://dodopayments.com/pay/..." },
	{ key: "paypalLink", label: "PayPal", placeholder: "https://paypal.me/you or PayPal invoice link" },
	{ key: "razorpayLink", label: "Razorpay", placeholder: "https://rzp.io/i/..." },
	{ key: "paddleLink", label: "Paddle", placeholder: "https://buy.paddle.com/..." },
];

const generateProposalPDF = ({
	project,
	proposal,
	projectReqs,
	projectTech,
	projectBrief,
	categoryConfig,
	totalCost,
	totalHours,
	paymentDetails,
	signature,
	shareUrl,
	currency = "USD",
}) => {
	const doc = new jsPDF();
	const margin = 20;
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const contentWidth = pageWidth - margin * 2;
	let y = margin;

	const checkPage = (needed = 15) => {
		if (y + needed > pageHeight - 20) {
			doc.addPage();
			y = margin;
		}
	};

	const addLines = (text, size = 10, style = "normal") => {
		doc.setFontSize(size);
		doc.setFont("helvetica", style);
		doc.setTextColor(24, 24, 27);
		const lines = doc.splitTextToSize(String(text), contentWidth);
		checkPage(lines.length * size * 0.42 + 4);
		doc.text(lines, margin, y);
		y += lines.length * size * 0.42 + 4;
	};

	doc.setFontSize(20);
	doc.setFont("helvetica", "bold");
	doc.text("PROJECT PROPOSAL", margin, y);
	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.text(`ID: ${proposal?.shareId || project.shareId}`, pageWidth - margin, y - 4, { align: "right" });
	doc.text(todayLabel(), pageWidth - margin, y + 2, { align: "right" });
	y += 14;

	addLines(project.name, 15, "bold");
	if (proposal?.title) addLines(proposal.title, 11, "bold");
	if (categoryConfig?.label) addLines(`Category: ${categoryConfig.label}`, 10);
	addLines(`Prepared for: ${project.client}`, 11);
	addLines(`Contact: ${project.contact}${project.email ? ` · ${project.email}` : ""}`, 10);
	const fromLabel =
		paymentDetails.senderType === "individual"
			? paymentDetails.senderName || paymentDetails.businessName
			: paymentDetails.businessName;
	if (fromLabel) addLines(`From: ${fromLabel}`, 10);
	if (paymentDetails.businessEmail) addLines(`Email: ${paymentDetails.businessEmail}`, 10);
	if (paymentDetails.phone) addLines(`Phone: ${paymentDetails.phone}`, 10);
	if (paymentDetails.address) addLines(`Address: ${paymentDetails.address}`, 10);

	y += 2;
	addLines(`Investment: ${formatCurrency(totalCost, currency)}   |   Timeline: ${proposal?.weeks ?? project.weeks} weeks   |   ${totalHours} hours`, 10, "bold");

	if (projectBrief?.goals || projectBrief?.targetAudience) {
		y += 4;
		addLines("PROJECT BRIEF", 12, "bold");
		if (projectBrief.goals) addLines(`Goals: ${projectBrief.goals}`, 10);
		if (projectBrief.targetAudience) addLines(`Audience: ${projectBrief.targetAudience}`, 10);
		if (projectBrief.deliverablesSummary) addLines(`Deliverables: ${projectBrief.deliverablesSummary}`, 10);
		if (projectBrief.revisionRounds) addLines(`Revision rounds included: ${projectBrief.revisionRounds}`, 10);
	}

	y += 4;
	addLines("SCOPE OF WORK", 12, "bold");
	projectReqs
		.filter((r) => r.status === "confirmed" && r.category !== "out")
		.forEach((r) => addLines(`• ${r.title}`, 10));
	const optional = projectReqs.filter((r) => r.category === "nice" && r.status === "proposed");
	if (optional.length) {
		y += 2;
		addLines("Optional add-ons:", 10, "bold");
		optional.forEach((r) => addLines(`• ${r.title}${r.hours ? ` (+${r.hours}h)` : ""}`, 10));
	}

	y += 4;
	addLines((categoryConfig?.deliverablesLabel || "DELIVERABLES").toUpperCase(), 12, "bold");
	projectTech
		.filter((t) => t.status === "locked")
		.forEach((t) => addLines(`• ${t.name} — ${t.role}`, 10));

	const projectLines = proposal?.lineItems || [];
	y += 4;
	addLines("COST BREAKDOWN", 12, "bold");
	projectLines.forEach((line) => {
		const lineText = line.description
			? `${line.label} — ${line.description}: ${line.hours}h × ${formatCurrency(line.rate, currency)}/hr = ${formatCurrency(line.hours * line.rate, currency)}`
			: `${line.label}: ${line.hours}h × ${formatCurrency(line.rate, currency)}/hr = ${formatCurrency(line.hours * line.rate, currency)}`;
		addLines(lineText, 10);
	});
	addLines(`TOTAL: ${formatCurrency(totalCost, currency)}`, 12, "bold");

	y += 6;
	addLines("PAYMENT OPTIONS", 12, "bold");
	const hasBank = paymentDetails.bankName || paymentDetails.accountNumber || paymentDetails.accountName;
	if (hasBank) {
		addLines("Bank Transfer", 10, "bold");
		if (paymentDetails.bankName) addLines(`Bank: ${paymentDetails.bankName}`, 10);
		if (paymentDetails.accountName) addLines(`Account Name: ${paymentDetails.accountName}`, 10);
		if (paymentDetails.accountNumber) addLines(`Account Number: ${paymentDetails.accountNumber}`, 10);
		if (paymentDetails.ifscSwift) addLines(`IFSC / SWIFT / Routing: ${paymentDetails.ifscSwift}`, 10);
	}
	if (paymentDetails.upiId) addLines(`UPI ID: ${paymentDetails.upiId}`, 10);

	PAYMENT_LINK_FIELDS.forEach(({ key, label }) => {
		if (paymentDetails[key]) addLines(`${label}: ${paymentDetails[key]}`, 10);
	});
	(paymentDetails.otherPayments || [])
		.filter((p) => p.label && p.link)
		.forEach((p) => addLines(`${p.label}: ${p.link}`, 10));

	if (shareUrl) {
		y += 4;
		addLines("ONLINE PROPOSAL (shareable link)", 12, "bold");
		addLines(shareUrl, 9);
	}

	checkPage(55);
	y += 8;
	addLines("CLIENT APPROVAL", 12, "bold");
	if (signature?.dataUrl) {
		if (signature.signerName) addLines(`Signed by: ${signature.signerName}`, 10);
		if (signature.signedAt) addLines(`Date: ${signature.signedAt}`, 10);
		doc.addImage(signature.dataUrl, "PNG", margin, y, 75, 30);
		y += 34;
		addLines(
			"By signing above, the client agrees to the scope, timeline, deliverables, and pricing in this proposal.",
			8,
			"italic",
		);
	} else {
		addLines("Signature: _________________________________________________", 10);
		addLines("Full Name: _________________________________________________", 10);
		addLines("Date: _________________________________________________", 10);
	}

	doc.setFontSize(8);
	doc.setTextColor(161, 161, 170);
	doc.text(
		"Generated by Proposely · This document serves as a project scope and approval agreement.",
		pageWidth / 2,
		pageHeight - 10,
		{ align: "center" },
	);

	doc.save(`proposal-${proposal?.shareId || project.shareId}.pdf`);
};

const generateInvoicePDF = ({
	project,
	proposal,
	lineItems,
	paymentDetails,
	currency = "USD",
	invoiceMeta,
	subtotal,
	taxAmount,
	total,
}) => {
	const doc = new jsPDF();
	const margin = 20;
	const pageWidth = doc.internal.pageSize.getWidth();
	const contentWidth = pageWidth - margin * 2;
	let y = margin;

	const addLines = (text, size = 10, style = "normal") => {
		doc.setFontSize(size);
		doc.setFont("helvetica", style);
		doc.setTextColor(24, 24, 27);
		const lines = doc.splitTextToSize(String(text), contentWidth);
		doc.text(lines, margin, y);
		y += lines.length * size * 0.42 + 4;
	};

	doc.setFontSize(22);
	doc.setFont("helvetica", "bold");
	doc.text("INVOICE", margin, y);
	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.text(`#${invoiceMeta.invoiceNumber}`, pageWidth - margin, y - 2, { align: "right" });
	doc.text(invoiceMeta.issueDate || todayLabel(), pageWidth - margin, y + 4, { align: "right" });
	y += 16;

	const fromLabel =
		paymentDetails.senderType === "individual"
			? paymentDetails.senderName || paymentDetails.businessName
			: paymentDetails.businessName;

	addLines("BILL FROM", 9, "bold");
	if (fromLabel) addLines(fromLabel, 11, "bold");
	if (paymentDetails.businessEmail) addLines(paymentDetails.businessEmail, 10);
	if (paymentDetails.phone) addLines(paymentDetails.phone, 10);
	if (paymentDetails.address) addLines(paymentDetails.address, 10);
	if (paymentDetails.taxId) addLines(`Tax ID: ${paymentDetails.taxId}`, 9);

	y += 4;
	addLines("BILL TO", 9, "bold");
	addLines(project.client, 11, "bold");
	addLines(project.contact, 10);
	if (project.email) addLines(project.email, 10);

	y += 6;
	if (invoiceMeta.dueDate) addLines(`Due date: ${invoiceMeta.dueDate}`, 10, "bold");
	if (proposal?.title) addLines(`Re: ${proposal.title}`, 10);

	y += 4;
	doc.setFillColor(244, 244, 245);
	doc.rect(margin, y, contentWidth, 8, "F");
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.text("Description", margin + 2, y + 5.5);
	doc.text("Qty", margin + contentWidth * 0.55, y + 5.5);
	doc.text("Rate", margin + contentWidth * 0.7, y + 5.5);
	doc.text("Amount", pageWidth - margin - 2, y + 5.5, { align: "right" });
	y += 12;

	doc.setFont("helvetica", "normal");
	lineItems.forEach((line) => {
		const amount = line.hours * line.rate;
		const desc = line.description ? `${line.label} — ${line.description}` : line.label;
		const descLines = doc.splitTextToSize(desc, contentWidth * 0.5);
		doc.text(descLines, margin + 2, y);
		doc.text(String(line.hours), margin + contentWidth * 0.55, y);
		doc.text(formatCurrency(line.rate, currency), margin + contentWidth * 0.7, y);
		doc.text(formatCurrency(amount, currency), pageWidth - margin - 2, y, { align: "right" });
		y += Math.max(descLines.length * 4.5, 8);
	});

	y += 6;
	doc.text(`Subtotal: ${formatCurrency(subtotal, currency)}`, pageWidth - margin, y, { align: "right" });
	y += 6;
	if (invoiceMeta.taxRate > 0) {
		doc.text(`Tax (${invoiceMeta.taxRate}%): ${formatCurrency(taxAmount, currency)}`, pageWidth - margin, y, {
			align: "right",
		});
		y += 6;
	}
	doc.setFont("helvetica", "bold");
	doc.text(`Total due: ${formatCurrency(total, currency)}`, pageWidth - margin, y, { align: "right" });
	y += 12;

	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	if (invoiceMeta.notes) addLines(invoiceMeta.notes, 9);

	if (paymentDetails.bankName || paymentDetails.stripeLink || paymentDetails.upiId) {
		y += 4;
		addLines("PAYMENT DETAILS", 10, "bold");
		if (paymentDetails.bankName) addLines(`Bank: ${paymentDetails.bankName}`, 9);
		if (paymentDetails.accountNumber) addLines(`Account: ${paymentDetails.accountNumber}`, 9);
		if (paymentDetails.upiId) addLines(`UPI: ${paymentDetails.upiId}`, 9);
		if (paymentDetails.stripeLink) addLines(`Pay online: ${paymentDetails.stripeLink}`, 9);
	}

	doc.save(`invoice-${invoiceMeta.invoiceNumber}.pdf`);
};

function EditorSection({ title, children, defaultOpen = true, badge }) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-left"
			>
				<div className="flex items-center gap-2">
					<h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
					{badge}
				</div>
				{open ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
			</button>
			{open && <div className="p-5">{children}</div>}
		</div>
	);
}

function SignaturePad({ onSignatureChange }) {
	const canvasRef = useRef(null);
	const isDrawing = useRef(false);
	const lastPoint = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		ctx.strokeStyle = "#18181b";
		ctx.lineWidth = 2;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
	}, []);

	const getPos = (e) => {
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		return {
			x: ((clientX - rect.left) / rect.width) * canvas.width,
			y: ((clientY - rect.top) / rect.height) * canvas.height,
		};
	};

	const startDraw = (e) => {
		e.preventDefault();
		isDrawing.current = true;
		lastPoint.current = getPos(e);
	};

	const draw = (e) => {
		if (!isDrawing.current) return;
		e.preventDefault();
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		const pos = getPos(e);
		ctx.beginPath();
		ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		lastPoint.current = pos;
		onSignatureChange(canvas.toDataURL("image/png"));
	};

	const endDraw = () => {
		isDrawing.current = false;
	};

	const clear = () => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		onSignatureChange(null);
	};

	return (
		<div className="space-y-2">
			<canvas
				ref={canvasRef}
				width={480}
				height={140}
				className="w-full h-36 border border-zinc-200 rounded-xl bg-white touch-none cursor-crosshair"
				onMouseDown={startDraw}
				onMouseMove={draw}
				onMouseUp={endDraw}
				onMouseLeave={endDraw}
				onTouchStart={startDraw}
				onTouchMove={draw}
				onTouchEnd={endDraw}
			/>
			<button
				type="button"
				onClick={clear}
				className="text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
			>
				Clear signature
			</button>
		</div>
	);
}

function PaymentMethodsSummary({ paymentDetails, compact = false }) {
	const hasBank = paymentDetails.bankName || paymentDetails.accountNumber;
	const activeLinks = PAYMENT_LINK_FIELDS.filter((f) => paymentDetails[f.key]);
	const others = (paymentDetails.otherPayments || []).filter((p) => p.label && p.link);

	if (!hasBank && !paymentDetails.upiId && !activeLinks.length && !others.length) {
		return (
			<p className={`text-zinc-400 ${compact ? "text-xs" : "text-sm"}`}>
				No payment methods configured yet.
			</p>
		);
	}

	return (
		<div className={`space-y-3 ${compact ? "text-xs" : "text-sm"}`}>
			{hasBank && (
				<div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
					<p className="font-medium text-zinc-900 flex items-center gap-1.5 mb-1.5">
						<Landmark className="w-3.5 h-3.5" />
						Bank Transfer
					</p>
					{paymentDetails.bankName && <p className="text-zinc-600">Bank: {paymentDetails.bankName}</p>}
					{paymentDetails.accountName && <p className="text-zinc-600">Name: {paymentDetails.accountName}</p>}
					{paymentDetails.accountNumber && <p className="text-zinc-600">Account: {paymentDetails.accountNumber}</p>}
					{paymentDetails.ifscSwift && <p className="text-zinc-600">IFSC / SWIFT: {paymentDetails.ifscSwift}</p>}
				</div>
			)}
			{paymentDetails.upiId && (
				<div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
					<p className="font-medium text-zinc-900 flex items-center gap-1.5">
						<Wallet className="w-3.5 h-3.5" />
						UPI: {paymentDetails.upiId}
					</p>
				</div>
			)}
			{activeLinks.map(({ key, label }) => (
				<div key={key} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between gap-2">
					<p className="font-medium text-zinc-900 flex items-center gap-1.5 shrink-0">
						<CreditCard className="w-3.5 h-3.5" />
						{label}
					</p>
					<a
						href={paymentDetails[key]}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:underline truncate"
					>
						{paymentDetails[key]}
					</a>
				</div>
			))}
			{others.map((p) => (
				<div key={p.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between gap-2">
					<p className="font-medium text-zinc-900 shrink-0">{p.label}</p>
					<a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
						{p.link}
					</a>
				</div>
			))}
		</div>
	);
}

function CurrencyDropdown({ value, onChange, className = "" }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const selected = getCurrencyMeta(value);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		if (open) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	return (
		<div ref={ref} className={`relative ${className}`}>
			<motion.button
				type="button"
				whileTap={{ scale: 0.98 }}
				onClick={() => setOpen((o) => !o)}
				className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 transition-colors"
			>
				<span className="text-base leading-none">{selected.flag}</span>
				<span className="font-semibold text-zinc-900">{selected.symbol}</span>
				<span className="text-zinc-500 text-xs hidden sm:inline">{selected.label}</span>
				<motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
					<ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
				</motion.span>
			</motion.button>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -6, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -6, scale: 0.97 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
						className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden py-1"
					>
						{CURRENCIES.map((c) => (
							<button
								key={c.code}
								type="button"
								onClick={() => {
									onChange(c.code);
									setOpen(false);
								}}
								className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors ${
									value === c.code ? "bg-zinc-50" : ""
								}`}
							>
								<span className="text-xl leading-none">{c.flag}</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-zinc-900">{c.label}</p>
									<p className="text-xs text-zinc-400">
										{c.symbol} · {c.code}
									</p>
								</div>
								{value === c.code && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

const PreviewPage = () => {
	const [projects, setProjects] = useState(INITIAL_PROJECTS);
	const [activeProjectId, setActiveProjectId] = useState("p1");
	const [activeProposalId, setActiveProposalId] = useState("prop-p1-1");
	const [activeTab, setActiveTab] = useState("editor");
	const [advancedSubTab, setAdvancedSubTab] = useState("overview");
	const [showAiPanel, setShowAiPanel] = useState(true);
	const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);
	const [techStack, setTechStack] = useState(INITIAL_TECH_STACK);
	const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
	const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
	const [projectBriefs, setProjectBriefs] = useState(INITIAL_PROJECT_BRIEFS);
	const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
	const [projectMedia, setProjectMedia] = useState(INITIAL_PROJECT_MEDIA);
	const [mediaSearch, setMediaSearch] = useState("");
	const [mediaForm, setMediaForm] = useState({ title: "", linkUrl: "" });
	const [mediaUploading, setMediaUploading] = useState(false);
	const [mediaError, setMediaError] = useState("");
	const mediaFileInputRef = useRef(null);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showNewProposalModal, setShowNewProposalModal] = useState(false);
	const [newProposalTitle, setNewProposalTitle] = useState("");
	const [showClientPreview, setShowClientPreview] = useState(false);
	const [showNewProjectModal, setShowNewProjectModal] = useState(false);
	const [showLogMeetingModal, setShowLogMeetingModal] = useState(false);
	const [copied, setCopied] = useState(false);
	const [newReqTitle, setNewReqTitle] = useState("");
	const [newReqCategory, setNewReqCategory] = useState("must");
	const [newProjectForm, setNewProjectForm] = useState(EMPTY_PROJECT_FORM);
	const [meetingForm, setMeetingForm] = useState({ title: "", summary: "", date: todayLabel() });
	const [newTechForm, setNewTechForm] = useState({ name: "", role: "", note: "" });
	const [newLineForm, setNewLineForm] = useState({ label: "", description: "", hours: 8, rate: 95 });
	const [newMilestoneForm, setNewMilestoneForm] = useState({ title: "", due: "" });
	const [paymentDetails, setPaymentDetails] = useState(DEFAULT_PAYMENT_DETAILS);
	const [invoiceMeta, setInvoiceMeta] = useState(() => ({
		...DEFAULT_INVOICE_META,
		issueDate: todayLabel(),
	}));
	const [clientSignatures, setClientSignatures] = useState({});
	const [pendingSignature, setPendingSignature] = useState(null);
	const [signerName, setSignerName] = useState("");
	const [approvalError, setApprovalError] = useState("");
	const [aiInput, setAiInput] = useState("");
	const [aiChat, setAiChat] = useState([]);
	const [aiPendingImages, setAiPendingImages] = useState([]);
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState("");
	const aiChatEndRef = useRef(null);

	const project = projects.find((p) => p.id === activeProjectId);
	const projectProposals = proposals[activeProjectId] || [];
	const activeProposal =
		projectProposals.find((p) => p.id === activeProposalId) ||
		projectProposals[projectProposals.length - 1];
	const projectReqs = requirements[activeProjectId] || [];
	const projectTech = techStack[activeProjectId] || [];
	const projectConvos = conversations[activeProjectId] || [];
	const projectLines = activeProposal?.lineItems || [];
	const projectBrief = projectBriefs[activeProjectId] || EMPTY_BRIEF;
	const projectMilestones = milestones[activeProjectId] || [];
	const projectMediaItems = projectMedia[activeProjectId] || [];
	const filteredMedia = projectMediaItems.filter((item) => {
		if (!mediaSearch.trim()) return true;
		const q = mediaSearch.toLowerCase();
		return (
			item.title?.toLowerCase().includes(q) ||
			item.url?.toLowerCase().includes(q) ||
			item.fileName?.toLowerCase().includes(q) ||
			MEDIA_TYPE_CONFIG[item.type]?.label.toLowerCase().includes(q)
		);
	});
	const categoryConfig = getCategoryConfig(project?.category || "other");
	const proposalSignature = activeProposal ? clientSignatures[activeProposal.id] : null;
	const projectCurrency = project?.currency || "USD";
	const fmt = (n) => formatCurrency(n, projectCurrency);

	const totalHours = projectLines.reduce((sum, l) => sum + l.hours, 0);
	const totalCost = projectLines.reduce((sum, l) => sum + l.hours * l.rate, 0);
	const confirmedCount = projectReqs.filter((r) => r.status === "confirmed").length;
	const pendingCount = projectReqs.filter((r) => r.status === "proposed").length;
	const lockedTech = projectTech.filter((t) => t.status === "locked").length;
	const shareUrl = activeProposal ? `https://scope.app/d/${activeProposal.shareId}` : "";

	const selectProject = (projectId) => {
		setActiveProjectId(projectId);
		setActiveTab("editor");
		setMediaSearch("");
		const list = proposals[projectId] || [];
		if (list.length) setActiveProposalId(list[list.length - 1].id);
	};

	const updateActiveProposal = (updater) => {
		if (!activeProposal) return;
		setProposals((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((p) =>
				p.id === activeProposal.id ? updater(p) : p,
			),
		}));
	};

	const updateProposalStatus = (proposalId, status) => {
		setProposals((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((p) =>
				p.id === proposalId ? { ...p, status } : p,
			),
		}));
	};

	const handleAddRequirement = (e) => {
		e.preventDefault();
		if (!newReqTitle.trim()) return;
		const newReq = {
			id: `r-${Date.now()}`,
			title: newReqTitle.trim(),
			category: newReqCategory,
			status: "proposed",
			source: "Added manually — today",
			hours: 0,
		};
		setRequirements((prev) => ({
			...prev,
			[activeProjectId]: [...(prev[activeProjectId] || []), newReq],
		}));
		setNewReqTitle("");
	};

	const handleCopyLink = () => {
		navigator.clipboard?.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};


	const handleCreateProposal = (e, duplicateFromCurrent = false) => {
		e?.preventDefault?.();
		if (!project) return;

		const list = proposals[activeProjectId] || [];
		const version = list.length + 1;
		const base = duplicateFromCurrent && activeProposal ? activeProposal : null;
		const title =
			newProposalTitle.trim() ||
			(base ? `Revision v${version}` : `Proposal v${version}`);

		const newProposal = {
			id: `prop-${Date.now()}`,
			title,
			version,
			status: "draft",
			shareId: slugify(`${project.name}-v${version}`),
			weeks: base?.weeks ?? project.weeks ?? 4,
			createdAt: todayLabel(),
			lineItems: base
				? base.lineItems.map((l) => ({ ...l, id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))
				: [{ id: `l-${Date.now()}`, label: "Discovery & setup", hours: 8, rate: project.hourlyRate || 95 }],
		};

		setProposals((prev) => ({
			...prev,
			[activeProjectId]: [...(prev[activeProjectId] || []), newProposal],
		}));
		setActiveProposalId(newProposal.id);
		setNewProposalTitle("");
		setShowNewProposalModal(false);
		setActiveTab("editor");
	};

	const handleDeleteProposal = (proposalId) => {
		const list = proposals[activeProjectId] || [];
		if (list.length <= 1) return;
		setProposals((prev) => ({
			...prev,
			[activeProjectId]: list.filter((p) => p.id !== proposalId),
		}));
		if (activeProposalId === proposalId) {
			const remaining = list.filter((p) => p.id !== proposalId);
			setActiveProposalId(remaining[remaining.length - 1].id);
		}
	};

	const handleCreateProject = (e) => {
		e.preventDefault();
		if (!newProjectForm.name.trim() || !newProjectForm.client.trim()) return;

		const id = `p-${Date.now()}`;
		const rate = Number(newProjectForm.hourlyRate) || 95;
		const weeks = Number(newProjectForm.weeks) || 4;
		const category = newProjectForm.category || "web-dev";
		const pricingModel = newProjectForm.pricingModel || "hourly";
		const catConfig = getCategoryConfig(category);
		const newProject = {
			id,
			name: newProjectForm.name.trim(),
			client: newProjectForm.client.trim(),
			contact: newProjectForm.contact.trim() || newProjectForm.client.trim(),
			email: newProjectForm.email.trim(),
			status: "draft",
			budget: 0,
			weeks,
			hourlyRate: rate,
			shareId: slugify(newProjectForm.name.trim()),
			category,
			pricingModel,
			currency: newProjectForm.currency || "USD",
		};

		setProjects((prev) => [...prev, newProject]);
		setRequirements((prev) => ({ ...prev, [id]: [] }));
		setTechStack((prev) => ({
			...prev,
			[id]: buildDefaultDeliverables(category, id),
		}));
		setProjectBriefs((prev) => ({
			...prev,
			[id]: {
				...EMPTY_BRIEF,
				customFields: Object.fromEntries(
					(catConfig?.briefFields || []).map((f) => [f.key, ""]),
				),
			},
		}));
		setMilestones((prev) => ({ ...prev, [id]: [] }));
		setProjectMedia((prev) => ({ ...prev, [id]: [] }));
		setConversations((prev) => ({ ...prev, [id]: [] }));
		const firstProposal = {
			id: `prop-${id}-1`,
			title: "Proposal v1",
			version: 1,
			status: "draft",
			shareId: slugify(`${newProjectForm.name.trim()}-v1`),
			weeks,
			createdAt: todayLabel(),
			lineItems: [
				{
					id: `l-${id}-0`,
					label: catConfig?.defaultLineItem?.label || "Discovery & setup",
					hours: catConfig?.defaultLineItem?.hours || 8,
					rate,
				},
			],
		};
		setProposals((prev) => ({ ...prev, [id]: [firstProposal] }));

		setActiveProjectId(id);
		setActiveProposalId(firstProposal.id);
		setActiveTab("editor");
		setShowNewProjectModal(false);
		setNewProjectForm(EMPTY_PROJECT_FORM);
	};

	const handleLogMeeting = (e) => {
		e.preventDefault();
		if (!meetingForm.title.trim() || !meetingForm.summary.trim()) return;

		const entry = {
			id: `c-${Date.now()}`,
			date: meetingForm.date || todayLabel(),
			title: meetingForm.title.trim(),
			summary: meetingForm.summary.trim(),
			requirementsAdded: 0,
		};

		setConversations((prev) => ({
			...prev,
			[activeProjectId]: [entry, ...(prev[activeProjectId] || [])],
		}));
		setShowLogMeetingModal(false);
		setMeetingForm({ title: "", summary: "", date: todayLabel() });
	};

	const handleAddTech = (e) => {
		e.preventDefault();
		if (!newTechForm.name.trim()) return;

		const item = {
			id: `t-${Date.now()}`,
			name: newTechForm.name.trim(),
			role: newTechForm.role.trim() || "Other",
			status: "discussing",
			note: newTechForm.note.trim() || "Added — awaiting client decision",
		};

		setTechStack((prev) => ({
			...prev,
			[activeProjectId]: [...(prev[activeProjectId] || []), item],
		}));
		setNewTechForm({ name: "", role: "", note: "" });
	};

	const handleToggleTechLock = (techId) => {
		setTechStack((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((t) =>
				t.id === techId ? { ...t, status: t.status === "locked" ? "discussing" : "locked" } : t,
			),
		}));
	};

	const handleAddLineItem = (e) => {
		e.preventDefault();
		if (!newLineForm.label.trim() || !activeProposal) return;

		const item = {
			id: `l-${Date.now()}`,
			label: newLineForm.label.trim(),
			description: newLineForm.description.trim(),
			hours: Number(newLineForm.hours) || 0,
			rate: Number(newLineForm.rate) || project?.hourlyRate || 95,
		};

		updateActiveProposal((p) => ({
			...p,
			lineItems: [...p.lineItems, item],
		}));
		setNewLineForm({ label: "", description: "", hours: 8, rate: project?.hourlyRate || 95 });
	};

	const handleUpdateLineItem = (lineId, field, value) => {
		updateActiveProposal((p) => ({
			...p,
			lineItems: p.lineItems.map((l) => {
				if (l.id !== lineId) return l;
				if (field === "hours" || field === "rate") {
					return { ...l, [field]: Number(value) || 0 };
				}
				return { ...l, [field]: value };
			}),
		}));
	};

	const handleDeleteLineItem = (lineId) => {
		updateActiveProposal((p) => ({
			...p,
			lineItems: p.lineItems.filter((l) => l.id !== lineId),
		}));
	};

	const handleProjectCurrencyChange = (currency) => {
		setProjects((prev) =>
			prev.map((p) => (p.id === activeProjectId ? { ...p, currency } : p)),
		);
	};

	const handleToggleReqStatus = (reqId) => {
		const cycle = { proposed: "confirmed", confirmed: "proposed", declined: "proposed" };
		setRequirements((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((r) =>
				r.id === reqId ? { ...r, status: cycle[r.status] || "proposed" } : r,
			),
		}));
	};

	const handleSendToClient = () => {
		if (activeProposal) updateProposalStatus(activeProposal.id, "sent");
		setShowShareModal(false);
	};

	const buildPdfPayload = (signatureOverride) => ({
		project,
		proposal: activeProposal,
		projectReqs,
		projectTech,
		projectBrief,
		categoryConfig,
		totalCost,
		totalHours,
		paymentDetails,
		signature: signatureOverride || proposalSignature,
		shareUrl,
		currency: projectCurrency,
	});

	const updateBriefField = (key, value) => {
		setProjectBriefs((prev) => ({
			...prev,
			[activeProjectId]: { ...(prev[activeProjectId] || EMPTY_BRIEF), [key]: value },
		}));
	};

	const updateBriefCustomField = (key, value) => {
		setProjectBriefs((prev) => ({
			...prev,
			[activeProjectId]: {
				...(prev[activeProjectId] || EMPTY_BRIEF),
				customFields: { ...(prev[activeProjectId]?.customFields || {}), [key]: value },
			},
		}));
	};

	const updateProjectField = (field, value) => {
		setProjects((prev) => prev.map((p) => (p.id === activeProjectId ? { ...p, [field]: value } : p)));
	};

	const handleUpdateRequirement = (reqId, field, value) => {
		setRequirements((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((r) =>
				r.id === reqId ? { ...r, [field]: value } : r,
			),
		}));
	};

	const handleDeleteRequirement = (reqId) => {
		setRequirements((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).filter((r) => r.id !== reqId),
		}));
	};

	const handleUpdateDeliverable = (techId, field, value) => {
		setTechStack((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((t) =>
				t.id === techId ? { ...t, [field]: value } : t,
			),
		}));
	};

	const handleDeleteDeliverable = (techId) => {
		setTechStack((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).filter((t) => t.id !== techId),
		}));
	};

	const invoiceSubtotal = projectLines.reduce((sum, l) => sum + l.hours * l.rate, 0);
	const invoiceTaxAmount = invoiceSubtotal * ((Number(invoiceMeta.taxRate) || 0) / 100);
	const invoiceTotal = invoiceSubtotal + invoiceTaxAmount;

	const handleDownloadInvoice = () => {
		if (!project) return;
		generateInvoicePDF({
			project,
			proposal: activeProposal,
			lineItems: projectLines,
			paymentDetails,
			currency: projectCurrency,
			invoiceMeta,
			subtotal: invoiceSubtotal,
			taxAmount: invoiceTaxAmount,
			total: invoiceTotal,
		});
	};

	const openMoreTab = (subTab) => {
		setActiveTab("more");
		setAdvancedSubTab(subTab);
	};

	const updateProjectCategory = (categoryId) => {
		setProjects((prev) =>
			prev.map((p) => (p.id === activeProjectId ? { ...p, category: categoryId } : p)),
		);
		const cat = getCategoryConfig(categoryId);
		setProjectBriefs((prev) => ({
			...prev,
			[activeProjectId]: {
				...(prev[activeProjectId] || EMPTY_BRIEF),
				customFields: Object.fromEntries((cat?.briefFields || []).map((f) => [f.key, ""])),
			},
		}));
	};

	const updateProjectPricingModel = (pricingModel) => {
		setProjects((prev) =>
			prev.map((p) => (p.id === activeProjectId ? { ...p, pricingModel } : p)),
		);
	};

	const handleAddMilestone = (e) => {
		e.preventDefault();
		if (!newMilestoneForm.title.trim()) return;
		const item = {
			id: `m-${Date.now()}`,
			title: newMilestoneForm.title.trim(),
			due: newMilestoneForm.due.trim() || "TBD",
			status: "pending",
		};
		setMilestones((prev) => ({
			...prev,
			[activeProjectId]: [...(prev[activeProjectId] || []), item],
		}));
		setNewMilestoneForm({ title: "", due: "" });
	};

	const handleToggleMilestone = (milestoneId) => {
		setMilestones((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).map((m) =>
				m.id === milestoneId
					? { ...m, status: m.status === "done" ? "pending" : "done" }
					: m,
			),
		}));
	};

	const handleDeleteMilestone = (milestoneId) => {
		setMilestones((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).filter((m) => m.id !== milestoneId),
		}));
	};

	const handleMediaFileUpload = async (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;

		setMediaUploading(true);
		setMediaError("");

		try {
			const uploaded = [];
			for (const file of files) {
				const result = await uploadFileToUploadThing(file);
				uploaded.push({
					id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
					type: inferMediaTypeFromFile(file),
					title: mediaForm.title.trim() || file.name,
					url: result.url,
					fileKey: result.key,
					fileName: result.name,
					mimeType: result.mimeType,
					size: result.size,
					createdAt: todayLabel(),
				});
			}

			setProjectMedia((prev) => ({
				...prev,
				[activeProjectId]: [...uploaded, ...(prev[activeProjectId] || [])],
			}));
			setMediaForm((f) => ({ ...f, title: "" }));
		} catch (err) {
			setMediaError(err.message || "Upload failed.");
		} finally {
			setMediaUploading(false);
			if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
		}
	};

	const handleAddMediaLink = (e) => {
		e.preventDefault();
		if (!mediaForm.linkUrl.trim()) return;

		let url = mediaForm.linkUrl.trim();
		if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

		const item = {
			id: `med-${Date.now()}`,
			type: "link",
			title: mediaForm.title.trim() || url,
			url,
			createdAt: todayLabel(),
		};

		setProjectMedia((prev) => ({
			...prev,
			[activeProjectId]: [item, ...(prev[activeProjectId] || [])],
		}));
		setMediaForm({ title: "", linkUrl: "" });
		setMediaError("");
	};

	const handleDeleteMedia = async (item) => {
		if (item.fileKey) {
			try {
				await deleteUploadThingFile(item.fileKey);
			} catch {
				// still remove from UI if remote delete fails
			}
		}
		setProjectMedia((prev) => ({
			...prev,
			[activeProjectId]: (prev[activeProjectId] || []).filter((m) => m.id !== item.id),
		}));
	};

	const applyAiToProject = (data) => {
		const pid = activeProjectId;
		const ts = Date.now();
		const rate = Number(data.project?.hourlyRate) || project?.hourlyRate || 95;

		if (data.project) {
			setProjects((prev) =>
				prev.map((p) =>
					p.id === pid
						? {
								...p,
								name: data.project.name || p.name,
								client: data.project.client || p.client,
								contact: data.project.contact || p.contact,
								email: data.project.email ?? p.email,
								category: data.project.category || p.category,
								pricingModel: data.project.pricingModel || p.pricingModel,
								weeks: Number(data.project.weeks) || p.weeks,
								hourlyRate: rate,
							}
						: p,
				),
			);
		}

		if (data.brief) {
			setProjectBriefs((prev) => ({
				...prev,
				[pid]: {
					...EMPTY_BRIEF,
					...(prev[pid] || {}),
					...data.brief,
					revisionRounds: Number(data.brief.revisionRounds) || 2,
					customFields: { ...(prev[pid]?.customFields || {}), ...(data.brief.customFields || {}) },
				},
			}));
		}

		if (Array.isArray(data.requirements) && data.requirements.length) {
			setRequirements((prev) => ({
				...prev,
				[pid]: data.requirements.map((r, i) => ({
					id: `r-ai-${ts}-${i}`,
					title: r.title,
					category: r.category || "must",
					status: r.status || "proposed",
					source: "AI generated",
					hours: Number(r.hours) || 0,
				})),
			}));
		}

		if (Array.isArray(data.deliverables) && data.deliverables.length) {
			setTechStack((prev) => ({
				...prev,
				[pid]: data.deliverables.map((d, i) => ({
					id: `t-ai-${ts}-${i}`,
					name: d.name,
					role: d.role || "Deliverable",
					status: d.status || "discussing",
					note: d.note || "",
				})),
			}));
		}

		if (Array.isArray(data.milestones) && data.milestones.length) {
			setMilestones((prev) => ({
				...prev,
				[pid]: data.milestones.map((m, i) => ({
					id: `m-ai-${ts}-${i}`,
					title: m.title,
					due: m.due || "TBD",
					status: "pending",
				})),
			}));
		}

		if (data.proposal) {
			const lineItems = (data.proposal.lineItems || []).map((l, i) => ({
				id: `l-ai-${ts}-${i}`,
				label: l.label,
				description: l.description || "",
				hours: Number(l.hours) || 0,
				rate: Number(l.rate) || rate,
			}));
			const proposalPatch = {
				title: data.proposal.title || "AI Proposal",
				weeks: Number(data.proposal.weeks) || project?.weeks || 4,
				lineItems,
			};

			if (activeProposal) {
				setProposals((prev) => ({
					...prev,
					[pid]: (prev[pid] || []).map((p) =>
						p.id === activeProposal.id ? { ...p, ...proposalPatch } : p,
					),
				}));
			} else {
				const newProp = {
					id: `prop-ai-${ts}`,
					version: 1,
					status: "draft",
					shareId: slugify(`${data.project?.name || project?.name || "project"}-ai`),
					createdAt: todayLabel(),
					...proposalPatch,
				};
				setProposals((prev) => ({
					...prev,
					[pid]: [...(prev[pid] || []), newProp],
				}));
				setActiveProposalId(newProp.id);
			}
		}

		if (data.conversationNote) {
			setConversations((prev) => ({
				...prev,
				[pid]: [
					{
						id: `c-ai-${ts}`,
						date: todayLabel(),
						title: "AI intake",
						summary: data.conversationNote,
						requirementsAdded: data.requirements?.length || 0,
					},
					...(prev[pid] || []),
				],
			}));
		}
	};

	const handleAiImageUpload = (e) => {
		const files = Array.from(e.target.files || []);
		files.forEach((file) => {
			if (!file.type.startsWith("image/")) return;
			const reader = new FileReader();
			reader.onload = () => {
				setAiPendingImages((prev) => [
					...prev,
					{ id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: file.name, dataUrl: reader.result },
				]);
			};
			reader.readAsDataURL(file);
		});
		e.target.value = "";
	};

	const handleAiGenerate = async (e) => {
		e?.preventDefault();
		const text = aiInput.trim();
		if (!text && aiPendingImages.length === 0) return;

		const contextSuffix = project
			? `\n\n[Refine the active project: "${project.name}" for ${project.client}. Category: ${project.category}. Keep client name unless user says otherwise.]`
			: "";

		const userMessage = {
			role: "user",
			content: text + contextSuffix,
			images: [...aiPendingImages],
		};

		const nextChat = [...aiChat, userMessage];
		setAiChat(nextChat);
		setAiInput("");
		setAiPendingImages([]);
		setAiLoading(true);
		setAiError("");

		try {
			const raw = await callOpenRouter(nextChat, AI_SYSTEM_PROMPT);
			const data = parseAiJson(raw);
			applyAiToProject(data);
			setAiChat((prev) => [
				...prev,
				{
					role: "assistant",
					content:
						data.assistantMessage ||
						"Done! Your proposal is filled in below — review and edit anything before sending.",
				},
			]);
			setActiveTab("editor");
			setShowAiPanel(false);
		} catch (err) {
			setAiError(err.message || "AI generation failed.");
		} finally {
			setAiLoading(false);
		}
	};

	useEffect(() => {
		aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [aiChat, aiLoading]);

	const handleDownloadPDF = (signatureOverride) => {
		if (!project) return;
		generateProposalPDF(buildPdfPayload(signatureOverride));
	};

	const handlePaymentField = (key, value) => {
		setPaymentDetails((prev) => ({ ...prev, [key]: value }));
	};

	const handleAddOtherPayment = () => {
		setPaymentDetails((prev) => ({
			...prev,
			otherPayments: [...(prev.otherPayments || []), { id: `op-${Date.now()}`, label: "", link: "" }],
		}));
	};

	const handleUpdateOtherPayment = (id, field, value) => {
		setPaymentDetails((prev) => ({
			...prev,
			otherPayments: prev.otherPayments.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
		}));
	};

	const handleRemoveOtherPayment = (id) => {
		setPaymentDetails((prev) => ({
			...prev,
			otherPayments: prev.otherPayments.filter((p) => p.id !== id),
		}));
	};

	const openClientPreview = () => {
		setPendingSignature(proposalSignature?.dataUrl || null);
		setSignerName(proposalSignature?.signerName || "");
		setApprovalError("");
		setShowClientPreview(true);
	};

	const handleClientApprove = () => {
		if (!activeProposal) return;
		if (!pendingSignature) {
			setApprovalError("Please sign in the box below to approve this proposal.");
			return;
		}
		if (!signerName.trim()) {
			setApprovalError("Please enter your full name.");
			return;
		}

		const signature = {
			dataUrl: pendingSignature,
			signerName: signerName.trim(),
			signedAt: todayLabel(),
		};

		setClientSignatures((prev) => ({ ...prev, [activeProposal.id]: signature }));
		updateProposalStatus(activeProposal.id, "approved");
		generateProposalPDF(buildPdfPayload(signature));
		setShowClientPreview(false);
		setApprovalError("");
	};

	const handleClientRevision = () => {
		if (activeProposal) updateProposalStatus(activeProposal.id, "revision");
		setShowClientPreview(false);
	};

	const StatusBadge = ({ status }) => {
		const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
		const Icon = cfg.icon;
		return (
			<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-zinc-700`}>
				<Icon className="w-3.5 h-3.5" />
				{cfg.label}
			</span>
		);
	};

	return (
		<>
			<Head>
				<title>Proposely — AI Proposal Generator</title>
				<meta name="description" content="Create client proposals in minutes with AI. Edit, share, and invoice on one page." />
			</Head>

			<div className="min-h-screen bg-zinc-50 text-zinc-900">
				{/* Top bar */}
				<header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
					<div className="flex items-center justify-between px-4 sm:px-6 h-14">
						<div className="flex items-center gap-3">
							<div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-200 text-zinc-800">
								<Sparkles className="w-4 h-4" />
							</div>
							<span className="font-semibold text-zinc-900 hidden sm:block">Proposely</span>
							<span className="text-zinc-300 hidden sm:block">/</span>
							<span className="text-sm text-zinc-600 truncate max-w-[180px] sm:max-w-none">{project?.name}</span>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={openClientPreview}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
							>
								<Eye className="w-4 h-4" />
								<span className="hidden sm:inline">Preview</span>
							</button>
							<button
								type="button"
								onClick={() => handleDownloadPDF()}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
							>
								<Download className="w-4 h-4" />
								<span className="hidden sm:inline">PDF</span>
							</button>
							<button
								type="button"
								onClick={() => setShowShareModal(true)}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
							>
								<Share2 className="w-4 h-4" />
								<span className="hidden sm:inline">Share</span>
							</button>
						</div>
					</div>
				</header>

				<div className="flex">
					{/* Project sidebar */}
					<aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 bg-white min-h-[calc(100vh-3.5rem)]">
						<div className="p-4 border-b border-zinc-100">
							<p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Your proposals</p>
							<div className="space-y-1">
								{projects.map((p) => (
									<button
										key={p.id}
										type="button"
										onClick={() => selectProject(p.id)}
										className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
											activeProjectId === p.id
												? "bg-zinc-100 text-zinc-900 font-medium"
												: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
										}`}
									>
										<p className="truncate">{p.name}</p>
										<p className="text-xs text-zinc-400 truncate">{p.client}</p>
									</button>
								))}
							</div>
							<button
								type="button"
								onClick={() => setShowNewProjectModal(true)}
								className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 border border-dashed border-zinc-200 rounded-xl hover:border-zinc-300 hover:text-zinc-700 transition-colors"
							>
								<Plus className="w-3.5 h-3.5" />
								New proposal
							</button>
						</div>

						<nav className="p-4 flex-1">
							<p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Create</p>
							<div className="space-y-0.5">
								{NAV_ITEMS.map((item) => {
									const Icon = item.icon;
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setActiveTab(item.id)}
											className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
												activeTab === item.id
													? "bg-zinc-900 text-white font-medium"
													: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
											}`}
										>
											<Icon className="w-4 h-4" />
											{item.label}
											{item.id === "more" && (
												<span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">
													Pro
												</span>
											)}
										</button>
									);
								})}
							</div>
						</nav>
					</aside>

					{/* Mobile tab bar */}
					<div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-2 py-1.5 flex justify-around gap-1">
						{NAV_ITEMS.map((item) => {
							const Icon = item.icon;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setActiveTab(item.id)}
									className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors flex-1 ${
										activeTab === item.id ? "text-zinc-900 font-medium bg-zinc-100" : "text-zinc-400"
									}`}
								>
									<Icon className="w-4 h-4" />
									{item.label.split(" ")[0]}
								</button>
							);
						})}
					</div>

					{/* Main content */}
					<main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl">
						{/* Mobile project picker */}
						<div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-1 items-center">
							{projects.map((p) => (
								<button
									key={p.id}
									type="button"
									onClick={() => selectProject(p.id)}
									className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
										activeProjectId === p.id
											? "bg-zinc-200 text-zinc-800 border-zinc-200"
											: "bg-white text-zinc-600 border-zinc-200"
									}`}
								>
									{p.name}
								</button>
							))}
							<button
								type="button"
								onClick={() => setShowNewProjectModal(true)}
								className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-dashed border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
								aria-label="New proposal"
							>
								<Plus className="w-4 h-4" />
							</button>
						</div>

						{/* ── ONE-PAGE PROPOSAL EDITOR (MVP) ── */}
						{activeTab === "editor" && (
							<div className="space-y-5">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900">Create proposal</h1>
										<p className="text-sm text-zinc-500 mt-1">
											Describe with AI, edit everything on one page, then share or invoice.
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2 shrink-0">
										<StatusBadge status={activeProposal?.status || "draft"} />
										<button
											type="button"
											onClick={() => setShowNewProposalModal(true)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
										>
											<Plus className="w-4 h-4" />
											New version
										</button>
									</div>
								</div>

								{/* AI strip */}
								<div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl overflow-hidden text-white">
									<button
										type="button"
										onClick={() => setShowAiPanel((v) => !v)}
										className="w-full flex items-center justify-between px-5 py-3.5 text-left"
									>
										<div className="flex items-center gap-2">
											<Wand2 className="w-5 h-5 text-zinc-300" />
											<span className="text-sm font-semibold">AI proposal generator</span>
											<span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">Gemini Flash</span>
										</div>
										{showAiPanel ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
									</button>
									{showAiPanel && (
										<div className="px-5 pb-5 space-y-3 border-t border-white/10">
											{aiChat.length > 0 && (
												<div className="max-h-32 overflow-y-auto space-y-2 pt-3 text-sm">
													{aiChat.slice(-2).map((msg, i) => (
														<p key={i} className={msg.role === "user" ? "text-zinc-300" : "text-white/90"}>
															<span className="text-zinc-500 text-xs uppercase">{msg.role}: </span>
															{msg.content.slice(0, 200)}{msg.content.length > 200 ? "…" : ""}
														</p>
													))}
												</div>
											)}
											{aiError && (
												<p className="text-xs text-red-300 flex items-center gap-1.5">
													<AlertCircle className="w-3.5 h-3.5" />
													{aiError}
												</p>
											)}
											<form onSubmit={handleAiGenerate} className="space-y-2">
												<textarea
													rows={2}
													placeholder="Paste call notes or describe the project — client, scope, budget, timeline…"
													value={aiInput}
													onChange={(e) => setAiInput(e.target.value)}
													disabled={aiLoading}
													className="w-full px-3 py-2 text-sm text-zinc-900 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-none disabled:opacity-50"
												/>
												<div className="flex items-center justify-between gap-2">
													<label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 border border-white/20 rounded-xl hover:bg-white/10 cursor-pointer">
														<ImagePlus className="w-3.5 h-3.5" />
														Images
														<input type="file" accept="image/*" multiple className="hidden" onChange={handleAiImageUpload} disabled={aiLoading} />
													</label>
													<button
														type="submit"
														disabled={aiLoading || (!aiInput.trim() && aiPendingImages.length === 0)}
														className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-white rounded-xl hover:bg-zinc-100 disabled:opacity-50"
													>
														{aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
														{aiChat.length === 0 ? "Generate" : "Refine"}
													</button>
												</div>
											</form>
										</div>
									)}
								</div>

								{/* Proposal version picker */}
								{projectProposals.length > 1 && (
									<div className="flex gap-2 overflow-x-auto pb-1">
										{projectProposals.map((prop) => (
											<button
												key={prop.id}
												type="button"
												onClick={() => setActiveProposalId(prop.id)}
												className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
													activeProposal?.id === prop.id
														? "bg-zinc-900 text-white border-zinc-900"
														: "bg-white text-zinc-600 border-zinc-200"
												}`}
											>
												{prop.title}
											</button>
										))}
									</div>
								)}

								{/* From / To */}
								<div className="grid md:grid-cols-2 gap-4">
									<EditorSection title="From — your details" defaultOpen>
										<div className="space-y-3">
											<div className="flex gap-2">
												{["individual", "company"].map((type) => (
													<button
														key={type}
														type="button"
														onClick={() => handlePaymentField("senderType", type)}
														className={`flex-1 px-3 py-2 text-xs font-medium rounded-xl border transition-colors capitalize ${
															paymentDetails.senderType === type
																? "bg-zinc-900 text-white border-zinc-900"
																: "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
														}`}
													>
														{type}
													</button>
												))}
											</div>
											{paymentDetails.senderType === "individual" ? (
												<input
													type="text"
													placeholder="Your full name"
													value={paymentDetails.senderName}
													onChange={(e) => handlePaymentField("senderName", e.target.value)}
													className={inputClass}
												/>
											) : (
												<input
													type="text"
													placeholder="Company / studio name"
													value={paymentDetails.businessName}
													onChange={(e) => handlePaymentField("businessName", e.target.value)}
													className={inputClass}
												/>
											)}
											<div className="grid sm:grid-cols-2 gap-3">
												<input
													type="email"
													placeholder="Email"
													value={paymentDetails.businessEmail}
													onChange={(e) => handlePaymentField("businessEmail", e.target.value)}
													className={inputClass}
												/>
												<input
													type="text"
													placeholder="Phone"
													value={paymentDetails.phone}
													onChange={(e) => handlePaymentField("phone", e.target.value)}
													className={inputClass}
												/>
											</div>
											<input
												type="text"
												placeholder="Address (optional)"
												value={paymentDetails.address}
												onChange={(e) => handlePaymentField("address", e.target.value)}
												className={inputClass}
											/>
											<div className="grid sm:grid-cols-2 gap-3">
												<input
													type="text"
													placeholder="Website"
													value={paymentDetails.website}
													onChange={(e) => handlePaymentField("website", e.target.value)}
													className={inputClass}
												/>
												<input
													type="text"
													placeholder="Tax ID / GST (optional)"
													value={paymentDetails.taxId}
													onChange={(e) => handlePaymentField("taxId", e.target.value)}
													className={inputClass}
												/>
											</div>
										</div>
									</EditorSection>

									<EditorSection title="To — client details" defaultOpen>
										<div className="space-y-3">
											<input
												type="text"
												placeholder="Proposal title"
												value={activeProposal?.title || ""}
												onChange={(e) => updateActiveProposal((p) => ({ ...p, title: e.target.value }))}
												className={inputClass}
											/>
											<input
												type="text"
												placeholder="Project name"
												value={project?.name || ""}
												onChange={(e) => updateProjectField("name", e.target.value)}
												className={inputClass}
											/>
											<input
												type="text"
												placeholder="Client company or name"
												value={project?.client || ""}
												onChange={(e) => updateProjectField("client", e.target.value)}
												className={inputClass}
											/>
											<div className="grid sm:grid-cols-2 gap-3">
												<input
													type="text"
													placeholder="Contact person"
													value={project?.contact || ""}
													onChange={(e) => updateProjectField("contact", e.target.value)}
													className={inputClass}
												/>
												<input
													type="email"
													placeholder="Client email"
													value={project?.email || ""}
													onChange={(e) => updateProjectField("email", e.target.value)}
													className={inputClass}
												/>
											</div>
											<div className="flex flex-wrap gap-2">
												<select
													value={project?.category || "other"}
													onChange={(e) => updateProjectCategory(e.target.value)}
													className={`${inputClass} w-auto`}
												>
													{PROJECT_CATEGORIES.map((cat) => (
														<option key={cat.id} value={cat.id}>{cat.label}</option>
													))}
												</select>
												<select
													value={project?.pricingModel || "hourly"}
													onChange={(e) => updateProjectPricingModel(e.target.value)}
													className={`${inputClass} w-auto`}
												>
													{PRICING_MODELS.map((m) => (
														<option key={m.id} value={m.id}>{m.label}</option>
													))}
												</select>
												<CurrencyDropdown value={projectCurrency} onChange={handleProjectCurrencyChange} />
											</div>
										</div>
									</EditorSection>
								</div>

								{/* Brief */}
								<EditorSection title="Project brief" defaultOpen>
									<div className="space-y-3">
										<textarea
											rows={2}
											placeholder="Goals — what should this project achieve?"
											value={projectBrief.goals || ""}
											onChange={(e) => updateBriefField("goals", e.target.value)}
											className={`${inputClass} resize-none`}
										/>
										<textarea
											rows={2}
											placeholder="Target audience"
											value={projectBrief.targetAudience || ""}
											onChange={(e) => updateBriefField("targetAudience", e.target.value)}
											className={`${inputClass} resize-none`}
										/>
										<textarea
											rows={2}
											placeholder="Deliverables summary"
											value={projectBrief.deliverablesSummary || ""}
											onChange={(e) => updateBriefField("deliverablesSummary", e.target.value)}
											className={`${inputClass} resize-none`}
										/>
										<div className="flex items-center gap-3">
											<label className="text-xs text-zinc-500 shrink-0">Revision rounds</label>
											<input
												type="number"
												min="0"
												value={projectBrief.revisionRounds ?? 2}
												onChange={(e) => updateBriefField("revisionRounds", Number(e.target.value))}
												className="w-20 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
											<label className="text-xs text-zinc-500 shrink-0 ml-4">Timeline (weeks)</label>
											<input
												type="number"
												min="1"
												value={activeProposal?.weeks ?? project?.weeks ?? 4}
												onChange={(e) =>
													updateActiveProposal((p) => ({ ...p, weeks: Number(e.target.value) || 1 }))
												}
												className="w-20 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
									</div>
								</EditorSection>

								{/* Scope */}
								<EditorSection
									title="Scope of work"
									badge={
										<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
											{projectReqs.length} items
										</span>
									}
								>
									<div className="space-y-2">
										{projectReqs.map((r) => (
											<div key={r.id} className="flex items-center gap-2 group">
												<button
													type="button"
													onClick={() => handleToggleReqStatus(r.id)}
													className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
														r.status === "confirmed"
															? "bg-emerald-500 border-emerald-500 text-white"
															: "border-zinc-300 text-transparent hover:border-emerald-400"
													}`}
												>
													<Check className="w-3 h-3" />
												</button>
												<input
													type="text"
													value={r.title}
													onChange={(e) => handleUpdateRequirement(r.id, "title", e.target.value)}
													className="flex-1 px-2 py-1.5 text-sm border border-transparent hover:border-zinc-200 focus:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
												/>
												<button
													type="button"
													onClick={() => handleDeleteRequirement(r.id)}
													className="p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
										<form onSubmit={handleAddRequirement} className="flex gap-2 pt-2">
											<input
												type="text"
												placeholder="Add scope item…"
												value={newReqTitle}
												onChange={(e) => setNewReqTitle(e.target.value)}
												className={`${inputClass} flex-1`}
											/>
											<button
												type="submit"
												className="px-3 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50"
											>
												<Plus className="w-4 h-4" />
											</button>
										</form>
									</div>
								</EditorSection>

								{/* Deliverables */}
								<EditorSection title="Deliverables">
									<div className="space-y-2">
										{projectTech.map((t) => (
											<div key={t.id} className="flex items-center gap-2 group">
												<input
													type="text"
													value={t.name}
													onChange={(e) => handleUpdateDeliverable(t.id, "name", e.target.value)}
													className="flex-1 px-2 py-1.5 text-sm border border-transparent hover:border-zinc-200 focus:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
												/>
												<input
													type="text"
													value={t.role}
													onChange={(e) => handleUpdateDeliverable(t.id, "role", e.target.value)}
													placeholder="Role"
													className="w-28 px-2 py-1.5 text-sm border border-transparent hover:border-zinc-200 focus:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
												/>
												<button
													type="button"
													onClick={() => handleDeleteDeliverable(t.id)}
													className="p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
										<form onSubmit={handleAddTech} className="flex gap-2 pt-2">
											<input
												type="text"
												placeholder="Add deliverable…"
												value={newTechForm.name}
												onChange={(e) => setNewTechForm((f) => ({ ...f, name: e.target.value }))}
												className={`${inputClass} flex-1`}
											/>
											<button type="submit" className="px-3 py-2 text-sm border border-zinc-200 rounded-xl hover:bg-zinc-50">
												<Plus className="w-4 h-4" />
											</button>
										</form>
									</div>
								</EditorSection>

								{/* Pricing */}
								<EditorSection
									title="Pricing"
									badge={
										<span className="text-sm font-bold text-zinc-900">{fmt(totalCost)}</span>
									}
								>
									<div className="overflow-x-auto -mx-5 px-5">
										<table className="w-full text-sm min-w-[560px]">
											<thead>
												<tr className="border-b border-zinc-100 text-left">
													<th className="pb-2 text-xs font-medium text-zinc-500">Item</th>
													<th className="pb-2 text-xs font-medium text-zinc-500">Description</th>
													<th className="pb-2 text-xs font-medium text-zinc-500 w-16">Hrs</th>
													<th className="pb-2 text-xs font-medium text-zinc-500 w-20">Rate</th>
													<th className="pb-2 text-xs font-medium text-zinc-500 w-24 text-right">Total</th>
													<th className="w-8" />
												</tr>
											</thead>
											<tbody className="divide-y divide-zinc-50">
												{projectLines.map((line) => (
													<tr key={line.id} className="group">
														<td className="py-1.5 pr-2">
															<input
																type="text"
																value={line.label}
																onChange={(e) => handleUpdateLineItem(line.id, "label", e.target.value)}
																className="w-full px-2 py-1 text-sm border border-transparent hover:border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
															/>
														</td>
														<td className="py-1.5 pr-2">
															<input
																type="text"
																value={line.description || ""}
																onChange={(e) => handleUpdateLineItem(line.id, "description", e.target.value)}
																className="w-full px-2 py-1 text-sm text-zinc-500 border border-transparent hover:border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
															/>
														</td>
														<td className="py-1.5">
															<input
																type="number"
																min="0"
																value={line.hours}
																onChange={(e) => handleUpdateLineItem(line.id, "hours", e.target.value)}
																className="w-full px-2 py-1 text-sm border border-transparent hover:border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
															/>
														</td>
														<td className="py-1.5">
															<input
																type="number"
																min="0"
																value={line.rate}
																onChange={(e) => handleUpdateLineItem(line.id, "rate", e.target.value)}
																className="w-full px-2 py-1 text-sm border border-transparent hover:border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
															/>
														</td>
														<td className="py-1.5 text-right font-medium whitespace-nowrap">{fmt(line.hours * line.rate)}</td>
														<td className="py-1.5">
															<button
																type="button"
																onClick={() => handleDeleteLineItem(line.id)}
																className="p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
									<form onSubmit={handleAddLineItem} className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-100">
										<input
											type="text"
											placeholder="Line item"
											value={newLineForm.label}
											onChange={(e) => setNewLineForm((f) => ({ ...f, label: e.target.value }))}
											className={`${inputClass} flex-1 min-w-[120px]`}
										/>
										<input
											type="number"
											placeholder="Hrs"
											value={newLineForm.hours}
											onChange={(e) => setNewLineForm((f) => ({ ...f, hours: e.target.value }))}
											className="w-20 px-3 py-2 text-sm border border-zinc-200 rounded-xl"
										/>
										<input
											type="number"
											placeholder="Rate"
											value={newLineForm.rate}
											onChange={(e) => setNewLineForm((f) => ({ ...f, rate: e.target.value }))}
											className="w-24 px-3 py-2 text-sm border border-zinc-200 rounded-xl"
										/>
										<button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800">
											Add
										</button>
									</form>
									<div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-100">
										<p className="text-xs text-zinc-400">{totalHours} hours · {activeProposal?.weeks ?? project?.weeks} weeks</p>
										<p className="text-lg font-bold text-zinc-900">{fmt(totalCost)}</p>
									</div>
								</EditorSection>

								{/* Payment essentials */}
								<EditorSection title="Payment details" defaultOpen={false}>
									<div className="space-y-3">
										<div className="grid sm:grid-cols-2 gap-3">
											<input
												type="text"
												placeholder="Bank name"
												value={paymentDetails.bankName}
												onChange={(e) => handlePaymentField("bankName", e.target.value)}
												className={inputClass}
											/>
											<input
												type="text"
												placeholder="Account number"
												value={paymentDetails.accountNumber}
												onChange={(e) => handlePaymentField("accountNumber", e.target.value)}
												className={inputClass}
											/>
										</div>
										<input
											type="text"
											placeholder="Stripe / payment link"
											value={paymentDetails.stripeLink}
											onChange={(e) => handlePaymentField("stripeLink", e.target.value)}
											className={inputClass}
										/>
										<input
											type="text"
											placeholder="UPI ID (optional)"
											value={paymentDetails.upiId}
											onChange={(e) => handlePaymentField("upiId", e.target.value)}
											className={inputClass}
										/>
										<button
											type="button"
											onClick={() => openMoreTab("payments")}
											className="text-xs text-zinc-500 hover:text-zinc-700 underline"
										>
											More payment options (Pro) →
										</button>
									</div>
								</EditorSection>

								{/* Send CTA */}
								<div className="bg-zinc-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
									<div>
										<p className="text-sm font-semibold">Ready to send?</p>
										<p className="text-xs text-zinc-400 mt-0.5">Share link, PDF, or create an invoice</p>
									</div>
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() => setActiveTab("invoice")}
											className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-white rounded-xl hover:bg-zinc-100"
										>
											<Receipt className="w-4 h-4" />
											Invoice
										</button>
										<button
											type="button"
											onClick={() => handleDownloadPDF()}
											className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-xl hover:bg-white/10"
										>
											<Download className="w-4 h-4" />
											PDF
										</button>
										<button
											type="button"
											onClick={() => setShowShareModal(true)}
											className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-emerald-400 rounded-xl hover:bg-emerald-300"
										>
											<Send className="w-4 h-4" />
											Share
										</button>
									</div>
								</div>
							</div>
						)}

						{/* ── INVOICE ── */}
						{activeTab === "invoice" && (
							<div className="space-y-6">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900">Create invoice</h1>
										<p className="text-sm text-zinc-500 mt-1">
											Uses your proposal line items and sender details. Download as PDF.
										</p>
									</div>
									<button
										type="button"
										onClick={handleDownloadInvoice}
										className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800"
									>
										<Download className="w-4 h-4" />
										Download invoice PDF
									</button>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
										<p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bill from</p>
										<p className="text-sm font-semibold text-zinc-900">
											{paymentDetails.senderType === "individual"
												? paymentDetails.senderName || paymentDetails.businessName || "—"
												: paymentDetails.businessName || "—"}
										</p>
										<p className="text-sm text-zinc-500">{paymentDetails.businessEmail}</p>
										<button type="button" onClick={() => setActiveTab("editor")} className="text-xs text-blue-600 hover:underline">
											Edit in proposal editor →
										</button>
									</div>
									<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
										<p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bill to</p>
										<p className="text-sm font-semibold text-zinc-900">{project?.client}</p>
										<p className="text-sm text-zinc-500">{project?.contact} · {project?.email}</p>
									</div>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<div className="grid sm:grid-cols-3 gap-3">
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Invoice #</label>
											<input
												type="text"
												value={invoiceMeta.invoiceNumber}
												onChange={(e) => setInvoiceMeta((m) => ({ ...m, invoiceNumber: e.target.value }))}
												className={inputClass}
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Issue date</label>
											<input
												type="text"
												value={invoiceMeta.issueDate}
												onChange={(e) => setInvoiceMeta((m) => ({ ...m, issueDate: e.target.value }))}
												className={inputClass}
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Due date</label>
											<input
												type="text"
												placeholder="Apr 15, 2026"
												value={invoiceMeta.dueDate}
												onChange={(e) => setInvoiceMeta((m) => ({ ...m, dueDate: e.target.value }))}
												className={inputClass}
											/>
										</div>
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Tax rate (%)</label>
										<input
											type="number"
											min="0"
											step="0.1"
											value={invoiceMeta.taxRate}
											onChange={(e) => setInvoiceMeta((m) => ({ ...m, taxRate: e.target.value }))}
											className="w-32 px-3 py-2 text-sm border border-zinc-200 rounded-xl"
										/>
									</div>
									<textarea
										rows={2}
										placeholder="Notes / payment terms"
										value={invoiceMeta.notes}
										onChange={(e) => setInvoiceMeta((m) => ({ ...m, notes: e.target.value }))}
										className={`${inputClass} resize-none`}
									/>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
									<div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
										<h2 className="text-sm font-semibold text-zinc-900">Line items from proposal</h2>
									</div>
									<div className="divide-y divide-zinc-100">
										{projectLines.length === 0 ? (
											<p className="px-5 py-8 text-sm text-zinc-400 text-center">Add line items in the proposal editor first.</p>
										) : (
											projectLines.map((line) => (
												<div key={line.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
													<div>
														<p className="font-medium text-zinc-900">{line.label}</p>
														{line.description && <p className="text-xs text-zinc-400">{line.description}</p>}
													</div>
													<div className="text-right shrink-0">
														<p className="text-zinc-600">{line.hours}h × {fmt(line.rate)}</p>
														<p className="font-medium text-zinc-900">{fmt(line.hours * line.rate)}</p>
													</div>
												</div>
											))
										)}
									</div>
									<div className="px-5 py-4 border-t border-zinc-200 bg-zinc-50 space-y-1 text-sm text-right">
										<p className="text-zinc-500">Subtotal: {fmt(invoiceSubtotal)}</p>
										{Number(invoiceMeta.taxRate) > 0 && (
											<p className="text-zinc-500">Tax ({invoiceMeta.taxRate}%): {fmt(invoiceTaxAmount)}</p>
										)}
										<p className="text-lg font-bold text-zinc-900">Total: {fmt(invoiceTotal)}</p>
									</div>
								</div>
							</div>
						)}

						{/* ── PRO TOOLS ── */}
						{activeTab === "more" && (
							<div className="mb-6">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900">Pro tools</h1>
										<p className="text-sm text-zinc-500 mt-1">Advanced project management — milestones, media, conversations, and more.</p>
									</div>
									<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
										<Lock className="w-3 h-3" />
										Paid plans
									</span>
								</div>
								<div className="flex gap-2 overflow-x-auto pb-2">
									{ADVANCED_NAV_ITEMS.map((item) => {
										const Icon = item.icon;
										return (
											<button
												key={item.id}
												type="button"
												onClick={() => setAdvancedSubTab(item.id)}
												className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
													advancedSubTab === item.id
														? "bg-zinc-900 text-white border-zinc-900"
														: "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
												}`}
											>
												<Icon className="w-3.5 h-3.5" />
												{item.label}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* ── AI GENERATE ── */}
						{activeTab === "more" && advancedSubTab === "ai" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
										<Wand2 className="w-6 h-6 text-zinc-600" />
										AI Proposal Generator
									</h1>
									<p className="text-sm text-zinc-500 mt-1">
										Describe the client project in plain English — paste call notes, upload mockups — and AI fills every workspace instantly.
									</p>
									<p className="text-xs text-zinc-400 mt-1">
										Powered by Gemini Flash 2 via OpenRouter · applies to project &ldquo;{project?.name}&rdquo;
									</p>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col min-h-[420px]">
									<div className="flex-1 p-4 space-y-4 max-h-[50vh] overflow-y-auto bg-zinc-50/50">
										{aiChat.length === 0 ? (
											<div className="text-center py-12 px-4">
												<Bot className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
												<p className="text-sm font-medium text-zinc-700">Start with a project description</p>
												<p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
													Example: &ldquo;Sarah from Bloom & Co. wants a Shopify-style e-commerce redesign, mobile-first, Stripe checkout, 8 weeks, budget around $18k. She sent a Figma moodboard.&rdquo;
												</p>
											</div>
										) : (
											aiChat.map((msg, i) => (
												<div
													key={i}
													className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
												>
													<div
														className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
															msg.role === "user"
																? "bg-zinc-900 text-white"
																: "bg-white border border-zinc-200 text-zinc-700"
														}`}
													>
														{msg.role === "assistant" && (
															<p className="text-[10px] font-medium text-zinc-600 mb-1 uppercase tracking-wider">ScopeDraft AI</p>
														)}
														<p className="whitespace-pre-wrap">{msg.content}</p>
														{msg.images?.length > 0 && (
															<div className="flex flex-wrap gap-2 mt-2">
																{msg.images.map((img) => (
																	<img
																		key={img.id}
																		src={img.dataUrl}
																		alt={img.name}
																		className="w-16 h-16 object-cover rounded-xl border border-zinc-200"
																	/>
																))}
															</div>
														)}
													</div>
												</div>
											))
										)}
										{aiLoading && (
											<div className="flex justify-start">
												<div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-zinc-500">
													<Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
													Generating proposal…
												</div>
											</div>
										)}
										<div ref={aiChatEndRef} />
									</div>

									{aiPendingImages.length > 0 && (
										<div className="px-4 py-2 border-t border-zinc-100 flex flex-wrap gap-2 bg-white">
											{aiPendingImages.map((img) => (
												<div key={img.id} className="relative">
													<img src={img.dataUrl} alt={img.name} className="w-14 h-14 object-cover rounded-xl border border-zinc-200" />
													<button
														type="button"
														onClick={() => setAiPendingImages((prev) => prev.filter((i) => i.id !== img.id))}
														className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center"
													>
														<X className="w-3 h-3" />
													</button>
												</div>
											))}
										</div>
									)}

									{aiError && (
										<div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center gap-2">
											<AlertCircle className="w-3.5 h-3.5 shrink-0" />
											{aiError}
										</div>
									)}

									<form onSubmit={handleAiGenerate} className="p-4 border-t border-zinc-200 bg-white space-y-3">
										<textarea
											rows={3}
											placeholder="Describe the client, project scope, budget, timeline, tech stack or deliverables, and anything from your last call…"
											value={aiInput}
											onChange={(e) => setAiInput(e.target.value)}
											disabled={aiLoading}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100 resize-none disabled:opacity-50"
										/>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
													<ImagePlus className="w-4 h-4" />
													Add images
													<input
														type="file"
														accept="image/*"
														multiple
														className="hidden"
														onChange={handleAiImageUpload}
														disabled={aiLoading}
													/>
												</label>
												{aiChat.length > 0 && (
													<button
														type="button"
														onClick={() => {
															setAiChat([]);
															setAiError("");
														}}
														className="text-xs text-zinc-400 hover:text-zinc-600"
													>
														Clear chat
													</button>
												)}
											</div>
											<button
												type="submit"
												disabled={aiLoading || (!aiInput.trim() && aiPendingImages.length === 0)}
												className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-600 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{aiLoading ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Wand2 className="w-4 h-4" />
												)}
												{aiChat.length === 0 ? "Generate proposal" : "Refine with AI"}
											</button>
										</div>
									</form>
								</div>

								<div className="grid sm:grid-cols-3 gap-3 text-xs text-zinc-500">
									{[
										"Fills brief, requirements, deliverables",
										"Creates milestones + priced proposal",
										"Chat to refine — add images anytime",
									].map((tip) => (
										<div key={tip} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 flex items-center gap-2">
											<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
											{tip}
										</div>
									))}
								</div>
							</div>
						)}

						{/* ── OVERVIEW ── */}
						{activeTab === "more" && advancedSubTab === "overview" && (
							<div className="space-y-6">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900">{project?.name}</h1>
										<div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-zinc-500">
											<span className="inline-flex items-center gap-1">
												<Building2 className="w-3.5 h-3.5" />
												{project?.client}
											</span>
											<span className="inline-flex items-center gap-1">
												<User className="w-3.5 h-3.5" />
												{project?.contact}
											</span>
											{categoryConfig && (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
													{React.createElement(categoryConfig.icon, { className: "w-3 h-3" })}
													{categoryConfig.label}
												</span>
											)}
											{project?.pricingModel && (
												<span className="text-xs text-zinc-400 capitalize">
													· {PRICING_MODELS.find((m) => m.id === project.pricingModel)?.label || project.pricingModel}
												</span>
											)}
										</div>
									</div>
									<StatusBadge status={activeProposal?.status || "draft"} />
								</div>

								<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
									{[
										{ label: "Total estimate", value: fmt(totalCost), icon: DollarSign, sub: `${totalHours}h · active proposal` },
										{ label: "Timeline", value: `${activeProposal?.weeks ?? project?.weeks} weeks`, icon: Clock, sub: "Active proposal" },
										{ label: "Proposals", value: `${projectProposals.length}`, icon: Files, sub: `${projectProposals.filter((p) => p.status === "approved").length} approved` },
										{ label: "Requirements", value: `${confirmedCount}/${projectReqs.length}`, icon: Check, sub: `${pendingCount} pending` },
									].map((stat) => {
										const Icon = stat.icon;
										return (
											<div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4">
												<div className="flex items-center gap-2 text-zinc-400 mb-2">
													<Icon className="w-4 h-4" />
													<span className="text-xs font-medium">{stat.label}</span>
												</div>
												<p className="text-xl font-bold text-zinc-900">{stat.value}</p>
												<p className="text-xs text-zinc-400 mt-0.5">{stat.sub}</p>
											</div>
										);
									})}
								</div>

								{/* Progress pipeline */}
								<div className="bg-white border border-zinc-200 rounded-xl p-5">
									<h2 className="text-sm font-semibold text-zinc-900 mb-4">Approval pipeline</h2>
									<div className="flex items-center gap-1 sm:gap-2">
										{["Capture", "Draft", "Share", "Approve"].map((step, i) => {
											const proposalStatus = activeProposal?.status || "draft";
											const stepStatus = proposalStatus === "approved" ? 4 : proposalStatus === "sent" ? 3 : proposalStatus === "revision" ? 2 : 2;
											const done = i < stepStatus;
											const current = i === stepStatus - 1;
											return (
												<React.Fragment key={step}>
													<div className="flex flex-col items-center gap-1.5 flex-1">
														<div
															className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
																done
																	? "bg-emerald-50 border-emerald-500 text-emerald-600"
																	: current
																		? "bg-zinc-200 border-zinc-200 text-white"
																		: "bg-zinc-50 border-zinc-200 text-zinc-400"
															}`}
														>
															{done ? <Check className="w-3.5 h-3.5" /> : i + 1}
														</div>
														<span className={`text-[10px] sm:text-xs font-medium ${done || current ? "text-zinc-900" : "text-zinc-400"}`}>
															{step}
														</span>
													</div>
													{i < 3 && <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 hidden sm:block" />}
												</React.Fragment>
											);
										})}
									</div>
								</div>

								{/* Quick actions + recent activity */}
								<div className="grid lg:grid-cols-2 gap-4">
									<div className="bg-white border border-zinc-200 rounded-xl p-5">
										<h2 className="text-sm font-semibold text-zinc-900 mb-3">Quick actions</h2>
										<div className="space-y-2">
											{[
												{ label: "Generate proposal with AI", tab: "ai", icon: Wand2 },
												{ label: "Upload call recording or screenshot", tab: "media", icon: Mic },
												{ label: "Complete project brief", tab: "brief", icon: Target },
												{ label: "Add requirement from last call", tab: "requirements", icon: Plus },
												{ label: `Review ${categoryConfig?.deliverablesLabel?.toLowerCase() || "deliverables"}`, tab: "deliverables", icon: Layers },
												{ label: "Update proposal pricing", tab: "proposal", icon: DollarSign },
												{ label: "Send draft to client", action: () => setShowShareModal(true), icon: Send },
											].map((action) => {
												const Icon = action.icon;
												return (
													<button
														key={action.label}
														type="button"
														onClick={() => (action.tab ? setActiveTab(action.tab) : action.action?.())}
														className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 border border-zinc-100 transition-colors"
													>
														<span className="flex items-center gap-2">
															<Icon className="w-4 h-4 text-zinc-400" />
															{action.label}
														</span>
														<ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
													</button>
												);
											})}
										</div>
									</div>

									<div className="bg-white border border-zinc-200 rounded-xl p-5">
										<h2 className="text-sm font-semibold text-zinc-900 mb-3">Recent conversations</h2>
										<div className="space-y-3">
											{projectConvos.slice(0, 3).map((c) => (
												<div key={c.id} className="flex gap-3">
													<div className="w-1 rounded-full bg-zinc-200 shrink-0" />
													<div>
														<div className="flex items-center gap-2">
															<p className="text-sm font-medium text-zinc-900">{c.title}</p>
															<span className="text-xs text-zinc-400">{c.date}</span>
														</div>
														<p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{c.summary}</p>
													</div>
												</div>
											))}
										</div>
										<button
											type="button"
											onClick={() => setActiveTab("conversations")}
											className="mt-3 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
										>
											View all conversations →
										</button>
									</div>
								</div>
							</div>
						)}

						{/* ── PROJECT BRIEF ── */}
						{activeTab === "more" && advancedSubTab === "brief" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900">Project brief</h1>
									<p className="text-sm text-zinc-500 mt-1">
										Universal context for any project — dev, design, marketing, consulting, or creative work.
									</p>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900">Project type</h2>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
										{PROJECT_CATEGORIES.map((cat) => {
											const Icon = cat.icon;
											const selected = project?.category === cat.id;
											return (
												<button
													key={cat.id}
													type="button"
													onClick={() => updateProjectCategory(cat.id)}
													className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors ${
														selected
															? "bg-zinc-200 text-zinc-800 border-zinc-200"
															: "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
													}`}
												>
													<Icon className="w-4 h-4" />
													<span className="text-[10px] sm:text-xs font-medium leading-tight">{cat.label}</span>
												</button>
											);
										})}
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-2">Pricing model</label>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
											{PRICING_MODELS.map((model) => (
												<button
													key={model.id}
													type="button"
													onClick={() => updateProjectPricingModel(model.id)}
													className={`px-3 py-2 rounded-xl border text-left transition-colors ${
														project?.pricingModel === model.id
															? "bg-zinc-100 border-zinc-300"
															: "border-zinc-200 hover:border-zinc-300"
													}`}
												>
													<p className="text-sm font-medium text-zinc-900">{model.label}</p>
													<p className="text-[10px] text-zinc-400">{model.description}</p>
												</button>
											))}
										</div>
									</div>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900">Core brief</h2>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Project goals</label>
										<textarea
											rows={3}
											placeholder="What should this project achieve for the client?"
											value={projectBrief.goals}
											onChange={(e) => updateBriefField("goals", e.target.value)}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100 resize-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Target audience</label>
										<input
											type="text"
											placeholder="Who is this for? End users, internal team, customers..."
											value={projectBrief.targetAudience}
											onChange={(e) => updateBriefField("targetAudience", e.target.value)}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Deliverables summary</label>
										<textarea
											rows={2}
											placeholder="High-level list of what the client receives at the end"
											value={projectBrief.deliverablesSummary}
											onChange={(e) => updateBriefField("deliverablesSummary", e.target.value)}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100 resize-none"
										/>
									</div>
									<div className="grid sm:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Timeline notes</label>
											<input
												type="text"
												placeholder="Deadlines, launch dates, phasing..."
												value={projectBrief.timelineNotes}
												onChange={(e) => updateBriefField("timelineNotes", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Revision rounds included</label>
											<input
												type="number"
												min="0"
												value={projectBrief.revisionRounds}
												onChange={(e) => updateBriefField("revisionRounds", Number(e.target.value) || 0)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
									</div>
								</div>

								{(categoryConfig?.briefFields || []).length > 0 && (
									<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
										<h2 className="text-sm font-semibold text-zinc-900">
											{categoryConfig.label} — specific details
										</h2>
										{categoryConfig.briefFields.map((field) => (
											<div key={field.key}>
												<label className="block text-xs font-medium text-zinc-500 mb-1">{field.label}</label>
												<input
													type="text"
													placeholder={field.placeholder}
													value={projectBrief.customFields?.[field.key] || ""}
													onChange={(e) => updateBriefCustomField(field.key, e.target.value)}
													className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
												/>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{activeTab === "more" && advancedSubTab === "requirements" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900">Requirements</h1>
									<p className="text-sm text-zinc-500 mt-1">
										Every deliverable discussed — tagged by priority and confirmation status. Works for features, pages, assets, or sessions.
									</p>
								</div>

								{/* Add requirement */}
								<form onSubmit={handleAddRequirement} className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
									<input
										type="text"
										placeholder="Add a requirement from your latest conversation..."
										value={newReqTitle}
										onChange={(e) => setNewReqTitle(e.target.value)}
										className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
									<select
										value={newReqCategory}
										onChange={(e) => setNewReqCategory(e.target.value)}
										className="px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-100"
									>
										<option value="must">Must have</option>
										<option value="nice">Nice to have</option>
										<option value="out">Out of scope</option>
									</select>
									<button
										type="submit"
										className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
									>
										<Plus className="w-4 h-4" />
										Add
									</button>
								</form>

								{projectReqs.length === 0 && (
									<div className="text-center py-12 bg-white border border-zinc-200 rounded-xl">
										<ClipboardList className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
										<p className="text-sm text-zinc-500">No requirements yet. Add one from your latest client call.</p>
									</div>
								)}

								{/* Requirement list grouped by category */}
								{["must", "nice", "out"].map((cat) => {
									const items = projectReqs.filter((r) => r.category === cat);
									if (!items.length) return null;
									const catCfg = CATEGORY_CONFIG[cat];
									return (
										<div key={cat}>
											<div className="flex items-center gap-2 mb-3">
												<span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catCfg.color}`}>
													{catCfg.label}
												</span>
												<span className="text-xs text-zinc-400">{items.length} items</span>
											</div>
											<div className="space-y-2">
												{items.map((req) => {
													const stCfg = REQ_STATUS_CONFIG[req.status];
													const StIcon = stCfg.icon;
													return (
														<div
															key={req.id}
															className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-start justify-between gap-4"
														>
															<div className="flex-1 min-w-0">
																<p className="text-sm font-medium text-zinc-900">{req.title}</p>
																<p className="text-xs text-zinc-400 mt-0.5">{req.source}</p>
															</div>
															<div className="flex items-center gap-3 shrink-0">
																{req.hours > 0 && (
																	<span className="text-xs text-zinc-400">{req.hours}h</span>
																)}
																<button
																	type="button"
																	onClick={() => handleToggleReqStatus(req.id)}
																	className={`inline-flex items-center gap-1 text-xs font-medium ${stCfg.color} hover:opacity-75 transition-opacity`}
																	title="Click to toggle status"
																>
																	<StIcon className="w-3.5 h-3.5" />
																	{stCfg.label}
																</button>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									);
								})}
							</div>
						)}

						{/* ── DELIVERABLES ── */}
						{activeTab === "more" && advancedSubTab === "deliverables" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900">{categoryConfig?.deliverablesLabel || "Deliverables"}</h1>
									<p className="text-sm text-zinc-500 mt-1">
										{categoryConfig?.deliverablesDesc || "Lock what's included once agreed with the client."}
									</p>
								</div>

								<div className="grid sm:grid-cols-2 gap-3">
									{projectTech.map((tech) => (
										<div
											key={tech.id}
											className={`bg-white border rounded-xl p-4 ${
												tech.status === "locked" ? "border-zinc-200" : "border-amber-200 bg-amber-50/30"
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div>
													<p className="text-sm font-semibold text-zinc-900">{tech.name}</p>
													<p className="text-xs text-zinc-400">{tech.role}</p>
												</div>
												<button
													type="button"
													onClick={() => handleToggleTechLock(tech.id)}
													className={
														tech.status === "locked"
															? "inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
															: "inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors"
													}
												>
													{tech.status === "locked" ? (
														<>
															<Lock className="w-3 h-3" />
															Locked
														</>
													) : (
														<>
															<HelpCircle className="w-3 h-3" />
															Open
														</>
													)}
												</button>
											</div>
											<p className="text-xs text-zinc-500 mt-2">{tech.note}</p>
										</div>
									))}
								</div>

								<form onSubmit={handleAddTech} className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
									<input
										type="text"
										placeholder={categoryConfig?.itemNamePlaceholder || "Item name"}
										value={newTechForm.name}
										onChange={(e) => setNewTechForm((f) => ({ ...f, name: e.target.value }))}
										className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
									<input
										type="text"
										placeholder={categoryConfig?.itemRolePlaceholder || "Type / category"}
										value={newTechForm.role}
										onChange={(e) => setNewTechForm((f) => ({ ...f, role: e.target.value }))}
										className="w-full sm:w-36 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
									<button
										type="submit"
										className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
									>
										<Plus className="w-4 h-4" />
										Add
									</button>
								</form>

								<div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
									<AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-blue-900">Why this matters</p>
										<p className="text-xs text-blue-700 mt-1">{categoryConfig?.tip}</p>
									</div>
								</div>
							</div>
						)}

						{/* ── MILESTONES ── */}
						{activeTab === "more" && advancedSubTab === "milestones" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900">Milestones</h1>
									<p className="text-sm text-zinc-500 mt-1">
										Phases and checkpoints — works for dev sprints, design rounds, content calendars, or consulting sessions.
									</p>
								</div>

								<form onSubmit={handleAddMilestone} className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
									<input
										type="text"
										placeholder="Milestone (e.g. Wireframes approved)"
										value={newMilestoneForm.title}
										onChange={(e) => setNewMilestoneForm((f) => ({ ...f, title: e.target.value }))}
										className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
									<input
										type="text"
										placeholder="Due (e.g. Week 2)"
										value={newMilestoneForm.due}
										onChange={(e) => setNewMilestoneForm((f) => ({ ...f, due: e.target.value }))}
										className="w-full sm:w-36 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
									<button
										type="submit"
										className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
									>
										<Plus className="w-4 h-4" />
										Add
									</button>
								</form>

								{projectMilestones.length === 0 ? (
									<div className="text-center py-12 bg-white border border-zinc-200 rounded-xl">
										<Flag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
										<p className="text-sm text-zinc-500">No milestones yet. Add project phases or delivery checkpoints.</p>
									</div>
								) : (
									<div className="space-y-2">
										{projectMilestones.map((m, index) => (
											<div
												key={m.id}
												className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
											>
												<div className="flex items-center gap-3 min-w-0">
													<button
														type="button"
														onClick={() => handleToggleMilestone(m.id)}
														className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
															m.status === "done"
																? "bg-emerald-500 border-emerald-500 text-white"
																: "border-zinc-300 hover:border-zinc-400"
														}`}
													>
														{m.status === "done" && <Check className="w-3.5 h-3.5" />}
													</button>
													<div className="min-w-0">
														<p className={`text-sm font-medium truncate ${m.status === "done" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
															{index + 1}. {m.title}
														</p>
														<p className="text-xs text-zinc-400">{m.due}</p>
													</div>
												</div>
												<button
													type="button"
													onClick={() => handleDeleteMilestone(m.id)}
													className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* ── MEDIA ── */}
						{activeTab === "more" && advancedSubTab === "media" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900">Project media</h1>
									<p className="text-sm text-zinc-500 mt-1">
										Store call recordings, screenshots, and reference links per project — uploaded via UploadThing.
									</p>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
										<Paperclip className="w-4 h-4" />
										Upload or add link
									</h2>
									<input
										type="text"
										placeholder="Title (e.g. Discovery call — Mar 12)"
										value={mediaForm.title}
										onChange={(e) => setMediaForm((f) => ({ ...f, title: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
									<div className="flex flex-col sm:flex-row gap-3">
										<label
											className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border border-dashed rounded-xl cursor-pointer transition-colors ${
												mediaUploading
													? "border-zinc-200 text-zinc-400 cursor-wait"
													: "border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
											}`}
										>
											{mediaUploading ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : (
												<Video className="w-4 h-4" />
											)}
											{mediaUploading ? "Uploading…" : "Upload MP4, audio, or image"}
											<input
												ref={mediaFileInputRef}
												type="file"
												accept="video/mp4,video/*,audio/*,image/*,.mp4,.m4a,.wav,.png,.jpg,.jpeg,.webp,.gif"
												multiple
												className="hidden"
												disabled={mediaUploading}
												onChange={handleMediaFileUpload}
											/>
										</label>
									</div>
									<form onSubmit={handleAddMediaLink} className="flex flex-col sm:flex-row gap-3">
										<input
											type="url"
											placeholder="Or paste a link (Loom, Drive, Figma, etc.)"
											value={mediaForm.linkUrl}
											onChange={(e) => setMediaForm((f) => ({ ...f, linkUrl: e.target.value }))}
											className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
										/>
										<button
											type="submit"
											className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shrink-0"
										>
											<Link2 className="w-4 h-4" />
											Save link
										</button>
									</form>
									{mediaError && (
										<p className="text-xs text-red-600 flex items-center gap-1">
											<AlertCircle className="w-3.5 h-3.5" />
											{mediaError}
										</p>
									)}
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
									<div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<p className="text-sm font-semibold text-zinc-900">
											{filteredMedia.length} item{filteredMedia.length !== 1 ? "s" : ""}
										</p>
										<div className="relative w-full sm:w-64">
											<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
											<input
												type="text"
												placeholder="Search media…"
												value={mediaSearch}
												onChange={(e) => setMediaSearch(e.target.value)}
												className="w-full pl-9 pr-3 py-1.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
									</div>
									<div className="overflow-x-auto">
										<table className="w-full text-sm min-w-[720px]">
											<thead>
												<tr className="border-b border-zinc-100 text-left">
													<th className="px-4 py-2.5 text-xs font-medium text-zinc-500 w-16">Preview</th>
													<th className="px-4 py-2.5 text-xs font-medium text-zinc-500 w-28">Type</th>
													<th className="px-4 py-2.5 text-xs font-medium text-zinc-500">Title</th>
													<th className="px-4 py-2.5 text-xs font-medium text-zinc-500 w-36">Details</th>
													<th className="px-4 py-2.5 text-xs font-medium text-zinc-500 w-28">Added</th>
													<th className="w-20" />
												</tr>
											</thead>
											<tbody className="divide-y divide-zinc-100">
												{filteredMedia.length === 0 ? (
													<tr>
														<td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
															{mediaSearch ? "No media matches your search." : "No recordings or screenshots yet."}
														</td>
													</tr>
												) : (
													filteredMedia.map((item) => {
														const typeCfg = MEDIA_TYPE_CONFIG[item.type] || MEDIA_TYPE_CONFIG.link;
														const TypeIcon = typeCfg.icon;
														return (
															<tr key={item.id} className="hover:bg-zinc-50/50">
																<td className="px-4 py-3">
																	{item.type === "screenshot" ? (
																		<img
																			src={item.url}
																			alt={item.title}
																			className="w-12 h-12 object-cover rounded-xl border border-zinc-200"
																		/>
																	) : item.type === "recording" && item.mimeType?.startsWith("video/") ? (
																		<div className="w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center">
																			<Video className="w-5 h-5 text-zinc-400" />
																		</div>
																	) : (
																		<div className="w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center">
																			<TypeIcon className="w-5 h-5 text-zinc-400" />
																		</div>
																	)}
																</td>
																<td className="px-4 py-3">
																	<span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.color}`}>
																		<TypeIcon className="w-3 h-3" />
																		{typeCfg.label}
																	</span>
																</td>
																<td className="px-4 py-3">
																	<p className="font-medium text-zinc-900">{item.title}</p>
																	{item.fileName && item.fileName !== item.title && (
																		<p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">{item.fileName}</p>
																	)}
																</td>
																<td className="px-4 py-3 text-xs text-zinc-500">
																	{item.size ? formatFileSize(item.size) : "External link"}
																</td>
																<td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{item.createdAt}</td>
																<td className="px-4 py-3">
																	<div className="flex items-center gap-1 justify-end">
																		<a
																			href={item.url}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
																			title="Open"
																		>
																			<ExternalLink className="w-4 h-4" />
																		</a>
																		<button
																			type="button"
																			onClick={() => handleDeleteMedia(item)}
																			className="p-1.5 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
																			title="Delete"
																		>
																			<Trash2 className="w-4 h-4" />
																		</button>
																	</div>
																</td>
															</tr>
														);
													})
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{/* ── CONVERSATIONS ── */}
						{activeTab === "more" && advancedSubTab === "conversations" && (
							<div className="space-y-6">
								<div className="flex items-start justify-between gap-4">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900">Conversations</h1>
										<p className="text-sm text-zinc-500 mt-1">
											A running log of every call and email — linked to requirements so context never gets lost.
										</p>
									</div>
									<button
										type="button"
										onClick={() => setShowLogMeetingModal(true)}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shrink-0"
									>
										<Plus className="w-4 h-4" />
										Log meeting
									</button>
								</div>

								{projectConvos.length === 0 ? (
									<div className="text-center py-12 bg-white border border-zinc-200 rounded-xl">
										<MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
										<p className="text-sm text-zinc-500">No conversations logged yet.</p>
										<button
											type="button"
											onClick={() => setShowLogMeetingModal(true)}
											className="mt-3 text-sm font-medium text-zinc-700 hover:text-zinc-900"
										>
											Log your first meeting →
										</button>
									</div>
								) : (
									<div className="relative">
										<div className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-200" />
										<div className="space-y-4">
											{projectConvos.map((c) => (
												<div key={c.id} className="relative flex gap-4 pl-10">
													<div className="absolute left-3 top-3 w-3.5 h-3.5 rounded-full bg-white border-2 border-zinc-300" />
													<div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4">
														<div className="flex flex-wrap items-center gap-2 mb-2">
															<h3 className="text-sm font-semibold text-zinc-900">{c.title}</h3>
															<span className="inline-flex items-center gap-1 text-xs text-zinc-400">
																<Calendar className="w-3 h-3" />
																{c.date}
															</span>
															<span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full">
																+{c.requirementsAdded} requirements
															</span>
														</div>
														<p className="text-sm text-zinc-600">{c.summary}</p>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{/* ── PAYMENTS ── */}
						{activeTab === "more" && advancedSubTab === "payments" && (
							<div className="space-y-6">
								<div>
									<h1 className="text-2xl font-bold text-zinc-900">Payment details</h1>
									<p className="text-sm text-zinc-500 mt-1">
										Configure how clients can pay. Included in the shareable link and downloaded PDF.
									</p>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900">Your business</h2>
									<div className="grid sm:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Business name</label>
											<input
												type="text"
												value={paymentDetails.businessName}
												onChange={(e) => handlePaymentField("businessName", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Business email</label>
											<input
												type="email"
												value={paymentDetails.businessEmail}
												onChange={(e) => handlePaymentField("businessEmail", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
									</div>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
										<Landmark className="w-4 h-4" />
										Bank transfer
									</h2>
									<div className="grid sm:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Bank name</label>
											<input
												type="text"
												placeholder="HDFC Bank, Chase, etc."
												value={paymentDetails.bankName}
												onChange={(e) => handlePaymentField("bankName", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Account holder name</label>
											<input
												type="text"
												value={paymentDetails.accountName}
												onChange={(e) => handlePaymentField("accountName", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">Account number</label>
											<input
												type="text"
												value={paymentDetails.accountNumber}
												onChange={(e) => handlePaymentField("accountNumber", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-zinc-500 mb-1">IFSC / SWIFT / Routing</label>
											<input
												type="text"
												placeholder="HDFC0001234 or SWIFT code"
												value={paymentDetails.ifscSwift}
												onChange={(e) => handlePaymentField("ifscSwift", e.target.value)}
												className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
											/>
										</div>
									</div>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
										<Wallet className="w-4 h-4" />
										UPI (India)
									</h2>
									<input
										type="text"
										placeholder="yourname@upi or phone UPI ID"
										value={paymentDetails.upiId}
										onChange={(e) => handlePaymentField("upiId", e.target.value)}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
										<CreditCard className="w-4 h-4" />
										Payment links
									</h2>
									<p className="text-xs text-zinc-500">Add checkout links from your payment provider — shown to client and in PDF.</p>
									<div className="space-y-3">
										{PAYMENT_LINK_FIELDS.map(({ key, label, placeholder }) => (
											<div key={key}>
												<label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
												<input
													type="url"
													placeholder={placeholder}
													value={paymentDetails[key]}
													onChange={(e) => handlePaymentField(key, e.target.value)}
													className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
												/>
											</div>
										))}
									</div>
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
									<div className="flex items-center justify-between">
										<h2 className="text-sm font-semibold text-zinc-900">Other payment links</h2>
										<button
											type="button"
											onClick={handleAddOtherPayment}
											className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
										>
											<Plus className="w-3.5 h-3.5" />
											Add
										</button>
									</div>
									{(paymentDetails.otherPayments || []).length === 0 ? (
										<p className="text-xs text-zinc-400">Gumroad, Wise, crypto wallet, custom invoice links, etc.</p>
									) : (
										<div className="space-y-3">
											{paymentDetails.otherPayments.map((p) => (
												<div key={p.id} className="flex gap-2">
													<input
														type="text"
														placeholder="Label (e.g. Wise)"
														value={p.label}
														onChange={(e) => handleUpdateOtherPayment(p.id, "label", e.target.value)}
														className="w-32 shrink-0 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
													/>
													<input
														type="url"
														placeholder="https://..."
														value={p.link}
														onChange={(e) => handleUpdateOtherPayment(p.id, "link", e.target.value)}
														className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
													/>
													<button
														type="button"
														onClick={() => handleRemoveOtherPayment(p.id)}
														className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="bg-white border border-zinc-200 rounded-xl p-5">
									<h2 className="text-sm font-semibold text-zinc-900 mb-3">Preview — client sees</h2>
									<PaymentMethodsSummary paymentDetails={paymentDetails} />
								</div>
							</div>
						)}

					</main>
				</div>

				{/* Share modal */}
				{showShareModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<button
							type="button"
							className="absolute inset-0 bg-zinc-200/40"
							onClick={() => setShowShareModal(false)}
							aria-label="Close"
						/>
						<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
							<button
								type="button"
								onClick={() => setShowShareModal(false)}
								className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-xl"
							>
								<X className="w-5 h-5" />
							</button>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
									<Link2 className="w-5 h-5 text-zinc-600" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-zinc-900">Share proposal draft</h3>
									<p className="text-xs text-zinc-500">Client can view, approve, or request changes</p>
								</div>
							</div>

							<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center gap-2 mb-4">
								<p className="flex-1 text-sm text-zinc-600 truncate">{shareUrl}</p>
								<button
									type="button"
									onClick={handleCopyLink}
									className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shrink-0"
								>
									{copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
									{copied ? "Copied" : "Copy"}
								</button>
							</div>

							<div className="space-y-2 text-xs text-zinc-500 mb-5">
								<p className="flex items-center gap-2">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
									Includes scope, brief, deliverables, timeline & pricing
								</p>
								<p className="flex items-center gap-2">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
									Payment options (bank, UPI, Stripe, Polar, etc.)
								</p>
								<p className="flex items-center gap-2">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
									Downloadable PDF with client signature for approval
								</p>
								<p className="flex items-center gap-2">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
									Client actions are logged — no email back-and-forth
								</p>
							</div>

							<button
								type="button"
								onClick={() => handleDownloadPDF()}
								className="w-full mb-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
							>
								<Download className="w-4 h-4" />
								Download PDF proposal
							</button>

							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => {
										setShowShareModal(false);
										openClientPreview();
									}}
									className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
								>
									<Eye className="w-4 h-4" />
									Preview
								</button>
								<button
									type="button"
									onClick={handleSendToClient}
									className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors"
								>
									<Send className="w-4 h-4" />
									Send to {project?.contact?.split(" ")[0]}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Client preview overlay */}
				{showClientPreview && (
					<div className="fixed inset-0 z-50 bg-zinc-100 overflow-y-auto">
						<div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
							<p className="text-xs font-medium text-amber-800">
								Preview — this is what {project?.contact} sees at the share link
							</p>
							<button
								type="button"
								onClick={() => setShowClientPreview(false)}
								className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded-xl transition-colors"
							>
								<X className="w-3.5 h-3.5" />
								Exit preview
							</button>
						</div>

						<div className="max-w-2xl mx-auto px-4 py-8">
							<div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
								<div className="px-6 py-8 border-b border-zinc-100 text-center">
									<p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Project Proposal</p>
									<h1 className="text-2xl font-bold text-zinc-900">{project?.name}</h1>
									<p className="text-sm text-zinc-500 mt-1">Prepared for {project?.client}</p>
									{activeProposal && (
										<p className="text-xs font-medium text-zinc-400 mt-2 uppercase tracking-wider">
											{activeProposal.title} · v{activeProposal.version}
										</p>
									)}
								</div>

								<div className="px-6 py-6 space-y-6">
									<div className="grid grid-cols-3 gap-4 text-center">
										<div className="p-3 bg-zinc-50 rounded-xl">
											<p className="text-xs text-zinc-400">Investment</p>
											<p className="text-lg font-bold text-zinc-900 mt-0.5">{fmt(totalCost)}</p>
										</div>
										<div className="p-3 bg-zinc-50 rounded-xl">
											<p className="text-xs text-zinc-400">Timeline</p>
											<p className="text-lg font-bold text-zinc-900 mt-0.5">{activeProposal?.weeks ?? project?.weeks} weeks</p>
										</div>
										<div className="p-3 bg-zinc-50 rounded-xl">
											<p className="text-xs text-zinc-400">Scope items</p>
											<p className="text-lg font-bold text-zinc-900 mt-0.5">{confirmedCount}</p>
										</div>
									</div>

									{projectBrief.goals && (
										<div>
											<h2 className="text-sm font-semibold text-zinc-900 mb-2">Project brief</h2>
											<p className="text-sm text-zinc-600">{projectBrief.goals}</p>
											{projectBrief.deliverablesSummary && (
												<p className="text-xs text-zinc-500 mt-2">{projectBrief.deliverablesSummary}</p>
											)}
										</div>
									)}

									<div>
										<h2 className="text-sm font-semibold text-zinc-900 mb-2">Scope of work</h2>
										<ul className="space-y-1.5">
											{projectReqs
												.filter((r) => r.status === "confirmed" && r.category !== "out")
												.map((r) => (
													<li key={r.id} className="flex items-center gap-2 text-sm text-zinc-600">
														<Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
														{r.title}
													</li>
												))}
										</ul>
									</div>

									<div>
										<h2 className="text-sm font-semibold text-zinc-900 mb-2">
											{categoryConfig?.deliverablesLabel || "Deliverables"}
										</h2>
										<div className="flex flex-wrap gap-2">
											{projectTech
												.filter((t) => t.status === "locked")
												.map((t) => (
													<span key={t.id} className="text-xs font-medium px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full">
														{t.name}
													</span>
												))}
										</div>
									</div>

									<div>
										<h2 className="text-sm font-semibold text-zinc-900 mb-2">Cost breakdown</h2>
										<div className="border border-zinc-100 rounded-xl divide-y divide-zinc-100">
											{projectLines.map((line) => (
												<div key={line.id} className="px-4 py-2.5 flex justify-between gap-4 text-sm">
													<div className="min-w-0">
														<p className="text-zinc-900 font-medium">{line.label}</p>
														{line.description && (
															<p className="text-xs text-zinc-400 mt-0.5">{line.description}</p>
														)}
														<p className="text-xs text-zinc-400 mt-0.5">
															{line.hours}h × {fmt(line.rate)}/hr
														</p>
													</div>
													<span className="font-medium text-zinc-900 shrink-0">{fmt(line.hours * line.rate)}</span>
												</div>
											))}
											<div className="px-4 py-3 flex justify-between bg-zinc-50">
												<span className="text-sm font-semibold text-zinc-900">Total ({projectCurrency})</span>
												<span className="text-sm font-bold text-zinc-900">{fmt(totalCost)}</span>
											</div>
										</div>
									</div>

									<div>
										<h2 className="text-sm font-semibold text-zinc-900 mb-2">Payment options</h2>
										<PaymentMethodsSummary paymentDetails={paymentDetails} compact />
									</div>

									<div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50">
										<h2 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-2">
											<PenLine className="w-4 h-4" />
											Sign to approve
										</h2>
										<p className="text-xs text-zinc-500 mb-3">
											By signing, you agree to the scope, timeline, deliverables, and pricing above.
										</p>
										{proposalSignature?.dataUrl && activeProposal?.status === "approved" ? (
											<div className="space-y-2">
												<img
													src={proposalSignature.dataUrl}
													alt="Client signature"
													className="h-20 border border-zinc-200 rounded-xl bg-white p-2"
												/>
												<p className="text-xs text-emerald-600 font-medium">
													Signed by {proposalSignature.signerName} on {proposalSignature.signedAt}
												</p>
											</div>
										) : (
											<div className="space-y-3">
												<input
													type="text"
													placeholder="Your full name"
													value={signerName}
													onChange={(e) => setSignerName(e.target.value)}
													className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-100"
												/>
												<SignaturePad onSignatureChange={setPendingSignature} />
												{approvalError && (
													<p className="text-xs text-red-600 flex items-center gap-1">
														<AlertCircle className="w-3.5 h-3.5" />
														{approvalError}
													</p>
												)}
											</div>
										)}
									</div>

									<button
										type="button"
										onClick={() => handleDownloadPDF(pendingSignature ? { dataUrl: pendingSignature, signerName, signedAt: todayLabel() } : proposalSignature)}
										className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
									>
										<Download className="w-4 h-4" />
										Download PDF
									</button>
								</div>

								<div className="px-6 py-5 border-t border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row gap-2">
									<button
										type="button"
										onClick={handleClientApprove}
										className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
									>
										<CheckCircle2 className="w-4 h-4" />
										Approve proposal
									</button>
									<button
										type="button"
										onClick={handleClientRevision}
										className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
									>
										<MessageSquare className="w-4 h-4" />
										Request changes
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* New project modal */}
				{showNewProjectModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<button
							type="button"
							className="absolute inset-0 bg-zinc-200/40"
							onClick={() => setShowNewProjectModal(false)}
							aria-label="Close"
						/>
						<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
							<button
								type="button"
								onClick={() => setShowNewProjectModal(false)}
								className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-xl"
							>
								<X className="w-5 h-5" />
							</button>
							<div className="flex items-center gap-3 mb-5">
								<div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
									<Plus className="w-5 h-5 text-zinc-600" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-zinc-900">New proposal</h3>
									<p className="text-xs text-zinc-500">Start blank — fill with AI or edit on the editor page</p>
								</div>
							</div>

							<form onSubmit={handleCreateProject} className="space-y-4">
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-2">Project category *</label>
									<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
										{PROJECT_CATEGORIES.map((cat) => {
											const Icon = cat.icon;
											const selected = newProjectForm.category === cat.id;
											return (
												<button
													key={cat.id}
													type="button"
													onClick={() => setNewProjectForm((f) => ({ ...f, category: cat.id }))}
													className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-colors ${
														selected
															? "bg-zinc-200 text-zinc-800 border-zinc-200"
															: "border-zinc-200 hover:border-zinc-300 text-zinc-700"
													}`}
												>
													<Icon className="w-3.5 h-3.5 shrink-0" />
													<span className="font-medium leading-tight">{cat.label}</span>
												</button>
											);
										})}
									</div>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Project name *</label>
									<input
										type="text"
										required
										placeholder="e.g. E-commerce Redesign"
										value={newProjectForm.name}
										onChange={(e) => setNewProjectForm((f) => ({ ...f, name: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Client company *</label>
									<input
										type="text"
										required
										placeholder="e.g. Bloom & Co."
										value={newProjectForm.client}
										onChange={(e) => setNewProjectForm((f) => ({ ...f, client: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Contact name</label>
										<input
											type="text"
											placeholder="Sarah Mitchell"
											value={newProjectForm.contact}
											onChange={(e) => setNewProjectForm((f) => ({ ...f, contact: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
										<input
											type="email"
											placeholder="client@company.com"
											value={newProjectForm.email}
											onChange={(e) => setNewProjectForm((f) => ({ ...f, email: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Pricing model</label>
										<select
											value={newProjectForm.pricingModel}
											onChange={(e) => setNewProjectForm((f) => ({ ...f, pricingModel: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-100"
										>
											{PRICING_MODELS.map((m) => (
												<option key={m.id} value={m.id}>
													{m.label}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-xs font-medium text-zinc-500 mb-1">Rate / budget ($)</label>
										<input
											type="number"
											min="1"
											value={newProjectForm.hourlyRate}
											onChange={(e) => setNewProjectForm((f) => ({ ...f, hourlyRate: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
										/>
									</div>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Est. weeks</label>
									<input
										type="number"
										min="1"
										value={newProjectForm.weeks}
										onChange={(e) => setNewProjectForm((f) => ({ ...f, weeks: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>
								<div className="flex gap-2 pt-2">
									<button
										type="button"
										onClick={() => setShowNewProjectModal(false)}
										className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors"
									>
										Create proposal
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Log meeting modal */}
				{showLogMeetingModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<button
							type="button"
							className="absolute inset-0 bg-zinc-200/40"
							onClick={() => setShowLogMeetingModal(false)}
							aria-label="Close"
						/>
						<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
							<button
								type="button"
								onClick={() => setShowLogMeetingModal(false)}
								className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-xl"
							>
								<X className="w-5 h-5" />
							</button>
							<div className="flex items-center gap-3 mb-5">
								<div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
									<MessageSquare className="w-5 h-5 text-zinc-600" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-zinc-900">Log meeting</h3>
									<p className="text-xs text-zinc-500">Record what was discussed with {project?.client}</p>
								</div>
							</div>

							<form onSubmit={handleLogMeeting} className="space-y-4">
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Title *</label>
									<input
										type="text"
										required
										placeholder="e.g. Kickoff call"
										value={meetingForm.title}
										onChange={(e) => setMeetingForm((f) => ({ ...f, title: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
									<input
										type="text"
										placeholder="Mar 20, 2026"
										value={meetingForm.date}
										onChange={(e) => setMeetingForm((f) => ({ ...f, date: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Summary *</label>
									<textarea
										required
										rows={4}
										placeholder="What was discussed, decisions made, open questions..."
										value={meetingForm.summary}
										onChange={(e) => setMeetingForm((f) => ({ ...f, summary: e.target.value }))}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100 resize-none"
									/>
								</div>
								<div className="flex gap-2 pt-2">
									<button
										type="button"
										onClick={() => setShowLogMeetingModal(false)}
										className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors"
									>
										Save meeting
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* New proposal modal */}
				{showNewProposalModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<button
							type="button"
							className="absolute inset-0 bg-zinc-200/40"
							onClick={() => setShowNewProposalModal(false)}
							aria-label="Close"
						/>
						<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
							<button
								type="button"
								onClick={() => setShowNewProposalModal(false)}
								className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-xl"
							>
								<X className="w-5 h-5" />
							</button>
							<div className="flex items-center gap-3 mb-5">
								<div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
									<Files className="w-5 h-5 text-zinc-600" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-zinc-900">New proposal</h3>
									<p className="text-xs text-zinc-500">
										For {project?.client} — proposal v{(projectProposals.length || 0) + 1}
									</p>
								</div>
							</div>
							<form onSubmit={(e) => handleCreateProposal(e, false)} className="space-y-4">
								<div>
									<label className="block text-xs font-medium text-zinc-500 mb-1">Proposal title</label>
									<input
										type="text"
										placeholder={`Proposal v${(projectProposals.length || 0) + 1}`}
										value={newProposalTitle}
										onChange={(e) => setNewProposalTitle(e.target.value)}
										className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
									/>
								</div>
								<p className="text-xs text-zinc-500">
									Starts with a blank pricing sheet. Use &ldquo;Duplicate as revision&rdquo; to copy the active proposal.
								</p>
								<div className="flex gap-2 pt-2">
									<button
										type="button"
										onClick={() => setShowNewProposalModal(false)}
										className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors"
									>
										Create proposal
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default PreviewPage;
