import { test } from 'zora'
import * as T from '../index.js'
import * as Emitter from '../test/Emitter.js'
import { compose, pipe, identity } from '../util.js'

// defining these here to lower abstraction cost for these fundamental tests
const array_builder = {
	[T.tProtocol.init]: () => [],
	[T.tProtocol.step]: (accumulator, value) => {
		accumulator.push(value)
		return accumulator
	},
	[T.tProtocol.result]: accumulator => accumulator
}
const map = f => T.Transducer(next => (accumulator, value) => next[T.tProtocol.step](accumulator, f(value)))

test('Transducer', t => {
	t.test('passing builder into a transducer returns a transformer process object', t => {
		const process = map (v => v + 1) (array_builder)
		t.deepEqual(typeof process, 'object', 'returned an object')
		t.deepEqual(typeof process[T.tProtocol.step], 'function', 'has a step function')
		t.deepEqual(process[T.tProtocol.step]([], 1), [ 2 ], 'step function transformed value and built it into the accumulator')
	})
	t.test('auto-transducing', t => {
		t.deepEqual(map (v => v * 10) ([ 1, 2, 3 ]), [ 10, 20, 30 ])
		t.deepEqual([ ...(map (v => v * 10) (new Set([ 1, 2, 3 ]))) ], [ 10, 20, 30 ])
		t.deepEqual(
			T.compose(T.Object.from, T.filter (v => v % 2 === 0), T.map (v => v + 1)) ([ 1, 2, 3 ]),
			{ 0: 2, 2: 4 },
		)
		t.deepEqual(
			T.compose(T.Object.from, T.map (v => v + 1), T.filter (v => v % 2 !== 0)) ([ 1, 2, 3 ]),
			{ 0: 2, 2: 4 },
		)
	})
	t.test('auto-transducing a builder builds from the source type to the builder type', async t => {
		t.deepEqual(T.Transducer(() => array_builder)(new Set([ 1, 2, 3 ])), [ 1, 2, 3 ], 'Set into Array')
	})
})
