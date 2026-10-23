import { describe, expect, it } from 'vitest'
import { drawLetters, isSubMultiset, LETTERS_PER_GAME, letterTier, letterValue } from './letters'

describe('letters', () => {
	it('uses Scrabble values', () => {
		expect(letterValue('a')).toBe(1)
		expect(letterValue('Q')).toBe(10)
		expect(letterValue('?')).toBe(0)
		expect(letterTier('Z')).toBe('legendary')
		expect(letterTier('E')).toBe('common')
	})

	it('draws the same letters for the same seed', () => {
		expect(drawLetters('daily:2026-10-23')).toEqual(drawLetters('daily:2026-10-23'))
		expect(drawLetters('daily:2026-10-23')).not.toEqual(drawLetters('daily:2026-10-24'))
		expect(drawLetters('seed')).toHaveLength(LETTERS_PER_GAME)
	})

	it('never draws more of a letter than the bag holds', () => {
		for (let i = 0; i < 50; i++) {
			const letters = drawLetters(`seed-${i}`, 98)
			expect(letters.filter((l) => l === 'Z')).toHaveLength(1)
			expect(letters.filter((l) => l === 'E')).toHaveLength(12)
		}
	})

	it('compares letter multisets', () => {
		expect(isSubMultiset(['A', 'A'], ['A', 'B', 'A'])).toBe(true)
		expect(isSubMultiset(['A', 'A'], ['A', 'B'])).toBe(false)
		expect(isSubMultiset(['a'], ['A'])).toBe(true)
	})
})
