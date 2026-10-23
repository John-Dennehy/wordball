import type { Vec } from '@/game/physics'

interface Particle {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	color: string
	size: number
}

interface FloatingText {
	text: string
	x: number
	y: number
	life: number
	color: string
}

/** Short-lived particles and score pop-ups. Purely cosmetic, so they live outside the engine. */
export class Effects {
	particles: Particle[] = []
	texts: FloatingText[] = []

	constructor(private readonly reducedMotion: boolean) {}

	burst(at: Vec, color: string, count = 22) {
		const n = this.reducedMotion ? Math.ceil(count / 4) : count
		for (let i = 0; i < n; i++) {
			const angle = Math.random() * Math.PI * 2
			const speed = 60 + Math.random() * 220
			this.particles.push({
				x: at.x,
				y: at.y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 1,
				color,
				size: 2 + Math.random() * 3,
			})
		}
	}

	text(text: string, at: Vec, color: string) {
		this.texts.push({ text, x: at.x, y: at.y, life: 1, color })
	}

	update(dt: number) {
		for (const p of this.particles) {
			p.x += p.vx * dt
			p.y += p.vy * dt
			p.vx *= 0.92
			p.vy *= 0.92
			p.life -= dt * 1.4
		}
		for (const t of this.texts) {
			t.y -= 40 * dt
			t.life -= dt * 0.8
		}
		this.particles = this.particles.filter((p) => p.life > 0)
		this.texts = this.texts.filter((t) => t.life > 0)
	}
}
