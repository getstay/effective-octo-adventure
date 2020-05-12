import { Transducer } from './Transducer.js'
import * as builders from './builders.js'

const makePrimitiveProperties = name => {
	const builder = builders[name]
	return {
		builder,
		from: Transducer(() => builder)
	}
}

export const Array = makePrimitiveProperties('Array')
export const Map = makePrimitiveProperties('Map')
export const Object = makePrimitiveProperties('Object')
export const Set = makePrimitiveProperties('Set')
export const String = makePrimitiveProperties('String')
