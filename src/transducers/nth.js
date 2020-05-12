import { Array_from } from '../core/primitives.js'
import { slice } from './slice.js'

export const nth = n => compose(
	values => values[0],
	Array_from,
	slice (n - 1, n)
)
