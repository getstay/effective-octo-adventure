# Transducers

## Source collection and destination collection unaware algorithms

// TODO: this whole section is currently just rambling.

We can create transformation algorithms thinking only about their meaning, without needing to consider any specific collection types.
We can reuse the same functions for any collection type.
We can transform from and to any collection type.

Generic transformations that do not have the responsibility of iterating a source or building up a result can compose naturally into other generic transformations, creating an efficient operation through many transformations, without creating an intermediate collection for each. The values will be passed from the source collection, through the transformation (which can be a series of many transformations composed together), and finally to the accumulator collection being built up.

Having the semantics of a collection independent of the algorithms that transform its values offers opportunities to verify the collection's semantics and to learn about how semantics of the algorithms and semantics across collections translate to and from any given collection's semantics. For example, an FRP / Reactive type i.e. Observable/Stream/Event is often described as a "list across time". If that is a true description of the type, then you might expect the same composition on an Array (list) or an Observable to produce the same result, but through the semantics of each collection. To avoid having to interpret results through those semantics, you could use a generic function that turns any collection into an array, or a promise of an array for asynchonously iterated types.

```js
T.compose (T.Array.from, T.map (v => v + 1)) (Array.of(1, 2, 3 ))
// [ 2, 3, 4 ]

T.compose (T.Array.from, T.map (v => v + 1)) (Observable.of(1, 2, 3)
// Promise [ 2, 3, 4 ]
// NOTE: the above result is hypotethetical, not based on any specific implementation of "Observable".
```

You might argue that such an expectation is more specific than "a list across time", and that, if the result is the same for all operations, you could call it, most literally, `ReactiveArray`, which is fine, too, but whatever your preferences, you are able to use these generic compositions to verify qualities about them.

## Introductory Examples

These examples are high level, far removed from implementation details, and sugared to such a degree that it is no longer apparent transducers are involved.
The implementation of the functions here may not be at all as you would expect.
Continue reading for an explanation of the theory and implementation that makes this possible.

Here, we define a function `f`, which is analogous to `array => array.map(v => v + 1).filter(v => v % 2 === 0)`.
```js
const f = T.compose (T.filter(v => v % 2 === 0), T.map (v => v + 1))
```

When passed an array, the result is as usual.
```js
f ([ 1, 2, 3 ])
// -> [  2, 4 ]
```

However, this operation only created the one array that it returned; each value from the input array having been mapped, then filtered, then put into this one array, rather than creating a mapped array, and then a filtered array and returning the second. Transducers are naturally efficient in this regard. No intermediate types will be created during the execution of a composition of transducers.

Here, `f` is composed with `T.Object.from`, which is also a transducer, producing a transducer which will take each value from the input array, through the map and filter transformations, and into an object. The index of each value from the array is passed along as its key, and the object receives the transformed values with those keys.
```js
T.compose (T.Object.from, f) ([ 1, 2, 3 ])
// -> { 0: 2, 2: 4 }
```

In this implementation, keyed collections such as Object and Map are not iterated as `[ key, value ]` pairs; rather all collections are iterated as `value, { key }`, as this provides consistent meaning of transformations across types, and a convenient default behavior. Transformation on `[ key, value ]` pairs, or just `key`, is opt-in using special functions for the purpose.
```js
T.overPairs (T.map (([ k, v ]) => [ v, Number(k) + v ])) ({ 0: 1, 1: 2, 2: 3 })
// -> { 1: 1, 2: 3, 3: 5 },

T.overKeys (T.compose (T.reject (key => key.startsWith('r')), T.map(T.reverse))) ({ foo: 1, bar: 2, baz: 3 })
// -> { oof: 1, zab: 3 },
```

In this example, `f` is composed with `T.Set.from`, so a `Set` is expected as a result.
An async iterable is passed as the source collection, which will asynchronously yield 1, then 2, then 3.
Because the source is iterated asynchronously, a promise of the `Set` is returned.
Each value is transformed as it is produced by the input async iterator, and built into the resulting `Set`.
When the iterator is done and all values have been built into the `Set`, the promise resolves.
```js
async function * oneTwoThree () { yield 1; yield 2; yield 3; }
await T.compose (T.Set.from, f) (oneTwoThree())
// -> Set (2, 4)
```

The examples have so far demonstrated the case of a synchronously iterable source collection having its values carried through transformations into an accumulator collection, and the case of an asynchronously iterable source collection doing the same, but returning a promise of the accumulator. There is another possibility, which is that the accumulator collection has semantics that provide meaning for its values as they are received or in some real-time way prior to having all of the incoming values. That means that in some sense, the collection is also asynchronously iterable, or reactive. For example, if the collection is an emitter, it can emit each value and subscribers can receive them. In this case, the accumulator collection is immediately returned.
```js
async function * oneTwoThree () { yield 1; yield 2; yield 3; }
const emitter = T.compose (Emitter.from, f) (oneTwoThree())
emitter.subscribe(console.log)
// -> logs: 1
// -> logs: 2
// -> logs: 3
```

