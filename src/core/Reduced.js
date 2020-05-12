import { after, isPromise } from '../util.js'
import { tProtocol } from './tProtocol.js'

export const reduced = value => {
	const reduced = { [tProtocol.reduced]: true, [tProtocol.value]: value }
	return isPromise(value) ? Object.assign(value.then(), reduced) : reduced
}

export const isReduced = x => !!x && x[tProtocol.reduced] === true

export const deref = value => value[tProtocol.value]

export const unreduced = value => isReduced(value) ? deref(value) : value

export const ensureReduced = value => isReduced(value) ? value : reduced(value)

// TODO: test the specific case where reduced(after is necessary (accumulator became a promise)
export const preservingReduced = step => (accumulator, value, meta) => {
	const result = step(accumulator, value, meta)
	return isReduced(result) ? reduced(after(accumulator, () => result)) : result
}
