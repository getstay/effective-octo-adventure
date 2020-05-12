import { Transducer, isTransducer } from './Transducer.js'


// TODO: figure out a module for automating this type identifying business
const typeIdentifier = Symbol('Pipe')
const isPipe = x => x && x.typeIdentifier === typeIdentifier
const Pipe = (left, right) => Object.assign(function pipe (value) { return right(left(value)) }, { fns: [ left, right ], typeIdentifier })

const tPipe2 = (a, b) => Transducer(next => a(b(next)))

export const pipe2 = (a, b) => isTransducer(a) && isTransducer(b)
	? tPipe2(a, b)
	: Pipe(
			isPipe(a) ? a.fns[0] : a,
			(isPipe(a) ? [ a.fns[1] ] : [])
				.concat(isPipe(b) ? b.fns : b)
				.reduce(pipe2)
	)

export const pipe = (...fns) => fns.reduce(pipe2)
