/** Shared language list + helpers (translate picker, video tools). */
const LANGS = [
	"English",
	"Spanish",
	"French",
	"Hindi",
	"Italian",
	"German",
	"Polish",
	"Portuguese",
	"Chinese",
	"Japanese",
	"Dutch",
	"Turkish",
	"Korean",
	"Danish",
	"Arabic",
	"Romanian",
	"Mandarin",
	"Filipino",
	"Swedish",
	"Indonesian",
	"Ukrainian",
	"Greek",
	"Czech",
	"Bulgarian",
	"Malay",
	"Slovak",
	"Croatian",
	"Tamil",
	"Finnish",
	"Russian",
	"Vietnamese",
	"Afrikaans (South Africa)",
	"Albanian (Albania)",
	"Amharic (Ethiopia)",
	"Arabic (Egypt)",
	"Arabic (Saudi Arabia)",
	"Arabic (United Arab Emirates)",
	"Armenian (Armenia)",
	"Bangla (Bangladesh)",
	"Bengali (India)",
	"Catalan",
	"Chinese (Mandarin, Simplified)",
	"Chinese (Cantonese, Traditional)",
	"Chinese (Taiwanese Mandarin, Traditional)",
	"Croatian (Croatia)",
	"Czech (Czechia)",
	"Danish (Denmark)",
	"Dutch (Netherlands)",
	"Dutch (Belgium)",
	"English (United States)",
	"English (UK)",
	"English (India)",
	"Filipino (Philippines)",
	"Finnish (Finland)",
	"French (France)",
	"French (Canada)",
	"German (Germany)",
	"German (Austria)",
	"Greek (Greece)",
	"Gujarati (India)",
	"Hebrew (Israel)",
	"Hindi (India)",
	"Hungarian (Hungary)",
	"Indonesian (Indonesia)",
	"Italian (Italy)",
	"Japanese (Japan)",
	"Kannada (India)",
	"Korean (Korea)",
	"Malay (Malaysia)",
	"Malayalam (India)",
	"Marathi (India)",
	"Norwegian Bokmål (Norway)",
	"Persian (Iran)",
	"Polish (Poland)",
	"Portuguese (Brazil)",
	"Portuguese (Portugal)",
	"Romanian (Romania)",
	"Russian (Russia)",
	"Spanish (Spain)",
	"Spanish (Mexico)",
	"Spanish (United States)",
	"Swedish (Sweden)",
	"Tamil (India)",
	"Telugu (India)",
	"Thai (Thailand)",
	"Turkish (Türkiye)",
	"Ukrainian (Ukraine)",
	"Urdu (India)",
	"Vietnamese (Vietnam)",
	"Welsh (United Kingdom)",
];

// ─── Language → Continent mapping ────────────────────────────────────────────
const LANG_CONTINENT_MAP = {
	// Asia
	Chinese: "Asia", Japanese: "Asia", Korean: "Asia", Filipino: "Asia",
	Indonesian: "Asia", Malay: "Asia", Tamil: "Asia", Vietnamese: "Asia",
	Mandarin: "Asia", Hindi: "Asia",
	"Bangla (Bangladesh)": "Asia",
	"Bengali (India)": "Asia",
	"Chinese (Mandarin, Simplified)": "Asia",
	"Chinese (Cantonese, Traditional)": "Asia",
	"Chinese (Taiwanese Mandarin, Traditional)": "Asia",
	"Filipino (Philippines)": "Asia",
	"Gujarati (India)": "Asia",
	"Hindi (India)": "Asia",
	"Indonesian (Indonesia)": "Asia",
	"Japanese (Japan)": "Asia",
	"Kannada (India)": "Asia",
	"Korean (Korea)": "Asia",
	"Malay (Malaysia)": "Asia",
	"Malayalam (India)": "Asia",
	"Marathi (India)": "Asia",
	"Persian (Iran)": "Asia",
	"Tamil (India)": "Asia",
	"Telugu (India)": "Asia",
	"Thai (Thailand)": "Asia",
	"Urdu (India)": "Asia",
	"Vietnamese (Vietnam)": "Asia",
	"Armenian (Armenia)": "Asia",
	// Europe
	English: "Europe", Spanish: "Europe", French: "Europe", Italian: "Europe",
	German: "Europe", Polish: "Europe", Portuguese: "Europe", Dutch: "Europe",
	Danish: "Europe", Romanian: "Europe", Swedish: "Europe", Ukrainian: "Europe",
	Greek: "Europe", Czech: "Europe", Bulgarian: "Europe", Slovak: "Europe",
	Croatian: "Europe", Finnish: "Europe", Russian: "Europe", Turkish: "Europe",
	Catalan: "Europe",
	"Albanian (Albania)": "Europe",
	"Catalan": "Europe",
	"Croatian (Croatia)": "Europe",
	"Czech (Czechia)": "Europe",
	"Danish (Denmark)": "Europe",
	"Dutch (Belgium)": "Europe",
	"Dutch (Netherlands)": "Europe",
	"English (UK)": "Europe",
	"Finnish (Finland)": "Europe",
	"French (France)": "Europe",
	"German (Austria)": "Europe",
	"German (Germany)": "Europe",
	"Greek (Greece)": "Europe",
	"Hungarian (Hungary)": "Europe",
	"Italian (Italy)": "Europe",
	"Norwegian Bokmål (Norway)": "Europe",
	"Polish (Poland)": "Europe",
	"Portuguese (Portugal)": "Europe",
	"Romanian (Romania)": "Europe",
	"Russian (Russia)": "Europe",
	"Spanish (Spain)": "Europe",
	"Swedish (Sweden)": "Europe",
	"Turkish (Türkiye)": "Europe",
	"Ukrainian (Ukraine)": "Europe",
	"Welsh (United Kingdom)": "Europe",
	// Americas
	"English (United States)": "Americas",
	"French (Canada)": "Americas",
	"Portuguese (Brazil)": "Americas",
	"Spanish (Mexico)": "Americas",
	"Spanish (United States)": "Americas",
	// Africa
	"Afrikaans (South Africa)": "Africa",
	"Amharic (Ethiopia)": "Africa",
	// Middle East
	Arabic: "Middle East",
	"Arabic (Egypt)": "Middle East",
	"Arabic (Saudi Arabia)": "Middle East",
	"Arabic (United Arab Emirates)": "Middle East",
	"Hebrew (Israel)": "Middle East",
};

