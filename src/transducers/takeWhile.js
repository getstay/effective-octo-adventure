import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'
import { reduced } from '../core/Reduced.js'

export const takeWhile = f => Transducer(next =>
	(accumulator, value, meta) =>
		f(value)
			? next[tProtocol.step](accumulator, value, meta)
			: reduced(accumulator)
)
