import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'
import { reduced } from '../core/Reduced.js'
import { identity } from '../util.js'

export const slice = startIndex => toIndex => {
	const finalIndex = toIndex - 1
	return Transducer(next => {
		let i = -1
		return (accumulator, value, meta) =>
			++i >= startIndex
				? (final => (final ? reduced : identity)(next[tProtocol.step](accumulator, value, { final })))(i === finalIndex || meta.final)
				: accumulator
	})
}
