import { Transducer } from '../core/Transducer.js'
import { tProtocol } from '../core/tProtocol.js'
import { reduce } from '../core/reduce.js'
import { isReduced, preservingReduced } from '../core/Reduced.js'
import { after, isPromise, last } from '../util.js'

const JobManager = ({ shiftN }) => {
	const jobs = []
	const lastN = shiftN - 1
	const shiftWhenFull = () => {
		if (jobs.length && last(jobs).n === lastN) {
			jobs.shift().remove()
		}
	}
	const add = (jobFn, { stop }) => {
		shiftWhenFull()
		const job = { n: jobs.length ? last(jobs).n + 1 : 0 } // 1 higher than the last job
		jobs.push(job)
		job.stop = () => stop(job.result)
		job.remove = () => {
			job.stop()
			const i = jobs.indexOf(job)
			jobs.splice(i, 1)
			jobs.slice(0, i).forEach(job => ++job.n) // incrememt n of all the jobs before this one
		}
		job.result = jobFn(job)
		manager.idle = after(manager.idle, () => job.result) // chain existing promise to new job promise
		return job
	}
	const manager = {
		add,
		idle: true,
		size: () => jobs.length,
		stop: () => jobs.forEach(job => job.remove())
	}
	return manager
}

export const switchLatestN = n => Transducer(next => {
	let source_complete = false
	let reduced = false
	let reductionsComplete = null
	const jobs = JobManager({ shiftN: n })

	const makeMemberReducer = (job, outerAccumulator) => preservingReduced((accumulator, value, { final }) => {
		if (reduced) {
			return reduced
		}
		final && job.remove()
		const result = next[tProtocol.step](outerAccumulator, value, { final: source_complete && jobs.size() === 0 })
		reduced = isReduced(result) ? result : false
		reduced && jobs.cleanup()
		return after(accumulator, () => result)
	})

	const step = (accumulator, value, { final }) => {
		source_complete = final
		const job = jobs.add(
			job => reduce (makeMemberReducer(job, accumulator)) (accumulator) (value),
			{ stop: result => result && result.stop && result.stop() }
		)
		after(job.result, job.remove)
		return accumulator
	}

	const result = accumulator => {
		source_complete = true
		return after(jobs.idle, () => next[tProtocol.result](accumulator))
	}

	return {
		[tProtocol.step]: step,
		[tProtocol.result]: result
	}
})
