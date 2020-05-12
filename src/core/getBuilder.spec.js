import { test } from 'zora'
import * as T from '../index.js'

test('getBuilder', t => {
	t.deepEqual(
		T.transduce ([]) (T.getBuilder([])) (T.identity) ({ foo: 1, bar: 2 }),
		[ 1, 2 ]
	)
	t.deepEqual(
		T.transduce ({}) (T.getBuilder({})) (T.identity) ([ 1, 2 ]),
		{ 0: 1, 1: 2 }
	)
	t.deepEqual(
		T.transduce ({}) (T.getBuilder(Object.create(null))) (T.identity) ([ 1, 2 ]),
		{ 0: 1, 1: 2 }
	)
	t.test('returns just the transformer from an object with transformer properties', t => {
		const builder = T.getBuilder({
			foo: 1,
			bar: 2,
			[T.tProtocol.init]: () => 'a',
			[T.tProtocol.step]: () => 'b',
			[T.tProtocol.result]: () => 'c'
		})
		t.deepEqual(Object.keys(builder), [ T.tProtocol.init, T.tProtocol.step, T.tProtocol.result ])
		t.equal(builder[T.tProtocol.step](), 'b')
	})
})
