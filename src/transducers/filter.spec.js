import { test } from 'zora'
import * as T from '../index.js'
import { testTransducer } from '../test/index.js'

test('filter', async t => {
	const transducer = T.filter (v => v % 2 === 0)
	t.deepEqual(
		T.transform (transducer) ([ 1, 2, 3, 4, 5 ]),
		[ 2, 4 ]
	)
	t.deepEqual(
		T.transform (transducer) ([ 1, 2, 3, 4, 5, 6 ]),
		[ 2, 4, 6 ]
	)
	await testTransducer(t, transducer, { foo: 1, bar: 2, baz: 3, qux: 4 }, { bar: 2, qux: 4 })
})
