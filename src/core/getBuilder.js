import { tProtocol } from './tProtocol.js'
import * as builders from './builders.js'
import { extractTransformer } from './Transformer.js'

export const getBuilder = collection => collection[tProtocol.step] ? extractTransformer(collection) : builders[(collection.constructor || Object).name]
