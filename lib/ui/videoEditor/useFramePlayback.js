import { useCallback, useEffect, useRef, useState } from "react";
import { decodeWavBase64 } from "./editorUtils";

export function useFramePlayback({ frames, selectedFrameId, onSelectFrame }) {
	const audioRef = useRef(null);
	const blobUrlRef = useRef(null);
	const abortRef = useRef(false);
	const [playing, setPlaying] = useState(false);
	const [playingFrameId, setPlayingFrameId] = useState(null);

	const cleanupAudio = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.onended = null;
			audioRef.current = null;
		}
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
	}, []);

	useEffect(() => () => {
		abortRef.current = true;
		cleanupAudio();
	}, [cleanupAudio]);

	const playFrameAudio = useCallback(
		(frame) =>
			new Promise((resolve) => {
				cleanupAudio();
				const b64 = frame?.audio?.data_base64;
				if (!b64) {
					resolve(false);
					return;
				}
				const buf = decodeWavBase64(b64);
				if (!buf) {
					resolve(false);
					return;
				}
				const blob = new Blob([buf], { type: "audio/wav" });
				const url = URL.createObjectURL(blob);
				blobUrlRef.current = url;
				const audio = new Audio(url);
				audioRef.current = audio;
				audio.onended = () => {
					cleanupAudio();
					resolve(true);
				};
				audio.onerror = () => {
					cleanupAudio();
					resolve(false);
				};
				void audio.play().catch(() => {
					cleanupAudio();
					resolve(false);
				});
			}),
		[cleanupAudio],
	);

	const stop = useCallback(() => {
		abortRef.current = true;
		cleanupAudio();
		setPlaying(false);
		setPlayingFrameId(null);
	}, [cleanupAudio]);

	const playSelected = useCallback(async () => {
		const frame = frames.find((f) => f.id === selectedFrameId);
		if (!frame) return;
		stop();
		abortRef.current = false;
		setPlaying(true);
		setPlayingFrameId(frame.id);
		await playFrameAudio(frame);
		if (!abortRef.current) {
			setPlaying(false);
			setPlayingFrameId(null);
		}
	}, [frames, selectedFrameId, playFrameAudio, stop]);

	const playAll = useCallback(async () => {
		if (!frames.length) return;
		stop();
		abortRef.current = false;
		setPlaying(true);
		for (const frame of frames) {
			if (abortRef.current) break;
			onSelectFrame?.(frame.id);
			setPlayingFrameId(frame.id);
			await playFrameAudio(frame);
			if (abortRef.current) break;
		}
		setPlaying(false);
		setPlayingFrameId(null);
	}, [frames, playFrameAudio, stop, onSelectFrame]);

	return {
		playing,
		playingFrameId,
		playSelected,
		playAll,
		stop,
		togglePlay: useCallback(
			async (selectedId) => {
				if (playing) {
					stop();
					return;
				}
				if (!frames.length) return;
				abortRef.current = false;
				setPlaying(true);
				const startIdx = Math.max(
					0,
					frames.findIndex((f) => f.id === (selectedId ?? selectedFrameId)),
				);
				for (let i = startIdx; i < frames.length; i++) {
					if (abortRef.current) break;
					const frame = frames[i];
					onSelectFrame?.(frame.id);
					setPlayingFrameId(frame.id);
					await playFrameAudio(frame);
					if (abortRef.current) break;
				}
				setPlaying(false);
				setPlayingFrameId(null);
			},
			[playing, frames, selectedFrameId, playFrameAudio, stop, onSelectFrame],
		),
	};
}
