import { test } from 'zora'
import * as T from '../index.js'

test('into', t => {
	t.deepEqual(
		T.into ([]) (T.map (v => v * 10)) ([ 1, 2, 3 ])
		[ 10, 20, 30 ]
	)
	t.deepEqual(
		T.into ([]) (T.map (v => v * 10)) (new Set([ 1, 2, 3 ]))
		[ 10, 20, 30 ]
	)
	t.deepEqual(
		T.into ({}) (T.map (v => v * 10)) ({ foo: 1, bar: 2 }),
		{ foo: 10, bar: 20 }
	)
	t.deepEqual(
		T.into ('') (T.map (v => v * 10)) ({ foo: 1, bar: 2 }),
		'1020'
	)
})
