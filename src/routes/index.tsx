import { createFileRoute, Link } from '@tanstack/react-router'
import { HOLES } from '@/game/arena'
import { getLeaderboard } from '@/server/leaderboard'

export const Route = createFileRoute('/')({
	loader: () => getLeaderboard(),
	component: Home,
})

const multipliers = [...new Set(HOLES.map((h) => h.multiplier))].map((m) => `×${m}`).join(', ')

const steps = [
	{
		title: 'Shoot',
		body: 'Each ball carries a letter. Drag back and release to fire it up the arena.',
		color: 'text-cyan',
	},
	{
		title: 'Score or bank',
		body: `Sink it in a hole to score its letter value × the hole's multiplier (${multipliers}) × 10, or shoot it down into the bank to keep it. Bumpers guard the jackpot.`,
		color: 'text-gold',
	},
	{
		title: 'Spell',
		body: 'Then spell as many words as you can from your banked letters before the clock runs out.',
		color: 'text-lime',
	},
]

function Home() {
	const { daily, today } = Route.useLoaderData()

	return (
		<div className="space-y-10 py-6 sm:py-12">
			<section className="text-center">
				<h1 className="font-display text-4xl leading-tight sm:text-6xl">
					<span className="text-cyan">WORD</span>
					<span className="text-magenta">BALL</span>
				</h1>
				<p className="mx-auto mt-6 max-w-xl text-lg text-muted">
					Half pinball, half anagram. Sink letters for points, bank the ones you want, then race the
					clock to spell words with them.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Link to="/play" search={{ mode: 'daily' }} className="btn-primary text-lg">
						Play today's challenge
					</Link>
					<Link to="/play" search={{ mode: 'practice' }} className="btn-secondary text-lg">
						Practice
					</Link>
				</div>
				<p className="mt-3 text-sm text-muted">
					Everyone gets the same letters each day ({today}, UTC).
				</p>
			</section>

			<section className="grid gap-4 sm:grid-cols-3" aria-label="How to play">
				{steps.map((step, i) => (
					<div key={step.title} className="panel p-6">
						<p className={`font-display text-sm ${step.color}`}>
							{i + 1}. {step.title}
						</p>
						<p className="mt-3 text-muted">{step.body}</p>
					</div>
				))}
			</section>

			<section className="panel p-6">
				<div className="flex items-baseline justify-between">
					<h2 className="label">Today's top scores</h2>
					<Link to="/leaderboard" className="text-sm text-cyan hover:underline">
						Full leaderboard
					</Link>
				</div>
				{daily.length === 0 ? (
					<p className="mt-4 text-muted">No scores yet today. Be the first.</p>
				) : (
					<ol className="mt-4 space-y-2">
						{daily.slice(0, 5).map((entry, i) => (
							<li key={entry.id} className="flex justify-between">
								<span>
									<span className="mr-3 text-muted">#{i + 1}</span>
									{entry.name}
								</span>
								<span className="font-display text-sm text-gold">{entry.total}</span>
							</li>
						))}
					</ol>
				)}
			</section>
		</div>
	)
}
