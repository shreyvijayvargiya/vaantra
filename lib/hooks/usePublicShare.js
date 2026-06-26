import { useQuery } from "@tanstack/react-query";
import { fetchPublicShare } from "../api/publicShare";

export const QUERY_KEY_PUBLIC_SHARE = (shareId) => ["publicShare", shareId];

export function usePublicShare(shareId) {
	return useQuery({
		queryKey: QUERY_KEY_PUBLIC_SHARE(shareId),
		queryFn: () => fetchPublicShare(shareId),
		enabled: Boolean(shareId),
		staleTime: 60_000,
		retry: 1,
	});
}
