import { describe, expect, it } from 'vitest'
import { ARENA, HOLES } from './arena'
import {
	bankedLetters,
	createSkillRound,
	launch,
	lettersForWordRound,
	MAX_BANKED,
	quickBank,
	type SkillEvent,
	type SkillState,
	tick,
} from './skillRound'

const DT = 1 / 120

function runUntilAiming(state: SkillState): { state: SkillState; events: SkillEvent[] } {
	const events: SkillEvent[] = []
	let s = state
	for (let i = 0; i < 120 * 30 && s.phase === 'flying'; i++) {
		const update = tick(s, DT)
		s = update.state
		events.push(...update.events)
	}
	return { state: s, events }
}

describe('skill round', () => {
	it('quick-banks the current letter and moves on', () => {
		const { state, events } = quickBank(createSkillRound(['C', 'A', 'T']))
		expect(bankedLetters(state)).toEqual(['C'])
		expect(state.current).toBe(1)
		expect(events[0]).toMatchObject({ type: 'bank', letter: 'C' })
	})

	it('banks a ball shot down into the bank zone', () => {
		const launched = launch(createSkillRound(['Q', 'A', 'T']), { x: 0, y: -60 })
		expect(launched.state.phase).toBe('flying')
		const { state, events } = runUntilAiming(launched.state)
		expect(events.some((e) => e.type === 'bank')).toBe(true)
		expect(bankedLetters(state)).toEqual(['Q'])
	})

	it('misses when a hard shot flies over the top', () => {
		const launched = launch(createSkillRound(['Q', 'A']), { x: 66, y: 110 })
		const { state, events } = runUntilAiming(launched.state)
		expect(events.some((e) => e.type === 'miss')).toBe(true)
		expect(state.score).toBe(0)
		expect(state.current).toBe(1)
	})

	it('sinks a slow ball in a hole for letter value × multiplier × 10', () => {
		const jackpot = HOLES.find((h) => h.multiplier === 5)
		if (!jackpot) throw new Error('no 5x hole')
		const state: SkillState = {
			...createSkillRound(['Q', 'A']),
			phase: 'flying',
			ball: { pos: { x: jackpot.x, y: jackpot.y + 1 }, vel: { x: 0, y: -40 }, radius: 16 },
		}
		const { state: after, events } = tick(state, DT)
		expect(events).toContainEqual(expect.objectContaining({ type: 'sink', points: 500 }))
		expect(after.score).toBe(500)
	})

	it('lets a fast ball roll over a hole', () => {
		const hole = HOLES[0]
		if (!hole) throw new Error('no hole')
		const state: SkillState = {
			...createSkillRound(['A', 'B']),
			phase: 'flying',
			ball: { pos: { x: hole.x, y: hole.y + 1 }, vel: { x: 0, y: -900 }, radius: 16 },
		}
		expect(tick(state, DT).events.some((e) => e.type === 'sink')).toBe(false)
	})

	it('ends when the bank is full', () => {
		let state = createSkillRound(Array(12).fill('E'))
		for (let i = 0; i < MAX_BANKED; i++) state = quickBank(state).state
		expect(state.phase).toBe('over')
		expect(state.overReason).toBe('bank-full')
	})

	it('ends when the letters run out or the clock does', () => {
		let state = createSkillRound(['A'])
		state = quickBank(state).state
		expect(state.overReason).toBe('letters')

		const timed = tick(createSkillRound(['A', 'B'], 1), 1.5)
		expect(timed.state.overReason).toBe('time')
		expect(timed.events).toContainEqual({ type: 'over', reason: 'time' })
	})

	it('ignores launches with no pull or outside aiming', () => {
		const fresh = createSkillRound(['A'])
		expect(launch(fresh, { x: 0, y: 0 }).state).toBe(fresh)
		const flying = launch(fresh, { x: 0, y: 50 }).state
		expect(launch(flying, { x: 0, y: 50 }).state).toBe(flying)
	})

	it('tops the word round up to three letters', () => {
		let state = createSkillRound(['C', 'A', 'T', 'S'])
		state = quickBank(state).state
		expect(lettersForWordRound(state)).toEqual(['C', 'A', 'T'])
		expect(ARENA.bankZoneY).toBeGreaterThan(ARENA.launch.y)
	})

	it('deflects a straight shot off the centre bumper', () => {
		const launched = launch(createSkillRound(['Q', 'A']), { x: 0, y: 100 })
		const { events } = runUntilAiming(launched.state)
		expect(events.some((e) => e.type === 'bounce')).toBe(true)
		expect(events.some((e) => e.type === 'sink' && e.points === 500)).toBe(false)
	})
})
