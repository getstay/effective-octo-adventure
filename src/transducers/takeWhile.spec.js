import { test } from 'zora'
import * as T from '../index.js'
import { testTransducer } from '../test/index.js'
import { compose } from '../util.js'

test('takeWhile', async t => {
	t.deepEqual(
		T.transform (T.takeWhile (() => false)) ([ 1, 2, 3, 4 ]),
		[]
	)
	const transducer = T.takeWhile (v => v < 3)
	t.deepEqual(
		T.transform (transducer) ([ 1, 2, 3, 4 ]),
		[ 1, 2 ]
	)
	await testTransducer(t, transducer, { foo: 1, bar: 2, baz: 3, qux: 4 }, { foo: 1, bar: 2 }, { expectFinal: false })
})
