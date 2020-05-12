import { test } from 'zora'
import * as T from '../index.js'
import * as Emitter from '../test/Emitter.js'

test('switchLatestN', t => {
	t.test('switchLatestN (3) (array)', t => {
		t.test('is just like flat() on array', t => {
			t.deepEqual(
				T.switchLatestN (3) ([ [ 1 ], [ 2, 3 ], [ 4 ] ]),
				[ [ 1 ], [ 2, 3 ], [ 4 ] ].flat(),
			)
		})
	})
	t.test('switchLatestN (n) (emitter)', t => {
		t.test('does not include concurrent emitters beyold latest N', async t => {
			const a = Emitter.create()
			const b = Emitter.create()
			const c = Emitter.create()
			const d = Emitter.create()
			const e = Emitter.create()
			const f = T.switchLatestN (3) (e)
			const values = []
			f.subscribe(value => values.push(value))
			await e.emit(a)
			await e.emit(b)
			await e.emit(c)
			await a.emit(1)
			await b.emit(2)
			await a.emit(3)
			await c.emit(4)
			await b.complete() // to verify that we are not limiting concurrency, but recency!
			await a.emit(5)
			await c.emit(6)
			await e.emit(d)
			await a.emit('x')
			await d.emit(7)
			await a.emit('x')
			await c.emit(8)
			await d.emit(9)
			t.deepEqual(values, [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ])
		})
		t.test('switchLatestN on Emitter.of is the same as Array.of', async t => {
			t.deepEqual(
				await T.values(T.switchLatest(Emitter.of(Emitter.of(1, 2, 3), Emitter.of(4, 5, 6)))),
				T.switchLatest(Array.of(Array.of(1, 2, 3), Array.of(4, 5, 6)))
			)
		})
	})
})
