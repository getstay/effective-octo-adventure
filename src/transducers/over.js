import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'
import { after, isPromise } from '../util.js'
import { pipe } from '../core/pipe.js'

const wrapped = Symbol()
const unwrap = value => after(value, value => value.wrapped === wrapped ? value.accumulator : value)
const wrap = (accumulator, value, meta) => after(accumulator, accumulator => ({ wrapped, accumulator: unwrap(accumulator), focus: [ meta.key, value ] }))

export const over = getter => setter => transducer => pipe(
	Transducer(next => (accumulator, value, meta) => {
		const wrapped = wrap(accumulator, value, meta)
		return next[tProtocol.step](wrapped, getter(value, meta.key), meta)
	}),
	transducer,
	Transducer(next => ({
		[tProtocol.step]: ({ accumulator, focus }, value, meta) => {
			const [ v, k ] = setter (value) (...focus)
			meta.key = k
			return next[tProtocol.step](accumulator, v, meta)
		},
		[tProtocol.result]: result => next[tProtocol.result](unwrap(result))
	}))
)

export const overKeys = over ((v, k) => k) (k => v => [ v, k ])
export const overPairs = over ((v, k) => [ k, v ]) (([ k, v ])=> () => [ v, k ])
