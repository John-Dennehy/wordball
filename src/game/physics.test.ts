import { describe, expect, it } from 'vitest'
import { DAMPING_PER_SECOND, LAUNCH_POWER, launchVelocity, RESTITUTION, step } from './physics'

const walls = { width: 500, height: 800 }

describe('physics', () => {
	it('launches opposite to the pull, capped at max pull', () => {
		expect(launchVelocity({ x: 0, y: 100 }, 160)).toEqual({ x: -0, y: -100 * LAUNCH_POWER })
		const capped = launchVelocity({ x: 0, y: 1000 }, 160)
		expect(capped.y).toBeCloseTo(-160 * LAUNCH_POWER)
		expect(launchVelocity({ x: 0, y: 0 }, 160)).toEqual({ x: 0, y: 0 })
	})

	it('slows down over time', () => {
		const { body } = step({ pos: { x: 250, y: 400 }, vel: { x: 0, y: -100 }, radius: 16 }, 1, walls)
		expect(body.vel.y).toBeCloseTo(-100 * DAMPING_PER_SECOND)
	})

	it('bounces off side and bottom walls but not the top', () => {
		const left = step({ pos: { x: 17, y: 400 }, vel: { x: -500, y: 0 }, radius: 16 }, 0.1, walls)
		expect(left.bounced).toBe(true)
		expect(left.body.pos.x).toBe(16)
		expect(left.body.vel.x).toBeGreaterThan(0)
		expect(left.body.vel.x).toBeLessThanOrEqual(500 * RESTITUTION)

		const bottom = step({ pos: { x: 250, y: 780 }, vel: { x: 0, y: 500 }, radius: 16 }, 0.1, walls)
		expect(bottom.bounced).toBe(true)
		expect(bottom.body.vel.y).toBeLessThan(0)

		const top = step({ pos: { x: 250, y: 5 }, vel: { x: 0, y: -500 }, radius: 16 }, 0.1, walls)
		expect(top.bounced).toBe(false)
		expect(top.body.pos.y).toBeLessThan(0)
	})

	it('bounces off a bumper and is pushed outside it', () => {
		const bumper = { x: 250, y: 300, radius: 20 }
		const { body, bounced } = step(
			{ pos: { x: 250, y: 337 }, vel: { x: 0, y: -400 }, radius: 16 },
			1 / 120,
			walls,
			[bumper],
		)
		expect(bounced).toBe(true)
		expect(body.vel.y).toBeGreaterThan(0)
		expect(Math.hypot(body.pos.x - bumper.x, body.pos.y - bumper.y)).toBeCloseTo(36)
	})
})
