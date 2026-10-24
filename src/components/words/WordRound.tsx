import { useEffect, useReducer, useRef, useState } from 'react'
import { letterValue } from '@/game/letters'
import { createRng } from '@/game/rng'
import {
	createWordRound,
	currentWord,
	type FoundWord,
	type WordState,
	wordRoundReducer,
} from '@/game/wordRound'
import { type Dictionary, loadDictionary } from '@/game/words'
import { sound } from '@/lib/sound'
import { letterColor } from '../skill/colors'

export function WordRound({
	letters,
	onFinish,
}: {
	letters: readonly string[]
	onFinish: (result: { found: FoundWord[]; score: number; dictionary: Dictionary }) => void
}) {
	const [state, dispatch] = useReducer(wordRoundReducer, letters, (l) => createWordRound(l))
	const [dictionary, setDictionary] = useState<Dictionary | null>(null)
	const stateRef = useRef<WordState>(state)
	stateRef.current = state
	const rng = useRef(createRng(`shuffle:${letters.join('')}`))

	useEffect(() => {
		let cancelled = false
		loadDictionary().then((d) => {
			if (!cancelled) setDictionary(d)
		})
		return () => {
			cancelled = true
		}
	}, [])

	// The clock only starts once the dictionary is ready
	useEffect(() => {
		if (!dictionary || state.over) return
		let last = performance.now()
		const id = setInterval(() => {
			const now = performance.now()
			const dt = Math.min((now - last) / 1000, 1)
			last = now
			const before = Math.ceil(stateRef.current.timeLeft)
			dispatch({ type: 'tick', dt })
			const after = Math.ceil(Math.max(0, stateRef.current.timeLeft - dt))
			if (after !== before && after <= 5 && after > 0) sound.tick()
		}, 250)
		return () => clearInterval(id)
	}, [dictionary, state.over])

	useEffect(() => {
		if (state.over && dictionary) {
			sound.over()
			onFinish({ found: state.found, score: state.score, dictionary })
		}
	}, [state.over, dictionary, onFinish, state.found, state.score])

	const submit = () => {
		if (!dictionary || !currentWord(stateRef.current)) return
		const before = stateRef.current.found.length
		const next = wordRoundReducer(stateRef.current, { type: 'submit', dictionary })
		if (next.found.length > before) sound.valid()
		else sound.invalid()
		dispatch({ type: 'submit', dictionary })
	}

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return
			// Let a focused button handle its own Enter and Space
			if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return
			if (e.key === 'Enter') submit()
			else if (e.key === 'Backspace') dispatch({ type: 'backspace' })
			else if (e.key === 'Escape') dispatch({ type: 'clear' })
			else if (e.key === ' ') dispatch({ type: 'shuffle', rng: rng.current })
			else if (/^[a-z]$/i.test(e.key)) {
				sound.tile()
				dispatch({ type: 'type', letter: e.key })
			} else return
			e.preventDefault()
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	})

	const word = currentWord(state)
	const seconds = Math.ceil(state.timeLeft)

	return (
		<div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[1fr_16rem]">
			<section className="panel p-5 sm:p-8" aria-label="Word round">
				<div className="flex items-center justify-between">
					<p className="label">Spell words from your letters</p>
					<p className={`font-display text-lg ${seconds <= 5 ? 'text-danger' : 'text-gold'}`}>
						{dictionary ? `${seconds}s` : '…'}
					</p>
				</div>

				<div
					className="mt-6 flex min-h-16 items-center justify-center rounded-xl border border-panel-edge bg-night/60 px-4 font-display text-xl tracking-[0.3em] sm:text-2xl"
					data-testid="current-word"
				>
					{word || <span className="text-sm tracking-normal text-muted">Tap or type letters</span>}
				</div>
				<p
					className={`mt-3 h-6 text-center text-sm font-medium ${
						state.feedback?.kind === 'error' ? 'text-danger' : 'text-lime'
					}`}
					aria-live="polite"
				>
					{state.feedback?.message}
				</p>

				<div className="mt-4 flex flex-wrap justify-center gap-2">
					{state.tiles.map((tile) => {
						const used = state.selection.includes(tile.id)
						return (
							<button
								key={tile.id}
								type="button"
								disabled={used || !dictionary}
								onClick={() => {
									sound.tile()
									dispatch({ type: 'pick', tileId: tile.id })
								}}
								className="relative grid size-14 place-items-center rounded-xl text-2xl font-bold text-night transition hover:-translate-y-0.5 disabled:translate-y-1 disabled:opacity-25 sm:size-15"
								style={{ background: letterColor(tile.letter) }}
								aria-label={`${tile.letter}, ${letterValue(tile.letter)} points`}
							>
								{tile.letter}
								<span className="absolute right-1.5 bottom-1 text-[10px]">
									{letterValue(tile.letter)}
								</span>
							</button>
						)
					})}
				</div>

				<div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
					<button
						type="button"
						className="btn-primary col-span-2 sm:col-span-1"
						onClick={submit}
						disabled={!word}
					>
						Enter
					</button>
					<button
						type="button"
						className="btn-secondary"
						onClick={() => dispatch({ type: 'backspace' })}
					>
						Delete
					</button>
					<button
						type="button"
						className="btn-secondary"
						onClick={() => dispatch({ type: 'shuffle', rng: rng.current })}
					>
						Shuffle
					</button>
					<button
						type="button"
						className="btn-secondary col-span-2 sm:col-span-1"
						onClick={() => dispatch({ type: 'finish' })}
						disabled={!dictionary}
					>
						I'm done
					</button>
				</div>
				<p className="mt-4 hidden text-center text-xs text-muted sm:block">
					Type letters, Enter to submit, Backspace to delete, Space to shuffle.
				</p>
			</section>

			<aside className="panel p-5">
				<div className="flex items-baseline justify-between">
					<p className="label">Words</p>
					<p className="font-display text-sm text-cyan" data-testid="word-score">
						{state.score}
					</p>
				</div>
				{state.found.length === 0 ? (
					<p className="mt-4 text-sm text-muted">Three letters or more. Longer words score more.</p>
				) : (
					<ul className="mt-4 space-y-1.5" data-testid="found-words">
						{state.found.map((f) => (
							<li key={f.word} className="flex justify-between font-medium">
								<span>{f.word}</span>
								<span className="text-lime">+{f.points}</span>
							</li>
						))}
					</ul>
				)}
			</aside>
		</div>
	)
}
