import { test } from 'zora'
import { iterateNative } from './iterateNative.js'

test('iterateNative', t => {
	t.test('Array', t => {
		t.test('step function gets (value, { key, final }) for each value in the collection', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => steps.push([ value, meta ])
				},
				[ 1, 2, 3 ]
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 0, final: false } ],
					[ 2, { key: 1, final: false } ],
					[ 3, { key: 2, final: true } ]
				]
			)
		})
		t.test('stops iterating when shortCircuit(valueReturnedByStepFunction) returns true', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => {
						steps.push([ value, meta ])
						return value
					},
					shortCircuit: value => value === 2
				},
				[ 1, 2, 3 ]
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 0, final: false } ],
					[ 2, { key: 1, final: false } ]
				]
			)
		})
	})

	t.test('Map', t => {
		t.test('step function gets (value, { key, final }) for each value in the collection', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => steps.push([ value, meta ])
				},
				new Map([ [ 'foo', 1 ], [ 'bar', 2 ], [ 'baz', 3 ] ])
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 'foo', final: false } ],
					[ 2, { key: 'bar', final: false } ],
					[ 3, { key: 'baz', final: true } ]
				]
			)
		})
		t.test('stops iterating when shortCircuit(valueReturnedByStepFunction) returns true', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => {
						steps.push([ value, meta ])
						return value
					},
					shortCircuit: value => value === 2
				},
				new Map([ [ 'foo', 1 ], [ 'bar', 2 ], [ 'baz', 3 ] ])
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 'foo', final: false } ],
					[ 2, { key: 'bar', final: false } ]
				]
			)
		})
	})

	t.test('Object', t => {
		t.test('step function gets (value, { key, final }) for each value in the collection', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => steps.push([ value, meta ])
				},
				{ foo: 1, bar: 2, baz: 3 }
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 'foo', final: false } ],
					[ 2, { key: 'bar', final: false } ],
					[ 3, { key: 'baz', final: true } ]
				]
			)
		})
		t.test('stops iterating when shortCircuit(valueReturnedByStepFunction) returns true', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => {
						steps.push([ value, meta ])
						return value
					},
					shortCircuit: value => value === 2
				},
				{ foo: 1, bar: 2, baz: 3 }
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 'foo', final: false } ],
					[ 2, { key: 'bar', final: false } ]
				]
			)
		})
	})

	t.test('Set', t => {
		t.test('step function gets (value, { key, final }) for each value in the collection', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => steps.push([ value, meta ])
				},
				new Set([ 'a', 'b', 'c' ])
			)
			t.deepEqual(
				steps,
				[
					[ 'a', { key: 'a', final: false } ],
					[ 'b', { key: 'b', final: false } ],
					[ 'c', { key: 'c', final: true } ]
				]
			)
		})
		t.test('stops iterating when shortCircuit(valueReturnedByStepFunction) returns true', t => {
			const steps = []
			iterateNative(
				{
					step: (value, meta) => {
						steps.push([ value, meta ])
						return value
					},
					shortCircuit: value => value === 'b'
				},
				new Set([ 'a', 'b', 'c' ])
			)
			t.deepEqual(
				steps,
				[
					[ 'a', { key: 'a', final: false } ],
					[ 'b', { key: 'b', final: false } ]
				]
			)
		})
	})

	t.test('AsyncIterable', t => {
		const FooIterable = size => ({
			size,
			[Symbol.asyncIterator]: async function * () {
				let i = 1
				while (i <= size) {
					yield i++
				}
			}
		})
		t.test('iterateNative returns a promise with a { stop } function when collection is async iterable', t => {
			const steps = []
			const iteration = iterateNative({ step: () => {} }, FooIterable(3))
			t.equal(typeof iteration.then, 'function')
			t.equal(typeof iteration.stop, 'function')
		})
		t.test('step function gets (value, { key, final }) for each value in the collection', async t => {
			const steps = []
			await iterateNative(
				{
					step: (value, meta) => steps.push([ value, meta ])
				},
				FooIterable(3)
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 0, final: false } ],
					[ 2, { key: 1, final: false } ],
					[ 3, { key: 2, final: true } ]
				]
			)
		})
		t.test('stops iterating when shortCircuit(valueReturnedByStepFunction) returns true', async t => {
			const steps = []
			await iterateNative(
				{
					step: (value, meta) => {
						steps.push([ value, meta ])
						return value
					},
					shortCircuit: value => value === 2
				},
				FooIterable(3)
			)
			t.deepEqual(
				steps,
				[
					[ 1, { key: 0, final: false } ],
					[ 2, { key: 1, final: false } ]
				]
			)
		})
		t.test('stops iterating when `promise.stop()` is called', async t => {
			const FooIterable = size => ({
				[Symbol.asyncIterator]: async function * () {
					let i = 1
					while (true) {
						// TODO: unfortunately, this will be called with { i: 3 }, despite iteration.stop() having been called,
						// because there is no api to abort that part.
						// This test passes because the iteration code ignores the lingering value, but it's a bit of a memory leak.
						// Waiting/hoping for cancel/abort API
						yield i++
						await new Promise(resolve => setTimeout(resolve, 250))
					}
				}
			})
			const values = []
			const iteration = iterateNative(
				{
					step: value => {
						values.push(value)
						if (value === 2) {
							setTimeout(iteration.stop, 125)
						}
					}
				},
				FooIterable()
			)
			await iteration
			t.deepEqual(values, [ 1, 2 ])
		})
	})
})
