import { useRouter } from "next/router";
import PublicSharePage from "../../app/components/PublicSharePage";

/** Public share viewer — no login required. */
export default function ShareRoutePage() {
	const router = useRouter();
	const raw = router.query.id;
	const shareId =
		raw == null || raw === ""
			? null
			: String(Array.isArray(raw) ? raw[0] : raw);

	if (!router.isReady) {
		return (
			<div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center text-sm text-zinc-500">
				Loading…
			</div>
		);
	}

	return <PublicSharePage shareId={shareId} />;
}
