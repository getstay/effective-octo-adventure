import { test } from 'zora'
import * as T from '../index.js'
import { testTransducer } from '../test/index.js'
import { compose } from '../util.js'

test('identity', async t => {
	const transducer = T.identity
	t.deepEqual(
		T.transform (transducer) ([ 1, 2, 3 ]),
		[ 1, 2, 3 ]
	)
	await testTransducer(t, transducer, { foo: 1, bar: 2, baz: 3 }, { foo: 1, bar: 2, baz: 3 })
})
