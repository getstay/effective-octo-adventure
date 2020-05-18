import { compose, Deferred, False, noop } from '../util.js'
import { tProtocol } from '../core/tProtocol.js'
import { Transducer } from '../core/Transducer.js'

// TODO: this and a lot of other stuff here is duplicated in the frp lib
export const create_basic = () => {
	const subscribers = new Map()
	return {
		emit: (...values) => {
			for (const subscriber of subscribers.values()) {
				subscriber(...values)
			}
		},
		subscribe: subscriber => {
			const id = Symbol()
			subscribers.set(id, subscriber)
			return () => subscribers.delete(id)
		},
		subscribers
	}
}

// TODO: update these notes from deferred.resolve() to promise.stop()
// `step` receives (value, meta) from the collection
// `shortCircuit` takes each result from `step` and returns a boolean, whether the iteration should stop
// This unfortunately returns a deferred rather than regular promise, so that the outside world can call deferred.resolve() to stop the iteration
// deferred.resolve() is different from shortCircuit in that, shortCircuit only has an effect at the time a value is ready and step is called
// whereas deferred.resolve() could be called at some other time, without waiting on the next value (if ever... it could be a thing that never completes)
// For example, when flattening an emitter of emitter, the emitted emitters are being iterated concurrently, and
// should the overall process only want to take N values in the accumulator, any one of those concurrent iterations may send the nth value to the accumulator,
// causing the process to end, and all the concurrent iterations need to be stopped, though only one of them has just produced a value
// and gets signaled to stop by shortCircuit. So, the `flatten` function needs to proactively stop these iterations by some api...
export const iterate = ({ step, shortCircuit = False }, emitter) => {
	let stop
	const promise = new Promise(resolve => {
		stop = compose(
			emitter.subscribe((value, meta) => shortCircuit(step(value, meta)) && stop()),
			emitter.complete.subscribe(() => stop()),
			resolve
		)
	})
	return Object.assign(promise, { stop })
}

const Tick = () => {
	let init = false
	const p = Promise.resolve()
	p.then(() => init = true)
	return f => init ? f() : p.then(f)
}

const Lock = () => {
	let locked = 0
	let queue = []
	function lock () {
		++locked
		return function unlock () {
			--locked
			if (locked === 0) {
				queue.forEach(f => f())
				queue = []
			}
		}
	}
	const asap = f => locked ? queue.push(f) : f()
	return Object.assign(lock, { asap })
}

const typeIdentifier = Symbol('Emitter')
const isEmitter = x => x && x.typeIdentifier === typeIdentifier

// emitter.complete() is a function, but is also an emitter and can be composed just as any other
// TODO: needs the `lock` also, or some compositions should be broken (write tests!)
const create_complete = ({ cleanup, tick }) => {
	const { emit, subscribe, subscribers } = create_basic()
	const basic_complete = () => {
		emit(true)
		subscribers.clear()
		cleanup()
	}
	function complete () {
		return tick(basic_complete)
	}
	Object.assign(complete, { subscribe })
	return {
		complete,
		basic_complete,
		typeIdentifier
	}
}

export const builder = {
	[tProtocol.init]: () => create(),
	// to push a value into it
	[tProtocol.step]: (accumulator, value, meta) => {
		accumulator.emit(value, meta)
		return accumulator
	},
	// cleanup after process is finished
	[tProtocol.result]: accumulator => {
		accumulator.complete()
		return accumulator
	}
}

export const create = () => {
	const { emit: basic_emit, subscribe, subscribers } = create_basic()
	const tick = Tick()
	const lock = Lock()
	const { basic_complete, complete } = create_complete({ cleanup: () => subscribers.clear(), tick })
	const emit = (value, meta = { final: false }) => {
		// if an emitter emits an emitter, consumers of the outer emitter must be given a chance to subscribe to the inner emitter
		// before the inner emitter emits, so lock it, emit it, and then unlock it
		const unlock = isEmitter(value) ? value.lock() : noop
		// `tick` just defers everything to the next tick, but only for the first tick since this emitter was created!
		// it's synchronous / just calls the function immediately after that
		// The initial defer provides the opportunity see whether emitters emit other emitters
		// and do the aforementioned locking stuff to reorder them
		// `lock.asap` will run this function now if unlocked, or whenever the other emitters finish their stuff and unlock it
		return tick(() => lock.asap(() => {
			basic_emit(value, meta)
			meta.final && basic_complete() // already in a tick, so call basic_complete
			// if the value is an emitter, it has been emitted and subscribers have been able to susbcribe to it as well
			// so unlock it, or if value is not an emitter, noop
			unlock()
		}))
	}
	return {
		complete,
		emit,
		subscribe,
		lock,
		// iterface for generic functions:
		// to iterate it
		[tProtocol.iterateAsync]: params => iterate(params, { subscribe, complete }),
		// to create an empty
		...builder,
		typeIdentifier
	}
}

export const of = (...values) => {
	const emitter = create()
	const finalIndex = values.length - 1
	values.forEach((value, index) => emitter.emit(value, { final: index === finalIndex }))
	return emitter
}

export const from = Transducer(() => builder)
