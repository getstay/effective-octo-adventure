import { map } from './map.js'

export const tap = f => map (value => {
	f(value)
	return value
})
