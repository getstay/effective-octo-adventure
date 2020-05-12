import { test } from 'zora'
import * as T from '../index.js'
import { testTransducer } from '../test/index.js'
import { compose } from '../util.js'

test('scan', async t => {
	const transducer = T.scan ((a, b) => a + b) (0)
	t.deepEqual(transducer ([ 1, 2, 3 ]), [ 1, 3, 6 ])
	//t.deepEqual(transducer ([ 1, 2, 3 ]), [ 1, 3, 6 ])
	//await testTransducer(t, transducer, { foo: 1, bar: 2, baz: 3 }, { foo: 1, bar: 3, baz: 6 })
})
