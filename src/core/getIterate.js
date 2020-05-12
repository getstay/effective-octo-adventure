import { iterateNative } from './iterateNative.js'
import { tProtocol } from './tProtocol.js'

export const getIterate = collection => collection[tProtocol.iterate] || collection[tProtocol.iterateAsync] || iterateNative
