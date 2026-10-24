/**
 * Tiny Web Audio synth for game effects, so there are no audio files to load.
 * Sound starts muted until the player turns it on, and the choice is remembered.
 */
const STORAGE_KEY = 'wordball:sound'

let context: AudioContext | null = null
let enabled = readPreference()

function readPreference(): boolean {
	try {
		return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'on'
	} catch {
		return false
	}
}

export function isSoundOn(): boolean {
	return enabled
}

export function setSoundOn(on: boolean): void {
	enabled = on
	try {
		localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
	} catch {
		// Private browsing can block storage; the toggle still works for this visit
	}
}

function tone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
	if (!enabled || typeof window === 'undefined') return
	context ??= new AudioContext()
	const start = context.currentTime
	const osc = context.createOscillator()
	const gain = context.createGain()
	osc.type = type
	osc.frequency.setValueAtTime(frequency, start)
	gain.gain.setValueAtTime(volume, start)
	gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
	osc.connect(gain).connect(context.destination)
	osc.start(start)
	osc.stop(start + duration)
}

export const sound = {
	launch: () => tone(220, 0.12, 'triangle'),
	bounce: () => tone(140, 0.05, 'square', 0.05),
	sink: (multiplier: number) => {
		tone(440 * multiplier ** 0.5, 0.15, 'sine')
		setTimeout(() => tone(660 * multiplier ** 0.5, 0.2, 'sine'), 90)
	},
	bank: () => tone(520, 0.12, 'triangle'),
	miss: () => tone(110, 0.25, 'sawtooth', 0.06),
	tick: () => tone(880, 0.04, 'square', 0.04),
	tile: () => tone(600, 0.04, 'triangle', 0.08),
	valid: () => {
		tone(523, 0.1)
		setTimeout(() => tone(784, 0.18), 80)
	},
	invalid: () => tone(160, 0.15, 'sawtooth', 0.06),
	over: () => {
		tone(392, 0.15)
		setTimeout(() => tone(330, 0.15), 140)
		setTimeout(() => tone(262, 0.3), 280)
	},
}
