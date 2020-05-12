import { transduce } from './transduce.js'
import { getBuilder } from './getBuilder.js'

export const into = accumulator => transduce (accumulator) (getBuilder(accumulator))
