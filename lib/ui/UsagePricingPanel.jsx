import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { auth } from "../config/firebase";
import {
	getUsageMinorUnitsForMinutes,
	getUsagePricePerMajorUnit,
	getUsageTotalMajorForMinutes,
	minutesFromSliderIndex,
	SUPPORTED_USAGE_CURRENCIES,
	USAGE_MINUTE_STEPS,
} from "../utils/usagePricing";

/** Display symbol + name (no USD/INR letter codes in UI). */
const CURRENCY_LABELS = {
	usd: "$ — US Dollar",
	inr: "₹ — Indian Rupee",
};

const CURRENCY_SYMBOL = {
	usd: "$",
	inr: "₹",
};

function CurrencyDropdownLight({ value, onChange }) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef(null);

	useEffect(() => {
		function handlePointerDown(e) {
			if (!rootRef.current?.contains(e.target)) setOpen(false);
		}
		function handleKey(e) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKey);
		};
	}, []);

	const label =
		CURRENCY_LABELS[value] ||
		`${CURRENCY_SYMBOL[value] ?? ""} ${value}`.trim();

	return (
		<div ref={rootRef} style={{ position: "relative", marginBottom: 14 }}>
			<button
				type="button"
				aria-expanded={open}
				aria-haspopup="listbox"
				onClick={() => setOpen((o) => !o)}
				style={{
					width: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 10,
					padding: "11px 14px",
					borderRadius: 12,
					fontSize: 13,
					fontWeight: 500,
					color: "#18181b",
					background: "#ffffff",
					border: "1px solid rgba(0,0,0,0.08)",
					boxShadow: open
						? "0 0 0 3px rgba(234,88,12,0.12), 0 4px 14px rgba(0,0,0,0.06)"
						: "0 1px 2px rgba(0,0,0,0.04)",
					cursor: "pointer",
					textAlign: "left",
					transition: "box-shadow 0.2s ease, border-color 0.2s ease",
				}}
			>
				<span style={{ flex: 1, minWidth: 0 }}>{label}</span>
				<motion.span
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
					style={{ display: "flex", color: "#71717a", flexShrink: 0 }}
					aria-hidden
				>
					<ChevronDown size={18} strokeWidth={2} />
				</motion.span>
			</button>

			<AnimatePresence>
				{open ? (
					<motion.div
						role="listbox"
						aria-label="Currency"
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							top: "calc(100% + 6px)",
							zIndex: 40,
							padding: 4,
							borderRadius: 12,
							background: "#ffffff",
							border: "1px solid rgba(0,0,0,0.08)",
							boxShadow:
								"0 10px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
							overflow: "hidden",
						}}
					>
						{SUPPORTED_USAGE_CURRENCIES.map((code) => {
							const isSelected = code === value;
							const text =
								CURRENCY_LABELS[code] ||
								`${CURRENCY_SYMBOL[code] ?? ""} ${code}`.trim();
							return (
								<button
									key={code}
									type="button"
									role="option"
									aria-selected={isSelected}
									onClick={() => {
										onChange(code);
										setOpen(false);
									}}
									style={{
										width: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 10,
										padding: "10px 12px",
										borderRadius: 8,
										border: "none",
										background: isSelected
											? "rgba(234,88,12,0.08)"
											: "transparent",
										color: "#18181b",
										fontSize: 13,
										fontWeight: isSelected ? 600 : 500,
										cursor: "pointer",
										textAlign: "left",
										transition: "background 0.15s ease",
									}}
									onMouseEnter={(e) => {
										if (!isSelected)
											e.currentTarget.style.background = "#f4f4f5";
									}}
									onMouseLeave={(e) => {
										if (!isSelected)
											e.currentTarget.style.background = "transparent";
									}}
								>
									<span style={{ flex: 1 }}>{text}</span>
									{isSelected ? (
										<Check
											size={16}
											strokeWidth={2.5}
											style={{ color: "#ea580c", flexShrink: 0 }}
											aria-hidden
										/>
									) : (
										<span style={{ width: 16, flexShrink: 0 }} aria-hidden />
									)}
								</button>
							);
						})}
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}

function formatPricePerMinuteLine(currency) {
	const p = getUsagePricePerMajorUnit(currency);
	if (p == null) return "";
	if (currency === "inr") {
		return `₹${Number(p).toLocaleString("en-IN")} / minute`;
	}
	return `$${p.toFixed(2)} / minute`;
}

function formatTotalLine(major, currency) {
	if (currency === "inr") {
		return `₹${major.toLocaleString("en-IN", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		})}`;
	}
	return `$${major.toFixed(2)}`;
}

function formatPayButton(major, currency) {
	if (currency === "inr") {
		return `Pay ₹${major.toLocaleString("en-IN", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		})}`;
	}
	return `Pay $${major.toFixed(2)}`;
}

/**
 * Slider (minute packs) + multi-currency total + Pay with Polar.
 */
