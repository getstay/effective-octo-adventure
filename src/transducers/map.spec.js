import { test } from 'zora'
import * as T from '../index.js'
import { testTransducer } from '../test/index.js'
import { compose } from '../util.js'

test('map', async t => {
	const transducer = T.map (v => v + 1)
	t.deepEqual(
		T.transform (transducer) ([ 1, 2, 3 ]),
		[ 2, 3, 4 ],
		'transform'
	)
	t.deepEqual(
		transducer ([ 1, 2, 3 ]),
		[ 2, 3, 4 ],
		'auto-transduce'
	)
	//await testTransducer(t, transducer, { foo: 1, bar: 2, baz: 3 }, { foo: 2, bar: 3, baz: 4 })
})
