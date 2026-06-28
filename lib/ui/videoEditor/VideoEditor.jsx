import VideoEditorModal from "./VideoEditorModal";

/** Opens frame editor in a full-screen modal (compact summary + trigger on detail page). */
export default function VideoEditor(props) {
	return <VideoEditorModal {...props} />;
}

export { VideoEditorModal };
