import Fuse from 'fuse.js';
import { useState, useMemo } from 'react';

type Unarray< T > = T extends Array< infer U > ? U : T;

type CleanFuseFields< T > = Exclude<
	Unarray< Fuse.IFuseOptions< T >[ 'keys' ] >,
	string | string[] | undefined
>;

const defaultOptions = {
	threshold: 0.4,
	distance: 20,
};

type UseFuzzySearchOptions< T > = {
	data: T[];
	fields: ( Exclude< keyof T, number | symbol > | CleanFuseFields< T > )[];
	options?: Partial< Fuse.IFuseOptions< T > >;
	initialQuery?: string;
};

export const useFuzzySearch = < T >( {
	data,
	fields,
	initialQuery = '',
	options = defaultOptions,
}: UseFuzzySearchOptions< T > ) => {
	const [ query, setQuery ] = useState( initialQuery );

	const fuseInstance = useMemo( () => {
		return new Fuse( data, {
			keys: fields,
			includeScore: false,
			includeMatches: false,
			...options,
		} );
	}, [ data, fields, options ] );

	const results = useMemo( () => {
		if ( ! query ) {
			return data;
		}

		return fuseInstance.search( query ).map( ( { item } ) => item );
	}, [ fuseInstance, query, data ] );

	return {
		results,
		query,
		setQuery,
	};
};
