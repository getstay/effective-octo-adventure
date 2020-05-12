import { test } from 'zora'
import * as T from '../index.js'

test('transduce', t => {
	t.deepEqual(
		T.transduce ([]) (T.Array.builder) (T.map (v => v * 10)) ([ 1, 2, 3 ]),
		[ 10, 20, 30 ]
	)
	t.deepEqual(
		T.transduce ('') (T.String.builder) (T.map (v => v * 10)) (new Map(Object.entries({ foo: 1, bar: 2, baz: 3 }))),
		'102030'
	)
	t.deepEqual(
		[ ...(T.transduce (new Map()) (T.Map.builder) (T.map (v => Number(v) * 10)) ('123').entries()) ],
		[ [ '0', 10 ], [ '1', 20 ], [ '2', 30 ] ]
	)
})
