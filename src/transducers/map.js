import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'

export const mapper = f => next => (accumulator, value, meta) => next(accumulator, f(value), meta)

export const map = f => Transducer(next => mapper (f) (next[tProtocol.step]))
