import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
	head: () => ({ meta: [{ title: 'Then & now · Wordball' }] }),
	component: About,
})

const ORIGINAL = 'https://github.com/John-Dennehy/wordball/tree/3809384/client/src'

const rows: [string, string, string][] = [
	[
		'Framework',
		'Create React App, class components and jQuery',
		'TanStack Start, React 19, file-based routes',
	],
	['Language', 'JavaScript', 'TypeScript, strict mode'],
	['Game logic', 'Mixed into React components', 'A pure, framework-free engine with unit tests'],
	['Physics', 'Per-frame velocity tweaks', 'Fixed 120 Hz timestep, wall and bumper collisions'],
	[
		'Letters',
		'Seeded from a word',
		'Seeded Scrabble bag, so every player gets the same daily letters',
	],
	[
		'Leaderboard',
		'Express and MongoDB, trusts the client',
		'Neon Postgres, every score re-checked on the server',
	],
	[
		'Controls',
		'Mouse only',
		'Mouse, touch and full keyboard play, with screen reader announcements',
	],
]

function About() {
	return (
		<div className="mx-auto max-w-3xl space-y-6 py-6">
			<h1 className="font-display text-xl text-cyan sm:text-2xl">Then &amp; now</h1>
			<p className="text-lg text-muted">
				Wordball started in December 2019 as a team final project at Makers Academy: a week-long
				sprint to build a game that tested both dexterity and vocabulary. This version is a
				from-scratch rewrite in 2026, keeping the idea and rebuilding everything else.
			</p>
			<div className="panel overflow-x-auto p-2 sm:p-4">
				<table className="w-full min-w-[34rem] text-left text-sm">
					<thead>
						<tr className="text-muted">
							<th className="p-2 font-medium" />
							<th className="p-2 font-medium">2019</th>
							<th className="p-2 font-medium text-lime">2026</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(([area, then, now]) => (
							<tr key={area} className="border-t border-panel-edge align-top">
								<th className="p-2 font-medium">{area}</th>
								<td className="p-2 text-muted">{then}</td>
								<td className="p-2">{now}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-muted">
				The original code is still in the repository's history:{' '}
				<a className="text-cyan underline" href={ORIGINAL}>
					browse the 2019 version
				</a>
				.
			</p>
			<Link to="/play" search={{ mode: 'daily' }} className="btn-primary">
				Play today's challenge
			</Link>
		</div>
	)
}
