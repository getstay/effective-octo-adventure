import { test } from 'zora'
import * as T from '../index.js'

test('reverse', async t => {
	t.equal(T.reverse('foo'), 'oof')
	t.equal(T.reverse('123'), '321')
	t.equal(T.reverse([ 1, 2, 3 ]), [ 3, 2, 1 ])
	t.equal(Object.entries(T.reverse({ foo: 1, bar: 2 })), [ [ 'bar', 2 ], [ 'foo', 1 ] ])
	t.equal(T.compose (T.slice (1) (3), T.reverse) ('that'), 'ah')
	//TODO: more tests, especially where something async comes after reverse
})
