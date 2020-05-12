import { test } from 'zora'
import * as T from '../index.js'

test('transform', t => {
	t.test('Array', t => {
		t.deepEqual(
			T.transform (T.map (v => v * 10)) ([ 1, 2, 3 ]),
			[ 10, 20, 30 ]
		)
	})
	t.test('Object', t => {
		t.deepEqual(
			T.transform (T.map (v => v * 10)) ({ foo: 1, bar: 2, baz: 3 }),
			{ foo: 10, bar: 20, baz: 30 }
		)
	})
	t.test('Map', t => {
		const result = T.transform (T.map (v => v * 10)) (new Map(Object.entries({ foo: 1, bar: 2, baz: 3 })))
		t.equal(result.constructor, Map)
		t.deepEqual(Object.fromEntries(result), { foo: 10, bar: 20, baz: 30 })
	})
	t.test('Set', t => {
		const result = T.transform (T.map (v => v * 10)) (new Set([ 1, 2, 3 ]))
		t.equal(result.constructor, Set)
		t.deepEqual([ ...result ], [ 10, 20, 30 ])
	})
	t.test('String', t => {
		const result = T.transform (T.map (v => Number(v) * 10)) ('123')
		t.equal(result, '102030')
	})
	t.test('transforming to a building transducer - Type.from()', t => {
		t.test('Array to Object', t => {
			t.deepEqual(
				T.transform (T.compose(T.Object.from, T.map (v => v * 10))) ([ 1, 2, 3 ]),
				{ 0: 10, 1: 20, 2: 30 }
			)
		})
		t.test('Object to String', t => {
			t.equal(
				T.transform (T.compose(T.String.from, T.map (v => v * 10))) ({ foo: 1, bar: 2, baz: 3 }),
				'102030'
			)
		})
		t.test('Map to Object', t => {
			t.deepEqual(
				T.transform (T.compose(T.Object.from, T.map (v => v * 10))) (new Map(Object.entries({ foo: 1, bar: 2, baz: 3 }))),
				{ foo: 10, bar: 20, baz: 30 }
			)
		})
		t.test('Set to Array', t => {
			t.deepEqual(
				T.transform (T.compose(T.Array.from, T.map (v => v * 10))) (new Set([ 1, 2, 3 ])),
				[ 10, 20, 30 ]
			)
		})
		t.test('String to Array', t => {
			t.deepEqual(
				T.transform (T.compose(T.Array.from, T.map (v => Number(v) * 10))) ('123'),
				[ 10, 20, 30 ]
			)
		})
	})
})
