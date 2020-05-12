import { identity, noop, pick } from '../util.js'
import { tProtocol } from './tProtocol.js'

const transformerKeys = [ tProtocol.init, tProtocol.step, tProtocol.result ]

export const extractTransformer = pick (transformerKeys)

// TODO: verify this is the thing to do... considering it a transformer if has all the transformer keys and only the transformer keys
// TODO: also, can probably improve this code
export const isTransformer = x => {
	let n = 0
	for (const key in x) {
		++n
		if (!transformerKeys.includes(key)) {
			return false
		}
	}
	return n === 3
}

export const Transformer = (transformer, nextTransformer) => ({
	[tProtocol.init]: noop,
	[tProtocol.step]: identity,
	[tProtocol.result]: identity,
	...nextTransformer,
	...(typeof transformer === 'function' ? { [tProtocol.step]: transformer } : transformer)
})
