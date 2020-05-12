import { test } from 'zora'
import * as T from '../index.js'

test('getIterate', t => {
	t.equal(typeof T.getIterate([]), 'function')
	t.equal(typeof T.getIterate(new Map()), 'function')
	t.equal(typeof T.getIterate({}), 'function')
	t.equal(typeof T.getIterate(new Set()), 'function')
	t.equal(typeof T.getIterate(''), 'function')
	t.equal(typeof T.getIterate({ [T.tProtocol.iterate]: () => {} }), 'function')
	t.equal(typeof T.getIterate({ [T.tProtocol.iterateAsync]: () => {} }), 'function')
})
