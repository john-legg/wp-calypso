import { TYPE_STARTER } from '@automattic/calypso-products';
import styled from '@emotion/styled';
import PlanPrice from 'calypso/my-sites/plan-price';
import { SCREEN_BREAKPOINT_SIGNUP, SCREEN_BREAKPOINT_PLANS } from './constant';
import type { Plan } from '@automattic/calypso-products';
import type { translate } from 'i18n-calypso';

interface Props {
	currencyCode: string;
	plan: Plan;
	price?: number;
	originalPrice?: number;
	onClick?: ( productSlug: string ) => void;
	translate: typeof translate;
}

const PlanTitle = styled.h2`
	font-size: 1.125rem;
	margin-bottom: 10px;
	font-weight: 500;

	@media screen and ( min-width: ${ SCREEN_BREAKPOINT_SIGNUP + 1 }px ) {
		.is-section-signup & {
			font-size: 2rem;
			font-family: Recoleta;
		}
	}

	@media screen and ( min-width: ${ SCREEN_BREAKPOINT_PLANS + 1 }px ) {
		.is-section-plans & {
			font-size: 2rem;
			font-family: Recoleta;
		}
	}
`;

const PlanDescription = styled.div`
	font-size: 1rem;
	font-weight: 400;
	margin: 0 0 1.5rem;

	ul {
		font-size: 0.875rem;
		margin-left: 1rem;
	}

	p {
		font-weight: 500;
		margin-bottom: 0.75rem;
	}

	@media screen and ( max-width: ${ SCREEN_BREAKPOINT_SIGNUP }px ) {
		.is-section-signup & {
			display: none;
		}
	}

	@media screen and ( max-width: ${ SCREEN_BREAKPOINT_PLANS }px ) {
		.is-section-plans & {
			display: none;
		}
	}
`;

const PriceContainer = styled.div`
	display: flex;
	flex-direction: row;
	font-family: Recoleta;
	font-weight: 500;

	.plan-price {
		font-size: 2.75rem;
		line-height: 1;
	}
`;

const BillingTimeFrame = styled.div`
	color: var( --studio-gray-40 );
	font-size: 0.75rem;
	font-weight: 500;
	margin: 0.5rem 0 1rem;
`;

export const PlansComparisonColHeader: React.FunctionComponent< Props > = ( {
	currencyCode,
	plan,
	price,
	originalPrice,
	children,
	translate,
} ) => {
	const isDiscounted = typeof originalPrice === 'number';

	return (
		<th scope="col">
			<PlanTitle>{ plan.getTitle() }</PlanTitle>

			<PlanDescription>
				{ plan.type === TYPE_STARTER ? (
					<>
						<p>{ translate( 'Great for blogs and simple sites:' ) }</p>
						<ul>
							<li>{ translate( 'Custom domain name.' ) }</li>
							<li>{ translate( 'Collect payments and donations.' ) }</li>
							<li>{ translate( '6GB of storage for images.' ) }</li>
							<li>{ translate( 'Automatic WordPress updates' ) }.</li>
							<li>{ translate( 'A la carte upgrades available.' ) }</li>
						</ul>
					</>
				) : (
					<>
						<p>{ translate( 'Great for business and custom sites:' ) }</p>
						<ul>
							<li>{ translate( 'Unlock 50k+ plugins and themes.' ) }</li>
							<li>{ translate( 'Advanced ecommerce tools.' ) }</li>
							<li>{ translate( 'Premium website themes.' ) }</li>
							<li>{ translate( '50GB of media storage.' ) }</li>
							<li>{ translate( '24-hour live chat support.' ) }</li>
						</ul>
					</>
				) }
			</PlanDescription>
			<PriceContainer>
				{ isDiscounted && (
					<>
						<PlanPrice
							currencyCode={ currencyCode }
							rawPrice={ originalPrice }
							displayFlatPrice={ true }
							translate={ translate }
							original
						/>
						<PlanPrice
							currencyCode={ currencyCode }
							displayFlatPrice={ true }
							rawPrice={ price }
							translate={ translate }
							discounted
						/>
					</>
				) }
				{ ! isDiscounted && (
					<PlanPrice
						currencyCode={ currencyCode }
						displayFlatPrice={ true }
						rawPrice={ price }
						translate={ translate }
					/>
				) }
			</PriceContainer>
			<BillingTimeFrame>{ plan.getBillingTimeFrame() }</BillingTimeFrame>
			{ children }
		</th>
	);
};
