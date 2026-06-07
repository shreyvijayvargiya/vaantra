/**
 * Centralized SEO Configuration
 *
 * Add or modify routes here to automatically set SEO tags.
 * Routes are matched in order - more specific routes should come first.
 *
 * Supported patterns:
 * - Exact match: "/pricing" matches only /pricing
 * - Nested routes: "/blog/*" matches /blog, /blog/[slug], /blog/id/[id], etc.
 * - Wildcard: "*" matches all routes (use as fallback)
 *
 * @example
 * {
 *   path: "/pricing",
 *   title: "Pricing - My SaaS",
 *   description: "Choose the perfect plan for your needs",
 *   keywords: "pricing, plans, subscription",
 *   ogImage: "/og-pricing.png"
 * }
 */

const BANNER = {
	ogImage: "/aantraa-banner.png",
	ogImageWidth: 3780,
	ogImageHeight: 1890,
	ogImageAlt: "aantraa — AI Video & Voice Translation",
};

export const SEO_CONFIG = {
	// Homepage
	"/": {
		title: "aantraa — AI Video & Voice Translation",
		description:
			"Dub videos or translate audio and text into 90+ languages with voice cloning. Run multiple translation jobs and target languages in parallel.",
		keywords:
			"video translation, audio translation, voice dubbing, multilingual, AI translation, parallel translation",
		ogType: "website",
		...BANNER,
	},

	// Pricing
	"/pricing": {
		title: "Pricing — aantraa (usage-based)",
		description:
			"Pay only for translation minutes. Top up and dub video or voice in 90+ languages.",
		keywords: "usage-based pricing, translation minutes, video dubbing, polar",
		ogType: "website",
		...BANNER,
	},

	"/login": {
		title: "Sign in — aantraa",
		description:
			"Sign in with Google to manage video and voice translation jobs on aantraa.",
		keywords: "login, sign in, Google, aantraa",
		ogType: "website",
		...BANNER,
	},

	"/account": {
		title: "Account — aantraa",
		description:
			"Manage your aantraa profile, usage, and one-time starter minutes.",
		keywords: "account, profile, usage",
		ogType: "website",
		noindex: true,
		...BANNER,
	},

	// Features
	"/features": {
		title: "Features - SAAS Starter",
		description:
			"Discover all the powerful features included in our SaaS boilerplate. Authentication, payments, admin panel, and more.",
		keywords: "features, saas features, boilerplate features",
		ogImage: "/og-features.png",
		ogType: "website",
	},

	// Documentation
	"/docs": {
		title: "Documentation - SAAS Starter",
		description:
			"Complete documentation for SAAS Starter. Learn how to set up, configure, and deploy your SaaS application.",
		keywords: "documentation, docs, saas documentation, setup guide",
		ogImage: "/og-docs.png",
		ogType: "website",
	},

	// Builder
	"/builder": {
		title: "Build Your SaaS - SAAS Starter",
		description:
			"Configure your SaaS application and generate your repository setup. Customize Firebase, Stripe, and deployment settings.",
		keywords: "builder, saas builder, configuration, setup",
		ogImage: "/og-builder.png",
		ogType: "website",
	},

	// Blog routes (nested)
	"/blog/*": {
		title: "Blog - SAAS Starter",
		description:
			"Read our latest articles, tutorials, and updates about SaaS development, best practices, and industry insights.",
		keywords: "blog, articles, saas blog, tutorials",
		ogImage: "/og-blog.png",
		ogType: "article",
	},

	// Contact
	"/contact": {
		title: "Contact Us - SAAS Starter",
		description:
			"Get in touch with us. We're here to help you build your SaaS application.",
		keywords: "contact, support, help, saas support",
		ogImage: "/og-contact.png",
		ogType: "website",
	},

	// 404 Error Page
	"/404": {
		title: "404 - Page Not Found - SAAS Starter",
		description: "The page you are looking for does not exist.",
		keywords: "404, page not found, error",
		ogImage: "/og-default.png",
		ogType: "website",
		noindex: true, // Hide 404 pages from search engines
	},

	// Admin routes (nested)
	"/admin/*": {
		title: "Admin Dashboard - SAAS Starter",
		description: "Admin dashboard for managing your SaaS application.",
		keywords: "admin, dashboard, management",
		ogImage: "/og-admin.png",
		ogType: "website",
		noindex: true, // Hide admin routes from search engines
	},

	// Default/fallback for all other routes
	"*": {
		title: "aantraa — AI Video & Voice Translation",
		description:
			"Dub videos or translate audio and text into 90+ languages. Voice cloning, parallel jobs, and fast turnaround.",
		keywords:
			"video translation, audio translation, voice dubbing, multilingual, AI translation",
		ogType: "website",
		...BANNER,
	},
};

/**
 * Get SEO config for a specific path
 * @param {string} pathname - The current pathname
 * @returns {object} SEO configuration object
 */
export const getSEOConfig = (pathname) => {
	// Try exact match first
	if (SEO_CONFIG[pathname]) {
		return SEO_CONFIG[pathname];
	}

	// Try nested route patterns (e.g., "/blog/*")
	for (const [pattern, config] of Object.entries(SEO_CONFIG)) {
		if (pattern.includes("*")) {
			const basePath = pattern.replace("/*", "");
			if (pathname.startsWith(basePath)) {
				return config;
			}
		}
	}

	// Fallback to wildcard
	return SEO_CONFIG["*"] || {};
};

/**
 * Get canonical URL for a path
 * @param {string} pathname - The current pathname
 * @param {string} baseUrl - Base URL of the site (optional)
 * @returns {string} Canonical URL
 */
export const getCanonicalUrl = (pathname, baseUrl = "") => {
	if (!baseUrl) {
		// Try to get from environment or use current origin
		if (typeof window !== "undefined") {
			baseUrl = window.location.origin;
		} else {
			baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
		}
	}
	return `${baseUrl}${pathname}`;
};
