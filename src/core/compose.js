import { pipe } from './pipe.js'

export const compose = (...fns) => pipe(...fns.slice(0).reverse())
