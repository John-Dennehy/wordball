import type { Bumper, Vec } from './physics'

/** The skill arena in logical pixels. The renderer scales it to fit the screen. */
export const ARENA = {
	width: 500,
	height: 800,
	ballRadius: 16,
	launch: { x: 250, y: 520 } satisfies Vec,
	/** Balls that come to rest or fall below this line are banked. */
	bankZoneY: 660,
	/** Longest slingshot pull that still adds power. */
	maxPull: 160,
} as const

export interface Hole {
	x: number
	y: number
	radius: number
	multiplier: number
}

export const HOLES: readonly Hole[] = [
	{ x: 180, y: 190, radius: 36, multiplier: 1 },
	{ x: 320, y: 190, radius: 36, multiplier: 1 },
	{ x: 105, y: 105, radius: 30, multiplier: 2 },
	{ x: 395, y: 105, radius: 30, multiplier: 2 },
	{ x: 250, y: 60, radius: 22, multiplier: 5 },
]

/** Points for sinking a letter: its value, times the hole multiplier, times ten. */
export function holePoints(letterValue: number, hole: Hole): number {
	return letterValue * hole.multiplier * 10
}

/** Bumpers guard the straight shot at the jackpot, so the best scores come from bank shots. */
export const BUMPERS: readonly Bumper[] = [
	{ x: 250, y: 330, radius: 22 },
	{ x: 150, y: 400, radius: 14 },
	{ x: 350, y: 400, radius: 14 },
]
