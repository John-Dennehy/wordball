import { describe, expect, it } from 'vitest'
import { canSpell, createDictionary, findWords, isWord, scoreWord } from './words'

const dictionary = createDictionary('cat\nact\ntac\nat\ncats\nscat\nzzz')

describe('words', () => {
	it('scores by letter value and length', () => {
		expect(scoreWord('CAT')).toBe(5)
		expect(scoreWord('CATS')).toBe(9)
	})

	it('checks the dictionary and length rules', () => {
		expect(isWord('CAT', dictionary)).toBe(true)
		expect(isWord('at', dictionary)).toBe(false)
		expect(isWord('dog', dictionary)).toBe(false)
	})

	it('spells with each letter at most once', () => {
		expect(canSpell('CAT', ['T', 'A', 'C'])).toBe(true)
		expect(canSpell('ZZZ', ['Z'])).toBe(false)
	})

	it('finds every spellable word, best first', () => {
		expect(findWords(['C', 'A', 'T', 'S'], dictionary)).toEqual([
			'CATS',
			'SCAT',
			'ACT',
			'CAT',
			'TAC',
		])
	})
})
