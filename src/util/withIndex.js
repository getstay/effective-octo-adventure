export const withIndex = f => {
	let index = 0
	return (...args) => f(...args, index++)
}
