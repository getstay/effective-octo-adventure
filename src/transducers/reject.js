import { filter } from './filter.js'
import { negate } from '../util.js'

export const reject = f => filter (negate(f))
