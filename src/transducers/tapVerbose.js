import { noop } from '../util.js'
import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'

export const tapVerbose = fns => Transducer(next => {
	const { step = noop, result = noop } = typeof fns === 'function' ? { step: fns } : fns
	return {
		[tProtocol.step]: (...args) => {
			step(...args)
			return next[tProtocol.step](...args)
		},
		[tProtocol.result]: accumulator => {
			result(accumulator)
			return accumulator
		}
	}
})
