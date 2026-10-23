import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { dailySeed, utcDay } from '@/game/modes'
import { validateRun } from '@/game/validateRun'
import { createDictionary, type Dictionary } from '@/game/words'
import { getStore } from './store'

const LEADERBOARD_SIZE = 20

let dictionary: Dictionary | undefined

async function getDictionary(): Promise<Dictionary> {
	if (!dictionary) {
		const { WORDS } = await import('@/game/dictionary.generated')
		dictionary = createDictionary(WORDS)
	}
	return dictionary
}

export const getLeaderboard = createServerFn({ method: 'GET' }).handler(async () => {
	const store = getStore()
	const today = utcDay()
	const [daily, allTime] = await Promise.all([
		store.top(LEADERBOARD_SIZE, today),
		store.top(LEADERBOARD_SIZE),
	])
	return { today, daily, allTime }
})

const submission = z.object({
	name: z
		.string()
		.trim()
		.min(1)
		.max(16)
		.regex(/^[\p{L}\p{N} _.-]+$/u, 'Use letters, numbers, spaces, dots, dashes or underscores'),
	day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	banked: z.array(z.string().regex(/^[A-Za-z]$/)).max(8),
	words: z.array(z.string().regex(/^[A-Za-z]{3,8}$/)).max(200),
	skillScore: z.number().int().nonnegative(),
})

/** A daily run is accepted for today, or yesterday to cover a game that crossed midnight UTC. */
function isOpenDay(day: string): boolean {
	const now = Date.now()
	return day === utcDay(new Date(now)) || day === utcDay(new Date(now - 24 * 60 * 60 * 1000))
}

export const submitScore = createServerFn({ method: 'POST' })
	.validator(submission)
	.handler(async ({ data }) => {
		if (!isOpenDay(data.day)) {
			return { ok: false as const, reason: 'That daily challenge has closed' }
		}

		const check = validateRun(
			{
				seed: dailySeed(data.day),
				banked: data.banked,
				words: data.words,
				skillScore: data.skillScore,
			},
			await getDictionary(),
		)
		if (!check.ok) return { ok: false as const, reason: check.reason }

		const store = getStore()
		await store.insert({
			name: data.name,
			day: data.day,
			skillScore: data.skillScore,
			wordScore: check.wordScore,
			total: check.total,
			words: check.words,
		})
		const rank = await store.rank(data.day, check.total)
		return { ok: true as const, rank, total: check.total, wordScore: check.wordScore }
	})
