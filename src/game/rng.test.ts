import { describe, expect, it } from 'vitest'
import { createRng, hashSeed, shuffle } from './rng'

describe('rng', () => {
	it('is deterministic for a seed', () => {
		const a = createRng('daily:2026-10-23')
		const b = createRng('daily:2026-10-23')
		expect([a(), a(), a()]).toEqual([b(), b(), b()])
	})

	it('differs between seeds and stays in [0, 1)', () => {
		const a = createRng('one')
		const b = createRng('two')
		const values = Array.from({ length: 1000 }, a)
		expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
		expect(a()).not.toBe(b())
		expect(hashSeed('one')).not.toBe(hashSeed('two'))
	})

	it('shuffles without losing or mutating items', () => {
		const items = [1, 2, 3, 4, 5, 6]
		const shuffled = shuffle(items, createRng('x'))
		expect(items).toEqual([1, 2, 3, 4, 5, 6])
		expect([...shuffled].sort()).toEqual(items)
	})
})
