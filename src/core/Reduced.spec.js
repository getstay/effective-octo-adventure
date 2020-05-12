import { test } from 'zora'
import * as T from '../index.js'
const { reduced, isReduced, deref, unreduced, ensureReduced, preservingReduced } = T.Reduced

test('Reduced', t => {
	t.test('reduced', t => {
		t.test('wraps regular value into a reduced object', t => {
			const result = reduced(123)
			t.equal(result[T.tProtocol.reduced], true)
			t.equal(result[T.tProtocol.value], 123)
		})
		t.test('wraps promise into a reduced object that is also a promise', async t => {
			const value = Promise.resolve(123)
			const result = reduced(value)
			t.equal(result[T.tProtocol.reduced], true)
			t.equal(result[T.tProtocol.value], value)
			t.equal(typeof result.then, 'function')
			t.equal(await result, 123)
			t.equal(await result, await value)
			t.equal(Object.is(value, result), false)
		})
	})
	t.test('isReduced', t => {
		t.equal(isReduced(reduced(123)), true)
		t.equal(isReduced(reduced({})), true)
		t.equal(isReduced(reduced(Promise.resolve(123))), true)
		t.equal(isReduced(123), false)
		t.equal(isReduced({}), false)
	})
	t.test('deref', t => {
		t.equal(deref(reduced(123)), 123)
		const promise = Promise.resolve()
		t.equal(Object.is(promise, deref(reduced(promise))), true)
	})
	t.test('unreduced', t => {
		t.equal(unreduced(reduced(123)), 123)
		t.equal(unreduced(123), 123)
	})
	t.test('ensureReduced', t => {
		const result = reduced(123)
		t.equal(Object.is(result, ensureReduced(result)), true)
		t.equal(isReduced(ensureReduced(123)), true)
	})
	t.test('preservingReduced', t => {
		const result = deref(preservingReduced(accumulator => reduced(accumulator))([ 1, 2, 3 ]))
		t.equal(isReduced(result), true)
		t.equal(isReduced(deref(result)), false)
	})
})
