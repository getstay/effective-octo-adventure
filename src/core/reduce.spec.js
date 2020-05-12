import { test } from 'zora'
import * as T from '../index.js'
import * as Emitter from '../test/Emitter.js'

test('reduce', t => {
	t.test('reducing an array into a number', t => {
		const result = T.reduce ((a, b) => a + b) (0) ([ 1, 2, 3 ])
		t.equal(result, 6)
	})
	t.test('short circuiting reduction of array with reduced', t => {
		const result = T.reduce
			((a, b) => b === 4 ? T.Reduced.reduced(a) : a + b)
			(0)
			([ 1, 2, 3, 4, 5, 6 ])
		t.equal(result, 6)
	})
	t.test('reducer that returns a promise', async t => {
		const result = T.reduce (async (a, b) => (await a) + b) (0) ([ 1, 2, 3 ])
		t.equal(await result, 6)
	})
	t.test('reducing a Map with async reducer', async t => {
		t.equal(
			await T.reduce (async (a, b) => (await a) + b) (0) (new Map(Object.entries({ foo: 1, bar: 2, baz: 3 }))),
			6
		)
	})
	t.test('reduce Emitter', async t => {
		const result = T.reduce (async (a, b) => (await a) + b) (0) (Emitter.of(1, 2, 3))
		t.equal(await result, 6)
	})
	t.test('reduce async iterable', async t => {
		t.equal(
			await T.reduce (async (a, b) => await a + b) (0) ((async function * () { yield 1; yield 2; yield 3 })()),
			6
		)
	})
	t.test('calling promise.stop() on stoppable reductions resolves the promise with the value at that time', async t => {
		const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
		const promise = T.reduce (async (a, b) => await a + b) (0) ((async function * () { yield 1; await delay(100); yield 2; await delay(100); yield 3 })())
		await delay(150)
		promise.stop()
		t.equal(await promise, 3)
	})
})
