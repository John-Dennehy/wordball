import type { Rng } from './rng'
import { shuffle } from './rng'
import { type Dictionary, isWord, MIN_WORD_LENGTH, scoreWord } from './words'

export const WORD_ROUND_SECONDS = 60

export interface Tile {
	id: number
	letter: string
}

export interface FoundWord {
	word: string
	points: number
}

export type Feedback =
	| { kind: 'success'; message: string }
	| { kind: 'error'; message: string }
	| null

export interface WordState {
	tiles: Tile[]
	/** Tile ids in the order they were picked to spell the current word. */
	selection: number[]
	found: FoundWord[]
	score: number
	timeLeft: number
	over: boolean
	feedback: Feedback
}

export type WordAction =
	| { type: 'pick'; tileId: number }
	| { type: 'type'; letter: string }
	| { type: 'backspace' }
	| { type: 'clear' }
	| { type: 'shuffle'; rng: Rng }
	| { type: 'submit'; dictionary: Dictionary }
	| { type: 'tick'; dt: number }
	| { type: 'finish' }

export function createWordRound(
	letters: readonly string[],
	seconds = WORD_ROUND_SECONDS,
): WordState {
	return {
		tiles: letters.map((letter, id) => ({ id, letter: letter.toUpperCase() })),
		selection: [],
		found: [],
		score: 0,
		timeLeft: seconds,
		over: false,
		feedback: null,
	}
}

export function currentWord(state: WordState): string {
	return state.selection.map((id) => state.tiles.find((t) => t.id === id)?.letter ?? '').join('')
}

export function wordRoundReducer(state: WordState, action: WordAction): WordState {
	if (state.over && action.type !== 'tick') return state

	switch (action.type) {
		case 'pick': {
			if (state.selection.includes(action.tileId)) return state
			if (!state.tiles.some((t) => t.id === action.tileId)) return state
			return { ...state, selection: [...state.selection, action.tileId], feedback: null }
		}
		case 'type': {
			const letter = action.letter.toUpperCase()
			const tile = state.tiles.find((t) => t.letter === letter && !state.selection.includes(t.id))
			if (!tile) return state
			return { ...state, selection: [...state.selection, tile.id], feedback: null }
		}
		case 'backspace':
			return { ...state, selection: state.selection.slice(0, -1), feedback: null }
		case 'clear':
			return { ...state, selection: [], feedback: null }
		case 'shuffle':
			return { ...state, tiles: shuffle(state.tiles, action.rng), selection: [], feedback: null }
		case 'submit':
			return submit(state, action.dictionary)
		case 'tick': {
			if (state.over) return state
			const timeLeft = Math.max(0, state.timeLeft - action.dt)
			return { ...state, timeLeft, over: timeLeft === 0 }
		}
		case 'finish':
			return { ...state, over: true, selection: [] }
	}
}

function submit(state: WordState, dictionary: Dictionary): WordState {
	const word = currentWord(state)
	const fail = (message: string): WordState => ({ ...state, feedback: { kind: 'error', message } })

	if (word.length < MIN_WORD_LENGTH) return fail(`Words need at least ${MIN_WORD_LENGTH} letters`)
	if (state.found.some((f) => f.word === word)) return fail(`${word} is already found`)
	if (!isWord(word, dictionary)) return fail(`${word} isn't in the dictionary`)

	const points = scoreWord(word)
	return {
		...state,
		selection: [],
		found: [{ word, points }, ...state.found],
		score: state.score + points,
		feedback: { kind: 'success', message: `${word} +${points}` },
	}
}