const CONTINENT_ORDER = ["Asia", "Europe", "Americas", "Africa", "Middle East"];

/** Pre-sorted groups used by the language picker when no search query is active. */
const LANG_GROUPS = (() => {
	const buckets = {};
	for (const c of CONTINENT_ORDER) buckets[c] = [];
	const other = [];
	for (const lang of LANGS) {
		const c = LANG_CONTINENT_MAP[lang];
		if (c && buckets[c]) buckets[c].push(lang);
		else other.push(lang);
	}
	for (const c of CONTINENT_ORDER) buckets[c].sort((a, b) => a.localeCompare(b));
	other.sort((a, b) => a.localeCompare(b));
	return [
		...CONTINENT_ORDER
			.filter((c) => buckets[c].length > 0)
			.map((c) => ({ continent: c, langs: buckets[c] })),
		...(other.length ? [{ continent: "Other", langs: other }] : []),
	];
})();
const LANG_FLAG_EXACT = {
	English: "🇬🇧",
	Spanish: "🇪🇸",
	French: "🇫🇷",
	Hindi: "🇮🇳",
	Italian: "🇮🇹",
	German: "🇩🇪",
	Polish: "🇵🇱",
	Portuguese: "🇵🇹",
	Chinese: "🇨🇳",
	Japanese: "🇯🇵",
	Dutch: "🇳🇱",
	Turkish: "🇹🇷",
	Korean: "🇰🇷",
	Danish: "🇩🇰",
	Arabic: "🇸🇦",
	Romanian: "🇷🇴",
	Mandarin: "🇨🇳",
	Filipino: "🇵🇭",
	Swedish: "🇸🇪",
	Indonesian: "🇮🇩",
	Ukrainian: "🇺🇦",
	Greek: "🇬🇷",
	Czech: "🇨🇿",
	Bulgarian: "🇧🇬",
	Malay: "🇲🇾",
	Slovak: "🇸🇰",
	Croatian: "🇭🇷",
	Tamil: "🇮🇳",
	Finnish: "🇫🇮",
	Russian: "🇷🇺",
	Vietnamese: "🇻🇳",
};
function flagForLanguageName(name) {
	if (!name) return "🌐";
	if (LANG_FLAG_EXACT[name]) return LANG_FLAG_EXACT[name];
	const n = name.toLowerCase();
	if (n.includes("welsh")) return "🇬🇧";
	if (
		n.includes("english (india)") ||
		(n.includes("bengali") && n.includes("india"))
	)
		return "🇮🇳";
	if (n.includes("hindi")) return "🇮🇳";
	if (
		n.includes("english (uk)") ||
		(n.includes("united kingdom") && n.includes("english"))
	)
		return "🇬🇧";
	if (n.includes("english (united states)") || n.includes("english (us)"))
		return "🇺🇸";
	if (n.startsWith("english")) return "🇬🇧";
	if (n.includes("spanish"))
		return n.includes("mexico")
			? "🇲🇽"
			: n.includes("united states")
				? "🇪🇸"
				: "🇪🇸";
	if (n.includes("french"))
		return n.includes("canada") ? "🇨🇦" : n.includes("france") ? "🇫🇷" : "🇫🇷";
	if (n.includes("german")) return n.includes("austria") ? "🇦🇹" : "🇩🇪";
	if (n.includes("italian")) return "🇮🇹";
	if (n.includes("portuguese")) return n.includes("brazil") ? "🇧🇷" : "🇵🇹";
	if (n.includes("dutch")) return n.includes("belgium") ? "🇧🇪" : "🇳🇱";
	if (n.includes("polish")) return "🇵🇱";
	if (n.includes("russian")) return "🇷🇺";
	if (n.includes("ukrainian")) return "🇺🇦";
	if (n.includes("chinese"))
		return n.includes("taiwan") ? "🇹🇼" : n.includes("cantonese") ? "🇭🇰" : "🇨🇳";
	if (n.includes("mandarin")) return "🇨🇳";
	if (n.includes("japanese")) return "🇯🇵";
	if (n.includes("korean")) return "🇰🇷";
	if (n.includes("arabic"))
		return n.includes("egypt")
			? "🇪🇬"
			: n.includes("saudi")
				? "🇸🇦"
				: n.includes("uae")
					? "🇦🇪"
					: "🇸🇦";
	if (n.includes("hindi")) return "🇮🇳";
	if (n.includes("turkish")) return "🇹🇷";
	if (n.includes("vietnamese")) return "🇻🇳";
	if (n.includes("thai")) return "🇹🇭";
	if (n.includes("indonesian")) return "🇮🇩";
	if (n.includes("filipino") || n.includes("tagalog")) return "🇵🇭";
	if (n.includes("swedish")) return "🇸🇪";
	if (n.includes("norwegian")) return "🇳🇴";
	if (n.includes("danish")) return "🇩🇰";
	if (n.includes("finnish")) return "🇫🇮";
	if (n.includes("greek")) return "🇬🇷";
	if (n.includes("hebrew")) return "🇮🇱";
	if (n.includes("persian") || n.includes("farsi")) return "🇮🇷";
	if (n.includes("romanian")) return "🇷🇴";
	if (n.includes("czech")) return "🇨🇿";
	if (n.includes("hungarian")) return "🇭🇺";
	if (n.includes("croatian")) return "🇭🇷";
	if (n.includes("slovak")) return "🇸🇰";
	if (n.includes("bulgarian")) return "🇧🇬";
	if (n.includes("tamil")) return "🇮🇳";
	if (n.includes("telugu")) return "🇮🇳";
	if (n.includes("malayalam")) return "🇮🇳";
	if (n.includes("kannada")) return "🇮🇳";
	if (n.includes("marathi")) return "🇮🇳";
	if (n.includes("gujarati")) return "🇮🇳";
	if (n.includes("urdu")) return "🇵🇰";
	if (n.includes("bengali")) return "🇧🇩";
	if (n.includes("bangla")) return "🇧🇩";
	if (n.includes("malay")) return "🇲🇾";
	if (n.includes("afrikaans")) return "🇿🇦";
	if (n.includes("albanian")) return "🇦🇱";
	if (n.includes("amharic")) return "🇪🇹";
	if (n.includes("armenian")) return "🇦🇲";
	if (n.includes("catalan")) return "🇪🇸";
	if (n.includes("latin america")) return "🌐";
	return "🌐";
}