export function UsagePricingPanel({
	onRequireLogin,
	compact = false,
	defaultCurrency = "usd",
	/** When set (e.g. modal opens), snaps the minute slider to this index. */
	suggestedSliderIndex,
	/** Fires when the user changes currency (e.g. syncs headline pricing on the landing card). */
	onCurrencyChange,
}) {
	const [sliderIdx, setSliderIdx] = useState(2);
	const [currency, setCurrency] = useState(
		() => SUPPORTED_USAGE_CURRENCIES.includes(String(defaultCurrency).toLowerCase())
			? String(defaultCurrency).toLowerCase()
			: "usd",
	);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);

	useEffect(() => {
		if (suggestedSliderIndex == null || !Number.isFinite(Number(suggestedSliderIndex))) {
			return;
		}
		const max = USAGE_MINUTE_STEPS.length - 1;
		const i = Math.max(
			0,
			Math.min(max, Math.floor(Number(suggestedSliderIndex))),
		);
		setSliderIdx(i);
	}, [suggestedSliderIndex]);

	useEffect(() => {
		onCurrencyChange?.(currency);
	}, [currency, onCurrencyChange]);

	const minutes = useMemo(
		() => minutesFromSliderIndex(sliderIdx),
		[sliderIdx],
	);

	const amountMinorUnits = useMemo(
		() => getUsageMinorUnitsForMinutes(minutes, currency),
		[minutes, currency],
	);

	const totalMajor = useMemo(
		() => getUsageTotalMajorForMinutes(minutes, currency),
		[minutes, currency],
	);
	const sliderMax = USAGE_MINUTE_STEPS.length - 1;
	const sliderProgressPct = sliderMax > 0 ? (sliderIdx / sliderMax) * 100 : 0;

	const pay = async () => {
		setErr(null);
		const user = auth.currentUser;
		if (!user) {
			onRequireLogin?.();
			return;
		}
		setBusy(true);
		try {
			const idToken = await user.getIdToken(true);
			const res = await fetch("/api/polar/usage-payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					idToken,
					minutes,
					amountMinorUnits,
					currency,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || "Checkout failed");
			}
			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			} else {
				throw new Error("No checkout URL");
			}
		} catch (e) {
			setErr(e?.message || "Something went wrong");
		} finally {
			setBusy(false);
		}
	};

	const wrapStyle = compact
		? {}
		: {
				padding: "14px 0 0",
			};

	return (
		<div style={wrapStyle}>
			<label
				className="mono"
				style={{
					fontSize: 11,
					letterSpacing: "0.06em",
					color: "#a1a1aa",
					display: "block",
					marginBottom: 8,
				}}
			>
				Currency
			</label>
			<CurrencyDropdownLight value={currency} onChange={setCurrency} />

			<label
				className="mono"
				style={{
					fontSize: 11,
					letterSpacing: "0.06em",
					color: "#a1a1aa",
					display: "block",
					marginBottom: 8,
				}}
			>
				Minutes of video translation
			</label>
			<div
				style={{
					borderRadius: 16,
					border: "1px solid rgba(0,0,0,0.08)",
					background:
						"linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,250,250,1) 100%)",
					padding: "14px 14px 12px",
					marginBottom: 8,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 10,
						gap: 12,
					}}
				>
					<p style={{ fontSize: 12, color: "#71717a", margin: 0, fontWeight: 500 }}>
						Selected pack
					</p>
					<div
						style={{
							padding: "6px 10px",
							borderRadius: 999,
							background: "rgba(234,88,12,0.12)",
							color: "#c2410c",
							fontSize: 12,
							fontWeight: 700,
							lineHeight: 1,
						}}
					>
						{minutes} min
					</div>
				</div>
				<input
					type="range"
					min={0}
					max={sliderMax}
					step={1}
					value={sliderIdx}
					onChange={(e) => setSliderIdx(Number(e.target.value))}
					style={{
						width: "100%",
						marginBottom: 10,
						accentColor: "#ea580c",
						background: `linear-gradient(90deg, #ea580c 0%, #ea580c ${sliderProgressPct}%, #e4e4e7 ${sliderProgressPct}%, #e4e4e7 100%)`,
						borderRadius: 999,
						height: 6,
					}}
				/>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
						gap: 6,
					}}
				>
					{USAGE_MINUTE_STEPS.map((step, i) => {
						const active = i === sliderIdx;
						return (
							<button
								key={step}
								type="button"
								onClick={() => setSliderIdx(i)}
								style={{
									borderRadius: 8,
									border: `1px solid ${active ? "rgba(234,88,12,0.35)" : "rgba(0,0,0,0.1)"}`,
									background: active ? "rgba(234,88,12,0.1)" : "#fff",
									padding: "5px 6px",
									fontSize: 11,
									fontWeight: active ? 700 : 600,
									color: active ? "#c2410c" : "#52525b",
									cursor: "pointer",
								}}
							>
								{step}m
							</button>
						);
					})}
				</div>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: 11,
					color: "#a1a1aa",
					marginBottom: 10,
				}}
			>
				<span>{USAGE_MINUTE_STEPS[0]} min</span>
				<span>{USAGE_MINUTE_STEPS[USAGE_MINUTE_STEPS.length - 1]} min</span>
			</div>
			<p style={{ fontSize: 13, color: "#52525b", marginBottom: 4 }}>
				{formatPricePerMinuteLine(currency)} · selected <strong>{minutes} min</strong>
			</p>
			{err ? (
				<p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{err}</p>
			) : null}
			<button
				type="button"
				onClick={pay}
				disabled={busy}
				style={{
					width: "100%",
					padding: "12px",
					borderRadius: 10,
					fontSize: 14,
					fontWeight: 600,
					background: busy ? "#fdba74" : "#ea580c",
					color: "#fff",
					border: "none",
					cursor: busy ? "wait" : "pointer",
				}}
			>
				{busy ? "Redirecting…" : formatPayButton(totalMajor, currency)}
			</button>
			
		</div>
	);
}
