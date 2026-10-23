import { type LetterTier, letterTier } from '@/game/letters'

const TIER_COLORS: Record<LetterTier, string> = {
	common: '#3dfca6',
	good: '#45d4ff',
	rare: '#ffc94d',
	epic: '#ff5fd2',
	legendary: '#ff8a3d',
}

export function letterColor(letter: string): string {
	return TIER_COLORS[letterTier(letter)]
}
