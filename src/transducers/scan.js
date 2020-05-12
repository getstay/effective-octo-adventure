import { mapper } from './map.js'
import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'

export const scanner = reducer => initialValue => next => {
	let accumulator = initialValue
	return mapper (value => accumulator = reducer(accumulator, value)) (next)
}

export const scan = reducer => initialValue => Transducer(next => scanner (reducer) (initialValue) (next[tProtocol.step]))
