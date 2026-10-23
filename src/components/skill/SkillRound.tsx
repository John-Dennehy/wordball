import { useCallback, useEffect, useRef, useState } from 'react'
import { ARENA, HOLES } from '@/game/arena'
import { letterValue } from '@/game/letters'
import type { Vec } from '@/game/physics'
import {
	bankedLetters,
	createSkillRound,
	currentLetter,
	launch,
	MAX_BANKED,
	quickBank,
	type SkillEvent,
	type SkillState,
	type SkillUpdate,
	tick,
} from '@/game/skillRound'
import { sound } from '@/lib/sound'
import { letterColor } from './colors'
import { Effects } from './effects'
import { type Aim, drawArena } from './render'

const STEP = 1 / 120
/** Keeps the arena on screen briefly after the round ends, so the last effects play out. */
const OUTRO_MS = 1200
const MIN_PULL = 12

interface Hud {
	letter: string | undefined
	score: number
	seconds: number
	banked: string[]
	lettersLeft: number
	aiming: boolean
}

function hudOf(state: SkillState): Hud {
	return {
		letter: currentLetter(state),
		score: state.score,
		seconds: Math.ceil(state.timeLeft),
		banked: bankedLetters(state),
		lettersLeft: state.letters.length - state.current,
		aiming: state.phase === 'aiming',
	}
}

function sameHud(a: Hud, b: Hud): boolean {
	return (
		a.letter === b.letter &&
		a.score === b.score &&
		a.seconds === b.seconds &&
		a.banked.length === b.banked.length &&
		a.lettersLeft === b.lettersLeft &&
		a.aiming === b.aiming
	)
}

/** Keyboard aim, as an angle from straight up (degrees) and a pull length. */
function pullFromAngle(degrees: number, power: number): Vec {
	const radians = (degrees * Math.PI) / 180
	return { x: -Math.sin(radians) * power, y: Math.cos(radians) * power }
}