Depending upon the semantics of the collection, some extreme stuff is possible.
This is an emitter emitting emitters that emit other values. You could subscribe to any of these individually and would recieve their emitted values. Each member value of the collection is a collection, and each value is iterated, sending its values along to the same destination as all the others, producing a flattened/unnested result.
```js
const emitter = T.flatten (Emitter.of(Emitter.of(1), Emitter.of(2, 3, 4), Emitter.of(5, 6)))
emitter.subscribe(console.log)
// -> logs: 1
// -> logs: 2
// -> logs: 3
// -> logs: 4
// -> logs: 5
// -> logs: 6
```

This is analogous to `Array.of(Array.of(1), Array.of(2, 3, 4), Array.of(5, 6)).flat()`, or `[ [ 1 ], [ 2, 3, 4 ], [ 5, 6 ] ].flat()`.
If there's any doubt - make the result an array instead, and see if the results are equivalent.
```js
;[ [ 1 ], [ 2, 3, 4 ], [ 5, 6 ] ].flat()`
// -> [ 1, 2, 3, 4, 5, 6 ]

await T.compose (T.Array.from, T.flatten) (Emitter.of(Emitter.of(1), Emitter.of(2, 3, 4), Emitter.of(5, 6)))
// -> [ 1, 2, 3, 4, 5, 6 ]
```

Finally, let's crank it up to 11 and flatten a collection of other collections it knows nothing about, into some other collection it knows nothing about.
```js
await T.compose (T.Array.from, T.flatten) (Emitter.of(Emitter.of(1), Array.of(2, 3, 4), new Set([ 5, 6 ])))
// -> [ 1, 2, 3, 4, 5, 6 ]
```

## Transducer definition

Transduce - to lead along

A transducer is a composable higher-order reducer. It takes a reducer as input, and returns another reducer ([Eric Elliot](https://medium.com/javascript-scene/transducers-efficient-data-processing-pipelines-in-javascript-7985330fe73d).
A reducer is a transformation from many inputs to one output.
A transducer is a transformation from one reducer into a reducer - a transformation of a transformation.
For example, taking a reducer (transformation) that filters, and returning a reducer that maps and then filters.

## Discovering a generic interface by separating concerns

A transducer is maximally generic and reusable because it knows about nothing more than its own algorithm. In this section, we will discover the foundational transducer implementation by splitting concerns from familiar implementation of operations on collections.

Consider how you might implement Array `.map`.

A low level approach:
```js
const map = f => array => {
	const accumulator = []
	for (let i = 0; i < array.length; i++) {
		accumulator[i] = f(array[i])
	}
	return accumulator
}
```

Noting the multiple concerns:
```js
const map = f => array => {
	const accumulator = [] // knowledge of the desitnation
	for (let i = 0; i < array.length; i++) { // iterating the source
		const value = array[i]
		const transformedValue = f(value) // the actual map algorithm
		accumulator[i] = transformedValue // building into the destination
	}
	return accumulator
}
```

Consider also a higher level implementation using `reduce`:
```js
const map = f => array => array.reduce( // iterating the source
	(accumulator, value) => {
		const transformedValue = f(value) // the actual map algorithm
		accumulator.push(transformedValue) // building into the destination
		return accumulator
	},
	[] // knowledge of the destination
)
```

It looks nicer, but suffers no less mixing of the aforementioned concerns.

In every place that there is a concern aside from the `map` algorithm, `f(value)`, this operation incurs a limitation.
It is limited to the type of its input collection (array), because it must know how to iterate that input.
It is limited to the type of its output collection (array), because it must know how to build into that output.
Further, it is unable to compose its underlying algorithm with any other, because it has other concerns on either side of that algorithm.

So, let's take a naive jab at solving those problems.
```js
const map = f => value => f(value)
map (v => v + 1) (0) // 1
```

Too far? Too far. Something appears to be missing, because we may as well have ditched `map` and called the function with the value directly, or at least renamed that function to `call`. Also, how could we use this with a collection and kind of iteration of that collection? Let's dance around the solution just a little longer.

However we solve this, it mustn't work only for `map`. Let's look at `filter` as well.
```js
const filter = predicate => array => array.reduce(
	(accumulator, value) => {
		if (predicate(value)) { // <--- I see you, filter algorithm.
			accumulator.push(value)
		}
		return accumulator
	},
	[]
)
```

Most of it is the same piling up of concerns, and then one small part that is actually `filter`, buried in there.

To ditch the concerns and make something useless once again:
```js
const filter = predicate => value => predicate(value) ? value : new Error('what do we do!?')
```

To find the interface we're looking for, let's take the overly concerned code block and break pieces out and stick pieces in, lego style.
I'll derive the pieces from our former observations.

`reduce` is already a nicely packaged idea - do something to potentially many things and return one thing. That covers iteration and having a result.

In both `filter` and `map`, we also see `accumulator.push(value)` and `return accumulator`. Let's extract only that part, such that it can be put together with `reduce`.
So, we're taking our former code, and just removing `map` or `filter` altogether:
```js
array => array.reduce(
	(accumulator, value) => {
		accumulator.push(value)
		return accumulator
	},
	[]
)
```
This just copies the input array into the accumulator array.
From this, all we must do is remove anything that isn't `reduce`. We'll call that stuff `accumulator` and `build`.

```js
const build_array = (array, value) => {
	array.push(value)
	return array
}

