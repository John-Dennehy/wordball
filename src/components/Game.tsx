import { useCallback, useState } from 'react'
import { drawLetters } from '@/game/letters'
import type { GameMode } from '@/game/modes'
import { lettersForWordRound, type SkillState } from '@/game/skillRound'
import type { FoundWord } from '@/game/wordRound'
import type { Dictionary } from '@/game/words'
import { type GameResult, Results } from './Results'
import { SkillRound } from './skill/SkillRound'
import { WordRound } from './words/WordRound'

type Phase =
	| { name: 'skill' }
	| { name: 'words'; skillScore: number; letters: string[] }
	| { name: 'results'; result: GameResult }

export function Game({
	mode,
	seed,
	day,
	onPlayAgain,
}: {
	mode: GameMode
	seed: string
	day: string
	onPlayAgain: () => void
}) {
	const [letters] = useState(() => drawLetters(seed))
	const [phase, setPhase] = useState<Phase>({ name: 'skill' })

	const finishSkill = useCallback((state: SkillState) => {
		setPhase({ name: 'words', skillScore: state.score, letters: lettersForWordRound(state) })
	}, [])

	const finishWords = useCallback(
		(words: { found: FoundWord[]; score: number; dictionary: Dictionary }) => {
			setPhase((current) =>
				current.name === 'words'
					? {
							name: 'results',
							result: {
								mode,
								day,
								skillScore: current.skillScore,
								letters: current.letters,
								found: words.found,
								wordScore: words.score,
								dictionary: words.dictionary,
							},
						}
					: current,
			)
		},
		[mode, day],
	)

	switch (phase.name) {
		case 'skill':
			return <SkillRound letters={letters} onFinish={finishSkill} />
		case 'words':
			return <WordRound letters={phase.letters} onFinish={finishWords} />
		case 'results':
			return <Results result={phase.result} onPlayAgain={onPlayAgain} />
	}
}
