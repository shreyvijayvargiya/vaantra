import { Html, Head, Main, NextScript } from "next/document";

/**
 * Custom Document
 *
 * Note: For route-specific SEO tags, edit lib/config/seo.js
 * The SEO component in _app.js will automatically apply tags based on routes.
 *
 * This file handles base HTML structure and static meta tags.
 */
export default function Document() {
	return (
		<Html lang="en">
			<Head>
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<link rel="icon" href="/aantra-logo.png" type="image/png" />
			<link rel="shortcut icon" href="/aantra-logo.png" type="image/png" />
			<link rel="apple-touch-icon" href="/aantra-logo.png" />

				{/* Base meta tags - route-specific tags are handled in lib/modules/SEO */}
				<meta name="theme-color" content="#18181b" />
				{process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? (
					<meta
						name="google-site-verification"
						content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
					/>
				) : null}
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
