import { identity, noop } from '../util.js'
import { isTransformer, Transformer } from './Transformer.js'
import { transform } from './transform.js'
import { tProtocol } from './tProtocol.js'

export const isTransducer = x => !!x && x[tProtocol.transducer] === true

export const satisfyTransducerInterface = transducerF => (nextTransformer = Transformer()) => Transformer(transducerF(nextTransformer), nextTransformer)

export const Transducer = transducerF => {
	const t = satisfyTransducerInterface (transducerF)
	function transducer (next = Transformer()) {
		return isTransformer(next) ? t (next) : transform (t) (next)
	}
	return Object.assign(transducer, { [tProtocol.transducer]: true })
}
