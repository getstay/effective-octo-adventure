import { isPromise } from '../util.js'
import { into } from './into.js'
import { transduce } from './transduce.js'
import { tProtocol } from './tProtocol.js'
import { getBuilder } from './getBuilder.js'

// TODO: a lower level function should probably be created that takes an existing process,
// so this function could just create that process and pass to it, instead of wasting a little work here
export const transform = transducer => source => {
	const builder = getBuilder(source)
	return transduce
		(transducer(builder)[tProtocol.init]())
		//(transducer()[tProtocol.init]() || builder[tProtocol.init]())
		(builder)
		(transducer)
		(source)
}

// into
// 	(transducer()[tProtocol.init]() || getBuilder(source)[tProtocol.init]())
// 	(transducer)
// 	(source)
