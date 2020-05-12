import { test } from 'zora'
import * as T from '../index.js'
import * as Emitter from '../test/Emitter.js'

test('switchLatest', t => {
	t.test('switchLatest(array)', t => {
		t.test('is just like flat() on array', t => {
			t.deepEqual(
				T.switchLatest ([ [ 1 ], [ 2, 3 ], [ 4 ] ]),
				[ [ 1 ], [ 2, 3 ], [ 4 ] ].flat(),
			)
		})
	})
	t.test('switchLatest(emitter)', t => {
		t.test('switches to latest emitter', async t => {
			const a = Emitter.create()
			const b = Emitter.create()
			const c = Emitter.create()
			const d = T.switchLatest(c)
			const values = []
			d.subscribe(value => values.push(value))
			await a.emit(0)
			await c.emit(a)
			await a.emit(1)
			await a.emit(2)
			await b.emit(10)
			await c.emit(b)
			await a.emit(3)
			await b.emit(11)
			await a.emit(4)
			await b.emit(12)
			t.deepEqual(values, [ 1, 2, 11, 12 ])
		})
		t.test('switchLatest with Emitter.of is the same as Array.of', async t => {
			t.deepEqual(
				await T.values(T.switchLatest(Emitter.of(Emitter.of(1, 2, 3), Emitter.of(4, 5, 6)))),
				T.switchLatest(Array.of(Array.of(1, 2, 3), Array.of(4, 5, 6)))
			)
		})
	})
})
