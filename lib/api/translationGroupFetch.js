import { fetchAndMergeTranslationGroups } from "./translationHistory";

export const QUERY_KEY_TRANSLATION_GROUP_STATS = (uid, groupId) => [
	"translationGroupStats",
	uid,
	groupId,
];

/**
 * @param {string} uid
 * @param {string} groupId
 */
export async function fetchTranslationGroupForUser(uid, groupId) {
	if (!uid || !groupId) return null;
	const groups = await fetchAndMergeTranslationGroups(uid);
	return groups.find((g) => g.id === groupId) ?? null;
}
