import { tProtocol } from '../core/tProtocol.js'
import { Transformer } from '../core/Transformer.js'
import { Transducer } from '../core/Transducer.js'
import { Deferred, isPromise, noop } from '../util.js'
import * as T from '../index.js'
import * as Emitter from './Emitter.js'
export { Emitter }

const asyncIterableToPromise = async iterable => {
	let values = []
	for await (const value of iterable) {
		values.push(value)
	}
	return values
}

export const Replay = (f = noop) => {
	const values = []
	let done = false
	let completeSignal = Symbol()
	let deferred = Deferred()

	const push = (value, { final = false } = {}) => {
		values.push(value)
		deferred.resolve(value)
		deferred = Deferred()
		final && complete()
	}

	const complete = () => {
		done = true
		deferred.resolve(completeSignal)
	}

	async function * asyncIterator () {
		let index = 0
		while (index < values.length || !done) {
			if (index < values.length) {
				yield Promise.resolve(values[index])
			} else {
				const value = await deferred
				if (value !== completeSignal) {
					yield value
				}
			}
			++index
		}
	}

	const iterateAsync = async ({ step, shortCircuit = () => false }) => {
		let index = 0
		for await (const value of asyncIterator()) {
			++index
			if (shortCircuit(step(value, { final: done && index === values.length }))) {
				return
			}
		}
	}

	f({ push, complete })

	return {
		complete,
		push,
		[tProtocol.iterateAsync]: iterateAsync,
		[Symbol.asyncIterator]: asyncIterator,
		...Transformer({
			[tProtocol.init]: Replay,
			[tProtocol.step]: (accumulator, value, meta) => {
				accumulator.push(value, meta)
				return accumulator
			},
			[tProtocol.result]: accumulator => {
				accumulator.complete()
				return accumulator
			}
		}),
		toString: () => `Replay(${JSON.stringify(values)})`,
		[Symbol.toStringTag]: 'Replay'
	}
}
Object.assign(Replay, {
	of: (...values) => Replay(({ push }) => {
		const finalIndex = values.length - 1
		values.reduce(async (promise, value, index) => {
			await promise
			push(value, { final: index === finalIndex })
		}, Promise.resolve())
	}),
	toPromise: asyncIterableToPromise
})

export const BuilderArgs = () => Object.assign([], Transformer({ [tProtocol.step]: (result, value, meta) => [result, result.push([ value, meta ])][0] }))

export const testTransducer = async (t, transducer, input, output, { expectFinal = true } = {}) => {
	const inputPairs = Object.entries(input)
	const outputPairs = Object.entries(output)
	const things = [
		{ name: 'Array', create: () => [], fromPairs: pairs => pairs, toPairs: pairs => pairs },
		{ name: 'Object', create: () => ({}), fromPairs: Object.fromEntries, toPairs: Object.entries },
		{ name: 'Set', create: () => new Set(), fromPairs: values => new Set(values), toPairs: set => [ ...set ] },
		{ name: 'Map', create: () => new Map(), fromPairs: pairs => new Map(pairs), toPairs: map => [ ...map ] },
		{ name: 'Replay', create: Replay, fromPairs: values => Replay.of(...values), toPairs: Replay.toPromise },
		{ name: 'Emitter', create: Emitter.create, fromPairs: values => Emitter.of(...values), toPairs: T.values },
	]

	const builderArgs = await T.into (BuilderArgs()) (T.lensRight(transducer)) (inputPairs)
	const lastMeta = builderArgs[builderArgs.length - 1][1]
	t.equal(typeof lastMeta, 'object', 'last build step received meta object')
	if (expectFinal) {
		t.equal(lastMeta.final, true, '{ final: true } is preserved')
	}
	return Promise.all([
		...things.flatMap(input => {
			return things.map(async output => {
				const accumulator = output.create()
				const source = input.fromPairs(inputPairs)
				const expression = T.into (accumulator) (T.lensRight(transducer)) (source)
				const assert = async result => t.deepEqual(
					await output.toPairs(result),
					outputPairs,
					`${input.name} to ${output.name}`
				)
				return isPromise(expression)
					? (accumulator[Symbol.asyncIterator] ? assert(accumulator) : expression.then(assert))
					: assert(expression)
			})
		})
	])
}
