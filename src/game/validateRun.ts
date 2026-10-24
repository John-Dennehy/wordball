import { HOLES } from './arena'
import { drawLetters, isSubMultiset, letterValue } from './letters'
import { MAX_BANKED } from './skillRound'
import { canSpell, type Dictionary, isWord, scoreWord } from './words'

export interface RunSubmission {
	seed: string
	banked: string[]
	words: string[]
	skillScore: number
}

export type RunCheck =
	| { ok: true; wordScore: number; total: number; words: string[] }
	| { ok: false; reason: string }

/**
 * Re-checks a finished game on the server, so the leaderboard doesn't take scores on trust.
 * The seed fixes which letters were drawn, so the banked letters must come from that draw,
 * every word must be real and spellable from them, the word score is recomputed here, and the
 * skill score can't beat sinking every drawn letter in the best hole.
 */
export function validateRun(run: RunSubmission, dictionary: Dictionary): RunCheck {
	const drawn = drawLetters(run.seed)
	const banked = run.banked.map((l) => l.toUpperCase())

	if (banked.length > MAX_BANKED) return { ok: false, reason: 'Too many banked letters' }
	if (!isSubMultiset(banked, drawn)) return { ok: false, reason: 'Banked letters were not drawn' }

	const words = [...new Set(run.words.map((w) => w.toUpperCase()))]
	for (const word of words) {
		if (!isWord(word, dictionary)) return { ok: false, reason: `${word} is not a word` }
		if (!canSpell(word, banked)) return { ok: false, reason: `${word} can't be spelled` }
	}

	const bestMultiplier = Math.max(...HOLES.map((h) => h.multiplier))
	const maxSkill = drawn.reduce((sum, l) => sum + letterValue(l) * bestMultiplier * 10, 0)
	if (!Number.isInteger(run.skillScore) || run.skillScore < 0 || run.skillScore > maxSkill) {
		return { ok: false, reason: 'Skill score is out of range' }
	}

	const wordScore = words.reduce((sum, w) => sum + scoreWord(w), 0)
	return { ok: true, wordScore, total: run.skillScore + wordScore, words }
}
