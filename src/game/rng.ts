/** A seeded pseudo-random number generator returning floats in [0, 1). */
export type Rng = () => number

/** FNV-1a: turns any string seed into a 32-bit integer. */
export function hashSeed(seed: string): number {
	let h = 2166136261
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}

/** mulberry32: small, fast and good enough for shuffling letters. */
export function createRng(seed: string): Rng {
	let a = hashSeed(seed)
	return () => {
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** Fisher–Yates shuffle that returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
	const out = [...items]
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1))
		const tmp = out[i] as T
		out[i] = out[j] as T
		out[j] = tmp
	}
	return out
}
