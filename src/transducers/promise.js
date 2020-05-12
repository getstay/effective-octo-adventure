test('', async t => {
	// TODO: instead of doing this stuff all in one operator, make most of this stuff operators that take promises and send promises, and then make operators that use those and send the resolution
	// or maybe that isn't possible/coherent?
	// the one on the end would always switch to the latest one received
	//
	// the point is that the operator needs to just send a promise out, what exactly it's a promise of may not be known yet
	// In the case of ordered, it sends the promise it first receives, holds the rest until that resolves, then sends the next
	// but this would be problematic because the upstream operator could have more promises buffered and if you derive 'pending/resolved' from the downstream one, it will have quick changes that don't really reflect the state of the upstream
	// it seems like the upstream needs to send an async iterable so it's like packaging up all the promises within one 'pending' state, so when that iterable completes, the state is not-pending
	/*
	 * race:
	 * 1 comes in, goes out
	 * 2 comes in, joins the race, race goes out
	 * 3 comes in, joins the race, race goes out
	 * 2 resolves
	 * operator on the end resolves with 2
	 *
	 * race all:
	 * 1 comes in, goes out
	 * 2 comes in, joins the race
	 *
	 * collection of values
	 * collection of promises of values
	 * collection of async iterables
	 * ->
	 *   flatten
	 *   collection of values
	 * ->
	 *   transducer sends `false` to next step at start of process (somehow)
	 *   receives iterable, sends `true`
	 *   return reduction of iterable into `false`, or somthing like that, maybe just after(reduction, () => next.step(accumulator, false, meta))
	 */
	t.deepEqual(
		await T.promiseAll([ Promise.resolve(1), Promise.resolve(2), Promise.resolve(3) ]),
		[ 1, 2, 3 ]
	)
	t.deepEqual(
		await T.promiseOrdered([ Promise.resolve(1), Promise.resolve(2), Promise.resolve(3) ]),
		[ 1, 2, 3 ]
	)
	t.deepEqual(
		// also needs a better name
		await T.promiseAllRace([ delay(100).then(() => 1), delay(50).then(() => 2), delay(200).then(() => 3) ]),
		[ 2, 1, 3 ]
	)
	t.deepEqual(
		await T.promiseRace([ delay(100).then(() => 1), delay(50).then(() => 2), delay(200).then(() => 3) ]),
		[ 2 ]
	)
	// this one really needs a better name i.e. promiseLatestRecieved
	t.deepEqual(
		await T.promiseLatest([ delay(100).then(() => 1), delay(50).then(() => 2), delay(200).then(() => 3) ]),
		[ 3 ]
	)
})
