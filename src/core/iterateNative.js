// TODO: probably lots of performance gains can be made by optimizing this stuff
import { False } from '../util.js'

const getLength = collection => Number(collection.length) || Number(collection.size) || Infinity

const fixupObject = object => {
	const entries = Object.entries(object)
	return {
		entries: () => entries,
		length: entries.length
	}
}

const iterateIterable = ({ step, shortCircuit = False }, iterable) => {
	const entries = iterable.entries()
	const finalIndex = getLength(iterable) - 1
	let index = 0
	for (const entry of entries) {
		if (shortCircuit(step(entry[1], { key: entry[0], final: index++ === finalIndex }))) {
			return
		}
	}
}

// TODO: the iteration will ignore, via Promis.race, a promise of next() being awaited at the time iterator.return() is called,
// but there is no official API for telling an iterator to stop/abort immediately and abort the promise/value being yielded,
// i.e. nodejs Readline's iterator has no such api,
// so the iterator will still produce the next value, even though no one cares
// This is in serious need of an official cancellation/abort API
const iterateAsyncIterable = ({ step, shortCircuit = False }, iterable) => {
	const finalIndex = getLength(iterable) - 1
	let index = 0
	let cancel, cancelled = new Promise(resolve => cancel = () => resolve(cancel))
	let done = false
	const iterator = iterable[Symbol.asyncIterator]()
	const promise = (async () => {
		while (!done) {
			const result = await Promise.race([ cancelled, iterator.next() ])
			if (result.done || result === cancel) {
				return
			}
			done = shortCircuit(step(result.value, { key: index, final: index++ === finalIndex }))
		}
	})()
	return Object.assign(promise, { stop: () => { cancel(); iterator.return() } })
}

export const iterateNative = ({ step, shortCircuit }, source) =>
	source[Symbol.asyncIterator]
		? iterateAsyncIterable({ step, shortCircuit }, source)
		: iterateIterable({ step, shortCircuit }, source.entries ? source : fixupObject(source))
