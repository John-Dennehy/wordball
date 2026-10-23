export interface Vec {
	x: number
	y: number
}

export interface Body {
	pos: Vec
	vel: Vec
	radius: number
}

export interface Walls {
	width: number
	height: number
}

/** A fixed round obstacle the ball bounces off. */
export interface Bumper {
	x: number
	y: number
	radius: number
}

/** Bumpers are springier than walls. */
export const BUMPER_RESTITUTION = 0.85

/** Fraction of speed kept per second while rolling. */
export const DAMPING_PER_SECOND = 0.2
/** Fraction of speed kept after bouncing off a wall. */
export const RESTITUTION = 0.6
/** Pixels per second of launch speed for each pixel of slingshot pull. */
export const LAUNCH_POWER = 8
/** Below this speed (px/s) a ball counts as stopped. */
export const REST_SPEED = 30

export function speed(body: Body): number {
	return Math.hypot(body.vel.x, body.vel.y)
}

/**
 * Turns a slingshot pull (from the ball to the pointer) into a launch velocity:
 * the ball flies the opposite way, with power capped at `maxPull`.
 */
export function launchVelocity(pull: Vec, maxPull: number): Vec {
	const length = Math.hypot(pull.x, pull.y)
	if (length === 0) return { x: 0, y: 0 }
	const clamped = Math.min(length, maxPull)
	const scale = (-clamped * LAUNCH_POWER) / length
	return { x: pull.x * scale, y: pull.y * scale }
}

/**
 * Advances a body by `dt` seconds. Side and bottom walls and any bumpers bounce; the top
 * is open so an overpowered shot can fly out. Returns a new body and whether it hit a wall.
 */
export function step(
	body: Body,
	dt: number,
	walls: Walls,
	bumpers: readonly Bumper[] = [],
): { body: Body; bounced: boolean } {
	const damping = DAMPING_PER_SECOND ** dt
	let vx = body.vel.x * damping
	let vy = body.vel.y * damping
	let x = body.pos.x + vx * dt
	let y = body.pos.y + vy * dt
	let bounced = false
	const r = body.radius

	if (x < r) {
		x = r
		vx = Math.abs(vx) * RESTITUTION
		bounced = true
	} else if (x > walls.width - r) {
		x = walls.width - r
		vx = -Math.abs(vx) * RESTITUTION
		bounced = true
	}
	if (y > walls.height - r) {
		y = walls.height - r
		vy = -Math.abs(vy) * RESTITUTION
		bounced = true
	}

	for (const bumper of bumpers) {
		const dx = x - bumper.x
		const dy = y - bumper.y
		const distance = Math.hypot(dx, dy)
		const minDistance = bumper.radius + r
		if (distance >= minDistance || distance === 0) continue
		const nx = dx / distance
		const ny = dy / distance
		const along = vx * nx + vy * ny
		if (along < 0) {
			// Reflect the velocity about the contact normal, losing some energy
			vx -= (1 + BUMPER_RESTITUTION) * along * nx
			vy -= (1 + BUMPER_RESTITUTION) * along * ny
		}
		x = bumper.x + nx * minDistance
		y = bumper.y + ny * minDistance
		bounced = true
	}

	return { body: { pos: { x, y }, vel: { x: vx, y: vy }, radius: r }, bounced }
}
