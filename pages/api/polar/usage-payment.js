import { verifyFirebaseIdToken } from "../../../lib/api/verifyFirebaseIdToken";
import {
	getUsdCentsForMinutes,
	USAGE_POLAR_PRODUCT_ID,
	validateUsageAmountCents,
} from "../../../lib/utils/usagePricing";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const POLAR_API_URL = process.env.POLAR_API_URL || "https://api.polar.sh";

/**
 * POST body: { idToken, minutes, amountCents, currency?: "usd" }
 * Creates a Polar checkout with ad-hoc fixed price for USAGE_POLAR_PRODUCT_ID.
 */
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	if (!POLAR_ACCESS_TOKEN) {
		return res.status(500).json({ error: "Polar API not configured" });
	}

	try {
		const { idToken, minutes, amountCents, currency = "usd" } = req.body || {};
		const m = Math.floor(Number(minutes) || 0);
		const cents = Number(amountCents);
		if (m <= 0) {
			return res.status(400).json({ error: "Invalid minutes" });
		}

		if (!validateUsageAmountCents(m, cents)) {
			return res.status(400).json({ error: "Amount does not match server pricing" });
		}

		const expected = getUsdCentsForMinutes(m);

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
			currency: String(currency).toLowerCase(),
			metadata: {
				firebase_uid: uid,
				minutes: m,
				kind: "translate_minutes",
			},
			prices: {
				[productId]: [
					{
						amount_type: "fixed",
						price_amount: expected,
						price_currency: String(currency).toLowerCase(),
					},
				],
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
