/** Polar product for pay-per-minute translation credits (USD checkout). */
export const USAGE_POLAR_PRODUCT_ID = "f0f4c0b4-de10-424b-a009-e92348011333";
// export const USAGE_POLAR_PRODUCT_ID = "06ed9022-ede5-440e-aaa7-c1ab7464ff89";

/** Slider marks: minutes of video translation to purchase. */
export const USAGE_MINUTE_STEPS = [2, 5, 10, 20, 100, 150, 200, 400];

/** USD per minute (must match server validation in usage-payment.js). */
export const PRICE_PER_MINUTE_USD = 2;

/** Whole INR per minute before converting to paise for Polar (must match server validation). */
export const PRICE_PER_MINUTE_INR = 50;

/**
 * Supported checkout currencies. Each entry defines major-unit price per minute and
 * how Polar expects `price_amount` (minor units: USD cents, INR paise, etc.).
 * To add e.g. EUR: add a per-minute rate constant, extend this map (`minorPerMajor`,
 * `minMinor`), and the new key appears in {@link SUPPORTED_USAGE_CURRENCIES} automatically.
 */
const USAGE_CURRENCY_CONFIG = {
	usd: {
		pricePerMajorPerMinute: PRICE_PER_MINUTE_USD,
		minorPerMajor: 100,
		/** Minimum Polar fixed price in minor units (10¢). */
		minMinor: 10,
	},
	inr: {
		pricePerMajorPerMinute: PRICE_PER_MINUTE_INR,
		minorPerMajor: 100,
		/** Minimum fixed price in paise (₹1). */
		minMinor: 100,
	},
};

export const SUPPORTED_USAGE_CURRENCIES = Object.freeze(
	Object.keys(USAGE_CURRENCY_CONFIG),
);

/**
 * @param {string} [input]
 * @returns {"usd" | "inr" | null}
 */
export function normalizeUsageCurrency(input) {
	const raw =
		input == null || String(input).trim() === "" ? "usd" : input;
	const c = String(raw).toLowerCase().trim();
	return c in USAGE_CURRENCY_CONFIG ? /** @type {"usd" | "inr"} */ (c) : null;
}

/**
 * Polar `price_amount` for fixed pricing: USD cents or INR paise, etc.
 * @param {number} minutes
 * @param {string} currency
 */
export function getUsageMinorUnitsForMinutes(minutes, currency) {
	const c = normalizeUsageCurrency(currency);
	if (!c) {
		throw new Error(`Unsupported currency: ${currency}`);
	}
	const cfg = USAGE_CURRENCY_CONFIG[c];
	const m = Math.max(0, Number(minutes) || 0);
	const majorTotal = m * cfg.pricePerMajorPerMinute;
	const minor = Math.round(majorTotal * cfg.minorPerMajor);
	return Math.max(cfg.minMinor, minor);
}

/**
 * Client + server: amount matches expected pricing in that currency’s minor units (±1).
 */
export function validateUsageAmountMinorUnits(minutes, amountMinorUnits, currency) {
	const c = normalizeUsageCurrency(currency);
	if (!c) return false;
	const expected = getUsageMinorUnitsForMinutes(minutes, c);
	return Math.abs(expected - Number(amountMinorUnits)) <= 1;
}

/**
 * Fixed line item for Polar checkout `prices[productId]`.
 * @param {number} minutes
 * @param {string} currency
 * @returns {{ price_amount: number, price_currency: string }}
 */
export function getUsagePolarFixedPrice(minutes, currency) {
	const c = normalizeUsageCurrency(currency);
	if (!c) {
		throw new Error(`Unsupported currency: ${currency}`);
	}
	return {
		price_amount: getUsageMinorUnitsForMinutes(minutes, c),
		price_currency: c,
	};
}

/**
 * Rows for Polar `prices[productId]`: one fixed price per supported currency.
 * Polar requires the organization’s default presentment currency (often USD) to appear
 * alongside other currencies (e.g. INR), even when the customer checks out in one currency.
 * @param {number} minutes
 * @returns {Array<{ amount_type: 'fixed', price_amount: number, price_currency: string }>}
 */
export function getUsagePolarFixedPriceRowsForMinutes(minutes) {
	return SUPPORTED_USAGE_CURRENCIES.map((code) => {
		const row = getUsagePolarFixedPrice(minutes, code);
		return {
			amount_type: "fixed",
			price_amount: row.price_amount,
			price_currency: row.price_currency,
		};
	});
}

/**
 * Major-unit price per minute for UI (USD dollars, INR rupees, etc.).
 * @param {string} currency
 */
export function getUsagePricePerMajorUnit(currency) {
	const c = normalizeUsageCurrency(currency);
	if (!c) return null;
	return USAGE_CURRENCY_CONFIG[c].pricePerMajorPerMinute;
}

/**
 * Total in major units for display (before converting to minor units for Polar).
 * @param {number} minutes
 * @param {string} currency
 */
export function getUsageTotalMajorForMinutes(minutes, currency) {
	const c = normalizeUsageCurrency(currency);
	if (!c) return 0;
	const cfg = USAGE_CURRENCY_CONFIG[c];
	const m = Math.max(0, Number(minutes) || 0);
	return Math.round(m * cfg.pricePerMajorPerMinute * 100) / 100;
}

export function minutesFromSliderIndex(index) {
	const i = Math.max(
		0,
		Math.min(USAGE_MINUTE_STEPS.length - 1, Math.floor(Number(index) || 0)),
	);
	return USAGE_MINUTE_STEPS[i];
}

export function sliderIndexForMinutes(minutes) {
	const m = Number(minutes);
	const idx = USAGE_MINUTE_STEPS.indexOf(m);
	return idx >= 0 ? idx : 0;
}

export function getUsdForMinutes(minutes) {
	const m = Math.max(0, Number(minutes) || 0);
	return Math.round(m * PRICE_PER_MINUTE_USD * 100) / 100;
}

/** Whole USD cents for Polar (minimum $0.10 USD for fixed prices). */
export function getUsdCentsForMinutes(minutes) {
	return getUsageMinorUnitsForMinutes(minutes, "usd");
}

/** Whole INR paise for Polar. */
export function getInrPaiseForMinutes(minutes) {
	return getUsageMinorUnitsForMinutes(minutes, "inr");
}

/**
 * Server + client: ensure client amount matches expected USD pricing (±1 cent).
 */
export function validateUsageAmountCents(minutes, amountCents) {
	return validateUsageAmountMinorUnits(minutes, amountCents, "usd");
}
