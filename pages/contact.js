import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { getCanonicalUrl } from "../lib/config/seo";

const CONTACT_EMAIL = "shreyvijayvargiya26@gmail.com";
const X_PROFILE_URL = "https://x.com/treyvijay";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aantraa.video";

const ContactPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/contact/send", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Message sent! We'll get back to you soon.");
				setFormData({ name: "", email: "", subject: "", message: "" });
			} else {
				throw new Error(data.error || "Failed to send message");
			}
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(error.message || "Failed to send message. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const title = "Contact — aantraa";
	const description =
		"Get in touch with aantraa for support, pricing, agency APIs, or partnership questions.";

	return (
		<>
			<Head>
				<title>{title}</title>
				<meta name="description" content={description} />
				<meta
					name="keywords"
					content="contact aantraa, support, video translation help, agency API"
				/>
				<link rel="canonical" href={getCanonicalUrl("/contact", SITE_URL)} />
				<meta name="robots" content="index, follow" />
				<meta property="og:site_name" content="aantraa" />
				<meta property="og:type" content="website" />
				<meta property="og:url" content={getCanonicalUrl("/contact", SITE_URL)} />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={`${SITE_URL}/aantraa-banner.png`} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:site" content="@aantraa_ai" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={description} />
			</Head>
			<div className="min-h-screen flex flex-col bg-white">
				<Navbar />

				<section className="flex-1 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
					<div className="max-w-4xl mx-auto">
						<div className="text-center mb-12">
							<h1 className="aantraa-font text-4xl sm:text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
								Get in touch
							</h1>
							<p className="text-lg text-zinc-600 max-w-xl mx-auto leading-relaxed">
								Questions about translation, pricing, or agency APIs? Reach out —
								we typically reply within one business day.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-6">
								<div className="p-6 bg-white border border-zinc-200 rounded-xl hover:border-orange-200 transition-colors">
									<div className="flex items-start gap-4">
										<div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
											<Mail className="w-5 h-5" />
										</div>
										<div>
											<h3 className="font-semibold text-zinc-900 mb-1">Email</h3>
											<a
												href={`mailto:${CONTACT_EMAIL}`}
												className="text-sm text-orange-600 hover:text-orange-700 font-medium break-all"
											>
												{CONTACT_EMAIL}
											</a>
										</div>
									</div>
								</div>

								<div className="p-6 bg-white border border-zinc-200 rounded-xl hover:border-orange-200 transition-colors">
									<div className="flex items-start gap-4">
										<div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
											<MessageSquare className="w-5 h-5" />
										</div>
										<div>
											<h3 className="font-semibold text-zinc-900 mb-1">X (Twitter)</h3>
											<a
												href={X_PROFILE_URL}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-orange-600 hover:text-orange-700 font-medium"
											>
												@treyvijay
											</a>
										</div>
									</div>
								</div>

								<div className="p-6 bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl">
									<p className="text-sm text-zinc-600 leading-relaxed">
										For B2B agency integrations and API early access, mention your
										use case in the form — we&apos;re onboarding partners now.
									</p>
									<Link
										href="/blog/ai-audio-video-translation-free-credits-pricing-and-contact"
										className="inline-block mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
									>
										Read about pricing &amp; APIs →
									</Link>
								</div>
							</div>

							<form
								onSubmit={handleSubmit}
								className="p-6 sm:p-8 bg-white border border-zinc-200 rounded-xl shadow-sm shadow-black/5 space-y-4"
							>
								<div>
									<label
										htmlFor="contact-name"
										className="block text-sm font-medium text-zinc-900 mb-1"
									>
										Name
									</label>
									<input
										id="contact-name"
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										required
										className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
									/>
								</div>
								<div>
									<label
										htmlFor="contact-email"
										className="block text-sm font-medium text-zinc-900 mb-1"
									>
										Email
									</label>
									<input
										id="contact-email"
										type="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										required
										className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
									/>
								</div>
								<div>
									<label
										htmlFor="contact-subject"
										className="block text-sm font-medium text-zinc-900 mb-1"
									>
										Subject
									</label>
									<input
										id="contact-subject"
										type="text"
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										required
										className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
									/>
								</div>
								<div>
									<label
										htmlFor="contact-message"
										className="block text-sm font-medium text-zinc-900 mb-1"
									>
										Message
									</label>
									<textarea
										id="contact-message"
										name="message"
										value={formData.message}
										onChange={handleChange}
										required
										rows={5}
										className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 resize-y"
									/>
								</div>
								<motion.button
									type="submit"
									disabled={isSubmitting}
									whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
									whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
									className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
								>
									<Send className="w-4 h-4" />
									{isSubmitting ? "Sending..." : "Send message"}
								</motion.button>
							</form>
						</div>
					</div>
				</section>

				<Footer />
			</div>
		</>
	);
};

export default ContactPage;
