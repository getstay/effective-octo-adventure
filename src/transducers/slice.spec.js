import { test } from 'zora'
import * as T from '../index.js'
import { testTransducer } from '../test/index.js'
import { compose } from '../util.js'

test('slice', t => {
	t.deepEqual(
		T.transform (T.slice (2) (4)) ([ 1, 2, 3, 4, 5 ]),
		[ 3, 4 ]
	)
	t.deepEqual(
		T.transform (compose(T.map (v => v + 1), T.slice (1) (3), T.filter (v => v % 2 === 0))) ([ 1, 2, 3, 4, 5 ]),
		[ 4 ]
	)
	t.test('slice (0) (Infinity)', async t => {
		await testTransducer(t, T.slice (0) (Infinity), { foo: 1, bar: 2, baz: 3 }, { foo: 1, bar: 2, baz: 3 })
	})
	t.test('slice (0) (1)', async t => {
		await testTransducer(t, T.slice (0) (1), { foo: 1, bar: 2, baz: 3 }, { foo: 1 })
	})
})
