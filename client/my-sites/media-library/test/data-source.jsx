/**
 * @jest-environment jsdom
 */
import { mount } from 'enzyme';
import { Provider as ReduxProvider } from 'react-redux';
import MediaLibraryDataSource from 'calypso/my-sites/media-library/data-source';
import { createReduxStore } from 'calypso/state';
import { setStore } from 'calypso/state/redux-store';

const noop = () => {};

// we need to check the correct children are rendered, so this mocks the
// PopoverMenu component with one that simply renders the children
jest.mock( 'calypso/components/popover-menu', () => {
	return ( props ) => <div>{ props.children }</div>;
} );
// only enable the external-media options, enabling everything causes an
// electron related build error
jest.mock( '@automattic/calypso-config', () => {
	const config = () => 'development';
	config.isEnabled = ( property ) => property.startsWith( 'external-media' );
	return config;
} );

describe( 'MediaLibraryDataSource', () => {
	describe( 'render data sources', () => {
		test( 'does not exclude any data sources by default', () => {
			const store = createReduxStore();
			setStore( store );
			const wrapper = mount(
				<ReduxProvider store={ store }>
					<MediaLibraryDataSource
						source={ '' }
						onSourceChange={ noop }
						ignorePermissions={ true }
					/>
				</ReduxProvider>
			);
			expect( wrapper.find( 'button[data-source="google_photos"]' ) ).toHaveLength( 1 );
			expect( wrapper.find( 'button[data-source="pexels"]' ) ).toHaveLength( 1 );
		} );

		test( 'excludes data sources listed in disabledSources', () => {
			const store = createReduxStore();
			setStore( store );
			const wrapper = mount(
				<ReduxProvider store={ store }>
					<MediaLibraryDataSource
						source={ '' }
						onSourceChange={ noop }
						disabledSources={ [ 'pexels' ] }
						ignorePermissions={ true }
					/>
				</ReduxProvider>
			);
			expect( wrapper.find( 'button[data-source="google_photos"]' ) ).toHaveLength( 1 );
			expect( wrapper.find( 'button[data-source="pexels"]' ) ).toHaveLength( 0 );
		} );
	} );
} );
