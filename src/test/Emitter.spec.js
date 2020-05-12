import { test } from 'zora'
import * as Emitter from './Emitter.js'
import * as T from '../index.js'

test('Emitter for testing', async t => {
	const emitter = Emitter.create()
	const emitterValues = T.values(emitter)
	emitter.emit(1)
	emitter.emit(2)
	emitter.emit(3)
	emitter.complete()
	t.deepEqual(await emitterValues, [ 1, 2, 3 ])

	t.deepEqual(await T.values(Emitter.of(1, 2)), [ 1, 2 ])

	t.test('calling .stop() on the promise returned by iterateAsync stops iteration and resolves the promise', async t => {
		const emitter = Emitter.create()
		const values = []
		const promise = emitter[T.tProtocol.iterateAsync]({ step: value => values.push(value) }, emitter)
		await emitter.emit(1)
		await emitter.emit(2)
		promise.stop()
		await emitter.emit(3)
		await promise
		t.deepEqual(
			values,
			[ 1, 2 ]
		)
	})
})
