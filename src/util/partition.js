import { filter } from '../transducers/filter.js'
import { reject } from '../transducers/reject.js'

export const partition = predicate => collection => [
	filter (predicate) (collection),
	reject (predicate) (collection)
]
