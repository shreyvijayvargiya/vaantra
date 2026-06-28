import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import LoginModal from "../lib/ui/LoginModal";
import { VideoEditorModal } from "../lib/ui/videoEditor/VideoEditor";
import VideoToolsStatusProgress from "../lib/ui/VideoToolsStatusProgress";
import { getVideoEditorProject } from "../lib/videoEditorApi";
import { extractBlogToVideoJobFields } from "../lib/videoToolsJob";
import { onAuthStateChange } from "../lib/api/auth";

export default function VideoEditorPage() {
	const router = useRouter();
	const projectId = typeof router.query.project_id === "string" ? router.query.project_id : null;
	const [showLogin, setShowLogin] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [job, setJob] = useState(null);

	useEffect(() => {
		return onAuthStateChange((user) => {
			if (!user) setShowLogin(true);
		});
	}, []);

	useEffect(() => {
		if (!router.isReady || !projectId) return;
		let cancelled = false;
		let interval;

		const load = async () => {
			try {
				const data = await getVideoEditorProject(projectId);
				if (cancelled) return;
				const fields = extractBlogToVideoJobFields(data);
				setJob(fields);
				if (fields.status === "done" || fields.apiStatus === "ready") {
					setLoading(false);
					if (interval) clearInterval(interval);
				} else if (fields.status === "error") {
					setError(fields.errorMessage || "Generation failed");
					setLoading(false);
					if (interval) clearInterval(interval);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e?.message || "Could not load project");
					setLoading(false);
				}
			}
		};

		void load();
		interval = setInterval(() => void load(), 3000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [router.isReady, projectId]);

	return (
		<div className="sans min-h-screen bg-zinc-50 text-zinc-700">
			<Navbar variant="marketing" onSignIn={() => setShowLogin(true)} />
			<main className="max-w-6xl mx-auto px-4 py-8">
				{!projectId ? (
					<p className="text-sm text-zinc-500">
						Add <code className="text-xs bg-zinc-100 px-1 rounded">?project_id=ve_…</code> to
						open a project.
					</p>
				) : loading && job?.status !== "done" ? (
					<div className="rounded-xl border border-zinc-200 bg-white p-8 max-w-lg mx-auto">
						<VideoToolsStatusProgress
							tool="blog"
							apiStatus={job?.apiStatus || "pending"}
							status={
								job?.status === "done"
									? "done"
									: job?.status === "error"
										? "error"
										: "processing"
							}
							createdAt={new Date().toISOString()}
						/>
					</div>
				) : error ? (
					<p className="text-sm text-red-600">{error}</p>
				) : (
					<VideoEditorModal
						embedded
						open
						projectId={projectId}
						initialProject={job?.editorProject}
						initialFrames={job?.editorFrames ?? job?.editorFramesStored ?? []}
						initialGlobalStyle={job?.globalStyle || job?.style}
						styleThemes={job?.styleThemes ?? []}
					/>
				)}
			</main>
			<Footer variant="marketing" />
			<LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
		</div>
	);
}
