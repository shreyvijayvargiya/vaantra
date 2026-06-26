import { genUploader } from "uploadthing/client";

export const { uploadFiles } = genUploader({
	url: "/api/uploadthing",
});

/**
 * Upload an MP4 (or other video) to UploadThing workspace endpoint.
 * @returns {{ url: string, name: string, size: number }}
 */
export async function uploadWorkspaceVideo(file, { onProgress } = {}) {
	const res = await uploadFiles("workspaceVideo", {
		files: [file],
		onUploadProgress: onProgress
			? ({ progress }) => onProgress(progress)
			: undefined,
	});
	const item = res?.[0];
	if (!item?.url) throw new Error("Upload failed — no URL returned");
	return {
		url: item.url,
		name: item.name || file.name,
		size: item.size ?? file.size,
	};
}
