import { isPromise, noop } from '../util.js'
import { isReduced, unreduced } from './Reduced.js'
import { tProtocol } from './tProtocol.js'
import { getIterate } from './getIterate.js'

export const genericReduce = (reducer, accumulator, source) => {
	const step = (value, meta) => {
		const result = reducer(accumulator, value, meta)
		accumulator = unreduced(result)
		return result
	}

	const iteration = getIterate(source)({ step, shortCircuit: isReduced }, source)

	return isPromise(iteration)
		? Object.assign(iteration.then(() => accumulator), { stop: iteration.stop })
		: accumulator
}

export const getReduce = collection => collection[tProtocol.reduce] || genericReduce

export const reduce = reducer => accumulator => source => getReduce(source)(reducer, accumulator, source)
