import { VIDEO_TOOLS_TABS } from "../ui/VideoToolsTabBar";

export const FEEDBACK_BONUS_MINUTES = 1;

export const FEEDBACK_TOOL_OPTIONS = [
	...VIDEO_TOOLS_TABS.map(({ id, label }) => ({ value: id, label })),
	{ value: "blog", label: "Blog to video" },
];

export const FEEDBACK_REFERRAL_OPTIONS = [
	{ value: "producthunt", label: "Product Hunt" },
	{ value: "x", label: "X (Twitter)" },
	{ value: "reddit", label: "Reddit" },
	{ value: "youtube", label: "YouTube" },
	{ value: "medium", label: "Medium" },
	{ value: "email", label: "Email" },
	{ value: "other", label: "Other" },
];
