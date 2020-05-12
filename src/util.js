export const add = a => b => a + b

export const always = value => () => value

export const adjust = index => f => array => [...array.slice(0, index), f(array[index]), ...array.slice(index + 1) ]

export const append = v => array => [ ...array, v ]

export const call = fn => v => fn(v)

export const last = array => array[array.length - 1]

export const noop = () => { return }

export const pick = keys => object => Object.fromEntries(Object.entries(object).filter(([ key ]) => keys.includes(key)))

export const identity = v => v

export const pipe = (...fns) => v => fns.reduce((acc, f) => f(acc), v)

export const compose = (...fns) => v => fns.reduceRight((acc, f) => f(acc), v)

export const False = always(false)

export const negate = f => (...args) => !f(...args)

export const has = prop => object => Object.prototype.hasOwnProperty.call(object, prop)

export const after = (value, f) => isPromise(value) ? value.then(f) : f(value)

// TODO: this should consider thenables as Promises. Use is-promise.
export const isPromise = value => Promise.resolve(value) === value
