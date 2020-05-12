import { test } from 'zora'
import * as T from '../index.js'

test('pipe', t => {
	t.test('pipes regular functions', t => {
		t.equal(
			T.pipe (v => v + 1) (0),
			1,
			'pipes one function'
		)
		t.equal(
			T.pipe (v => v * 2, v => v + 2) (0),
			2,
			'pipes two functions'
		)
		t.equal(
			T.pipe (v => v + 1, v => v - 5, v => v + 10, v => v * 2, v => v + 2) (0),
			14,
			'pipes five functions'
		)
	})
	t.test('pipes transducers, reversing them to pipe in the same direction as regular functions', t => {
		t.deepEqual(
			T.transduce ([]) (T.builders.Array) (T.pipe (T.map (v => v + 1))) ([ 0, 1 ]),
			[ 1, 2 ],
			'pipes one transducer'
		)
		t.deepEqual(
			T.transduce ([]) (T.builders.Array) (T.pipe (T.map (v => v * 10), T.map (v => v + 1))) ([ 0, 1 ]),
			[ 1, 11 ],
			'pipes two transducers'
		)
		t.deepEqual(
			T.transduce
				([])
				(T.builders.Array)
				(T.pipe (T.map (v => v + 1), T.map (v => v - 5), T.map (v => v + 10), T.map (v => v * 2), T.map (v => v + 2)))
				([ 0, 1 ]),
			[ 14, 16 ],
			'pipes five transducers'
		)
	})
	t.test('transducer pipeline auto-transduces', t => {
		t.deepEqual(
			T.pipe (T.map (v => v + 1)) ([ 0, 1 ]),
			[ 1, 2 ],
			'pipeline of one transducer auto-transduces'
		)
		t.deepEqual(
			T.pipe (T.map (v => v * 10), T.map (v => v + 1)) ([ 0, 1 ]),
			[ 1, 11 ],
			'pipeline of two transducers auto-transduces'
		)
		t.deepEqual(
			T.pipe (T.map (v => v + 1), T.map (v => v - 5), T.map (v => v + 10), T.map (v => v * 2), T.map (v => v + 2)) ([ 0, 1 ]),
			[ 14, 16 ],
			'pipeline of five transducers auto-transduces'
		)
	})
	t.test('pipeline of functions and transducers', t => {
		t.equal(
			T.isTransducer(T.pipe(T.map(v => v), T.map (v => v))),
			true,
			'sanity check: returns a transducer when both arguments are transducers'
		)
		t.equal(
			T.isTransducer(T.pipe(T.map(v => v), T.map(v => v), T.map(v => v), T.map(v => v), T.map (v => v))),
			true,
			'sanity check: returns a transducer when all arguments are transducers'
		)
		t.equal(
			T.isTransducer(T.pipe(v => v, T.map (v => v))),
			false,
			'does not return a transducer when the first argument is a regular function'
		)
		t.equal(
			T.isTransducer(T.pipe(T.map (v => v), v => v)),
			false,
			'does not return a transducer when the last argument is a regular function'
		)
		t.equal(
			T.isTransducer(T.pipe(T.map (v => v), v => v, T.map (v => v))),
			false,
			'does not return a transducer when the middle argument is a regular function'
		)
		t.test('pipe(function, ...transducers, function)', t => {
			const accumulators = []
			t.equal(
				T.pipe
					(
						v => { v.push(11); return v },
						T.map(v => v + 4),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v * 10),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 1),
						v => v.reverse(),
						v => { accumulators.push(v); return v }
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
		t.test('pipe(function, ...transducers, function, ...transducers, function)', t => {
			const accumulators = []
			t.equal(
				T.pipe
					(
						v => { v.push(11); return v },
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 4),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v * 10),
						v => { accumulators.push(v); return v },
						v => v.slice(1),
						v => { accumulators.push(v); return v },
						T.map(v => v + 5),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 1),
						v => v.reverse(),
						v => { accumulators.push(v); return v }
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
		t.test('pipe(...transducers, ...functions, ...transducers)', t => {
			const accumulators = []
			t.equal(
				T.pipe
					(
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 4),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v * 10),
						v => { accumulators.push(v); return v },
						v => v.slice(1),
						v => { accumulators.push(v); return v },
						T.map(v => v + 5),
						T.tapVerbose(accumulator => accumulators.push(accumulator)),
						T.map(v => v + 1),
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
