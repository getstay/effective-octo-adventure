import { test } from 'zora'
import * as T from '../index.js'
import { BuilderArgs, Emitter, Replay, testTransducer } from '../test/index.js'
import { compose } from '../util.js'

test('flatten', async t => {
	t.test('preserves short circuiting from next transducer', async t => {
		const transducer = compose (T.flatten, T.takeWhile (v => v % 2 !== 0))
		const asyncTransducer = compose(T.delay({ ms: 0 }), transducer, T.delay({ ms: 0 }), T.map(v => -v))
		t.deepEqual(
			T.into ([]) (transducer) ([ [ 1, 2 ], [ 3, 4, 5 ] ]),
			[ 1 ],
			'Array to Array'
		)
		const a = T.into ([]) (asyncTransducer) ([ [ 1, 2 ], [ 3, 4, 5 ] ])
		t.deepEqual(
			await a,
			[ -1 ],
			'Array to Array, async'
		)
	})
	t.deepEqual(
		T.transform (T.flatten) ([ [ 1 ], [ 2, 3 ], [ 4 ] ]),
		[ 1, 2, 3, 4 ]
	)
	t.deepEqual(
		T.transform (T.flatten) ([ { foo: 1 }, { bar: 2, baz: 3 }, { qux: 4 } ]),
		[ [ 'foo', 1 ], [ 'bar', 2 ], [ 'baz', 3 ], [ 'qux', 4 ] ]
	)
	t.deepEqual(
		T.into ({}) (T.flatten) ([ { foo: 1 }, { bar: 2, baz: 3 }, { qux: 4 } ]),
		{ foo: 1, bar: 2, baz: 3, qux: 4 }
	)
	t.deepEqual(
		await T.values(T.transform (T.flatten) (Replay.of(Replay.of(1), Replay.of(2, 3), Replay.of(4)))),
		[ 1, 2, 3, 4 ],
		'Replay of Replay to Replay'
	)
	t.deepEqual(
		await T.values(T.transform (T.flatten) (Emitter.of(Emitter.of(1), Emitter.of(2, 3, 4), Emitter.of(5, 6)))),
		[ 1, 2, 3, 4, 5, 6 ],
		'Emitter of Emitter to Emitter'
	)
	t.deepEqual(
		await T.into (BuilderArgs()) (T.flatten) (Emitter.of(Emitter.of(1, 2), Emitter.of(3, 4))),
		[
			[ 1, { final: false } ],
			[ 2, { final: false } ],
			[ 3, { final: false } ],
			[ 4, { final: true } ]
		]
	)
	t.test('member reductions that outlive the source reduction calculate { final } correctly when source reduction completes with final value', async t => {
		const a = Emitter.create()
		const b = Emitter.create()
		const c = Emitter.create()
		const d = T.into (BuilderArgs()) (T.flatten) (c)
		await c.emit(a)
		await c.emit(b, { final: true })
		await a.emit(1)
		await b.emit(2, { final: true })
		await a.emit(3, { final: true })
		t.deepEqual(
			await d,
			[
				[ 1, { final: false } ],
				[ 2, { final: false } ],
				[ 3, { final: true } ]
			]
		)
	})
	t.test('member reductions that outlive the source reduction calculate { final } correctly when source reduction completes after its final value', async t => {
		const a = Emitter.create()
		const b = Emitter.create()
		const c = Emitter.create()
		const d = T.into (BuilderArgs()) (T.flatten) (c)
		await c.emit(a)
		await c.emit(b)
		await c.complete()
		await a.emit(1)
		await b.emit(2, { final: true })
		await a.emit(3, { final: true })
		t.deepEqual(
			await d,
			[
				[ 1, { final: false } ],
				[ 2, { final: false } ],
				[ 3, { final: true } ]
			]
		)
	})
	t.test('flattening Emitter of Array and Emitter', async t => {
		t.deepEqual(
			await T.values(T.flatten (Emitter.of(Array.of(1, 2, 3), Emitter.of(4, 5, 6)))),
			[ 1, 2, 3, 4, 5, 6 ]
		)
	})
	t.test('flattening Emitter of Emitter and Array', async t => {
		t.deepEqual(
			await T.values(T.flatten (Emitter.of(Emitter.of(1, 2, 3), Array.of(4, 5, 6)))),
			[ 1, 2, 3, 4, 5, 6 ]
		)
	})
	// TODO: rework keyed collection iteration to use { key } meta so that this can work
	/*t.deepEqual(
		T.transform (T.flatten) ({ foo: { foot: 1 }, bar: { bart: 2, bazt: 3 }, qux: { quxt: 4 } }),
		{ foot: 1, bart: 2, bazt: 3, quxt: 4 }
	)*/
})
