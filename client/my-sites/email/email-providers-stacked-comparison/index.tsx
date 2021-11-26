import {
	GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY,
	TITAN_MAIL_MONTHLY_SLUG,
} from '@automattic/calypso-products';
import { withShoppingCart } from '@automattic/shopping-cart';
import { TranslateResult, useTranslate } from 'i18n-calypso';
import React, { FunctionComponent, ReactElement, useState, Validator } from 'react';
import { connect } from 'react-redux';
import QueryProductsList from 'calypso/components/data/query-products-list';
import QuerySiteDomains from 'calypso/components/data/query-site-domains';
import { getSelectedDomain } from 'calypso/lib/domains';
import { hasGSuiteSupportedDomain } from 'calypso/lib/gsuite';
import { buildNewTitanMailbox } from 'calypso/lib/titan/new-mailbox';
import withCartKey from 'calypso/my-sites/checkout/with-cart-key';
import {
	PASSWORD_RESET_TITAN_FIELD,
	FULL_NAME_TITAN_FIELD,
} from 'calypso/my-sites/email/titan-new-mailbox';
import TitanNewMailboxList from 'calypso/my-sites/email/titan-new-mailbox-list';
import { FullWidthButton } from 'calypso/my-sites/marketplace/components';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import { errorNotice } from 'calypso/state/notices/actions';
import { NoticeOptions } from 'calypso/state/notices/types';
import { getProductBySlug, getProductsList } from 'calypso/state/products-list/selectors';
import canUserPurchaseGSuite from 'calypso/state/selectors/can-user-purchase-gsuite';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import { getDomainsWithForwards } from 'calypso/state/selectors/get-email-forwards';
import { fetchSiteDomains } from 'calypso/state/sites/domains/actions';
import { getDomainsBySiteId, isRequestingSiteDomains } from 'calypso/state/sites/domains/selectors';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import EmailProvidersStackedCard from './email-provider-stacked-card';
import { professionalEmailCard } from './provider-cards/professional-email-card';
import type { Domain } from '@automattic/data-stores/dist/types/site';

import './style.scss';

type Site = {
	ID: number;
	slug: string;
};

