import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAndMergeTranslationGroups } from "../api/translationHistory";

export const QUERY_KEY_TRANSLATION_GROUPS = (uid) => ["translationGroups", uid];

/**
 * Fetches translation history from Firestore (see `fetchTranslationGroups` / `fetchAndMergeTranslationGroups`
 * in `lib/api/translationHistory.js`) — same client-side Firestore pattern as `getAllUsers` in `lib/api/users.js`.
 */
export function useTranslationGroups(uid) {
	return useQuery({
		queryKey: QUERY_KEY_TRANSLATION_GROUPS(uid),
		queryFn: () => fetchAndMergeTranslationGroups(uid),
		enabled: Boolean(uid),
		staleTime: 20_000,
	});
}

export function useTranslationGroupsInvalidator() {
	const qc = useQueryClient();
	return (uid) => {
		if (uid) void qc.invalidateQueries({ queryKey: QUERY_KEY_TRANSLATION_GROUPS(uid) });
	};
}
