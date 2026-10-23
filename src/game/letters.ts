import { createRng, shuffle } from './rng'

/** Scrabble letter values. */
export const LETTER_VALUES: Record<string, number> = {
	A: 1,
	B: 3,
	C: 3,
	D: 2,
	E: 1,
	F: 4,
	G: 2,
	H: 4,
	I: 1,
	J: 8,
	K: 5,
	L: 1,
	M: 3,
	N: 1,
	O: 1,
	P: 3,
	Q: 10,
	R: 1,
	S: 1,
	T: 1,
	U: 1,
	V: 4,
	W: 4,
	X: 8,
	Y: 4,
	Z: 10,
}

/** Scrabble tile counts (no blanks): 98 tiles in the bag. */
const TILE_COUNTS: Record<string, number> = {
	A: 9,
	B: 2,
	C: 2,
	D: 4,
	E: 12,
	F: 2,
	G: 3,
	H: 2,
	I: 9,
	J: 1,
	K: 1,
	L: 4,
	M: 2,
	N: 6,
	O: 8,
	P: 2,
	Q: 1,
	R: 6,
	S: 4,
	T: 6,
	U: 4,
	V: 2,
	W: 2,
	X: 1,
	Y: 2,
	Z: 1,
}

export const LETTERS_PER_GAME = 20

export function letterValue(letter: string): number {
	return LETTER_VALUES[letter.toUpperCase()] ?? 0
}

export type LetterTier = 'common' | 'good' | 'rare' | 'epic' | 'legendary'

/** Colour tier used by the renderer, by letter value. */
export function letterTier(letter: string): LetterTier {
	const value = letterValue(letter)
	if (value >= 10) return 'legendary'
	if (value >= 5) return 'epic'
	if (value >= 4) return 'rare'
	if (value >= 2) return 'good'
	return 'common'
}

function fullBag(): string[] {
	return Object.entries(TILE_COUNTS).flatMap(([letter, count]) => Array(count).fill(letter))
}

/** Draws the letters for a game. The same seed always gives the same letters. */
export function drawLetters(seed: string, count = LETTERS_PER_GAME): string[] {
	return shuffle(fullBag(), createRng(seed)).slice(0, count)
}

/** Counts letters, for multiset comparisons. */
export function countLetters(letters: Iterable<string>): Map<string, number> {
	const counts = new Map<string, number>()
	for (const letter of letters) {
		const key = letter.toUpperCase()
		counts.set(key, (counts.get(key) ?? 0) + 1)
	}
	return counts
}

/** True when every letter in `subset` is available in `pool`, respecting duplicates. */
export function isSubMultiset(subset: Iterable<string>, pool: Iterable<string>): boolean {
	const available = countLetters(pool)
	for (const [letter, needed] of countLetters(subset)) {
		if ((available.get(letter) ?? 0) < needed) return false
	}
	return true
}
