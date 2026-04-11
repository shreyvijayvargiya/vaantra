import React, { useMemo, useState } from "react";
import { auth } from "../config/firebase";
import {
	getUsdCentsForMinutes,
	getUsdForMinutes,
	minutesFromSliderIndex,
	PRICE_PER_MINUTE_USD,
	USAGE_MINUTE_STEPS,
} from "../utils/usagePricing";

/**
 * Slider (minute packs) + USD total + Pay with Polar.
 */
export function UsagePricingPanel({
	successReturnPath = "/app",
	onRequireLogin,
	compact = false,
}) {
	const [sliderIdx, setSliderIdx] = useState(2);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);

	const minutes = useMemo(
		() => minutesFromSliderIndex(sliderIdx),
		[sliderIdx],
	);
	const totalUsd = useMemo(() => getUsdForMinutes(minutes), [minutes]);
	const amountCents = useMemo(() => getUsdCentsForMinutes(minutes), [minutes]);

	const pay = async () => {
		setErr(null);
		const user = auth.currentUser;
		if (!user) {
			onRequireLogin?.();
			return;
		}
		setBusy(true);
		try {
			const idToken = await user.getIdToken();
			const res = await fetch("/api/polar/usage-payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					idToken,
					minutes,
					amountCents,
					currency: "usd",
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
				Minutes of video translation
			</label>
			<input
				type="range"
				min={0}
				max={USAGE_MINUTE_STEPS.length - 1}
				step={1}
				value={sliderIdx}
				onChange={(e) => setSliderIdx(Number(e.target.value))}
				style={{ width: "100%", marginBottom: 8 }}
			/>
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
				${PRICE_PER_MINUTE_USD.toFixed(2)} / minute · selected{" "}
				<strong>{minutes} min</strong>
			</p>
			<p
				style={{
					fontSize: compact ? 18 : 22,
					fontWeight: 700,
					color: "#18181b",
					marginBottom: 12,
				}}
			>
				Total:{" "}
				<span style={{ color: "#ea580c" }}>${totalUsd.toFixed(2)} USD</span>
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
				{busy ? "Redirecting…" : `Pay $${totalUsd.toFixed(2)} with Polar`}
			</button>
			<p style={{ fontSize: 11, color: "#a1a1aa", marginTop: 10 }}>
				Secured by Polar. You’ll return to {successReturnPath} after payment.
			</p>
		</div>
	);
}