export function SkillRound({
	letters,
	onFinish,
}: {
	letters: readonly string[]
	onFinish: (state: SkillState) => void
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const engine = useRef(createSkillRound(letters))
	const aim = useRef<Aim>({ pull: { x: 0, y: 0 }, active: false })
	const keyboardAim = useRef({ degrees: 0, power: 90 })
	const effects = useRef<Effects | null>(null)
	const [hud, setHud] = useState<Hud>(() => hudOf(engine.current))
	const [announcement, setAnnouncement] = useState('')
	const onFinishRef = useRef(onFinish)
	onFinishRef.current = onFinish

	const handleEvents = useCallback((events: SkillEvent[]) => {
		const fx = effects.current
		for (const event of events) {
			switch (event.type) {
				case 'launch':
					sound.launch()
					break
				case 'bounce':
					sound.bounce()
					break
				case 'sink': {
					const hole = HOLES[event.hole]
					sound.sink(hole?.multiplier ?? 1)
					fx?.burst(event.at, hole && hole.multiplier >= 5 ? '#ffc94d' : letterColor(event.letter))
					fx?.text(`+${event.points}`, event.at, '#ffc94d')
					setAnnouncement(`Sank ${event.letter} for ${event.points} points`)
					break
				}
				case 'bank':
					sound.bank()
					fx?.burst({ x: ARENA.width / 2, y: ARENA.bankZoneY + 40 }, '#3dfca6', 14)
					fx?.text(
						`Banked ${event.letter}`,
						{ x: ARENA.width / 2, y: ARENA.bankZoneY - 10 },
						'#3dfca6',
					)
					setAnnouncement(`Banked ${event.letter}`)
					break
				case 'miss':
					sound.miss()
					fx?.text('Over the top!', { x: ARENA.width / 2, y: 40 }, '#ff6b6b')
					setAnnouncement(`${event.letter} flew over the top`)
					break
				case 'stop':
					fx?.text('No score', event.at, '#9aa5d1')
					setAnnouncement(`${event.letter} stopped short`)
					break
				case 'over':
					sound.over()
					setAnnouncement('Skill round over')
					break
			}
		}
	}, [])

	const apply = useCallback(
		(update: SkillUpdate) => {
			engine.current = update.state
			handleEvents(update.events)
		},
		[handleEvents],
	)

	const fire = useCallback(
		(pull: Vec) => {
			if (Math.hypot(pull.x, pull.y) < MIN_PULL) return
			apply(launch(engine.current, pull))
		},
		[apply],
	)

	const bank = useCallback(() => apply(quickBank(engine.current)), [apply])

	// Game loop: fixed physics steps, drawn once per animation frame
	useEffect(() => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext('2d')
		if (!canvas || !ctx) return

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		effects.current = new Effects(reducedMotion)
		const dpr = Math.min(window.devicePixelRatio || 1, 2)
		canvas.width = ARENA.width * dpr
		canvas.height = ARENA.height * dpr
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

		let frame = 0
		let last = performance.now()
		let accumulator = 0
		let endedAt: number | null = null
		let lastHud = hudOf(engine.current)

		const loop = (now: number) => {
			// Clamp long gaps (a background tab) so the clock doesn't race ahead
			const elapsed = Math.min((now - last) / 1000, 0.1)
			last = now
			accumulator += elapsed
			while (accumulator >= STEP) {
				apply(tick(engine.current, STEP))
				accumulator -= STEP
			}
			effects.current?.update(elapsed)
			drawArena(ctx, engine.current, aim.current, effects.current as Effects)

			const next = hudOf(engine.current)
			if (!sameHud(next, lastHud)) {
				if (next.seconds !== lastHud.seconds && next.seconds <= 5 && next.seconds > 0) sound.tick()
				lastHud = next
				setHud(next)
			}

			if (engine.current.phase === 'over') {
				endedAt ??= now
				if (now - endedAt > OUTRO_MS) {
					onFinishRef.current(engine.current)
					return
				}
			}
			frame = requestAnimationFrame(loop)
		}
		frame = requestAnimationFrame(loop)
		return () => cancelAnimationFrame(frame)
	}, [apply])

	// Keyboard: arrows aim, space fires, B banks
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return
			if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return
			const k = keyboardAim.current
			let aimed = false
			switch (e.key) {
				case 'ArrowLeft':
					k.degrees = Math.max(-80, k.degrees - 2)
					aimed = true
					break
				case 'ArrowRight':
					k.degrees = Math.min(80, k.degrees + 2)
					aimed = true
					break
				case 'ArrowUp':
					k.power = Math.min(ARENA.maxPull, k.power + 4)
					aimed = true
					break
				case 'ArrowDown':
					k.power = Math.max(MIN_PULL, k.power - 4)
					aimed = true
					break
				case ' ':
				case 'Enter':
					fire(pullFromAngle(k.degrees, k.power))
					aim.current.active = false
					break
				case 'b':
				case 'B':
					bank()
					aim.current.active = false
					break
				default:
					return
			}
			e.preventDefault()
			if (aimed) aim.current = { pull: pullFromAngle(k.degrees, k.power), active: true }
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [fire, bank])

	const toArena = (e: React.PointerEvent<HTMLCanvasElement>): Vec => {
		const rect = e.currentTarget.getBoundingClientRect()
		return {
			x: ((e.clientX - rect.left) / rect.width) * ARENA.width,
			y: ((e.clientY - rect.top) / rect.height) * ARENA.height,
		}
	}

	const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (engine.current.phase !== 'aiming') return
		e.currentTarget.setPointerCapture(e.pointerId)
		const at = toArena(e)
		aim.current = { pull: { x: at.x - ARENA.launch.x, y: at.y - ARENA.launch.y }, active: true }
	}

	const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!aim.current.active || !e.currentTarget.hasPointerCapture(e.pointerId)) return
		const at = toArena(e)
		aim.current.pull = { x: at.x - ARENA.launch.x, y: at.y - ARENA.launch.y }
	}

	const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!aim.current.active) return
		const { pull } = aim.current
		aim.current = { pull, active: false }
		// Keep keyboard aim in step with the last drag
		const length = Math.hypot(pull.x, pull.y)
		if (length > 0) {
			keyboardAim.current = {
				degrees: (Math.atan2(-pull.x, pull.y) * 180) / Math.PI,
				power: Math.min(length, ARENA.maxPull),
			}
		}
		e.currentTarget.releasePointerCapture(e.pointerId)
		fire(pull)
	}

	return (
		<div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
			<div className="order-2 grid grid-cols-2 gap-3 lg:order-1 lg:grid-cols-1">
				<div className="panel p-4 text-center">
					<p className="label">Current letter</p>
					{hud.letter ? (
						<div className="mt-3 flex items-center justify-center gap-3">
							<span
								className="grid size-14 place-items-center rounded-full text-2xl font-bold text-night"
								style={{ background: letterColor(hud.letter) }}
							>
								{hud.letter}
							</span>
							<span className="text-sm text-muted">{letterValue(hud.letter)} pts</span>
						</div>
					) : (
						<p className="mt-3 text-muted">None left</p>
					)}
					<button
						type="button"
						className="btn-primary mt-4 w-full text-sm"
						onClick={bank}
						disabled={!hud.aiming}
					>
						Bank it (B)
					</button>
				</div>
				<div className="panel p-4 text-sm text-muted">
					<p className="label mb-2">How to shoot</p>
					<p>
						Drag back from the ball and let go. Aim <strong className="text-ink">up</strong> to sink
						it in a hole for points, or <strong className="text-ink">down</strong> to bank the
						letter for the word round.
					</p>
					<p className="mt-2 hidden lg:block">Keyboard: arrows aim, Space shoots, B banks.</p>
				</div>
			</div>

			<div className="order-1 mx-auto w-full max-w-[min(100%,calc((100dvh-13rem)*0.625))] lg:order-2 lg:max-w-[min(100%,calc((100dvh-9rem)*0.625))]">
				{/* Compact HUD for small screens, where the side panels sit below the arena */}
				<div className="mb-2 flex items-center justify-between gap-2 lg:hidden">
					<p className="font-display text-sm text-cyan">{hud.score}</p>
					<p className={`font-display text-sm ${hud.seconds <= 5 ? 'text-danger' : 'text-gold'}`}>
						{hud.seconds}s
					</p>
					<p className="text-sm text-muted">
						{hud.banked.length}/{MAX_BANKED} banked
					</p>
					<button
						type="button"
						className="btn-primary px-3 py-1.5 text-sm"
						onClick={bank}
						disabled={!hud.aiming}
					>
						Bank
					</button>
				</div>
				<canvas
					ref={canvasRef}
					role="img"
					aria-label="Wordball arena. Drag back from the ball to aim, release to shoot."
					className="aspect-[5/8] w-full touch-none select-none rounded-2xl border-2 border-cyan/60 shadow-[0_0_40px_-10px_var(--color-cyan)]"
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={() => {
						aim.current.active = false
					}}
				/>
			</div>

			<div className="order-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
				<div className="panel p-4">
					<p className="label">Skill score</p>
					<p className="mt-2 font-display text-2xl text-cyan" data-testid="skill-score">
						{hud.score}
					</p>
					<p className="label mt-4">Time</p>
					<p
						className={`mt-2 font-display text-2xl ${hud.seconds <= 5 ? 'text-danger' : 'text-gold'}`}
					>
						{hud.seconds}s
					</p>
				</div>
				<div className="panel p-4">
					<div className="flex items-baseline justify-between">
						<p className="label">Banked</p>
						<p className="text-sm text-muted" data-testid="banked-count">
							{hud.banked.length}/{MAX_BANKED}
						</p>
					</div>
					<div className="mt-3 grid grid-cols-4 gap-2">
						{Array.from({ length: MAX_BANKED }, (_, i) => {
							const letter = hud.banked[i]
							return (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: fixed slots
									key={i}
									className="grid aspect-square place-items-center rounded-lg border border-dashed border-panel-edge font-bold text-night"
									style={
										letter ? { background: letterColor(letter), borderStyle: 'solid' } : undefined
									}
								>
									{letter}
								</span>
							)
						})}
					</div>
					<p className="mt-3 text-sm text-muted">{hud.lettersLeft} letters left</p>
				</div>
			</div>
			<p className="sr-only" aria-live="polite">
				{announcement}
			</p>
		</div>
	)
}
