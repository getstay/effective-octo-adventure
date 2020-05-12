import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'

export const map_step = f => next => (accumulator, value, meta) => next(accumulator, f(value), meta)

export const map = f => Transducer(next => map_step (f) (next[tProtocol.step]))