;[ 1, 2, 3 ].reduce(build_array, [])
//  -> [ 1, 2, 3 ]
```

You've now read a lot of words and nothing cool has happened at all. Hang in there, because things get interesting from now on.

All we must do from here is start from `build_array` and end up with a function that maps or filters (or both) *and* does `build_array`. Let's just call it `build` for now, because there's no need to limit ourselves to using an array as the accumulator, and only being able to build an array.

```js
const map = f => build => (accumulator, value) => build(accumulator, f(value))

const reducer = map (v => v + 1) (build_array)
// TA-DA! This is a function we can pass to reduce that maps and builds the array!

;[ 1, 2, 3 ].reduce(reducer, [])
// -> [ 2, 3, 4 ]
```

What about filter?
```js
const filter = predicate => build => (accumulator, value) =>
	predicate(value)
		? build(accumulator, value) // only build if the value passes the predicate
		: accumulator // otherwise, just return the accumulator unchanged
```

Are you excited? I get excited. We just expressed collection generic transformations algorithms of `map` and `filter`, and it was absurdly simple to do. Now, take a glance back at `build_array`, and `map` and `filter`. They all have something in common. They all have this signature somewhere: `(accumulator, value) => accumulator`. That's the signature of a reducer. `build_array` is a reducer, and `map` and `filter` both take a function pertaining to their algorithms, then take a reducer, and return a reducer. And what is a transducer? It's a function that takes a reducer and returns a reducer!

So, you know `build_array` is a reducer, and we have been passing it as `build` to `filter` and `map`, which call it like a reducer, of course: `build(accumulator, value)`. We can say this in a more generic way and discover more goodies by doing so. `map` and `filter` take the next reducer, and return a reducer that may or may not call that next reducer. We have been calling that next reducer `build` and passing `build_array`, and map always calls that next reducer, but filter only calls it if the value passes the predicate. Now realizing that this argument is simply the next reducer, there is no need for that next reducer to be the builder. The next reducer passed to the `map` transducer could be the `filter` reducer, meaning that the `map` transducer will return a reducer which maps and then filters. In order to get the `filter` reducer, the `filter` transducer must be passed the next reducer, so we can pass the builder there. We pass the builder, a reducer, to the filter transducer, returning a reducer that filters and builds, and we pass that reducer to the map transducer, returning a reducer that maps, filters, and builds.

I'll use the most possible steps and longest variable names here so that it's easy, albeit annoying, to digest.
```js
const map_add1_transducer = map (v => v + 1)
const filter_even_transducer = filter (v => v % 2 === 0)
const filter_even_then_build_array_reducer = filter_even_transducer(build_array)
const map_add1_then_filter_even_then_build_array_reducer = map_add1_transducer(filter_even_then_build_array_reducer)

