import { map_step } from './map.js'
import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'

export const scan_step = reducer => initialValue => next => {
	let accumulator = initialValue
	return map_step (value => accumulator = reducer(accumulator, value)) (next)
}

export const scan = reducer => initialValue => Transducer(next => scan_step (reducer) (initialValue) (next[tProtocol.step]))
