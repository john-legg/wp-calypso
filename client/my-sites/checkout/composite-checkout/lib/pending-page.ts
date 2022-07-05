import page from 'page';

export function performCheckoutRedirect( url: string, siteSlug: string | undefined ): void {
	if ( ! isRelativeUrl( url ) ) {
		return performCheckoutFullPageRedirect( url, siteSlug );
	}
	try {
		performCheckoutSPARedirect( url, siteSlug );
	} catch ( err ) {
		performCheckoutFullPageRedirect( url, siteSlug );
	}
}

function isRelativeUrl( url: string ): boolean {
	return url.startsWith( '/' ) && ! url.startsWith( '//' );
}

export function performCheckoutSPARedirect( url: string, siteSlug: string | undefined ): void {
	window.scrollTo( 0, 0 );
	page( addUrlToPendingPageRedirect( url, siteSlug ) );
}

export function performCheckoutFullPageRedirect( url: string, siteSlug: string | undefined ): void {
	window.location.href = addUrlToPendingPageRedirect( url, siteSlug );
}

function addUrlToPendingPageRedirect( url: string, siteSlug: string | undefined ): string {
	const { origin = 'https://wordpress.com' } = typeof window !== 'undefined' ? window.location : {};
	const successUrlPath = `/checkout/thank-you/${ siteSlug || 'no-site' }/pending`;
	const successUrlBase = `${ origin }${ successUrlPath }`;
	const successUrlObject = new URL( successUrlBase );
	successUrlObject.searchParams.set( 'redirectTo', url );
	if ( isRelativeUrl( url ) ) {
		return successUrlObject.pathname + successUrlObject.search + successUrlObject.hash;
	}
	return successUrlObject.href;
}
