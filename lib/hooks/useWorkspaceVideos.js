import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAndMergeWorkspaceVideos } from "../api/workspaceVideos";

export const QUERY_KEY_WORKSPACE_VIDEOS = (uid, groups) => [
	"workspaceVideos",
	uid,
	groups?.length ?? 0,
];

export function useWorkspaceVideos(uid, translationGroups) {
	return useQuery({
		queryKey: QUERY_KEY_WORKSPACE_VIDEOS(uid, translationGroups),
		queryFn: () => fetchAndMergeWorkspaceVideos(uid, translationGroups),
		enabled: Boolean(uid),
		staleTime: 15_000,
	});
}

export function useWorkspaceVideosInvalidator() {
	const qc = useQueryClient();
	return (uid) => {
		if (uid) void qc.invalidateQueries({ queryKey: ["workspaceVideos", uid] });
	};
}
