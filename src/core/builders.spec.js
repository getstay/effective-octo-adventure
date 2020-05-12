import { test } from 'zora'
import * as T from '../index.js'

test('builders', t => {
	t.test('Array', t => {
		t.deepEqual(
			T.transduce ([]) (T.builders.Array) (T.map (v => v * 10)) (new Set([ 1, 2, 3 ])),
			[ 10, 20, 30 ]
		)
	})
	t.test('Map', t => {
		t.test('Array to Map', t => {
			const result = T.transduce (new Map()) (T.builders.Map) (T.map (v => v * 10)) ([ 1, 2, 3 ])
			t.equal(result.constructor, Map)
			t.deepEqual(Object.fromEntries(result), { 0: 10, 1: 20, 2: 30 })
		})
		t.test('Object to Map', t => {
			const result = T.transduce (new Map()) (T.builders.Map) (T.map (v => v * 10)) ({ foo: 1, bar: 2, baz: 3 })
			t.equal(result.constructor, Map)
			t.deepEqual(Object.fromEntries(result), { foo: 10, bar: 20, baz: 30 })
		})
	})
	t.test('Object', t => {
		t.test('Array to Object', t => {
			const result = T.transduce ({}) (T.builders.Object) (T.map (v => v * 10)) ([ 1, 2, 3 ])
			t.deepEqual(result, { 0: 10, 1: 20, 2: 30 })
		})
		t.test('Map to Object.create(null)', t => {
			const result = T.transduce (Object.create(null)) (T.builders.Object) (T.map (v => v * 10)) (new Map([ [ 'foo', 1 ], [ 'bar', 2 ], [ 'baz', 3 ] ]))
			t.equal({ ...result }, { foo: 10, bar: 20, baz: 30 }) // had to ...result because zora fails the equality check with null prototype object
		})
	})
	t.test('Set', t => {
		const result = T.transduce (new Set()) (T.builders.Set) (T.map (v => v * 10)) ([ 1, 2, 3 ])
		t.equal(result.constructor, Set)
		t.deepEqual(Array.from(result), [ 10, 20, 30 ])
	})
	t.test('String', t => {
		t.test('can build string starting from string', t => {
			t.deepEqual(
				T.transduce ('a') (T.builders.String) (T.map (v => v * 10)) (new Set([ 1, 2, 3 ])),
				'a102030'
			)
			t.deepEqual(
				T.transduce ('a') (T.builders.String) (T.map (v => v * 10)) ('123'),
				'a102030'
			)
			t.deepEqual(
				T.transduce ('a') (T.builders.String) (T.map (v => v * 10)) ({ foo: 1, bar: 2, baz: 3 }),
				'a102030'
			)
		})
		t.test('can build string starting from array', t => {
			t.deepEqual(
				T.transduce ('a') (T.builders.String) (T.map (v => v * 10)) (new Set([ 1, 2, 3 ])),
				'a102030'
			)
			t.deepEqual(
				T.transduce ('a') (T.builders.String) (T.map (v => v * 10)) ('123'),
				'a102030'
			)
			t.deepEqual(
				T.transduce ('a') (T.builders.String) (T.map (v => v * 10)) ({ foo: 1, bar: 2, baz: 3 }),
				'a102030'
			)
		})
	})
})
