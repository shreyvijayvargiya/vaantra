import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../app/components/Navbar";
import Footer from "../../app/components/Footer";
import BlogMarkdown from "../../app/components/BlogMarkdown";
import {
	Calendar,
	ArrowLeft,
	Copy,
	Link as LinkIcon,
	Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
	getStaticBlogBySlug,
	getAllStaticBlogSlugs,
} from "../../lib/blogs/staticBlogs";
import { getCanonicalUrl } from "../../lib/config/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aantraa.site";

export default function BlogPostPage({ blog }) {
	if (!blog) {
		return (
			<>
				<Head>
					<title>Article not found — aantraa Blog</title>
					<meta name="robots" content="noindex, nofollow" />
				</Head>
				<div className="min-h-screen flex flex-col bg-white">
					<Navbar />
					<div className="flex-1 flex items-center justify-center px-4">
						<div className="text-center">
							<h1 className="aantraa-font text-2xl font-bold text-zinc-900 mb-4">
								Article not found
							</h1>
							<Link
								href="/blog"
								className="text-orange-600 hover:text-orange-700 font-medium"
							>
								Back to blog
							</Link>
						</div>
					</div>
					<Footer />
				</div>
			</>
		);
	}

	const formatDate = (date) => {
		if (!date) return "";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const pageTitle = `${blog.title} — aantraa Blog`;
	const description = blog.description || blog.title;
	const canonicalPath = `/blog/${blog.slug}`;
	const canonicalUrl = getCanonicalUrl(canonicalPath, SITE_URL);
	const ogImage = blog.ogImage || blog.bannerImage || `${SITE_URL}/aantraa-banner.png`;

	const copyMarkdown = async () => {
		try {
			await navigator.clipboard.writeText(blog.content);
			toast.success("Markdown copied to clipboard!");
		} catch {
			toast.error("Failed to copy markdown");
		}
	};

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(canonicalUrl);
			toast.success("Link copied to clipboard!");
		} catch {
			toast.error("Failed to copy link");
		}
	};

	return (
		<>
			<Head>
				<title>{pageTitle}</title>
				<meta name="description" content={description} />
				{blog.tags?.length > 0 && (
					<meta name="keywords" content={blog.tags.join(", ")} />
				)}
				<link rel="canonical" href={canonicalUrl} />
				<meta name="robots" content="index, follow" />
				<meta property="og:site_name" content="aantraa" />
				<meta property="og:type" content="article" />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:title" content={blog.title} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={ogImage} />
				<meta
					property="og:image:alt"
					content={blog.title}
				/>
				{blog.publishedAt && (
					<meta
						property="article:published_time"
						content={new Date(blog.publishedAt).toISOString()}
					/>
				)}
				{blog.author && (
					<meta property="article:author" content={blog.author} />
				)}
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:site" content="@aantraa_ai" />
				<meta name="twitter:title" content={blog.title} />
				<meta name="twitter:description" content={description} />
				<meta name="twitter:image" content={ogImage} />
			</Head>
			<div className="min-h-screen flex flex-col bg-white">
				<Navbar />

				<article className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
					<div className="max-w-3xl mx-auto">
						<Link
							href="/blog"
							className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-orange-600 mb-8 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to blog
						</Link>

						{blog.bannerImage ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={blog.bannerImage}
								alt={blog.title}
								className="w-full h-64 sm:h-80 object-cover rounded-xl mb-8 border border-zinc-200"
							/>
						) : (
							<div className="w-full h-48 sm:h-56 rounded-xl mb-8 bg-gradient-to-br from-orange-50 via-white to-zinc-100 border border-zinc-200 flex items-center justify-center px-8">
								<p className="aantraa-font text-center text-2xl sm:text-3xl font-bold text-zinc-800 tracking-tight leading-tight">
									{blog.title}
								</p>
							</div>
						)}

						<div className="flex items-center justify-between flex-wrap gap-3 mb-6">
							<div className="flex items-center flex-wrap gap-2 text-sm text-zinc-500">
								<Calendar className="w-4 h-4" />
								<time dateTime={blog.publishedAt}>
									{formatDate(blog.publishedAt)}
								</time>
								{blog.author && (
									<>
										<span aria-hidden>•</span>
										<span>{blog.author}</span>
									</>
								)}
							</div>
							<div className="flex items-center gap-2">
								<motion.button
									type="button"
									whileHover={{ scale: 1.03 }}
									whileTap={{ scale: 0.97 }}
									onClick={copyMarkdown}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors text-xs font-medium"
									title="Copy Markdown"
								>
									<Copy className="w-3.5 h-3.5" />
									Copy Markdown
								</motion.button>
								<motion.button
									type="button"
									whileHover={{ scale: 1.03 }}
									whileTap={{ scale: 0.97 }}
									onClick={copyLink}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl transition-colors text-xs font-medium"
									title="Copy link"
								>
									<LinkIcon className="w-3.5 h-3.5" />
									Copy link
								</motion.button>
							</div>
						</div>

						<h1 className="aantraa-font text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 tracking-tight leading-tight">
							{blog.title}
						</h1>

						{blog.description && (
							<p className="text-lg text-zinc-600 leading-relaxed mb-6 border-l-4 border-orange-400 pl-4">
								{blog.description}
							</p>
						)}

						{blog.tags?.length > 0 && (
							<div className="flex flex-wrap gap-2 mb-8">
								{blog.tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium"
									>
										<Tag className="w-3 h-3" />
										{tag}
									</span>
								))}
							</div>
						)}

						<BlogMarkdown content={blog.content} />
					</div>
				</article>

				<Footer />
			</div>
		</>
	);
}

export async function getStaticPaths() {
	const slugs = getAllStaticBlogSlugs();
	return {
		paths: slugs.map((slug) => ({ params: { slug } })),
		fallback: false,
	};
}

export async function getStaticProps({ params }) {
	const blog = getStaticBlogBySlug(params.slug);
	if (!blog) {
		return { notFound: true };
	}

	const { content, ...meta } = blog;
	return {
		props: {
			blog: { ...meta, content },
		},
	};
}
