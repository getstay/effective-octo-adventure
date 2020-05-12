export const tProtocol = Object.fromEntries(
	[ 'init', 'iterate', 'iterateAsync', 'step', 'reduce', 'reduced', 'result', 'transducer', 'value' ]
		.map(name => [ name, `@@transducer/${name}` ])
)
