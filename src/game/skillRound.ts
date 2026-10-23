import { ARENA, BUMPERS, HOLES, holePoints } from './arena'
import { letterValue } from './letters'
import { type Body, launchVelocity, REST_SPEED, speed, step, type Vec } from './physics'

export const SKILL_ROUND_SECONDS = 45
export const MAX_BANKED = 8
export const MIN_BANKED = 3
/** A ball moving faster than this rolls straight over a hole instead of dropping in. */
export const CAPTURE_SPEED = 150

export type SkillPhase = 'aiming' | 'flying' | 'over'
export type OverReason = 'time' | 'letters' | 'bank-full'

export interface SkillState {
	/** Every letter drawn for this game, in play order. */
	letters: readonly string[]
	/** Index of the letter being aimed or in flight. */
	current: number
	ball: Body | null
	phase: SkillPhase
	score: number
	/** Indexes into `letters` of the banked letters, in banking order. */
	banked: number[]
	timeLeft: number
	overReason: OverReason | null
}

export type SkillEvent =
	| { type: 'launch'; letter: string }
	| { type: 'bounce'; at: Vec }
	| { type: 'sink'; letter: string; hole: number; points: number; at: Vec }
	| { type: 'bank'; letter: string; at: Vec }
	| { type: 'miss'; letter: string }
	| { type: 'stop'; letter: string; at: Vec }
	| { type: 'over'; reason: OverReason }

export interface SkillUpdate {
	state: SkillState
	events: SkillEvent[]
}

export function createSkillRound(
	letters: readonly string[],
	seconds = SKILL_ROUND_SECONDS,
): SkillState {
	return {
		letters,
		current: 0,
		ball: null,
		phase: letters.length > 0 ? 'aiming' : 'over',
		score: 0,
		banked: [],
		timeLeft: seconds,
		overReason: letters.length > 0 ? null : 'letters',
	}
}

export function currentLetter(state: SkillState): string | undefined {
	return state.letters[state.current]
}

export function bankedLetters(state: SkillState): string[] {
	return state.banked.map((i) => state.letters[i] as string)
}

/** Fires the current letter. `pull` is the drag from the ball to the pointer. */
export function launch(state: SkillState, pull: Vec): SkillUpdate {
	const letter = currentLetter(state)
	if (state.phase !== 'aiming' || !letter) return { state, events: [] }
	const vel = launchVelocity(pull, ARENA.maxPull)
	if (vel.x === 0 && vel.y === 0) return { state, events: [] }
	return {
		state: {
			...state,
			phase: 'flying',
			ball: { pos: { ...ARENA.launch }, vel, radius: ARENA.ballRadius },
		},
		events: [{ type: 'launch', letter }],
	}
}

/** Banks the current letter without shooting it (keyboard shortcut and accessibility path). */
export function quickBank(state: SkillState): SkillUpdate {
	if (state.phase !== 'aiming' || !currentLetter(state)) return { state, events: [] }
	return bank(state, { ...ARENA.launch })
}

/** Advances the round by `dt` seconds: the clock and, if a ball is in flight, its physics. */
export function tick(state: SkillState, dt: number): SkillUpdate {
	if (state.phase === 'over') return { state, events: [] }

	const timeLeft = Math.max(0, state.timeLeft - dt)
	if (timeLeft === 0) {
		return end({ ...state, timeLeft, ball: null }, 'time')
	}

	if (state.phase !== 'flying' || !state.ball) return { state: { ...state, timeLeft }, events: [] }

	const moved = step(state.ball, dt, ARENA, BUMPERS)
	const next: SkillState = { ...state, timeLeft, ball: moved.body }
	const events: SkillEvent[] = moved.bounced ? [{ type: 'bounce', at: moved.body.pos }] : []
	const resolved = resolveBall(next)
	return { state: resolved.state, events: [...events, ...resolved.events] }
}

function resolveBall(state: SkillState): SkillUpdate {
	const ball = state.ball
	const letter = currentLetter(state)
	if (!ball || !letter) return { state, events: [] }
	const at = { ...ball.pos }
	const ballSpeed = speed(ball)

	if (ball.pos.y < -ball.radius) {
		return advance(state, [{ type: 'miss', letter }])
	}

	if (ballSpeed < CAPTURE_SPEED) {
		const holeIndex = HOLES.findIndex(
			(hole) => Math.hypot(ball.pos.x - hole.x, ball.pos.y - hole.y) < hole.radius,
		)
		const hole = HOLES[holeIndex]
		if (hole) {
			const points = holePoints(letterValue(letter), hole)
			return advance({ ...state, score: state.score + points }, [
				{ type: 'sink', letter, hole: holeIndex, points, at: { x: hole.x, y: hole.y } },
			])
		}
	}

	if (ball.pos.y >= ARENA.bankZoneY + ball.radius) {
		return bank(state, at)
	}

	if (ballSpeed < REST_SPEED) {
		return advance(state, [{ type: 'stop', letter, at }])
	}

	return { state, events: [] }
}

function bank(state: SkillState, at: Vec): SkillUpdate {
	const letter = currentLetter(state) as string
	const banked = [...state.banked, state.current]
	const events: SkillEvent[] = [{ type: 'bank', letter, at }]
	const next = { ...state, banked }
	if (banked.length >= MAX_BANKED) {
		const ended = end({ ...next, ball: null, current: state.current + 1 }, 'bank-full')
		return { state: ended.state, events: [...events, ...ended.events] }
	}
	return advance(next, events)
}

function advance(state: SkillState, events: SkillEvent[]): SkillUpdate {
	const current = state.current + 1
	const next: SkillState = { ...state, current, ball: null, phase: 'aiming' }
	if (current >= state.letters.length) {
		const ended = end(next, 'letters')
		return { state: ended.state, events: [...events, ...ended.events] }
	}
	return { state: next, events }
}

function end(state: SkillState, reason: OverReason): SkillUpdate {
	return {
		state: { ...state, phase: 'over', ball: null, overReason: reason },
		events: [{ type: 'over', reason }],
	}
}

/**
 * The letters carried into the word round. Players who banked fewer than three
 * get topped up from the letters they never played, then from any unbanked ones,
 * so there is always something to spell with.
 */
export function lettersForWordRound(state: SkillState): string[] {
	const picked = [...state.banked]
	const unplayed = state.letters.map((_, i) => i).filter((i) => i >= state.current)
	const unbanked = state.letters.map((_, i) => i).filter((i) => !state.banked.includes(i))
	for (const i of [...unplayed, ...unbanked]) {
		if (picked.length >= MIN_BANKED) break
		if (!picked.includes(i)) picked.push(i)
	}
	return picked.map((i) => state.letters[i] as string)
}
