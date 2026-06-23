import { useState } from "react";
import { ChevronDown } from "lucide-react";
import AnimatedDropdown from "./AnimatedDropdown";

/**
 * Labelled form field using the shared AnimatedDropdown (aantraa style).
 * Options: { value, label } or { id, label }.
 */
export default function FormAnimatedDropdown({
	label,
	value,
	onChange,
	options = [],
	placeholder = "Select…",
	disabled = false,
	className = "",
}) {
	const [open, setOpen] = useState(false);

	const mapped = options.map((o) => ({
		value: o.value ?? o.id,
		label: o.label,
	}));

	const close = () => setOpen(false);
	const toggle = () => {
		if (!disabled) setOpen((o) => !o);
	};

	return (
		<div className={className}>
			{label ? (
				<label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
			) : null}
			<AnimatedDropdown
				isOpen={open && !disabled}
				onToggle={toggle}
				onSelect={(v) => {
					onChange(v);
					close();
				}}
				options={mapped}
				value={value}
				placeholder={placeholder}
				buttonClassName=""
				renderButton={(selected) => (
					<button
						type="button"
						disabled={disabled}
						onClick={toggle}
						className={`w-full min-h-[42px] px-3 py-2.5 text-sm border border-zinc-300 rounded-xl bg-white shadow-sm flex items-center justify-between text-left text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors ${
							disabled ? "opacity-50 cursor-not-allowed" : "hover:border-zinc-400"
						}`}
					>
						<span className={selected ? "text-zinc-900" : "text-zinc-400"}>
							{selected?.label ?? placeholder}
						</span>
						<ChevronDown
							className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
						/>
					</button>
				)}
				renderOption={(option, _index, isSelected) => (
					<button
						key={option.value}
						type="button"
						onClick={() => {
							onChange(option.value);
							close();
						}}
						className={`w-full px-3 py-2 text-left text-sm rounded-xl transition-colors ${
							isSelected
								? "bg-orange-50 text-orange-800 font-medium"
								: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
						}`}
					>
						{option.label}
					</button>
				)}
			/>
		</div>
	);
}
