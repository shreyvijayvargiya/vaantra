import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Check } from "lucide-react";
import { LANGS, LANG_GROUPS, flagForLanguageName } from "../utils/languages";

/**
 * Single-select language picker — same list/search/groups as translate LangMultiSelect.
 */
export default function LangSingleSelect({
	value,
	onChange,
	label,
	placeholder = "Select language",
	disabled = false,
	className = "",
}) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const ref = useRef(null);

	const filtered = LANGS.filter((l) => l.toLowerCase().includes(q.toLowerCase()));

	useEffect(() => {
		const h = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", h);
		return () => document.removeEventListener("mousedown", h);
	}, []);

	const select = (lang) => {
		onChange(lang);
		setOpen(false);
		setQ("");
	};

	return (
		<div className={`relative ${className}`} ref={ref}>
			{label ? (
				<label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
			) : null}
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen((o) => !o)}
				className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors ${
					disabled ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-400"
				}`}
			>
				<span className="text-base leading-none shrink-0" aria-hidden>
					{value ? flagForLanguageName(value) : "🌐"}
				</span>
				<span
					className={`flex-1 truncate ${value ? "text-zinc-900" : "text-zinc-400"}`}
				>
					{value || placeholder}
				</span>
				<ChevronDown
					className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			<AnimatePresence>
				{open && !disabled && (
					<motion.div
						initial={{ opacity: 0, y: -6, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -6, scale: 0.97 }}
						transition={{ duration: 0.14 }}
						className="absolute left-0 right-0 top-full z-[200] mt-1.5 w-full min-w-[280px] bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden"
					>
						<div className="p-2 border-b border-zinc-100">
							<div className="flex items-center gap-2 px-2.5 py-2 bg-zinc-50 border border-zinc-100 rounded-xl">
								<Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
								<input
									autoFocus
									value={q}
									onChange={(e) => setQ(e.target.value)}
									placeholder="Search…"
									className="w-full bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
								/>
							</div>
						</div>
						<div className="max-h-56 overflow-y-auto p-1.5">
							{q ? (
								filtered.length === 0 ? (
									<p className="text-sm text-zinc-400 px-3 py-2">No results</p>
								) : (
									filtered.map((lang) => (
										<button
											key={lang}
											type="button"
											onClick={() => select(lang)}
											className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-colors ${
												value === lang
													? "bg-orange-50 text-orange-800 font-medium"
													: "text-zinc-600 hover:bg-zinc-50"
											}`}
										>
											<span aria-hidden>{flagForLanguageName(lang)}</span>
											<span className="flex-1 truncate">{lang}</span>
											{value === lang && (
												<Check className="w-4 h-4 text-orange-600 shrink-0" />
											)}
										</button>
									))
								)
							) : (
								LANG_GROUPS.map(({ continent, langs }) => (
									<div key={continent}>
										<p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 sticky top-0 bg-white">
											{continent}
										</p>
										{langs.map((lang) => (
											<button
												key={lang}
												type="button"
												onClick={() => select(lang)}
												className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-colors ${
													value === lang
														? "bg-orange-50 text-orange-800 font-medium"
														: "text-zinc-600 hover:bg-zinc-50"
												}`}
											>
												<span aria-hidden>{flagForLanguageName(lang)}</span>
												<span className="flex-1 truncate">{lang}</span>
												{value === lang && (
													<Check className="w-4 h-4 text-orange-600 shrink-0" />
												)}
											</button>
										))}
									</div>
								))
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
