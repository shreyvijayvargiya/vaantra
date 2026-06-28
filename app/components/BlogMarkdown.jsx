import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const CodeBlock = ({ language, children }) => {
	const [copied, setCopied] = useState(false);
	const codeString = String(children).replace(/\n$/, "");

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(codeString);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Code copied to clipboard!");
		} catch {
			toast.error("Failed to copy code");
		}
	};

	return (
		<div className="relative group mb-4">
			<div className="absolute top-2 right-2 z-10">
				<motion.button
					type="button"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleCopy}
					className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
						copied
							? "bg-green-100 text-green-700"
							: "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
					}`}
				>
					{copied ? (
						<>
							<Check className="w-3 h-3" />
							Copied
						</>
					) : (
						<>
							<Copy className="w-3 h-3" />
							Copy
						</>
					)}
				</motion.button>
			</div>
			<pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
				<code className={`font-mono block whitespace-pre ${language ? `language-${language}` : ""}`}>
					{codeString}
				</code>
			</pre>
		</div>
	);
};

const markdownComponents = {
	h1: ({ ...props }) => (
		<h1
			className="aantraa-font text-3xl font-bold text-zinc-900 mb-4 mt-8 tracking-tight"
			{...props}
		/>
	),
	h2: ({ ...props }) => (
		<h2
			className="aantraa-font text-2xl font-bold text-zinc-900 mb-3 mt-8 tracking-tight"
			{...props}
		/>
	),
	h3: ({ ...props }) => (
		<h3 className="text-xl font-semibold text-zinc-900 mb-2 mt-6" {...props} />
	),
	h4: ({ ...props }) => (
		<h4 className="text-lg font-semibold text-zinc-900 mb-2 mt-4" {...props} />
	),
	p: ({ ...props }) => (
		<p className="text-zinc-700 mb-4 leading-7 text-base" {...props} />
	),
	ul: ({ ...props }) => (
		<ul
			className="list-disc list-outside mb-4 space-y-2 text-zinc-700 text-base ml-6 pl-2"
			{...props}
		/>
	),
	ol: ({ ...props }) => (
		<ol
			className="list-decimal list-outside mb-4 space-y-2 text-zinc-700 text-base ml-6 pl-2"
			{...props}
		/>
	),
	li: ({ ...props }) => <li className="mb-1.5 leading-7" {...props} />,
	code: ({ inline, className, children, ...props }) => {
		if (inline) {
			return (
				<code
					className="text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono"
					{...props}
				>
					{children}
				</code>
			);
		}

		const match = /language-(\w+)/.exec(className || "");
		const language = match ? match[1] : "";
		const codeString = String(children).replace(/\n$/, "");

		if (language || /[{}();=<>[\]]/.test(codeString)) {
			return <CodeBlock language={language}>{codeString}</CodeBlock>;
		}

		return (
			<div className="text-zinc-700 mb-4 leading-7 text-base">{codeString}</div>
		);
	},
	pre: ({ children }) => <>{children}</>,
	blockquote: ({ ...props }) => (
		<blockquote
			className="border-l-4 border-orange-300 bg-orange-50/50 pl-4 py-1 italic text-zinc-700 my-6 text-base rounded-r-lg"
			{...props}
		/>
	),
	a: ({ ...props }) => (
		<a
			className="text-orange-600 hover:text-orange-700 underline underline-offset-2 font-medium"
			target="_blank"
			rel="noopener noreferrer"
			{...props}
		/>
	),
	strong: ({ ...props }) => (
		<strong className="font-semibold text-zinc-900" {...props} />
	),
	em: ({ ...props }) => <em className="italic text-zinc-800" {...props} />,
	img: ({ alt, ...props }) => (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			alt={alt || ""}
			className="rounded-xl shadow-lg my-6 w-full h-auto border border-zinc-200"
			{...props}
		/>
	),
	hr: ({ ...props }) => <hr className="border-zinc-200 my-8" {...props} />,
	table: ({ ...props }) => (
		<div className="overflow-x-auto my-6 rounded-xl border border-zinc-200 shadow-sm">
			<table className="min-w-full border-collapse text-sm" {...props} />
		</div>
	),
	thead: ({ ...props }) => (
		<thead className="bg-zinc-50 border-b border-zinc-200" {...props} />
	),
	tbody: ({ ...props }) => (
		<tbody className="divide-y divide-zinc-100 bg-white" {...props} />
	),
	tr: ({ ...props }) => (
		<tr className="hover:bg-orange-50/40 transition-colors" {...props} />
	),
	th: ({ ...props }) => (
		<th
			className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 border-r border-zinc-100 last:border-r-0"
			{...props}
		/>
	),
	td: ({ ...props }) => (
		<td
			className="px-4 py-3 text-zinc-700 border-r border-zinc-100 last:border-r-0 align-top"
			{...props}
		/>
	),
};

export default function BlogMarkdown({ content, className = "" }) {
	if (!content) return null;

	return (
		<div className={`blog-content prose prose-zinc max-w-none prose-base ${className}`}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
				{content}
			</ReactMarkdown>
		</div>
	);
}
