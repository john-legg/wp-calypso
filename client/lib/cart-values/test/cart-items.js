import {
	GSUITE_BASIC_SLUG,
	PLAN_FREE,
	PLAN_BLOGGER,
	PLAN_BLOGGER_2_YEARS,
	PLAN_PERSONAL,
	PLAN_PERSONAL_2_YEARS,
	PLAN_PREMIUM,
	PLAN_PREMIUM_2_YEARS,
	PLAN_BUSINESS,
	PLAN_BUSINESS_2_YEARS,
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
	PRODUCT_JETPACK_BACKUP_DAILY,
} from '@automattic/calypso-products';
const { getPlan, getTermDuration } = require( '@automattic/calypso-products' );
const cartItems = require( '../cart-items' );
const {
	planItem,
	isNextDomainFree,
	hasRenewableSubscription,
	isDomainBeingUsedForPlan,
	getCartItemBillPeriod,
	getDomainPriceRule,
	hasToUpgradeToPayForADomain,
	getRenewalItemFromProduct,
	supportsPrivacyProtectionPurchase,
} = cartItems;

describe( 'planItem()', () => {
	test( 'should return null for free plan', () => {
		expect( planItem( PLAN_FREE ) ).toBe( null );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( ( product_slug ) => {
		test( `should return an object for non-free plan (${ product_slug })`, () => {
			expect( planItem( product_slug ).product_slug ).toBe( product_slug );
		} );
	} );
} );

describe( 'getCartItemBillPeriod()', () => {
	test( 'if cartItem has bill_period property, it should be returned', () => {
		expect( getCartItemBillPeriod( { bill_period: 180 } ) ).toBe( 180 );
		expect( getCartItemBillPeriod( { bill_period: 114 } ) ).toBe( 114 );
		expect( getCartItemBillPeriod( { bill_period: 4 } ) ).toBe( 4 );
		expect( getCartItemBillPeriod( { bill_period: -1 } ) ).toBe( -1 );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_JETPACK_PERSONAL,
		PLAN_JETPACK_PERSONAL_MONTHLY,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_JETPACK_PREMIUM,
		PLAN_JETPACK_PREMIUM_MONTHLY,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
		PLAN_JETPACK_BUSINESS,
		PLAN_JETPACK_BUSINESS_MONTHLY,
	].forEach( ( product_slug ) => {
		test( `should return plan bill_period for any plan with product_slug ${ product_slug }`, () => {
			const expected_bill_period = getTermDuration( getPlan( product_slug ).term );

			expect(
				getCartItemBillPeriod( {
					product_slug,
				} )
			).toBe( expected_bill_period );
		} );
	} );
} );

describe( 'hasRenewableSubscription()', () => {
	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_JETPACK_PERSONAL,
		PLAN_JETPACK_PERSONAL_MONTHLY,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_JETPACK_PREMIUM,
		PLAN_JETPACK_PREMIUM_MONTHLY,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
		PLAN_JETPACK_BUSINESS,
		PLAN_JETPACK_BUSINESS_MONTHLY,
	].forEach( ( product_slug ) => {
		test( `should return true for product with bill_period same as plan ${ product_slug }`, () => {
			const bill_period = getTermDuration( getPlan( product_slug ).term );

			expect(
				hasRenewableSubscription( {
					products: [ { bill_period } ],
				} )
			).toBe( true );
		} );

		test( `should return true for product with product_slug same as plan ${ product_slug }`, () => {
			expect(
				hasRenewableSubscription( {
					products: [ { product_slug } ],
				} )
			).toBe( true );
		} );
	} );
} );

describe( 'isDomainBeingUsedForPlan()', () => {
	const buildCartWithDomain = ( plan_slug = PLAN_PREMIUM, domain = 'domain.com' ) => ( {
		products: [
			{ product_slug: plan_slug },
			{
				is_domain_registration: true,
				meta: domain,
			},
		],
	} );
	test( 'should return true for premium plan and .com domain', () => {
		expect( isDomainBeingUsedForPlan( buildCartWithDomain(), 'domain.com' ) ).toBe( true );
	} );
	test( 'should return false when cart is null', () => {
		expect( isDomainBeingUsedForPlan( null, 'domain.com' ) ).toBe( false );
	} );
	test( 'should return false when domain is falsey', () => {
		expect( isDomainBeingUsedForPlan( buildCartWithDomain(), null ) ).toBe( false );
	} );
	test( 'should return false when domain does not match one in the cart', () => {
		expect( isDomainBeingUsedForPlan( buildCartWithDomain(), 'anotherdomain.com' ) ).toBe( false );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( ( product_slug ) => {
		test( `should return true for ${ product_slug } plan and .com domain`, () => {
			expect( isDomainBeingUsedForPlan( buildCartWithDomain( product_slug ), 'domain.com' ) ).toBe(
				true
			);
		} );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( ( product_slug ) => {
		test( `should return true for ${ product_slug } plan and .blog domain`, () => {
			expect(
				isDomainBeingUsedForPlan(
					buildCartWithDomain( product_slug, 'domain.blog' ),
					'domain.blog'
				)
			).toBe( true );
		} );
	} );

	[ PLAN_BLOGGER, PLAN_BLOGGER_2_YEARS ].forEach( ( product_slug ) => {
		test( `should return false for ${ product_slug } plan and .com domain`, () => {
			expect( isDomainBeingUsedForPlan( buildCartWithDomain( product_slug ), 'domain.com' ) ).toBe(
				false
			);
		} );
	} );

	[ PLAN_BLOGGER, PLAN_BLOGGER_2_YEARS ].forEach( ( product_slug ) => {
		test( `should return false for ${ product_slug } plan and .blog domain`, () => {
			expect(
				isDomainBeingUsedForPlan(
					buildCartWithDomain( product_slug, 'domain.blog' ),
					'domain.blog'
				)
			).toBe( true );
		} );
	} );
} );

describe( 'isNextDomainFree()', () => {
	test( 'should return true when cart.next_domain_is_free is true', () => {
		expect( isNextDomainFree( { next_domain_is_free: true } ) ).toBe( true );
	} );
	test( 'should return true when cart.next_domain_is_free, next_domain_condition is empty and no domain is passed', () => {
		expect( isNextDomainFree( { next_domain_is_free: true, next_domain_condition: '' } ) ).toBe(
			true
		);
	} );
	test( 'should return false when cart.next_domain_is_free, next_domain_condition is blog and no domain is passed', () => {
		expect( isNextDomainFree( { next_domain_is_free: true, next_domain_condition: 'blog' } ) ).toBe(
			false
		);
	} );
	test( 'should return false when cart.next_domain_is_free is true, but condition is "blog" and requested domain is .com', () => {
		expect(
			isNextDomainFree( { next_domain_is_free: true, next_domain_condition: 'blog' }, 'domain.com' )
		).toBe( false );
	} );
	test( 'should return true when cart.next_domain_is_free is true, but condition is "blog" and requested domain is .blog', () => {
		expect(
			isNextDomainFree(
				{ next_domain_is_free: true, next_domain_condition: 'blog' },
				'domain.blog'
			)
		).toBe( true );
	} );
	test( 'should return false when cart.next_domain_is_free is false', () => {
		expect( isNextDomainFree( { next_domain_is_free: false } ) ).toBe( false );
	} );
	test( 'should return false when cart is null', () => {
		expect( isNextDomainFree( null ) ).toBe( false );
	} );
} );

describe( 'getDomainPriceRule()', () => {
	const buildCartWithDomain = ( plan_slug = PLAN_PREMIUM, domain = 'domain.com' ) => ( {
		products: [
			{ product_slug: plan_slug },
			{
				is_domain_registration: true,
				meta: domain,
			},
		],
	} );

	describe( 'general', () => {
		test( 'should return FREE_DOMAIN when product slug is empty', () => {
			expect( getDomainPriceRule( false, null, null, { product_slug: null, cost: '14' } ) ).toBe(
				'FREE_DOMAIN'
			);
		} );
		test( 'should return FREE_DOMAIN when cost is Free', () => {
			expect( getDomainPriceRule( false, null, null, { product_slug: 'hi', cost: 'Free' } ) ).toBe(
				'FREE_DOMAIN'
			);
		} );
	} );

	describe( 'site is on a free plan', () => {
		test( 'should return INCLUDED_IN_HIGHER_PLAN if site has no domain and no plan in cart [withPlansOnly=true]', () => {
			expect(
				getDomainPriceRule(
					true,
					{ plan: { product_slug: 'free_plan' } },
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'INCLUDED_IN_HIGHER_PLAN' );
		} );
		test( 'should return PRICE if site has no domain and no plan in cart [withPlansOnly=false]', () => {
			expect(
				getDomainPriceRule(
					false,
					{ plan: { product_slug: 'free_plan' } },
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'PRICE' );
		} );

		test( 'should return PRICE if it is a domain only flow (NUX, isDomainOnly: true)', () => {
			expect(
				getDomainPriceRule(
					false,
					{},
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' },
					true
				)
			).toBe( 'PRICE' );
		} );

		test( 'should return FREE_WITH_YOUR_PLAN if site has plan in cart and next_domain_is_free is true', () => {
			expect(
				getDomainPriceRule(
					false,
					{ plan: { product_slug: 'free_plan' } },
					{
						products: [ { product_slug: PLAN_PREMIUM } ],
						next_domain_is_free: true,
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'FREE_WITH_PLAN' );
		} );

		test( 'should return FREE_WITH_YOUR_PLAN if site has plan in cart and a domain in cart', () => {
			expect(
				getDomainPriceRule(
					false,
					{ plan: { product_slug: 'free_plan' } },
					{
						products: [
							{ product_slug: PLAN_PREMIUM },
							{ is_domain_registration: true, meta: 'domain.com' },
						],
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'FREE_WITH_PLAN' );
		} );

		test( 'should return PAID if site has plan in cart and next_domain_is_free is false', () => {
			expect(
				getDomainPriceRule(
					false,
					{ plan: { product_slug: 'free_plan' } },
					{
						products: [ { product_slug: PLAN_PREMIUM } ],
						next_domain_is_free: false,
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'PRICE' );
		} );
	} );

	describe( 'site is on a personal plan', () => {
		test( 'should return PRICE if site has no domain and no plan in cart (next_domain_is_free is not set)', () => {
			expect(
				getDomainPriceRule(
					true,
					{ plan: { product_slug: PLAN_PERSONAL } },
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'PRICE' );
		} );
		test( 'should return FREE_WITH_PLAN if site has no domain and no plan in cart (next_domain_is_free=true)', () => {
			expect(
				getDomainPriceRule(
					true,
					{ plan: { product_slug: PLAN_PERSONAL } },
					{ next_domain_is_free: true },
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'FREE_WITH_PLAN' );
		} );
		test( 'should return PRICE if site has no domain and a plan in cart (next_domain_is_free=false)', () => {
			expect(
				getDomainPriceRule(
					true,
					{ plan: { product_slug: PLAN_PERSONAL } },
					{
						products: [ { product_slug: PLAN_PREMIUM } ],
						next_domain_is_free: false,
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'PRICE' );
		} );
		test( 'should return PRICE if site has no domain and no plan in cart (next_domain_is_free=false)', () => {
			expect(
				getDomainPriceRule(
					true,
					{ plan: { product_slug: PLAN_PERSONAL } },
					{
						next_domain_is_free: false,
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'PRICE' );
		} );
	} );

	describe( 'site is on a premium plan', () => {
		test( 'should return FREE_WITH_PLAN when domain is being used for plan', () => {
			expect(
				getDomainPriceRule( false, null, buildCartWithDomain( PLAN_PREMIUM, 'domain.com' ), {
					domain_name: 'domain.com',
					product_slug: 'domain',
				} )
			).toBe( 'FREE_WITH_PLAN' );
		} );

		test( 'should return FREE_WITH_PLAN when next domain is free', () => {
			expect(
				getDomainPriceRule(
					false,
					null,
					{
						products: [ { product_slug: PLAN_PREMIUM } ],
						next_domain_is_free: true,
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'FREE_WITH_PLAN' );
		} );

		test( 'should return PRICE when .com domain is being used for plan that already has a domain', () => {
			expect(
				getDomainPriceRule(
					false,
					{ plan: { product_slug: PLAN_PERSONAL }, domain: {} },
					{
						is_domain_registration: true,
						meta: 'domain.com',
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'PRICE' );
		} );
	} );

	describe( 'site is on a blogger plan', () => {
		test( 'should return FREE_WITH_PLAN when .blog domain is being used for plan', () => {
			expect(
				getDomainPriceRule( false, null, buildCartWithDomain( PLAN_BLOGGER, 'domain.blog' ), {
					domain_name: 'domain.blog',
					product_slug: 'domain',
				} )
			).toBe( 'FREE_WITH_PLAN' );
		} );

		test( 'should return FREE_WITH_PLAN when next domain is free ( .blog domain )', () => {
			expect(
				getDomainPriceRule(
					false,
					null,
					{
						products: [ { product_slug: PLAN_BLOGGER } ],
						next_domain_is_free: true,
						next_domain_condition: 'blog',
					},
					{ domain_name: 'domain.blog', product_slug: 'domain' }
				)
			).toBe( 'FREE_WITH_PLAN' );
		} );

		test( 'should return UPGRADE_TO_HIGHER_PLAN_TO_BUY when next domain is free ( .com domain )', () => {
			expect(
				getDomainPriceRule(
					false,
					null,
					{
						products: [ { product_slug: PLAN_BLOGGER } ],
						next_domain_is_free: true,
						next_domain_condition: 'blog',
					},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'UPGRADE_TO_HIGHER_PLAN_TO_BUY' );
		} );

		test( 'should return UPGRADE_TO_HIGHER_PLAN_TO_BUY when .com domain is being used for plan', () => {
			expect(
				getDomainPriceRule( false, null, buildCartWithDomain( PLAN_BLOGGER, 'domain.blog' ), {
					domain_name: 'domain.com',
					product_slug: 'domain',
				} )
			).toBe( 'UPGRADE_TO_HIGHER_PLAN_TO_BUY' );
		} );

		test( 'should return UPGRADE_TO_HIGHER_PLAN_TO_BUY when .com domain is being used for plan that already has no domain', () => {
			expect(
				getDomainPriceRule(
					false,
					{ plan: { product_slug: PLAN_BLOGGER }, domain: {} },
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' }
				)
			).toBe( 'UPGRADE_TO_HIGHER_PLAN_TO_BUY' );
		} );
	} );

	describe( 'plan flows which do not include a free domain', () => {
		test( 'should return PRICE if flowName is free', () => {
			expect(
				getDomainPriceRule(
					true,
					null,
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' },
					false,
					'free'
				)
			).toBe( 'PRICE' );
		} );

		test( 'should return PRICE if flowName is personal-monthly', () => {
			expect(
				getDomainPriceRule(
					true,
					null,
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' },
					false,
					'personal-monthly'
				)
			).toBe( 'PRICE' );
		} );

		test( 'should return PRICE if flowName is premium-monthly', () => {
			expect(
				getDomainPriceRule(
					true,
					null,
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' },
					false,
					'premium-monthly'
				)
			).toBe( 'PRICE' );
		} );

		test( 'should return PRICE if flowName is business-monthly', () => {
			expect(
				getDomainPriceRule(
					true,
					null,
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' },
					false,
					'business-monthly'
				)
			).toBe( 'PRICE' );
		} );

		test( 'should return PRICE if flowName is ecommerce-monthly', () => {
			expect(
				getDomainPriceRule(
					true,
					null,
					{},
					{ domain_name: 'domain.com', product_slug: 'domain' },
					false,
					'ecommerce-monthly'
				)
			).toBe( 'PRICE' );
		} );
	} );
} );

describe( 'hasToUpgradeToPayForADomain()', () => {
	test( 'should return true if current site is on a blogger plan, and adding a non .blog domain', () => {
		expect(
			hasToUpgradeToPayForADomain( { plan: { product_slug: PLAN_BLOGGER } }, {}, 'domain.com' )
		).toBe( true );
	} );

	test( 'should return true if current site is on a blogger 2y plan, and adding a non .blog domain', () => {
		expect(
			hasToUpgradeToPayForADomain(
				{ plan: { product_slug: PLAN_BLOGGER_2_YEARS } },
				{},
				'domain.com'
			)
		).toBe( true );
	} );

	test( 'should return true if blogger plan is in the cart, and adding a non .blog domain', () => {
		expect(
			hasToUpgradeToPayForADomain(
				{},
				{ products: [ { product_slug: PLAN_BLOGGER } ] },
				'domain.com'
			)
		).toBe( true );
	} );

	test( 'should return true if blogger 2y plan is in the cart, and adding a non .blog domain', () => {
		expect(
			hasToUpgradeToPayForADomain(
				{},
				{ products: [ { product_slug: PLAN_BLOGGER_2_YEARS } ] },
				'domain.com'
			)
		).toBe( true );
	} );

	test( 'should return false if blogger plan is not in the cart', () => {
		expect(
			hasToUpgradeToPayForADomain(
				{ plan: { product_slug: PLAN_FREE } },
				{ products: [ { product_slug: PLAN_PERSONAL } ] },
				'domain.com'
			)
		).toBe( false );
	} );

	[
		PLAN_FREE,
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( ( product_slug ) => {
		test( `should return false if current site is not on a blogger plan [${ product_slug }]`, () => {
			expect( hasToUpgradeToPayForADomain( { plan: { product_slug } }, {} ) ).toBe( false );
		} );
	} );

	test( 'should return false if current site has no plan', () => {
		expect( hasToUpgradeToPayForADomain( { plan: {} }, {} ) ).toBe( false );
	} );

	test( 'should return false if current site is empty', () => {
		expect( hasToUpgradeToPayForADomain( {}, {} ) ).toBe( false );
	} );

	test( 'should return false if current site is not passed', () => {
		expect( hasToUpgradeToPayForADomain( null, {} ) ).toBe( false );
	} );
} );

describe( 'getRenewalItemFromProduct()', () => {
	const buildPurchase = ( overrides ) => ( {
		id: 123,
		domain: 'purchased.com',
		...overrides,
	} );
	const properties = {
		domain: 'purchased.com',
	};
	describe( 'isDomainProduct', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'domain_map', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				meta: 'purchased.com',
				product_slug: 'domain_map',
			} );
		} );
	} );
	describe( 'isPlan', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: PLAN_PERSONAL, isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: PLAN_PERSONAL,
			} );
		} );
	} );
	describe( 'isGoogleApps', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: GSUITE_BASIC_SLUG, users: 123, isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					google_apps_users: 123,
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				meta: 'purchased.com',
				product_slug: GSUITE_BASIC_SLUG,
			} );
		} );
	} );
	describe( 'isSiteRedirect', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'offsite_redirect', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				meta: 'purchased.com',
				product_slug: 'offsite_redirect',
			} );
		} );
	} );
	describe( 'isNoAds', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'no-adverts/no-adverts.php', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: 'no-adverts/no-adverts.php',
			} );
		} );
	} );
	describe( 'isCustomDesign', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'custom-design', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: 'custom-design',
			} );
		} );
	} );
	describe( 'isVideoPress', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'videopress', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: 'videopress',
			} );
		} );
	} );
	describe( 'isUnlimitedSpace', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'unlimited_space', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: 'unlimited_space',
			} );
		} );
	} );
	describe( 'isUnlimitedThemes', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'unlimited_themes', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: 'unlimited_themes',
			} );
		} );
	} );
	describe( 'isJetpackProduct', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: PRODUCT_JETPACK_BACKUP_DAILY, isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: PRODUCT_JETPACK_BACKUP_DAILY,
			} );
		} );
	} );
	describe( 'isSpaceUpgrade', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: '1gb_space_upgrade', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: '1gb_space_upgrade',
			} );
		} );
	} );
	describe( 'isRenewable', () => {
		test( 'should return the corresponding renewal item', () => {
			expect(
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'woocommerce_subscriptions_monthly', isRenewable: true } ),
					properties
				)
			).toEqual( {
				extra: {
					purchaseId: 123,
					purchaseType: 'renewal',
				},
				product_slug: 'woocommerce_subscriptions_monthly',
			} );
		} );
	} );

	describe( 'renewal not supported', () => {
		test( 'should return the corresponding renewal item', () => {
			expect( () =>
				getRenewalItemFromProduct(
					buildPurchase( { product_slug: 'new_plan_does_not_exist' } ),
					properties
				)
			).toThrowError( 'This product cannot be renewed' );
		} );
	} );
} );

describe( 'supportsPrivacyProtectionPurchase', () => {
	const testProducts = {
		non_private_product: {
			product_slug: 'non_private_product',
		},
		private_product: {
			product_slug: 'private_product',
			is_privacy_protection_product_purchase_allowed: true,
		},
	};

	it( 'returns true if the product slug matches a product with privacy allowed', () => {
		expect( supportsPrivacyProtectionPurchase( 'private_product', testProducts ) ).toBeTruthy();
	} );

	it( 'returns false if the product slug does not match a product with privacy allowed', () => {
		expect( supportsPrivacyProtectionPurchase( 'non_private_product', testProducts ) ).toBeFalsy();
	} );
} );
