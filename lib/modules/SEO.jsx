import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSEOConfig, getCanonicalUrl } from "../config/seo";

/**
 * SEO Component
 * Automatically applies SEO tags based on the current route
 * Uses the centralized SEO_CONFIG for easy management
 */
const SEO = ({ customSEO = null }) => {
	const router = useRouter();
	const seoConfig = customSEO || getSEOConfig(router.pathname);
	const canonicalUrl = getCanonicalUrl(router.asPath);

	return (
		<Head>
			{/* Basic Meta Tags */}
			<title>{seoConfig.title}</title>
			<meta name="description" content={seoConfig.description} />
			{seoConfig.keywords && (
				<meta name="keywords" content={seoConfig.keywords} />
			)}

			{/* Canonical URL */}
			<link rel="canonical" href={canonicalUrl} />

			{/* Robots */}
			{seoConfig.noindex ? (
				<meta name="robots" content="noindex, nofollow" />
			) : (
				<meta name="robots" content="index, follow" />
			)}

		{/* Open Graph — Facebook, LinkedIn, WhatsApp, Discord */}
		<meta property="og:site_name" content="aantraa" />
		<meta property="og:type" content={seoConfig.ogType || "website"} />
		<meta property="og:url" content={canonicalUrl} />
		<meta property="og:title" content={seoConfig.title} />
		<meta property="og:description" content={seoConfig.description} />
		{seoConfig.ogImage && (
			<meta property="og:image" content={seoConfig.ogImage} />
		)}
		{seoConfig.ogImageWidth && (
			<meta property="og:image:width" content={String(seoConfig.ogImageWidth)} />
		)}
		{seoConfig.ogImageHeight && (
			<meta property="og:image:height" content={String(seoConfig.ogImageHeight)} />
		)}
		{seoConfig.ogImageAlt && (
			<meta property="og:image:alt" content={seoConfig.ogImageAlt} />
		)}

		{/* Twitter / X */}
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:site" content="@aantraa_ai" />
		<meta name="twitter:url" content={canonicalUrl} />
		<meta name="twitter:title" content={seoConfig.title} />
		<meta name="twitter:description" content={seoConfig.description} />
		{seoConfig.ogImage && (
			<meta name="twitter:image" content={seoConfig.ogImage} />
		)}
		{seoConfig.ogImageAlt && (
			<meta name="twitter:image:alt" content={seoConfig.ogImageAlt} />
		)}

			{/* Additional Meta Tags */}
			{seoConfig.author && <meta name="author" content={seoConfig.author} />}
			{seoConfig.viewport && (
				<meta name="viewport" content={seoConfig.viewport} />
			)}
		</Head>
	);
};

export default SEO;

