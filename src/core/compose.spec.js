import { test } from 'zora'
import * as T from '../index.js'

test('compose', t => {
	t.test('composes regular functions', t => {
		t.equal(
			T.compose (v => v + 1) (0),
			1,
			'composes one function'
		)
		t.equal(
			T.compose (v => v * 2, v => v + 2) (0),
			4,
			'composes two functions'
		)
		t.equal(
			T.compose (v => v + 1, v => v - 5, v => v + 10, v => v * 2, v => v + 2) (0),
			10,
			'composes five functions'
		)
	})
	t.test('composes transducers, reversing them to compose in the same direction as regular functions', t => {
		t.deepEqual(
			T.transduce ([]) (T.builders.Array) (T.compose (T.map (v => v + 1))) ([ 0, 1 ]),
			[ 1, 2 ],
			'composes one transducer'
		)
		t.deepEqual(
			T.transduce ([]) (T.builders.Array) (T.compose (T.map (v => v * 10), T.map (v => v + 1))) ([ 0, 1 ]),
			[ 10, 20 ],
			'composes two transducers'
		)
		t.deepEqual(
			T.transduce
				([])
				(T.builders.Array)
				(T.compose (T.map (v => v + 1), T.map (v => v - 5), T.map (v => v + 10), T.map (v => v * 2), T.map (v => v + 2)))
				([ 0, 1 ]),
			[ 10, 12 ],
			'composes five transducers'
		)
	})
	t.test('transducer composition auto-transduces', t => {
		t.deepEqual(
			T.compose (T.map (v => v + 1)) ([ 0, 1 ]),
			[ 1, 2 ],
			'composition of one transducer auto-transduces'
		)
		t.deepEqual(
			T.compose (T.map (v => v * 10), T.map (v => v + 1)) ([ 0, 1 ]),
			[ 10, 20 ],
			'composition of two transducers auto-transduces'
		)
		t.deepEqual(
			T.compose (T.map (v => v + 1), T.map (v => v - 5), T.map (v => v + 10), T.map (v => v * 2), T.map (v => v + 2)) ([ 0, 1 ]),
			[ 10, 12 ],
			'composition of five transducers auto-transduces'
		)
	})
	t.test('compositions of functions and transducers', t => {
		t.equal(
			T.isTransducer(T.compose(T.map(v => v), T.map (v => v))),
			true,
			'sanity check: returns a transducer when both arguments are transducers'
		)
		t.equal(
			T.isTransducer(T.compose(T.map(v => v), T.map(v => v), T.map(v => v), T.map(v => v), T.map (v => v))),
			true,
			'sanity check: returns a transducer when all arguments are transducers'
		)
		t.equal(
			T.isTransducer(T.compose(v => v, T.map (v => v))),
			false,
			'does not return a transducer when the first argument is a regular function'
		)
		t.equal(
			T.isTransducer(T.compose(T.map (v => v), v => v)),
			false,
			'does not return a transducer when the last argument is a regular function'
		)
		t.equal(
			T.isTransducer(T.compose(T.map (v => v), v => v, T.map (v => v))),
			false,
			'does not return a transducer when the middle argument is a regular function'
		)
		t.test('compose(function, ...transducers, function)', t => {
			const accumulators = []
			t.equal(
				T.compose
					(
						v => { accumulators.push(v); return v },
						v => v.reverse(),
						T.map(v => v + 1),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v * 10),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 4),
						v => { v.push(11); return v },
					)
					([ 1, 6 ]),
				[ 151, 101, 51 ],
				'produced the correct result'
			)
			t.equal(
				new Set(accumulators).size,
				1,
				'ran the argument to the composition through the first function, auto-transduced through the transducers in one go, and ran the result through the last function'
			)
		})
		t.test('compose(function, ...transducers, function, ...transducers, function)', t => {
			const accumulators = []
			t.equal(
				T.compose
					(
						v => { accumulators.push(v); return v },
						v => v.reverse(),
						T.map(v => v + 1),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 5),
						v => { accumulators.push(v); return v },
						v => v.slice(1),
						v => { accumulators.push(v); return v },
						T.map(v => v * 10),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 4),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						v => { v.push(11); return v }
					)
					([ 1, 6 ]),
				[ 156, 106 ],
				'produced the correct result'
			)
			t.equal(
				new Set(accumulators).size,
				3,
			)
		})
		t.test('compose(...transducers, ...functions, ...transducers)', t => {
			const accumulators = []
			t.equal(
				T.compose
					(
						T.map(v => v + 1),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 5),
						v => { accumulators.push(v); return v },
						v => v.slice(1),
						v => { accumulators.push(v); return v },
						T.map(v => v * 10),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 4),
						T.tapVerbose(accumulator => accumulators.push(accumulator))
					)
					([ 1, 6 ]),
				[ 106 ],
				'produced the correct result'
			)
			t.equal(
				new Set(accumulators).size,
				3,
			)
		})
	})
})
