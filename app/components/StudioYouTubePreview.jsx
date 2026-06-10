/** Same outer chrome as StudioVideoPlayer; iframe preview for YouTube. */
export default function StudioYouTubePreview({ videoId }) {
	const embedSrc = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
	return (
		<div
			style={{
				borderRadius: 16,
				overflow: "hidden",
				background:
					"linear-gradient(145deg, #18181b 0%, #27272a 45%, #1c1917 100%)",
				border: "1px solid rgba(255,255,255,0.06)",
			}}
		>
			<div
				style={{
					borderRadius: 12,
					overflow: "hidden",
					position: "relative",
					background: "#000",
					aspectRatio: "16/9",
					maxHeight: 320,
					width: "100%",
				}}
			>
				<iframe
					src={embedSrc}
					title="YouTube video preview"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					referrerPolicy="strict-origin-when-cross-origin"
					allowFullScreen
					style={{
						width: "100%",
						height: "100%",
						border: "none",
						display: "block",
					}}
				/>
			</div>
		</div>
	);
}
