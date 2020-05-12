import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'
import { reduce } from '../core/reduce.js'
import { after } from '../util.js'

export const reverse = Transducer(next => {
	const steps = []
	return {
		[tProtocol.step]: (accumulator, value, meta) => {
			steps.unshift([ value, meta.key ])
			return accumulator
		},
		[tProtocol.result]: accumulator => after(
			reduce
				((accumulator, [ value, key ], meta) => next[tProtocol.step](accumulator, value, { key, final: meta.final }))
				(accumulator)
				(steps),
			next[tProtocol.result]
		)
	}
})
