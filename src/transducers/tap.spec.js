import { test } from 'zora'
import * as T from '../index.js'
import { compose } from '../util.js'

test('tap', t => {
	t.test('does not modify input', t => {
		t.deepEqual(
			T.tap (() => 'x') ([ 1, 2, 3 ])
			[ 1, 2, 3 ]
		)
	})
	t.test('f received each value', t => {
		const values = []
		T.tap (value => values.push(value)) ([ 1, 2, 3 ])
		t.deepEqual(
			values,
			[ 1, 2, 3 ]
		)
	})
	t.test('working in a pipeline', t => {
		const values = []
		t.deepEqual(
			compose (T.map (v => v + 1), T.tap (value => values.push(value)), T.map (v => v + 2)) ([ 1, 2, 3 ]),
			[ 4, 5, 6 ]
		)
		t.deepEqual(
			values,
			[ 2, 3, 4 ]
		)
	})
})
