import { ARENA, BUMPERS, HOLES } from '@/game/arena'
import { letterValue } from '@/game/letters'
import type { Vec } from '@/game/physics'
import { bankedLetters, currentLetter, type SkillState } from '@/game/skillRound'
import { letterColor } from './colors'
import type { Effects } from './effects'

const HOLE_STYLES: Record<number, { fill: string; ring: string }> = {
	1: { fill: '#14213d', ring: '#45d4ff' },
	2: { fill: '#1d1f5c', ring: '#a78bfa' },
	5: { fill: '#4a2a00', ring: '#ffc94d' },
}

export interface Aim {
	/** Drag from the ball to the pointer; the ball flies the opposite way. */
	pull: Vec
	active: boolean
}

export function drawArena(
	ctx: CanvasRenderingContext2D,
	state: SkillState,
	aim: Aim,
	effects: Effects,
) {
	const { width, height } = ARENA
	ctx.clearRect(0, 0, width, height)

	ctx.fillStyle = '#0d1328'
	ctx.fillRect(0, 0, width, height)

	// Bank zone
	ctx.fillStyle = 'rgba(61, 252, 166, 0.07)'
	ctx.fillRect(0, ARENA.bankZoneY, width, height - ARENA.bankZoneY)
	ctx.strokeStyle = 'rgba(61, 252, 166, 0.6)'
	ctx.setLineDash([8, 6])
	ctx.lineWidth = 2
	line(ctx, 0, ARENA.bankZoneY, width, ARENA.bankZoneY)
	ctx.setLineDash([])
	label(ctx, 'BANK ZONE', width / 2, ARENA.bankZoneY + 22, 'rgba(61, 252, 166, 0.8)')

	// Banked letters sit in the tray
	bankedLetters(state).forEach((letter, i) => {
		const x = 52 + i * 57
		drawBall(ctx, { x, y: height - 50 }, letter, 18)
	})

	// Launch line
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
	ctx.setLineDash([4, 8])
	line(ctx, 0, ARENA.launch.y, width, ARENA.launch.y)
	ctx.setLineDash([])

	for (const hole of HOLES) {
		const style = HOLE_STYLES[hole.multiplier] ?? HOLE_STYLES[1]
		if (!style) continue
		ctx.save()
		ctx.shadowColor = style.ring
		ctx.shadowBlur = hole.multiplier >= 5 ? 24 : 12
		circle(ctx, hole.x, hole.y, hole.radius, style.fill)
		ctx.restore()
		ctx.strokeStyle = style.ring
		ctx.lineWidth = 3
		ctx.beginPath()
		ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2)
		ctx.stroke()
		label(
			ctx,
			`×${hole.multiplier}`,
			hole.x,
			hole.y + 5,
			'#ffffff',
			'bold 14px "Space Grotesk", sans-serif',
		)
	}

	for (const bumper of BUMPERS) {
		ctx.save()
		ctx.shadowColor = '#ff5fd2'
		ctx.shadowBlur = 14
		circle(ctx, bumper.x, bumper.y, bumper.radius, '#3a1238')
		ctx.restore()
		ctx.strokeStyle = '#ff5fd2'
		ctx.lineWidth = 3
		ctx.beginPath()
		ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2)
		ctx.stroke()
	}

	const letter = currentLetter(state)
	if (state.phase === 'aiming' && letter) {
		if (aim.active) drawAimGuide(ctx, aim.pull)
		drawBall(ctx, ARENA.launch, letter, ARENA.ballRadius)
	}
	if (state.phase === 'flying' && state.ball && letter) {
		drawBall(ctx, state.ball.pos, letter, state.ball.radius)
	}

	for (const p of effects.particles) {
		ctx.globalAlpha = Math.max(0, p.life)
		circle(ctx, p.x, p.y, p.size, p.color)
	}
	ctx.globalAlpha = 1
	for (const t of effects.texts) {
		ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 1.5))
		label(ctx, t.text, t.x, t.y, t.color, 'bold 16px "Space Grotesk", sans-serif')
	}
	ctx.globalAlpha = 1
}

function drawAimGuide(ctx: CanvasRenderingContext2D, pull: Vec) {
	const length = Math.hypot(pull.x, pull.y)
	if (length < 4) return
	const power = Math.min(length, ARENA.maxPull) / ARENA.maxPull
	const dir = { x: -pull.x / length, y: -pull.y / length }
	const { x, y } = ARENA.launch

	// Band back to the pointer
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
	ctx.lineWidth = 2
	const pulled = Math.min(length, ARENA.maxPull)
	line(ctx, x, y, x - dir.x * pulled, y - dir.y * pulled)

	// Arrow in the shot direction, coloured by power
	const reach = 40 + power * 90
	ctx.strokeStyle = power > 0.85 ? '#ff6b6b' : power > 0.5 ? '#ffc94d' : '#3dfca6'
	ctx.lineWidth = 4
	ctx.setLineDash([10, 8])
	line(ctx, x, y, x + dir.x * reach, y + dir.y * reach)
	ctx.setLineDash([])
}

function drawBall(ctx: CanvasRenderingContext2D, at: Vec, letter: string, radius: number) {
	const color = letterColor(letter)
	ctx.save()
	ctx.shadowColor = color
	ctx.shadowBlur = 16
	circle(ctx, at.x, at.y, radius, color)
	ctx.restore()
	label(
		ctx,
		letter,
		at.x,
		at.y + radius * 0.35,
		'#0b0f1f',
		`bold ${Math.round(radius * 1.1)}px "Space Grotesk", sans-serif`,
	)
	label(
		ctx,
		String(letterValue(letter)),
		at.x + radius * 0.55,
		at.y + radius * 0.75,
		'#0b0f1f',
		`bold ${Math.round(radius * 0.5)}px "Space Grotesk", sans-serif`,
	)
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
	ctx.fillStyle = fill
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2)
	ctx.fill()
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
	ctx.beginPath()
	ctx.moveTo(x1, y1)
	ctx.lineTo(x2, y2)
	ctx.stroke()
}

function label(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	color: string,
	font = 'bold 11px "Space Grotesk", sans-serif',
) {
	ctx.fillStyle = color
	ctx.font = font
	ctx.textAlign = 'center'
	ctx.fillText(text, x, y)
}
