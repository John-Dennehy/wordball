import { createFileRoute } from '@tanstack/react-router'
import { getLeaderboard } from '@/server/leaderboard'
import type { LeaderboardEntry } from '@/server/store'

export const Route = createFileRoute('/leaderboard')({
	loader: () => getLeaderboard(),
	head: () => ({ meta: [{ title: 'Leaderboard · Wordball' }] }),
	component: LeaderboardPage,
})

function Board({
	title,
	entries,
	showDay,
}: {
	title: string
	entries: LeaderboardEntry[]
	showDay?: boolean
}) {
	return (
		<section className="panel p-6">
			<h2 className="label">{title}</h2>
			{entries.length === 0 ? (
				<p className="mt-4 text-muted">No scores yet.</p>
			) : (
				<table className="mt-4 w-full text-left text-sm">
					<thead className="text-muted">
						<tr>
							<th className="py-2 font-medium">#</th>
							<th className="py-2 font-medium">Name</th>
							{showDay && <th className="hidden py-2 font-medium sm:table-cell">Day</th>}
							<th className="py-2 text-right font-medium">Skill</th>
							<th className="py-2 text-right font-medium">Words</th>
							<th className="py-2 text-right font-medium">Total</th>
						</tr>
					</thead>
					<tbody>
						{entries.map((entry, i) => (
							<tr key={entry.id} className="border-t border-panel-edge">
								<td className="py-2 text-muted">{i + 1}</td>
								<td className="py-2 font-medium" title={entry.words.join(', ')}>
									{entry.name}
								</td>
								{showDay && <td className="hidden py-2 text-muted sm:table-cell">{entry.day}</td>}
								<td className="py-2 text-right text-cyan">{entry.skillScore}</td>
								<td className="py-2 text-right text-lime">{entry.wordScore}</td>
								<td className="py-2 text-right font-display text-xs text-gold">{entry.total}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</section>
	)
}

function LeaderboardPage() {
	const { today, daily, allTime } = Route.useLoaderData()
	return (
		<div className="space-y-4 py-6">
			<h1 className="font-display text-xl text-cyan sm:text-2xl">Leaderboard</h1>
			<p className="text-muted">
				Daily challenge scores only, so everyone is playing the same letters. Every score is
				re-checked on the server before it's posted.
			</p>
			<div className="grid gap-4 lg:grid-cols-2">
				<Board title={`Today · ${today}`} entries={daily} />
				<Board title="All-time best" entries={allTime} showDay />
			</div>
		</div>
	)
}
