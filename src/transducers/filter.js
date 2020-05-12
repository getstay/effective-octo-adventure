import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'

export const filter = predicate => Transducer(next => (result, value, meta) => predicate(value) ? next[tProtocol.step](result, value, meta) : result)
