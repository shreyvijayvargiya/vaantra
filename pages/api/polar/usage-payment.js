import { verifyFirebaseIdToken } from "../../../lib/api/verifyFirebaseIdToken";
import {
	getUsagePolarFixedPriceRowsForMinutes,
	normalizeUsageCurrency,
	USAGE_POLAR_PRODUCT_ID,
	validateUsageAmountMinorUnits,
} from "../../../lib/utils/usagePricing";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const POLAR_API_URL = process.env.POLAR_API_URL || "https://api.polar.sh";

/**
 * POST body: {
 *   idToken,
 *   minutes,
 *   currency?: "usd" | "inr",
 *   amountMinorUnits?: number, // USD cents or INR paise (matches `currency`)
 *   amountCents?: number,       // alias for amountMinorUnits (backward compat; still USD cents when currency is usd)
 * }
 * Creates a Polar checkout with ad-hoc fixed prices for USAGE_POLAR_PRODUCT_ID (USD + INR
 * rows so the org default presentment currency is included — required by Polar).
 *
 * Credits are applied when Polar delivers `order.paid` to `/api/polar/webhook`
 * (subscribe to that event on your webhook endpoint in the Polar dashboard).
 */
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	if (!POLAR_ACCESS_TOKEN) {
		return res.status(500).json({ error: "Polar API not configured" });
	}

	try {
		const { idToken, minutes, amountCents, amountMinorUnits, currency: currencyRaw } =
			req.body || {};
		const m = Math.floor(Number(minutes) || 0);
		const currency = normalizeUsageCurrency(currencyRaw);
		const amountFromClient =
			amountMinorUnits != null && amountMinorUnits !== ""
				? Number(amountMinorUnits)
				: Number(amountCents);

		if (m <= 0) {
			return res.status(400).json({ error: "Invalid minutes" });
		}
		if (!currency) {
			return res.status(400).json({
				error: "Unsupported currency",
				supported: ["usd", "inr"],
			});
		}
		if (!Number.isFinite(amountFromClient)) {
			return res.status(400).json({ error: "Invalid amount" });
		}

		if (!validateUsageAmountMinorUnits(m, amountFromClient, currency)) {
			return res.status(400).json({ error: "Amount does not match server pricing" });
		}

		const priceRows = getUsagePolarFixedPriceRowsForMinutes(m);
		const price_currency = currency;

		const { uid, email } = await verifyFirebaseIdToken(idToken);

		const productId = USAGE_POLAR_PRODUCT_ID;
		const origin =
			req.headers.origin ||
			(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") ||
			"http://localhost:3000";

		const successUrl = `${origin}/app?usage_paid=1`;

		const body = {
			products: [productId],
			external_customer_id: uid,
			customer_email: email || undefined,
			success_url: successUrl,
			return_url: `${origin}/app`,
			currency: price_currency,
			metadata: {
				firebase_uid: uid,
				minutes: m,
				kind: "translate_minutes",
				checkout_currency: price_currency,
			},
			prices: {
				[productId]: priceRows,
			},
		};

		const checkoutResponse = await fetch(`${POLAR_API_URL}/v1/checkouts`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!checkoutResponse.ok) {
			const errorData = await checkoutResponse.json().catch(() => ({}));
			console.error("Polar usage checkout error:", errorData);
			return res.status(checkoutResponse.status).json({
				error: errorData.detail || errorData.message || "Checkout failed",
			});
		}

		const checkoutData = await checkoutResponse.json();
		return res.status(200).json({
			checkoutUrl: checkoutData.url || checkoutData.checkout_url,
			checkoutId: checkoutData.id,
		});
	} catch (e) {
		console.error("[usage-payment]", e);
		return res.status(401).json({
			error: e?.message || "Unauthorized",
		});
	}
}
