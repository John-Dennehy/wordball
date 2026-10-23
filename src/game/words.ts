import { countLetters, letterValue } from './letters'

export const MIN_WORD_LENGTH = 3
export const MAX_WORD_LENGTH = 8

const LENGTH_MULTIPLIERS: Record<number, number> = {
	3: 1,
	4: 1.5,
	5: 2,
	6: 2.5,
	7: 3,
	8: 4,
}

export function lengthMultiplier(length: number): number {
	return LENGTH_MULTIPLIERS[Math.min(length, MAX_WORD_LENGTH)] ?? 0
}

/** A word scores the sum of its letter values times a length multiplier. */
export function scoreWord(word: string): number {
	const base = [...word].reduce((sum, letter) => sum + letterValue(letter), 0)
	return Math.round(base * lengthMultiplier(word.length))
}

export type Dictionary = ReadonlySet<string>

export function createDictionary(text: string): Dictionary {
	return new Set(text.split('\n').filter(Boolean))
}

/** Loads the dictionary as a separate chunk, so it only downloads when the word round starts. */
export async function loadDictionary(): Promise<Dictionary> {
	const { WORDS } = await import('./dictionary.generated')
	return createDictionary(WORDS)
}

export function isWord(word: string, dictionary: Dictionary): boolean {
	const clean = word.toLowerCase()
	return clean.length >= MIN_WORD_LENGTH && clean.length <= MAX_WORD_LENGTH && dictionary.has(clean)
}

/** True when `word` can be spelled from `letters`, using each letter at most once. */
export function canSpell(word: string, letters: readonly string[]): boolean {
	const available = countLetters(letters)
	for (const [letter, needed] of countLetters(word)) {
		if ((available.get(letter) ?? 0) < needed) return false
	}
	return true
}

/** Every dictionary word that can be spelled from `letters`, best scoring first. */
export function findWords(letters: readonly string[], dictionary: Dictionary): string[] {
	const found: string[] = []
	for (const word of dictionary) {
		if (
			word.length >= MIN_WORD_LENGTH &&
			word.length <= letters.length &&
			canSpell(word, letters)
		) {
			found.push(word.toUpperCase())
		}
	}
	return found.sort((a, b) => scoreWord(b) - scoreWord(a) || a.localeCompare(b))
}