type TitanMailbox = {
	uuid: Validator< string >;
	domain: Validator< string >;
	mailbox: Validator< string >;
	password: Validator< string >;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type EmailProvidersStackedComparisonProps = {
	comparisonContext: string;
	selectedDomainName: string;
	source: string;
	cartDomainName?: string;
	selectedSite?: Site;
	currencyCode?: string;
	currentRoute?: string;
	domain?: Domain;
	domainName?: string;
	domainsWithForwards?: Domain[];
	gSuiteProduct?: string;
	hasCartDomain?: boolean;
	isGSuiteSupported?: boolean;
	productsList?: string[];
	requestingSiteDomains?: boolean;
	titanMailProduct?: string;
};

export interface ProviderCard {
	additionalPriceInformation?: TranslateResult;
	badge?: ReactElement;
	buttonLabel?: TranslateResult;
	children?: ReactElement;
	description: TranslateResult;
	detailsExpanded: boolean;
	discount?: string;
	expandButtonLabel: TranslateResult;
	features: TranslateResult[];
	footerBadge?: ReactElement;
	formattedPrice: string;
	formFields: ReactElement;
	logo: ReactElement;
	onExpandedChange: ( providerKey: string, expanded: boolean ) => void;
	onButtonClick?: ( event: React.MouseEvent ) => void;
	productName: TranslateResult;
	providerKey: string;
	showExpandButton: boolean;
}

const EmailProvidersStackedComparison: FunctionComponent< EmailProvidersStackedComparisonProps > = (
	props
) => {
	const translate = useTranslate();
	const professionalEmail: ProviderCard = professionalEmailCard;
	const { selectedSite, selectedDomainName } = props;

	const onTitanFormReturnKeyPress = noop;
	const validatedTitanMailboxUuids: TitanMailbox[] = [];
	const onTitanConfirmNewMailboxes = noop;

	const [ titanMailbox, setTitanMailbox ] = useState( [
		buildNewTitanMailbox( selectedDomainName, false ),
	] );
	const [ addingToCart ] = useState( false );

	const formFields = (
		<TitanNewMailboxList
			onMailboxesChange={ setTitanMailbox }
			mailboxes={ titanMailbox }
			selectedDomainName={ selectedDomainName }
			onReturnKeyPress={ onTitanFormReturnKeyPress }
			showLabels={ true }
			validatedMailboxUuids={ validatedTitanMailboxUuids }
			showAddAnotherMailboxButton={ false }
			hiddenFields={ [ FULL_NAME_TITAN_FIELD, PASSWORD_RESET_TITAN_FIELD ] }
		>
			<FullWidthButton
				className="email-providers-stacked-comparison__continue"
				primary
				busy={ addingToCart }
				onClick={ onTitanConfirmNewMailboxes }
			>
				{ translate( 'Create your mailbox' ) }
			</FullWidthButton>
		</TitanNewMailboxList>
	);

	return (
		<>
			<QueryProductsList />

			{ selectedSite && <QuerySiteDomains siteId={ selectedSite.ID } /> }

			<h1 className="email-providers-stacked-comparison__header wp-brand-font">
				{ translate( 'Pick and email solution' ) }
			</h1>

			<EmailProvidersStackedCard
				providerKey={ professionalEmail.providerKey }
				logo={ professionalEmail.logo }
				productName={ professionalEmail.productName }
				description={ professionalEmail.description }
				detailsExpanded={ professionalEmail.detailsExpanded }
				discount={ '$42' }
				additionalPriceInformation={ 'per mailbox' }
				onExpandedChange={ professionalEmail.onExpandedChange }
				formattedPrice={ professionalEmail.formattedPrice }
				formFields={ formFields }
				showExpandButton={ professionalEmail.showExpandButton }
				expandButtonLabel={ professionalEmail.expandButtonLabel }
				features={ professionalEmail.features }
				footerBadge={ professionalEmail.badge }
			/>
		</>
	);
};

export default connect(
	( state, ownProps: EmailProvidersStackedComparisonProps ) => {
		const selectedSite = getSelectedSite( state );
		const domains = getDomainsBySiteId( state, selectedSite?.ID );
		const domain = getSelectedDomain( {
			domains,
			selectedDomainName: ownProps.selectedDomainName,
		} );

		const resolvedDomainName = domain ? domain.name : ownProps.selectedDomainName;
		const domainName = ownProps.cartDomainName ?? resolvedDomainName;
		const hasCartDomain = Boolean( ownProps.cartDomainName );

		const isGSuiteSupported =
			canUserPurchaseGSuite( state ) &&
			( hasCartDomain || ( domain && hasGSuiteSupportedDomain( [ domain ] ) ) );

		return {
			currencyCode: getCurrentUserCurrencyCode( state ),
			currentRoute: getCurrentRoute( state ),
			domain,
			domainName,
			domainsWithForwards: getDomainsWithForwards( state, domains ),
			gSuiteProduct: getProductBySlug( state, GOOGLE_WORKSPACE_BUSINESS_STARTER_YEARLY ),
			hasCartDomain,
			isGSuiteSupported,
			productsList: getProductsList( state ),
			requestingSiteDomains: isRequestingSiteDomains( state, domainName ),
			selectedSite,
			titanMailProduct: getProductBySlug( state, TITAN_MAIL_MONTHLY_SLUG ),
		};
	},
	( dispatch ) => {
		return {
			errorNotice: ( text: string, options: NoticeOptions ) =>
				dispatch( errorNotice( text, options ) ),
			getSiteDomains: ( siteId: number ) => dispatch( fetchSiteDomains( siteId ) ),
		};
	}
)( withCartKey( withShoppingCart( EmailProvidersStackedComparison ) ) );
