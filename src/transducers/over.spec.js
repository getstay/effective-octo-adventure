import { test } from 'zora'
import * as T from '../index.js'

test('over', t => {
	t.test('overKeys', t => {
		t.deepEqual(
			T.transform (T.overKeys (T.map(v => v.split('').reverse().join('')))) ({ foo: 1, bar: 2, baz: 3 }),
			{ oof: 1, rab: 2, zab: 3 }
		)
	})
	t.test('overPairs', t => {
		t.deepEqual(
			T.transform (T.overPairs (T.map (([ k, v ]) => [ v, Number(k) + v ]))) ({ 0: 1, 1: 2, 2: 3 }),
			{ 1: 1, 2: 3, 3: 5 }
		)
	})
	t.test('overKeys, auto-transduce', t => {
		t.deepEqual(
			//T.overKeys (T.map(v => v.split('').reverse().join(''))) ({ foo: 1, bar: 2, baz: 3 }),
			T.overKeys (T.map(T.reverse)) ({ foo: 1, bar: 2, baz: 3 }),
			{ oof: 1, rab: 2, zab: 3 },
			'overKeys(map(f))'
		)
		t.deepEqual(
			//T.overKeys (T.compose (T.reject (v => v.startsWith('r')), T.map(v => v.split('').reverse().join('')))) ({ foo: 1, bar: 2, baz: 3 }),
			T.overKeys (T.compose (T.reject (v => v.startsWith('r')), T.map(T.reverse))) ({ foo: 1, bar: 2, baz: 3 }),
			{ oof: 1, zab: 3 },
			'overKeys(compose(reject(f), map(f)))'
		)
	})
	t.test('overPairs, auto-transduce', t => {
		t.deepEqual(
			T.overPairs (T.map (([ k, v ]) => [ v, Number(k) + v ])) ({ 0: 1, 1: 2, 2: 3 }),
			{ 1: 1, 2: 3, 3: 5 },
			'overPairs(map(f))'
		)
		t.deepEqual(
			T.overPairs (T.compose (T.reject(([ k, v ]) => (k + v) < 3), T.map (([ k, v ]) => [ v, Number(k) + v ]))) ({ 0: 1, 1: 2, 2: 3 }),
			{ 2: 3, 3: 5 },
			'overPairs(compose(reject(f), map(f)))'
		)
	})
})
