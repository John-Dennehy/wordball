import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { GameMode } from '@/game/modes'
import type { FoundWord } from '@/game/wordRound'
import { type Dictionary, findWords, scoreWord } from '@/game/words'
import { submitScore } from '@/server/leaderboard'

const NAME_KEY = 'wordball:name'

function savedName(): string {
	try {
		return localStorage.getItem(NAME_KEY) ?? ''
	} catch {
		return ''
	}
}

export interface GameResult {
	mode: GameMode
	day: string
	skillScore: number
	letters: string[]
	found: FoundWord[]
	wordScore: number
	dictionary: Dictionary
}

type Submit =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved'; rank: number }
	| { status: 'error'; message: string }

export function Results({ result, onPlayAgain }: { result: GameResult; onPlayAgain: () => void }) {
	const total = result.skillScore + result.wordScore
	const [name, setName] = useState(savedName)
	const [submit, setSubmit] = useState<Submit>({ status: 'idle' })
	const [copied, setCopied] = useState(false)

	const missed = useMemo(() => {
		const found = new Set(result.found.map((f) => f.word))
		return findWords(result.letters, result.dictionary)
			.filter((w) => !found.has(w))
			.slice(0, 6)
	}, [result])

	const save = async (e: React.FormEvent) => {
		e.preventDefault()
		setSubmit({ status: 'saving' })
		try {
			localStorage.setItem(NAME_KEY, name.trim())
		} catch {
			// Not being able to remember the name is fine
		}
		try {
			const response = await submitScore({
				data: {
					name: name.trim(),
					day: result.day,
					banked: result.letters,
					words: result.found.map((f) => f.word),
					skillScore: result.skillScore,
				},
			})
			setSubmit(
				response.ok
					? { status: 'saved', rank: response.rank }
					: { status: 'error', message: response.reason },
			)
		} catch {
			setSubmit({ status: 'error', message: "Couldn't reach the leaderboard. Try again?" })
		}
	}

	const share = async () => {
		const text = `Wordball daily ${result.day}: ${total} points (${result.found.length} words). Can you beat it?`
		try {
			await navigator.clipboard.writeText(`${text} ${window.location.origin}`)
			setCopied(true)
		} catch {
			setCopied(false)
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-4">
			<section className="panel p-6 text-center sm:p-10">
				<p className="label">
					{result.mode === 'daily' ? `Daily challenge · ${result.day}` : 'Practice game'}
				</p>
				<p className="mt-4 font-display text-4xl text-gold sm:text-5xl" data-testid="total-score">
					{total}
				</p>
				<div className="mt-6 grid grid-cols-2 gap-3 text-sm">
					<div className="rounded-xl bg-night/60 p-3">
						<p className="label">Skill</p>
						<p className="mt-1 font-display text-cyan">{result.skillScore}</p>
					</div>
					<div className="rounded-xl bg-night/60 p-3">
						<p className="label">Words</p>
						<p className="mt-1 font-display text-lime">{result.wordScore}</p>
					</div>
				</div>

				{result.mode === 'daily' && (
					<div className="mt-8">
						{submit.status === 'saved' ? (
							<p className="text-lg">
								You're <strong className="text-gold">#{submit.rank}</strong> today.{' '}
								<Link to="/leaderboard" className="text-cyan underline">
									See the leaderboard
								</Link>
							</p>
						) : (
							<form onSubmit={save} className="flex flex-col gap-2 sm:flex-row">
								<label htmlFor="player-name" className="sr-only">
									Your name
								</label>
								<input
									id="player-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									maxLength={16}
									required
									placeholder="Your name"
									className="flex-1 rounded-xl border border-panel-edge bg-night px-4 py-3 text-ink placeholder:text-muted"
								/>
								<button
									type="submit"
									className="btn-primary"
									disabled={submit.status === 'saving' || !name.trim()}
								>
									{submit.status === 'saving' ? 'Saving…' : 'Post score'}
								</button>
							</form>
						)}
						{submit.status === 'error' && (
							<p className="mt-2 text-sm text-danger" role="alert">
								{submit.message}
							</p>
						)}
					</div>
				)}

				<div className="mt-6 flex flex-wrap justify-center gap-2">
					{result.mode === 'daily' && (
						<button type="button" className="btn-secondary" onClick={share}>
							{copied ? 'Copied!' : 'Share result'}
						</button>
					)}
					<button type="button" className="btn-secondary" onClick={onPlayAgain}>
						{result.mode === 'daily' ? 'Practice game' : 'Play again'}
					</button>
				</div>
			</section>

			<section className="panel grid gap-6 p-6 sm:grid-cols-2">
				<div>
					<p className="label">Your words</p>
					{result.found.length ? (
						<ul className="mt-3 space-y-1">
							{result.found.map((f) => (
								<li key={f.word} className="flex justify-between">
									<span>{f.word}</span>
									<span className="text-lime">+{f.points}</span>
								</li>
							))}
						</ul>
					) : (
						<p className="mt-3 text-sm text-muted">None this time.</p>
					)}
				</div>
				<div>
					<p className="label">You could also have had</p>
					{missed.length ? (
						<ul className="mt-3 space-y-1">
							{missed.map((w) => (
								<li key={w} className="flex justify-between text-muted">
									<span>{w}</span>
									<span>+{scoreWord(w)}</span>
								</li>
							))}
						</ul>
					) : (
						<p className="mt-3 text-sm text-muted">Nothing. You found them all!</p>
					)}
				</div>
			</section>
		</div>
	)
}
