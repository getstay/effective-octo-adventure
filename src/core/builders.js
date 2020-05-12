import { tProtocol } from './tProtocol.js'

const makeBuilder = (constructor, push) => ({
	[tProtocol.init]: () => new constructor(),
	[tProtocol.step]: (a, v, m) => { push(a, v, m); return a },
	[tProtocol.result]: v => v
})

// TODO: investigate/test/document the String situation - because strings are immutable, there are limitations
// TODO: would it be nicer to make the Object init return Object.create(null) instead of {} ?
export const Array_builder = makeBuilder(Array, (a, v) => a.push(v))
export const Map_builder = makeBuilder(Map, (a, v, { key }) => a.set(key, v))
export const Object_builder = makeBuilder(Object, (a, v, { key }) => a[key] = v)
export const Set_builder = makeBuilder(Set, (a, v) => a.add(v))
export const String_builder = {
	[tProtocol.init]: () => [],
	[tProtocol.step]: (a, v) => {
		a = typeof a === 'string' ? a.split('') : a
		a.push(v)
		return a
	},
	[tProtocol.result]: a => Array.isArray(a) ? a.join('') : a
}

export {
	Array_builder as Array,
	Map_builder as Map,
	Object_builder as Object,
	Set_builder as Set,
	String_builder as String,
}
