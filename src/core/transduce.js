import { isPromise } from '../util.js'
import { tProtocol } from './tProtocol.js'
import { reduce } from './reduce.js'

const canRepresentAsyncSteps = collection => collection[tProtocol.iterateAsync] || collection[Symbol.asyncIterator]

export const transduce = accumulator => builder => transducer => source => {
	const process = transducer(builder)
	const result = reduce (process[tProtocol.step]) (accumulator) (source)
	const resultF = result => process[tProtocol.result](result, accumulator)
	const finalResult = isPromise(result) ? result.then(resultF) : resultF(result)
	return canRepresentAsyncSteps(accumulator) ? accumulator : finalResult
}