/** ISO-style code for video-caption / viral-clip APIs */
export function languageNameToApiCode(name) {
	if (!name) return "en";
	const n = String(name).toLowerCase();
	const rules = [
		[/chinese.*cantonese/, "zh"],
		[/chinese.*taiwan/, "zh"],
		[/chinese|mandarin/, "zh"],
		[/english/, "en"],
		[/spanish/, "es"],
		[/french/, "fr"],
		[/hindi/, "hi"],
		[/german/, "de"],
		[/italian/, "it"],
		[/portuguese/, "pt"],
		[/japanese/, "ja"],
		[/korean/, "ko"],
		[/arabic/, "ar"],
		[/russian/, "ru"],
		[/dutch/, "nl"],
		[/polish/, "pl"],
		[/turkish/, "tr"],
		[/vietnamese/, "vi"],
		[/thai/, "th"],
		[/indonesian/, "id"],
		[/filipino|tagalog/, "fil"],
		[/swedish/, "sv"],
		[/danish/, "da"],
		[/finnish/, "fi"],
		[/greek/, "el"],
		[/hebrew/, "he"],
		[/persian|farsi/, "fa"],
		[/romanian/, "ro"],
		[/czech/, "cs"],
		[/hungarian/, "hu"],
		[/croatian/, "hr"],
		[/slovak/, "sk"],
		[/bulgarian/, "bg"],
		[/ukrainian/, "uk"],
		[/tamil/, "ta"],
		[/telugu/, "te"],
		[/malayalam/, "ml"],
		[/kannada/, "kn"],
		[/marathi/, "mr"],
		[/gujarati/, "gu"],
		[/urdu/, "ur"],
		[/bengali|bangla/, "bn"],
		[/malay/, "ms"],
		[/afrikaans/, "af"],
		[/albanian/, "sq"],
		[/amharic/, "am"],
		[/armenian/, "hy"],
		[/catalan/, "ca"],
		[/norwegian/, "no"],
		[/welsh/, "cy"],
	];
	for (const [re, code] of rules) {
		if (re.test(n)) return code;
	}
	return "en";
}

export {
	LANGS,
	LANG_CONTINENT_MAP,
	CONTINENT_ORDER,
	LANG_GROUPS,
	LANG_FLAG_EXACT,
	flagForLanguageName,
};
