export type GameMode = 'daily' | 'practice'

/** UTC date as YYYY-MM-DD, so everyone in the world shares the same daily letters. */
export function utcDay(date: Date = new Date()): string {
	return date.toISOString().slice(0, 10)
}

export function dailySeed(day: string = utcDay()): string {
	return `daily:${day}`
}

export function practiceSeed(): string {
	return `practice:${crypto.randomUUID()}`
}

export function modeOfSeed(seed: string): GameMode | null {
	if (seed.startsWith('daily:')) return 'daily'
	if (seed.startsWith('practice:')) return 'practice'
	return null
}
