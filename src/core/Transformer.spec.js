import { test } from 'zora'
import * as T from '../index.js'

test('Transformer', t => {
	t.test('returns an identity-ish transformer when called without a parameter', t => {
		const transformer = T.Transformer()
		t.equal(transformer[T.tProtocol.init](), undefined)
		t.deepEqual(transformer[T.tProtocol.step]([ 1 ]), [ 1 ])
		t.deepEqual(transformer[T.tProtocol.result]([ 1 ]), [ 1 ])
	})
	t.test('when passed a function, returns a transformer object with that function as its step function', t => {
		const transformer = T.Transformer((accumulator, value) => accumulator + value)
		t.equal(transformer[T.tProtocol.init](), undefined)
		t.deepEqual(transformer[T.tProtocol.step](1, 2), 3)
		t.deepEqual(transformer[T.tProtocol.result]([ 1 ]), [ 1 ])
	})
	t.test('when passed a complete transformer, returns a transformer with the same properties', t => {
		const transformer = T.Transformer({
			[T.tProtocol.init]: () => 'a',
			[T.tProtocol.step]: () => 'b',
			[T.tProtocol.result]: () => 'c'
		})
		t.equal(transformer[T.tProtocol.init](), 'a')
		t.equal(transformer[T.tProtocol.step](), 'b')
		t.equal(transformer[T.tProtocol.result](), 'c')
	})
	t.test('when passed a partial transformer, returns a complete transformer', t => {
		const transformer = T.Transformer({
			[T.tProtocol.init]: () => 'a',
		})
		t.equal(transformer[T.tProtocol.init](), 'a')
		t.equal(transformer[T.tProtocol.step]([ 1 ]), [ 1 ])
		t.equal(transformer[T.tProtocol.result]([ 1 ]), [ 1 ])
	})
	t.test('if passed nextTransformer, its properties are used to fill in missing properties', t => {
		const transformer = T.Transformer(
			{
				[T.tProtocol.result]: () => [ 'a', 'b', 'c' ]
			},
			{
				[T.tProtocol.init]: () => [ 1, 2, 3 ]
			}
		)
		t.deepEqual(transformer[T.tProtocol.init](), [ 1, 2, 3 ])
		t.deepEqual(transformer[T.tProtocol.step]({ foo: 1 }), { foo: 1 })
		t.deepEqual(transformer[T.tProtocol.result](), [ 'a', 'b', 'c' ])
	})
})
