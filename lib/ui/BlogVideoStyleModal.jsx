import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import BlogVideoStyleForm from "./BlogVideoStyleForm";
import BlogVideoStylePreview from "./BlogVideoStylePreview";
import { buildBlogStylePayload } from "../utils/blogVideoStyle";

export default function BlogVideoStyleModal({
	open,
	onClose,
	value,
	onChange,
	aspect = "16:9",
	onAspectChange,
	themeOptions,
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onClose]);

	const themeLabel = value?.theme?.replace(/_/g, " ") || "dark blue";

	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-sm"
					onClick={onClose}
					role="dialog"
					aria-modal="true"
					aria-labelledby="blog-style-modal-title"
				>
					<motion.div
						initial={{ scale: 0.96, opacity: 0, y: 12 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.96, opacity: 0, y: 12 }}
						transition={{ type: "spring", damping: 26, stiffness: 320 }}
						onClick={(e) => e.stopPropagation()}
						className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
					>
						<div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-zinc-200 shrink-0">
							<div>
								<h2
									id="blog-style-modal-title"
									className="text-base sm:text-lg font-bold text-zinc-900"
								>
									Video style
								</h2>
								<p className="text-xs text-zinc-500 mt-0.5 capitalize">
									Theme: {themeLabel} · {aspect}
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
								aria-label="Close"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
							<div className="lg:w-[min(100%,420px)] xl:w-[440px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 overflow-y-auto max-h-[42vh] lg:max-h-none">
								<div className="p-4 sm:p-5">
									<BlogVideoStyleForm
										value={value}
										onChange={onChange}
										aspect={aspect}
										onAspectChange={onAspectChange}
										themeOptions={themeOptions}
										compact
									/>
								</div>
							</div>

							<div className="flex-1 min-h-[280px] lg:min-h-0 bg-gradient-to-br from-zinc-100 to-zinc-50 overflow-hidden">
								<BlogVideoStylePreview form={value} aspect={aspect} />
							</div>
						</div>

						<div className="flex items-center justify-end gap-3 px-4 sm:px-5 py-3 border-t border-zinc-200 bg-zinc-50/80 shrink-0">
							<button
								type="button"
								onClick={onClose}
								className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors"
							>
								<Check className="w-4 h-4" />
								Done
							</button>
						</div>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
