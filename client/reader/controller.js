import i18n from 'i18n-calypso';
import page from 'page';
import { createElement } from 'react';
import AsyncLoad from 'calypso/components/async-load';
import { sectionify } from 'calypso/lib/route';
import wpcom from 'calypso/lib/wp';
import FeedError from 'calypso/reader/feed-error';
import StreamComponent from 'calypso/reader/following/main';
import { isAutomatticTeamMember } from 'calypso/reader/lib/teams';
import { getPrettyFeedUrl, getPrettySiteUrl } from 'calypso/reader/route';
import { recordTrack } from 'calypso/reader/stats';
import { getLastPath } from 'calypso/state/reader-ui/selectors';
import { toggleReaderSidebarFollowing } from 'calypso/state/reader-ui/sidebar/actions';
import { isFollowingOpen } from 'calypso/state/reader-ui/sidebar/selectors';
import { getReaderTeams } from 'calypso/state/teams/selectors';
import { getSection } from 'calypso/state/ui/selectors';
import {
	trackPageLoad,
	trackUpdatesLoaded,
	trackScrollPage,
	setPageTitle,
	getStartDate,
} from './controller-helper';

const analyticsPageTitle = 'Reader';
let lastRoute = null;

function userHasHistory( context ) {
	return !! context.lastRoute;
}

function renderFeedError( context, next ) {
	context.primary = createElement( FeedError );
	next();
}

export function prettyRedirects( context, next ) {
	// Do we have a 'pretty' site or feed URL? We only use this for /discover.
	let redirect;
	if ( context.params.blog_id ) {
		redirect = getPrettySiteUrl( context.params.blog_id );
	} else if ( context.params.feed_id ) {
		redirect = getPrettyFeedUrl( context.params.feed_id );
	}

	if ( redirect ) {
		return page.redirect( redirect );
	}

	next();
}

export function legacyRedirects( context, next ) {
	const legacyPathRegexes = {
		feedStream: /^\/read\/blog\/feed\/([0-9]+)$/i,
		feedFullPost: /^\/read\/post\/feed\/([0-9]+)\/([0-9]+)$/i,
		blogStream: /^\/read\/blog\/id\/([0-9]+)$/i,
		blogFullPost: /^\/read\/post\/id\/([0-9]+)\/([0-9]+)$/i,
	};

	if ( context.path.match( legacyPathRegexes.feedStream ) ) {
		page.redirect( `/read/feeds/${ context.params.feed_id }` );
	} else if ( context.path.match( legacyPathRegexes.feedFullPost ) ) {
		page.redirect( `/read/feeds/${ context.params.feed_id }/posts/${ context.params.post_id }` );
	} else if ( context.path.match( legacyPathRegexes.blogStream ) ) {
		page.redirect( `/read/blogs/${ context.params.blog_id }` );
	} else if ( context.path.match( legacyPathRegexes.blogFullPost ) ) {
		page.redirect( `/read/blogs/${ context.params.blog_id }/posts/${ context.params.post_id }` );
	}

	next();
}

export function updateLastRoute( context, next ) {
	if ( lastRoute ) {
		context.lastRoute = lastRoute;
	}
	lastRoute = context.path;
	next();
}

export function incompleteUrlRedirects( context, next ) {
	let redirect;
	// Have we arrived at a URL ending in /posts? Redirect to feed stream/blog stream
	if ( context.path.match( /^\/read\/feeds\/([0-9]+)\/posts$/i ) ) {
		redirect = `/read/feeds/${ context.params.feed_id }`;
	} else if ( context.path.match( /^\/read\/blogs\/([0-9]+)\/posts$/i ) ) {
		redirect = `/read/blogs/${ context.params.blog_id }`;
	}

	if ( redirect ) {
		return page.redirect( redirect );
	}

	next();
}

export function sidebar( context, next ) {
	context.secondary = (
		<AsyncLoad require="calypso/reader/sidebar" path={ context.path } placeholder={ null } />
	);

	next();
}

export function unmountSidebar( context, next ) {
	next();
}

export function following( context, next ) {
	const basePath = sectionify( context.path );
	const fullAnalyticsPageTitle = analyticsPageTitle + ' > Following';
	const mcKey = 'following';
	const startDate = getStartDate( context );

	const state = context.store.getState();
	// only for a8c for now
	if ( isAutomatticTeamMember( getReaderTeams( state ) ) ) {
		// select last reader path if available, otherwise just open following
		const currentSection = getSection( state );
		const lastPath = getLastPath( state );

		if ( lastPath && lastPath !== '/read' && currentSection.name !== 'reader' ) {
			return page.redirect( lastPath );
		}

		// if we have no last path, default to Following/All and expand following
		const isOpen = isFollowingOpen( state );
		if ( ! isOpen ) {
			context.store.dispatch( toggleReaderSidebarFollowing() );
		}
	}

	trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );
	recordTrack( 'calypso_reader_following_loaded' );

	setPageTitle( context, i18n.translate( 'Following' ) );

	// warn: don't async load this only. we need it to keep feed-post-store in the reader bundle
	context.primary = createElement( StreamComponent, {
		key: 'following',
		listName: i18n.translate( 'Followed Sites' ),
		streamKey: 'following',
		startDate,
		recsStreamKey: 'custom_recs_posts_with_images',
		showPrimaryFollowButtonOnCards: false,
		trackScrollPage: trackScrollPage.bind(
			null,
			basePath,
			fullAnalyticsPageTitle,
			analyticsPageTitle,
			mcKey
		),
		onUpdatesShown: trackUpdatesLoaded.bind( null, mcKey ),
	} );
	next();
}

