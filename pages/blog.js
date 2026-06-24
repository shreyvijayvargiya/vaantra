import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Search, Tag } from "lucide-react";
import { getStaticBlogsList } from "../lib/blogs/staticBlogs";
import { getCanonicalUrl } from "../lib/config/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aantraa.site";

export default function BlogPage({ blogs }) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredBlogs = blogs.filter((blog) => {
		const q = searchQuery.toLowerCase();
		return (
			blog.title?.toLowerCase().includes(q) ||
			blog.description?.toLowerCase().includes(q) ||
			blog.tags?.some((tag) => tag.toLowerCase().includes(q))
		);
	});

	const formatDate = (date) => {
		if (!date) return "";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const title = "Blog — aantraa";
	const description =
		"Articles on AI audio and video translation, free starter credits, usage-based pricing, and product updates from aantraa.";

	return (
		<>
			<Head>
				<title>{title}</title>
				<meta name="description" content={description} />
				<meta
					name="keywords"
					content="aantraa blog, video translation, audio translation, AI dubbing, free credits, pricing"
				/>
				<link rel="canonical" href={getCanonicalUrl("/blog", SITE_URL)} />
				<meta name="robots" content="index, follow" />
				<meta property="og:site_name" content="aantraa" />
				<meta property="og:type" content="website" />
				<meta property="og:url" content={getCanonicalUrl("/blog", SITE_URL)} />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={`${SITE_URL}/aantraa-banner.png`} />
				<meta property="og:image:width" content="3780" />
				<meta property="og:image:height" content="1890" />
				<meta
					property="og:image:alt"
					content="aantraa — AI Video & Voice Translation"
				/>
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:site" content="@aantraa_ai" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={description} />
				<meta name="twitter:image" content={`${SITE_URL}/aantraa-banner.png`} />
			</Head>
			<div className="min-h-screen flex flex-col bg-white">
				<Navbar />

				<section className="flex-1 py-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-200/80">
					<div className="max-w-5xl mx-auto">
						<div className="text-center mb-12">
							<h1 className="aantraa-font text-4xl sm:text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
								Blog
							</h1>
							<p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
								Insights on AI audio &amp; video translation, pricing, and
								product updates from{" "}
								<span className="text-orange-600 font-medium">aantraa</span>
							</p>
						</div>

						<div className="flex justify-end mb-8">
							<div className="relative w-full sm:w-auto">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
								<input
									type="search"
									placeholder="Search articles..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full sm:min-w-[280px] pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 text-sm"
								/>
							</div>
						</div>

						{filteredBlogs.length === 0 ? (
							<div className="text-center py-16 text-zinc-600 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
								{searchQuery
									? "No articles match your search."
									: "No articles yet. Check back soon!"}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{filteredBlogs.map((blog, index) => (
									<motion.article
										key={blog.slug}
										initial={{ opacity: 0, y: 16 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										transition={{ delay: index * 0.08 }}
										className="flex flex-col overflow-hidden bg-white border border-zinc-200 rounded-xl hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
									>
										{blog.bannerImage ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={blog.bannerImage}
												alt={blog.title}
												className="w-full h-48 object-cover"
											/>
										) : (
											<div className="w-full h-48 bg-gradient-to-br from-orange-50 via-white to-zinc-100 border-b border-zinc-100 flex items-center justify-center px-6">
												<p className="aantraa-font text-center text-lg font-semibold text-zinc-700 leading-snug">
													{blog.title}
												</p>
											</div>
										)}

										<div className="flex flex-col flex-1 p-6">
											<div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
												<Calendar className="w-3.5 h-3.5" />
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

											<h2 className="aantraa-font text-xl font-bold text-zinc-900 mb-2 tracking-tight">
												{blog.title}
											</h2>

											{blog.description && (
												<p className="text-sm text-zinc-600 leading-relaxed mb-4 flex-1 line-clamp-3">
													{blog.description}
												</p>
											)}

											{blog.tags?.length > 0 && (
												<div className="flex flex-wrap gap-2 mb-4">
													{blog.tags.slice(0, 3).map((tag) => (
														<span
															key={tag}
															className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs"
														>
															<Tag className="w-3 h-3" />
															{tag}
														</span>
													))}
												</div>
											)}

											<Link
												href={`/blog/${blog.slug}`}
												className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors mt-auto"
											>
												Read article
												<ArrowRight className="w-4 h-4" />
											</Link>
										</div>
									</motion.article>
								))}
							</div>
						)}
					</div>
				</section>

				<Footer />
			</div>
		</>
	);
}

export async function getStaticProps() {
	const blogs = getStaticBlogsList();
	return {
		props: { blogs },
	};
}
