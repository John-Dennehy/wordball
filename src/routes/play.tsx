import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Game } from '@/components/Game'
import { dailySeed, type GameMode, practiceSeed, utcDay } from '@/game/modes'

const search = z.object({
	mode: z.enum(['daily', 'practice']).catch('daily'),
})

export const Route = createFileRoute('/play')({
	validateSearch: search,
	// Seeds come from the player's clock and randomness, so render this route in the browser only
	ssr: false,
	head: () => ({ meta: [{ title: 'Play · Wordball' }] }),
	component: PlayPage,
})

function newGame(mode: GameMode) {
	const day = utcDay()
	return { mode, day, seed: mode === 'daily' ? dailySeed(day) : practiceSeed() }
}

function PlayPage() {
	const { mode } = Route.useSearch()
	const navigate = useNavigate()
	const [game, setGame] = useState(() => newGame(mode))
	const current = game.mode === mode ? game : newGame(mode)

	const playAgain = () => {
		if (mode === 'daily') {
			navigate({ to: '/play', search: { mode: 'practice' } })
		} else {
			setGame(newGame('practice'))
		}
	}

	return (
		<Game
			key={current.seed}
			mode={current.mode}
			seed={current.seed}
			day={current.day}
			onPlayAgain={playAgain}
		/>
	)
}