export function feedDiscovery( context, next ) {
	if ( ! context.params.feed_id.match( /^\d+$/ ) ) {
		const url = context.params.feed_id;
		context.queryClient
			.fetchQuery(
				[ 'feed-discovery', url ],
				() => wpcom.req.get( '/read/feed', { url } ).then( ( res ) => res.feeds[ 0 ].feed_ID ),
				{ meta: { persist: false } }
			)
			.then( ( feedId ) => {
				page.redirect( `/read/feeds/${ feedId }` );
			} )
			.catch( () => {
				renderFeedError( context, next );
			} );
	} else {
		next();
	}
}

export function feedListing( context, next ) {
	const feedId = context.params.feed_id;
	if ( ! parseInt( feedId, 10 ) ) {
		next();
		return;
	}

	const basePath = '/read/feeds/:feed_id';
	const fullAnalyticsPageTitle = analyticsPageTitle + ' > Feed > ' + feedId;
	const mcKey = 'blog';

	trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );
	recordTrack( 'calypso_reader_blog_preview', { feed_id: feedId } );

	context.primary = (
		<AsyncLoad
			require="calypso/reader/feed-stream"
			key={ 'feed-' + feedId }
			streamKey={ 'feed:' + feedId }
			feedId={ +feedId }
			trackScrollPage={ trackScrollPage.bind(
				null,
				basePath,
				fullAnalyticsPageTitle,
				analyticsPageTitle,
				mcKey
			) }
			onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
			showPrimaryFollowButtonOnCards={ false }
			suppressSiteNameLink={ true }
			showBack={ userHasHistory( context ) }
			placeholder={ null }
		/>
	);
	next();
}

export function blogListing( context, next ) {
	const basePath = '/read/blogs/:blog_id';
	const blogId = context.params.blog_id;
	const fullAnalyticsPageTitle = analyticsPageTitle + ' > Site > ' + blogId;
	const streamKey = 'site:' + blogId;
	const mcKey = 'blog';

	trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );
	recordTrack( 'calypso_reader_blog_preview', {
		blog_id: context.params.blog_id,
	} );

	context.primary = (
		<AsyncLoad
			require="calypso/reader/site-stream"
			key={ 'site-' + blogId }
			streamKey={ streamKey }
			siteId={ +blogId }
			trackScrollPage={ trackScrollPage.bind(
				null,
				basePath,
				fullAnalyticsPageTitle,
				analyticsPageTitle,
				mcKey
			) }
			onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
			showPrimaryFollowButtonOnCards={ false }
			suppressSiteNameLink={ true }
			showBack={ userHasHistory( context ) }
			placeholder={ null }
		/>
	);
	next();
}

export function readA8C( context, next ) {
	const basePath = sectionify( context.path );
	const fullAnalyticsPageTitle = analyticsPageTitle + ' > A8C';
	const mcKey = 'a8c';
	const streamKey = 'a8c';
	const startDate = getStartDate( context );

	trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );

	setPageTitle( context, 'Automattic' );

	/* eslint-disable wpcalypso/jsx-classname-namespace */
	context.primary = (
		<AsyncLoad
			require="calypso/reader/a8c/main"
			key="read-a8c"
			className="is-a8c"
			listName="Automattic"
			streamKey={ streamKey }
			startDate={ startDate }
			trackScrollPage={ trackScrollPage.bind(
				null,
				basePath,
				fullAnalyticsPageTitle,
				analyticsPageTitle,
				mcKey
			) }
			showPrimaryFollowButtonOnCards={ false }
			onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
			placeholder={ null }
		/>
	);
	/* eslint-enable wpcalypso/jsx-classname-namespace */
	next();
}

export function readFollowingP2( context, next ) {
	const basePath = sectionify( context.path );
	const fullAnalyticsPageTitle = analyticsPageTitle + ' > P2';
	const mcKey = 'p2';
	const streamKey = 'p2';
	const startDate = getStartDate( context );

	trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );

	setPageTitle( context, 'P2' );

	/* eslint-disable wpcalypso/jsx-classname-namespace */
	context.primary = (
		<AsyncLoad
			require="calypso/reader/p2/main"
			key="read-p2"
			listName="P2"
			streamKey={ streamKey }
			startDate={ startDate }
			trackScrollPage={ trackScrollPage.bind(
				null,
				basePath,
				fullAnalyticsPageTitle,
				analyticsPageTitle,
				mcKey
			) }
			showPrimaryFollowButtonOnCards={ false }
			onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
			placeholder={ null }
		/>
	);
	/* eslint-enable wpcalypso/jsx-classname-namespace */
	next();
}

export async function blogDiscoveryByFeedId( context, next ) {
	const { blog, feed_id } = context.params;

	// If we have already had blog or we don't have feed_id, call `next()` immediately
	if ( blog || ! feed_id ) {
		next();
		return;
	}

	// Query the site by feed_id and inject to the context params so that calypso can get correct site
	// after redirecting the user to log-in page
	context.queryClient
		.fetchQuery(
			[ '/read/feed/', feed_id ],
			() => wpcom.req.get( `/read/feed/${ feed_id }` ).then( ( res ) => res.blog_ID ),
			{ meta: { persist: false } }
		)
		.then( ( blog_id ) => {
			context.params.blog_id = blog_id;
			next();
		} )
		.catch( () => {
			renderFeedError( context, next );
		} );
}
