import { Transducer } from '../core/Transducer.js'

export const identity = Transducer(next => ({}))
