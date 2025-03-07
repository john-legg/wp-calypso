import { createSelector } from '@automattic/state-utils';
import isJetpackSite from 'calypso/state/sites/selectors/is-jetpack-site';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import { AppState } from 'calypso/types';

/**
 * Returns true if the current site is a simple site
 *
 * @param  {object}   state         Global state tree
 * @returns {?boolean}               Whether the current site is a simple site or not
 */
export default createSelector(
	( state: AppState, siteId = getSelectedSiteId( state ) ) => ! isJetpackSite( state, siteId ),
	( state: AppState, siteId = getSelectedSiteId( state ) ) => [ isJetpackSite( state, siteId ) ]
);
