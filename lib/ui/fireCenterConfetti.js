import confetti from "canvas-confetti";

const BRAND_COLORS = ["#ea580c", "#f97316", "#fb923c", "#fbbf24", "#ffffff", "#fed7aa"];

/** Center-screen confetti burst — call after a success moment (e.g. feedback submitted). */
export function fireCenterConfetti() {
	const origin = { x: 0.5, y: 0.45 };

	confetti({
		particleCount: 80,
		spread: 100,
		startVelocity: 42,
		gravity: 0.9,
		ticks: 220,
		origin,
		colors: BRAND_COLORS,
		disableForReducedMotion: true,
	});

	setTimeout(() => {
		confetti({
			particleCount: 50,
			angle: 60,
			spread: 72,
			origin: { x: 0.35, y: 0.5 },
			colors: BRAND_COLORS,
			disableForReducedMotion: true,
		});
		confetti({
			particleCount: 50,
			angle: 120,
			spread: 72,
			origin: { x: 0.65, y: 0.5 },
			colors: BRAND_COLORS,
			disableForReducedMotion: true,
		});
	}, 120);

	const duration = 1400;
	const end = Date.now() + duration;

	const frame = () => {
		confetti({
			particleCount: 2,
			angle: 90,
			spread: 360,
			startVelocity: 18,
			origin,
			colors: BRAND_COLORS,
			disableForReducedMotion: true,
		});
		if (Date.now() < end) requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
}