;[ 1, 2, 3 ].reduce(map_add1_then_filter_even_then_build_array_reducer, [])
// -> [ 2, 4 ]
```

The composed reducer recieved `[], 1`, the map reducer in it called the next reducer with `[], 2`.
That next reducer is `filter`, which checked that the value is an even number, and it is, so it called the next reducer with `[], 2`.
That next reducer is `build_array`, which returned `[ 2 ]`, and the filter `reducer` returns that, and the map reducer returns that,
so the composed reducer returned `[ 2 ]`, and that completes the processes of the first value from the input.
`reduce` then calls the reducer with the accumulator and the next value, so the reducer receives `[ 2 ], 2`, and so on.

Here's a more compact version of the previous code.
```js
;[ 1, 2, 3 ].reduce(
	map
		(v => v + 1)
		(filter
			(v => v % 2 === 0)
			(build_array)),
	[]
)
```

You can pass this composition to a `reduce` that operates on a different collection type, and/or switch out the builder and build into a different collection type.
For example, it is arbitrary to make a `build_string` or `build_set` reducer and put it in the place of `build_array`. That gives you mapping and filtering from an array, directly into a string or a Set. Most JavaScript primitives implement the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#The_iterable_protocol). Regular Objects don't, but it is easy to implement yourself, or you can iterate objects many other ways. You can make a reduce that takes any iterable, or make a reduce function specific to each collection, or something in between. There is also the JS [async iterable protocol](https://javascript.info/async-iterators-generators#async-iterables) to consider, and collections which don't conform to either type very well. For example, an emitter delivers its values over time, but many implementations emit to subscribers synchronously. JS async iterables always deliver values asynchronously, so the async iterable protocol may be undesirable. There are many options, but inevitably, you can create a `reduce` function or functions to work with these and other collections.

The point is - have a `reduce` for all the things, have generic transformations that make a reducer, and have a builder for all the things, and then you can iterate anything, transforming the values using the same algorithms for anything, and build the values into anything.

You are now familiar with the fundamental transducer concept and basic implementation! We must still expand on these ideas to support the implementation of more algorithms, and to build up to a convenient, high-level, expressive API.

## Short Circuiting / Early Termination

Many algorithms only pertain to part of a collection and do not need any further values from the collection to produce the result.

Consider how you could implement `slice` from `reduce`.
```js
;[ 1, 2, 3, 4, 5 ].slice(1, 3)
// -> [ 2, 3 ]

const slice = startIndex => toIndex => array => array.reduce(
	(acc, value, index) => {
		if (index >= startIndex && index < toIndex) {
			acc.push(value)
		}
		return acc
	},
	[]
)

slice (1) (3) ([ 1, 2, 3, 4, 5 ])
// -> [ 2, 3 ]
```

The output is correct, but the expression is not entirely accurate, and so is doing needless work. The values `4` and `5` are iterated and passed into the reducer, though the nature of the algorithm indicates that they are not needed. We can fix this by using a reduce that supports short circuiting. The common implementation is that a reducer can wrap its return value in a special object, and after each call to the reducer, `reduce` examines the return value to see if it is that special object. If so, iteration is stopped, the value is unwrapped from the object, and is returned.

```js
const reduced = value => ({ [specialReducedIdentifier]: true, value })

const slice = startIndex => toIndex => array => {
	const finalIndex = toIndex - 1
	return array.reduce(
		(acc, value, index) => {
			if (index >= startIndex) {
				acc.push(value)
			}
			return index === finalIndex ? reduced(acc) : acc
		},
		[]
	)
}

slice (1) (3) ([ 1, 2, 3, 4, 5 ])
// -> [ 2, 3 ]
```

The result is the same, but iteration stops after `3`, so `4` and `5` are not be passed to the reducer.

Finally, we should extract `slice` into a transducer.
```js
const slice = startIndex => toIndex => next => {
	const finalIndex = toIndex - 1
	return (accumulator, value) =>
		index >= startIndex
			? index === finalIndex ? reduced(next(accumulator, value)) : next(accumulator, value)
			: accumulator
}
```

On the final value, `slice` calls the next step, which calls out to the builder, building the final value into the accumulator, and returning the accumulator, which `slice` wraps in `reduced` and returns. It is short circuiting on the final value, including it in the result. A transducer could also short circuit excluding the current value by simply wrapping the accumulator in `reduced` and returning it without calling the next step.

## Overcoming limitations in expressing algorithms with only a reducer

The transducer implementation so far is a function that takes a reducer and returns a reducer, and the reducer can call the next reducer and short circuit the reduction by returning its result wrapped in `reduced`. This interface is insufficient for many cases. What about a `reverse` transducer? `reduceRight` is not an option, because a transducer can't take on the responsibility or knowledge of iterating, nor is it possible to iterate many collections from the right. Iterating from the left, we can only produce a reversed result by collecting every value, and knowing we have collected every value, and then sending them on in the opposite order.
```js
const reverse = array => {
	const values = []
	return array.reduce(
		(acc, value, index) => {
			values.unshift(value)
			if (index === array.length - 1) {
				values.forEach(value => acc.push(value))
			}
			return acc
		},
		[]
	)
}

reverse([ 1, 2, 3 ])
// -> [ 3, 2, 1 ]
```

That accomplished the goal within a reducer, but we certainly cheated by checking the input array to determine if we were on the last value. In hyper-generic transducer land, we can't examine the source collection, nor could we rely on it having a `length` if we could. You could offer the solution of adding some metadata and passing along { final: true } when it's the last value, and I'd dig that for other reasons, but it doesn't solve our current problem. Not all collections can know what their last value is at the time a value is iterated; they may send a value and then determine they have reached their end afterward. This means that the `reverse` algorithm could only reliably send its values *after* the iteration/reduction is complete.
```js
const reverse = array => {
	const values = []
	const acc = return array.reduce(
		(acc, value, index) => {
			values.unshift(value)
			return acc
		},
		[]
	)
	values.forEach(value => acc.push(value))
	return acc
}

