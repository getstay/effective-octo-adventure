import { test } from 'zora'
import * as Emitter from '../test/Emitter.js'
import * as T from '../index.js'
import { compose } from '../util.js'

test('partition', async t => {
	t.deepEqual(
		T.partition (v => v % 2 === 0) ([ 1, 2, 3, 4, 5 ]),
		[ [ 2, 4 ], [ 1, 3, 5 ] ]
	)
	t.deepEqual(
		await compose
			(
				Promise.all.bind(Promise),
				T.map(T.values),
				T.partition (v => v % 2 === 0)
			)
			(Emitter.of(1, 2, 3, 4, 5)),
		[ [ 2, 4 ], [ 1, 3, 5 ] ]
	)
})
