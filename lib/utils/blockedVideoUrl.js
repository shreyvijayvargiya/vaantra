/** Domains whose videos cannot be fetched by the translation API (URL mode). */
export const BLOCKED_VIDEO_URL_DOMAINS = {
	"youtube.com":
		"YouTube videos can't be fetched by our API. Please download the video and upload it instead.",
	"youtu.be":
		"YouTube videos can't be fetched by our API. Please download the video and upload it instead.",
	"tiktok.com":
		"TikTok videos are protected. Please download and upload the file directly.",
	"instagram.com":
		"Instagram requires authentication. Please download and upload the file directly.",
	"facebook.com":
		"Facebook videos are protected. Please download and upload the file directly.",
	"fb.watch":
		"Facebook videos are protected. Please download and upload the file directly.",
	"fb.com":
		"Facebook videos are protected. Please download and upload the file directly.",
	"twitter.com":
		"Twitter/X videos can't be fetched. Please download and upload the file directly.",
	"x.com":
		"Twitter/X videos can't be fetched. Please download and upload the file directly.",
	"twitch.tv":
		"Twitch streams/clips can't be fetched. Please download and upload the file directly.",
	"netflix.com":
		"Netflix videos are DRM-protected and cannot be downloaded.",
	"hulu.com": "Hulu videos are DRM-protected and cannot be downloaded.",
	"disneyplus.com":
		"Disney+ videos are DRM-protected and cannot be downloaded.",
	"primevideo.com":
		"Amazon Prime Video is DRM-protected and cannot be downloaded.",
	"reddit.com":
		"Reddit-hosted videos can't be fetched. Please download and upload the file directly.",
};

/**
 * @param {string} url
 * @returns {string | null} User-facing warning, or null if URL is allowed.
 */
export function getBlockedVideoUrlWarning(url) {
	if (!url?.trim()) return null;
	try {
		const hostname = new URL(url.trim()).hostname
			.replace(/^www\./, "")
			.toLowerCase();
		for (const [domain, message] of Object.entries(BLOCKED_VIDEO_URL_DOMAINS)) {
			if (hostname === domain || hostname.endsWith(`.${domain}`)) {
				return message;
			}
		}
	} catch {
		/* invalid URL handled elsewhere */
	}
	return null;
}