reverse([ 1, 2, 3 ])
// -> [ 3, 2, 1 ]
```

There are two new concepts here - a transducer algorithm with an additional function, and that function running beyond the reduction. Let's first improve our transducer specification while making the `reverse` transducer.
```js
export const reverse = next => {
	const values = []
	return {
		step: (accumulator, value, meta) => {
			values.unshift(value)
			return accumulator
		},
		result: accumulator => {
			while (values.length && !isReduced(accumulator)) {
				const value = values.shift()
				accumulator = next.step(accumulator, value)
			}
			return next.result(unreduced(accumulator))
		}
	}
}

// NOTE: there is a serious problem here that has not yet been discussed. The following code is stateful and ought to be scoped within a function we have not yet discussed.
const process = reverse(build_array)
process.result([ 1, 2, 3 ].reduce(process.step, [])
// -> [ 3, 2, 1 ]
```

Our transducer is no longer simply taking a reducer and returning a reducer, but taking a value that includes a reducer and returning such a value. This value is `{ step, result }`, where `step` is the reducer, and `result` is the function that takes the `accumulator` after `reduce` has completed, and returns the final result. This value `{ step, result }` is known as a `transformer`. Where we have formerly spoken of a `reducer`, you should now think of a transformer with a reducer called the `step` function. We should now say that is a transducer is a function that takes the next transformer and returns a transformer.

The default `result` function for a transducer just takes the accumulator and passes it to the next result function. `result: accumulator => next.result(accumulator`. Or simplified: `result: next.result`. This means that the result function of all the transducers in a pipeline will be called, each returning the value of the next.

The `result` function of `reverse` calls `next.step`, which is a valid and normal thing to do. The `result` function provides an opportunity for a transducer to flush any pending steps it knows about, should it desire to. In the case of `reverse`, it buffers everything and needs to flush its values in order to accomplish anything. It must be considerate of the `reduced` object and stop calling `next.step` if `reduced` is returned to it. Further, it must unwrap `reduced` and just send the plain result onto `next.result`. You might notice that what we've just described is the same specification required for our short-circuit-able `reduce`. Therefore, we can rewrite the `result` function for `reverse` using that `reduce` to update the accumulator, check for `reduced`, and ensure it is unwrapped.
```js
export const reverse = next => {
	const values = []
	return {
		step: (accumulator, value, meta) => {
			values.unshift(value)
			return accumulator
		},
		result: accumulator => {
			const result = reduce (next.step) (accumulator) (values)
			return next.result(result)
		}
	}
}
```

## stateful transducers

The `reverse` transducer has another quality that differentiates it from `map` and `filter` - local state. When it receives `next`, it creates a local array `values`, which is populated across multiple steps, throughout the overall process. It is critical that this state is not leaked such that another process begins from existing state populated by another process. Remember that when transducers are composed, they are not invokved, but setup to be invoked in a series when the composed function is invoked. In other words, `compose(transducerA, transducerB)` just returns a function that is waiting on `next` to be passed in, just like the transducers being composed.
```js
// Composing doesn't invoke the transducers. Just sets them up to be invoked in series.
const composition = next => transducerA(transducerB(next))

// The actual invocation, which passes the `next` transformer through all the composed transducers and returns a transformer.
composition(builder)
```

Once the builder is passed in, the local state in transducers is created, and so the returned transformer is stateful if any transducers in the composition are stateful. Invoking a transducer must therefore be considered dangerous and handled with care. The following example demonstrates the danger.
```js
const process = reverse(build_array)

process.result(reduce(process.step, [], [ 1, 2, 3 ]))
// -> [ 3, 2, 1 ]

process.result(reduce(process.step, [], [ 4, 5, 6 ]))
// -> [ 6, 5, 4, 3, 2, 1 ]
```

Reusing the transformer returned from invoking the transducer, `process`, caused the same expression to produce a different result, because both invocations shared the same state. A new `process` must be created for each reduction. The next section will implement a function for wrapping up this concern.

## `transduce (accumulator) (builder) (transducer) (source)`

Now that our algorithms have `{ step, result }` functions instead of just being the reducer `step`, we cannot run a transformation with only `reduce (reducer) (initialValue) (source)`. We should create a higher level function that calls `reduce` with the transformer's `step` function and then calls the transformer's `result` function with the result from `reduce`. We should also use this function to contain the stateful `process`. This function is called `transduce`, and it just a small layer over `reduce`.

```js
const transduce = accumulator => builder => transducer => source => {
	const process = transducer(builder)
	const result = reduce (process.step) (accumulator) (source)
	return process.result(result)
}

transduce ([]) (build_array) (reverse) ([ 1, 2, 3 ])
// -> [ 3, 2, 1 ]

transduce ([]) (build_array) (reverse) ([ 1, 2, 3 ])
// -> [ 3, 2, 1 ]
```

Passing in the builder separately and having `transduce` pass it to the transducer keeps the stateful transformer reference contained, and we no longer need to remember to call `process.result` after reducing. We have to pass a builder that is compatible with the accumulator, so there's redundancy here. Given an collection, we could somehow determine what builder to use to build into, or given a builder, we could somehow get an empty collection to build into, and then use something higher level to wrap this up.

Some implementations of `transduce` will vary behavior by the number and/or type of arguments passed to it, covering some or all of the cases which can instead be handled with specific functions  for each case. I suggest avoiding excess branches in `transduce` and just build small layers over it to handle the different inputs.

## `into (accumulator) (transducer) (source)`

`into` is slightly more convenient than `transduce`, letting us just pass the accumulator, and finding and passing the apporpriate builder to `transduce` for us. For this to work, you need some kind of `getBuilder` function that takes a collection and returns a transformer that can take each value and build it into the accumulator. A way to do this is to have custom collections implement the transformer properties, so that given such a collection, its `step` and `result` functions could be used to build it, otherwise, if the collection is a primitive/known collection, have builders in the library for them and return the appropriate one for that collection.

```js
const into = accumulator => transduce (accumulator) (getBuilder(accumulator))

into ([]) (map (v => v + 1)) ([ 1, 2, 3 ])
// -> [ 2, 3, 4 ]
```

`into` is the function I have seen used most often in the wild for running transducers. I don't make a habit of taking existing references and mutating them with values, so `into` is not of much interest to me. For the above case, I certainly do not prefer that api over the much simpler `map (v => v + 1) ([ 1, 2, 3 ])`. Let's keep exploring!

## `something (builder) (transducer) (source)`

_* This function is not found in other transducer implementations._

TODO: name this function and write this section, if this function should even exist..
TODO: either in this section or the next section on `transform` needs to include the following:
So far, we have defined a transformer as `{ step, result }`, and a `builder` as a transformer that should be at the end, building values into the accumulator. There are situations where it is desirable to construct a new/empty collection from a builder, and a property for such a purpose is an intuitive feature for a builder. If by expanding the meaning of "builder", we also expand the meaning of "transformer", we will handle another case as well. Transformers will now have an additional property `init` that is a function that either returns the result of `next.init()`, or returns a new/empty collection to use as the accumulator. This means that, if given a builder directly, you can get a collection by calling `builder.init()`, or if given a transformer with a builder on the end, you can accomplish the same with `transformer.init()`, as all the transformers in the pipeline will just call out to the `next.init()` until reaching the builder, and then return its value, in the same way that `step` and `result` work.

## `transform (transducer) (source)`

_* This function is not found in other transducer implementations._

`transform` goes a small level higher than the former functions, taking neither an accumulator nor a builder. You may first think of it as meaning that both the builder and accumulator should be determined from the `source` collection; if you put in an array, you will get back an array. This further improves the API over former examples.

```js
T.transform (T.map (v => v + 1)) ([ 1, 2, 3 ])
// -> [ 2, 3, 4 ]
```

There is an additional case which I suggest handling here as well. We have formerly discussed the rule that a transducer must not be invoked directly, out in the code where the stateful transformer reference can be leaked. Given that passing a builder means invoking a transducer, this means there is a limitation that we could not create a composition of a transducer and a specific builder directly. Consider `compose(Object.fromEntries, map (([ key, value ]) => [ value, key ]))`, which is mapping the collection of key/value pairs, and then creating an object from those pairs. It is desirable that we could express something like `compose(builder, transducer)`. A way this can be done is to make a builder into a transducer, which is as simple as `() => builder`.

```js
// builders don't use `next`, so just ignore it... no need for any arguments
const Array_from = () => Array_builder

// always building into an array
compose(Array_from, T.map (v => v + 1))
```

This can be problematic because when executing this composition, the accumulator must match the builder that is composed here. If the accumulator is chosen according to the type of the source collection, then this composition is only going to work when the source collection is of the same type as the builder in it. This is a case where I would attempt to get a collection from the transducer, which means it has a builder in it, and otherwise get a builder and accumulator from the source collection, and so this is what `transform` does.

```js
T.transform (compose(Array_from, T.map(v => v + 1))) (new Set([ 1, 2, 3 ]))
// -> [ 2, 3, 4 ]

T.transform (T.map(v => v + 1)) (new Set([ 1, 2, 3 ]))
// -> Set { 2, 3, 4 }
```

This is almost tolerable, as we've eliminated having to specify the two extra values that came along with using transducers - the accumulator and the builder, and we can still go from any collection, through as many transformations as we want, and to any collection all in one pass. But, I can't abide having to call `transform` all over the place, so we're not done here.

## Revisiting Transformers

The previous sections ran into situations that led to expanding the transformer specification to include an `init` function, and that userland collections can implement the transformer properties so that having the collection also means having a builder for that collection. We should not make a specification that userland collections should have properties named `{ step, result }`. There is the chance the collection author has used those property names for some other purpose. Besides, it is nice to name these properties in a way that their purpose is not ambiguous. The common practice in JavaScript transducer libraries has been to prefix these transformer properties with `@@transducer`, so that they are distinct and reliably identifiable as transducer transformer properties.

```js
// transducer
next => {
	// transformer
	return {
		'@@transducer/init': () => next['@@transducer/init'](),
		'@@transducer/step': (accumulator, value) => next['@@transducer/step'](accumulator, value),
		'@@transducer/result': accumulator => next['@@transducer/result')(accumulator)
	}
}
```

The above is more verbose than necessary. If the transducer doesn't need to do anything with a property, it can just take the next transformer's property as its own.

This is pretty awful to type and to look at, so, unless abandoning this whole approach in favor of a better one, an option to ease the pain a little bit is to put the property names on an object and use that.
```js
import { tProtocol } from './'
next => ({
	[tProtocol.init]: () => next[tProtocol.init](),
	[tProtocol.step]: (accumulator, value) => next[tProtocol.step](accumulator, value),
	[tProtocol.result]: accumulator => next[tProtocol.result](accumulator)
})
```

It is possible to know if something is a transformer by looking for these properties, however, it can be unclear whether an object is strictly a transformer, or a collection that implements the transformer specification so that it can be used as a builder. This creates an awkward, but manageable case you will see in an upcoming section, and could be a good reason to come up with a better approach if possible.

## Transducer composition order vs. transformation order

It is common to compose functions using a `compose` or `pipe` function, but note that transducers appear to compose backwards.

With regular, non-transducer functions, this composition returns a function which takes a value (a collection),
filters the collection down to even numbers,
then maps the collection by adding one to each value.
```js
compose (map (add(1)), filter (isEvenNumber))
```

But if the values passed to `compose` are transducers, the composition may verbally appear the same, but its meaning is very different.
The composed function is not expecting a value that is a collection, but a value that is the next reducer function.
In the non-transducer version, the input value and the value passed through the functions from right to left is a collection.
In the transducer version, the input value is a reducer, and the output from each function is a reducer. The input reducer is transformed into another reducer from right to left, and so that process occurrs in the typical order, like any other function composition. What makes transducer composition appear backwards is that the resulting reducer will transform values from left to right.

I'll break that down:
```js
compose
	(
		map (add(1)), // next => (accumulator, value) => next(accumulator, f(value))
		filter (isEvenNumber), // next => (accumulator, value) => predicate(value) ? next(accumulator, value) : accumulator
	)
	(build_array)

// think:
// map_transducer(filter_transducer(build_array))
```

`build_array` is passed as `next` to the `filter` transducer, making a reducer that filters and then builds, and that reducer is passed as `next` to the `map` transducer, making a reducer that maps, then filters, then builds. So the reducers are transformed from right to left, creating a reducer that runs those transformations from left to right (calling next). You must therefore list the transformations in opposite of the typical order when using `pipe` or `compose`.

Knowing all this, you might be disturbed that the introductory examples are not composing transformations 'backwards', are being passed collections directly, and are not calling `reduce` or using some kind of `build`. I could understand if you're ready to call the whole thing a scam, because those examples seem to have nothing to do with transducers. Valid concerns, my friend! These details are important, but it is possible to build up to a level where you don't need to interact with them anymore.

## Getting jiggy wit it - auto-transducing

I like that transducers are generic and reusable. I like that I can freely move from type to type... but having to muddy my code with `transform (actualThingICareAbout)` all over the place does not make me desire to jig. I would not even waltz about it. Some transducer implementations use a cool idea - move the `transform` (or whatever thing like that... some call to `transduce`) _inside_ transducers themselves, so that if you pass them a collection instead of a transformer, they will go ahead and transform that collection, which makes them work like their regular function counterparts.

We can wrap transducers in a helper that gives them this behavior for us.

```js
// takes a transducer and returns a transducer that can auto-transduce when passed a collection instead of a transformer
const Transducer = transducerF => next => isTransformer(next) ? transducerF (next) : transform (transducerF) (next)

const map = f => Transducer(next => ({
	...next,
	[tProtocol.step]: (accumulator, value) => next[tProtocol.step](accumulator, value)
})

map (v => v + 1) ([ 1, 2, 3 ])
// -> [ 2, 3, 4 ]
```

Did we just fly directly into the sun with our wings in tact? Unfortunately, no. On the one hand, it worked like a regular function, but on the other hand, it worked like a regular function. Consider this:

```js
compose(filter (v => v % 2 === 0), map (v => v + 1)) ([ 1, 2, 3 ])
```

Do you expect the result to be `[ 2, 4 ]`, or `[ 3 ]`? Recall that transducers transform 'backwards' of how they compose, so, a transducer, this operation should filter and then map. But as regular functions, it would map the array, producing an array, then pass that array to filter, producing another array. So... they work very differently as regular functions. What if we could just get all of the good stuff and none of the bad stuff?

I prefer if stuff just works like it looks like it should work and I don't have to think about it, and also it's as efficient as possible. Since we have these functions that sound like regular function and can work like regular functions, at some point, we'll want to throw a regular function into `compose` along side these auto-transducing transducers. That would work as we have it so far; I just wanted to point out it's something you can do and we shouldn't break it somehow.

It would be sweet if `compose` could combine transducers that are next to each other, and _then_ auto-transduce, instead of each transducer auto-transducing as it is passed a collection. Except... then what about the order? We can't have regular functions composing one direction and transducer transforming the other direction, all in the same arguments to `compose`. So, it's pretty clear we're going to have to normalize the order by reversing the order of transducers when they're used this way. We would no longer think about transducer and their order when composing them, but justconsider them as right-to-left transformations as any other function. We need a `compose` function that will reverse the order of transducers and combine them, and works smoothly with other functions. I implemented this as `pipe` first, because one place in the code was much easier to reason about for me in comparison to the equivalent code for compose.

// TODO: link to pipe.js

With this special `compose`, we can finally use the same API we would use for non-transduce code, but keep all of the benefits of the generic implementation.

```js
T.compose(T.map (v => v + 1), T.filter (v => v % 2 !== 0)) ([ 1, 2, 3 ]),
// -> [ 2, 4 ]

T.compose(T.Object.from, T.map (v => v + 1), T.filter (v => v % 2 !== 0)) ([ 1, 2, 3 ]),
// -> { 0: 2, 2: 4 },
```

Did you catch that? We didn't need to say anything about keys to go from an array to an object - the iteration function passed along the index as `key` in case anything could use it, and so the object builder took the array indexes as its keys, **and it naturally preserved the correct index from the array.** This is a nice bonus resulting from efficient transducer composition and the decision to iterate all collections as `value, { key }`, instead of some collections as value and some as `[ key, value ]` pairs. This allows us to do something very expressive that is usually impossible: switch the value being operated on within an operation from values to keys, or as key/value pairs.

```js
const f = T.compose (T.reject (v => v.startsWith('r')), T.map (T.reverse))

// run the operation normally - on the values of the input
f ({ foo: 'jack', bar: 'ron', baz: 'sally' })
// -> { foo: 'kcaj', baz: 'yllas' }

// run the operation on the keys
T.overKeys (f) ({ foo: 'jack', bar: 'ron', baz: 'sally' })
// -> { oof: 'jack', zab: 'sally' }
```

```js
T.overPairs (T.reverse) ({ foo: 1, bar: 2, baz: 3 })
// -> { 1: 'foo', 2: 'bar', 3, 'baz' }
```

This is accomplished by putting a transducer on each side of the given transducer. The transducer before adjusts what is sent to next transducer, and the transducer after adjusts it back. It is very similar to a lens, and maybe it is correct to call it some kind of promapping. Promap is both contramap and map - transforming the input and the output.

TODO: link to over.js

_Note: we have now ventured far away from other transducer implementations, and will go a little further yet._

## Identifying transducers and transformers

As you have seen, by examining whether a value is a transducer or a transformer in some situations we can do some cool stuff. There is no common approach to identifying whether a function is a transducer. I simply added the property `{ '@@transducer': true }` to my transducer functions, using the aforementioned helper `Transducer`, that also provides auto-transducing. Speaking of auto-transducing, that is where the awkwardness comes about that I had mentioned regarding collections implementing the transformer properties.

```js
const Transducer = transducerF => next => isTransformer(next) ? transducerF (next) : transform (transducerF) (next)
```

The helper makes the transducer check whether `next` is a transformer, and if so, passes it to the transducer as usual, otherwise, it ought to be a collection and should call `transform` for us. But, if a collection has the transformer properties, couldn't it be considered a transformer? I got around this issue by defining a transformer as an object having strictly the transformer properties and no other properties, therefore a collection is not a transformer and everything works, but I would still like to see the API/interfaces improved in this regard.

## Implementation convenience

// TODO: partial transformer definitions
// TODO: reusing step functions
// TODO: composing transducers into new ones

## TODO: asynchronous reduce and asynchronous transducers
