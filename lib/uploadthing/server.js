import { createUploadthing } from "uploadthing/next-legacy";

const f = createUploadthing();

export const ourFileRouter = {
	workspaceVideo: f({
		video: { maxFileSize: "512MB", maxFileCount: 1 },
	})
		.middleware(async () => ({}))
		.onUploadComplete(async ({ file }) => ({
			url: file.url,
			name: file.name,
			size: file.size,
		})),
};

export default ourFileRouter;
