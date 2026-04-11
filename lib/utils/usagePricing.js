/** Polar product for pay-per-minute translation credits (USD checkout). */
export const USAGE_POLAR_PRODUCT_ID =
	process.env.NEXT_PUBLIC_POLAR_USAGE_PRODUCT_ID ||
	"f0f4c0b4-de10-424b-a009-e92348011333";

/** Slider marks: minutes of video translation to purchase. */
export const USAGE_MINUTE_STEPS = [5, 10, 20, 100, 150, 200, 400];

/** USD per minute (must match server validation in usage-payment.js). */
export const PRICE_PER_MINUTE_USD = 0.15;

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

/** Whole cents for Polar (minimum $0.10 USD for fixed prices). */
export function getUsdCentsForMinutes(minutes) {
	const usd = getUsdForMinutes(minutes);
	return Math.max(10, Math.round(usd * 100));
}

/**
 * Server + client: ensure client amount matches expected pricing (±1 cent).
 */
export function validateUsageAmountCents(minutes, amountCents) {
	const expected = getUsdCentsForMinutes(minutes);
	return Math.abs(expected - Number(amountCents)) <= 1;
}
