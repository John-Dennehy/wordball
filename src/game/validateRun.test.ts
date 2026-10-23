import { describe, expect, it } from 'vitest'
import { drawLetters } from './letters'
import { validateRun } from './validateRun'
import { createDictionary } from './words'

const seed = 'daily:2026-10-23'
const drawn = drawLetters(seed)
const banked = drawn.slice(0, 6)

describe('validateRun', () => {
	it('recomputes the word score for an honest run', () => {
		const word = banked.slice(0, 3).join('')
		const dictionary = createDictionary(word.toLowerCase())
		const result = validateRun({ seed, banked, words: [word, word], skillScore: 50 }, dictionary)
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.words).toEqual([word])
			expect(result.total).toBe(50 + result.wordScore)
		}
	})

	it('rejects letters that were never drawn', () => {
		const notDrawn = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !drawn.includes(l))
		if (!notDrawn) return
		const result = validateRun(
			{ seed, banked: [notDrawn], words: [], skillScore: 0 },
			createDictionary(''),
		)
		expect(result).toEqual({ ok: false, reason: 'Banked letters were not drawn' })
	})

	it('rejects made-up words and impossible skill scores', () => {
		const dictionary = createDictionary('')
		expect(validateRun({ seed, banked, words: ['XYZ'], skillScore: 0 }, dictionary).ok).toBe(false)
		expect(validateRun({ seed, banked, words: [], skillScore: 1e9 }, dictionary).ok).toBe(false)
		expect(validateRun({ seed, banked, words: [], skillScore: -1 }, dictionary).ok).toBe(false)
		expect(validateRun({ seed, banked, words: [], skillScore: 1.5 }, dictionary).ok).toBe(false)
	})
})
