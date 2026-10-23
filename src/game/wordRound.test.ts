import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import { createWordRound, currentWord, wordRoundReducer as reduce } from './wordRound'
import { createDictionary } from './words'

const dictionary = createDictionary('cat\nact')

describe('word round', () => {
	it('spells by typing and scores a valid word', () => {
		let state = createWordRound(['C', 'A', 'T', 'A'])
		for (const letter of 'cat') state = reduce(state, { type: 'type', letter })
		expect(currentWord(state)).toBe('CAT')
		state = reduce(state, { type: 'submit', dictionary })
		expect(state.found).toEqual([{ word: 'CAT', points: 5 }])
		expect(state.score).toBe(5)
		expect(state.selection).toEqual([])
	})

	it('rejects short, unknown and repeated words', () => {
		let state = createWordRound(['C', 'A', 'T'])
		state = reduce(state, { type: 'type', letter: 'C' })
		expect(reduce(state, { type: 'submit', dictionary }).feedback?.kind).toBe('error')

		state = reduce(createWordRound(['T', 'A', 'C']), { type: 'pick', tileId: 0 })
		state = reduce(state, { type: 'pick', tileId: 1 })
		state = reduce(state, { type: 'pick', tileId: 2 })
		expect(reduce(state, { type: 'submit', dictionary }).feedback).toMatchObject({ kind: 'error' })

		state = createWordRound(['C', 'A', 'T'])
		for (let round = 0; round < 2; round++) {
			for (const letter of 'CAT') state = reduce(state, { type: 'type', letter })
			state = reduce(state, { type: 'submit', dictionary })
		}
		expect(state.found).toHaveLength(1)
		expect(state.feedback?.message).toMatch(/already/)
	})

	it("can't use a tile twice", () => {
		let state = createWordRound(['A'])
		state = reduce(state, { type: 'type', letter: 'A' })
		state = reduce(state, { type: 'type', letter: 'A' })
		state = reduce(state, { type: 'pick', tileId: 0 })
		expect(state.selection).toEqual([0])
	})

	it('edits, shuffles and runs out of time', () => {
		let state = createWordRound(['C', 'A', 'T'], 2)
		state = reduce(state, { type: 'type', letter: 'C' })
		state = reduce(state, { type: 'backspace' })
		expect(state.selection).toEqual([])
		state = reduce(state, { type: 'shuffle', rng: createRng('s') })
		expect(state.tiles.map((t) => t.letter).sort()).toEqual(['A', 'C', 'T'])
		state = reduce(state, { type: 'tick', dt: 3 })
		expect(state.over).toBe(true)
		expect(reduce(state, { type: 'type', letter: 'C' })).toBe(state)
	})
})
