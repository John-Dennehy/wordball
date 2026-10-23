# Wordball

Half pinball, half anagram. Each ball carries a letter: sink it in a hole for points, or shoot it into the bank to keep it. Then spell as many words as you can from your banked letters before the clock runs out.

Everyone plays the same letters each day, and the daily leaderboard re-checks every score on the server.

## How to play

1. **Shoot.** Drag back from the ball and let go. On a keyboard, the arrow keys aim and Space shoots.
2. **Score or bank.** A ball that drops into a hole scores its letter value × the hole's multiplier (×1, ×2 or ×5) × 10. A ball shot down into the bank zone is kept for the word round (up to 8 letters). Bumpers guard the ×5 jackpot, so the best shots come off the walls.
3. **Spell.** You have 60 seconds to make words of 3 to 8 letters from your bank. Each word scores its letter values × a length multiplier, from ×1 for three letters up to ×4 for eight.

## Then and now

Wordball began in December 2019 as a team final project at Makers Academy. This is a 2026 rewrite from scratch. It keeps the idea and rebuilds everything else. The original code is still in the history at [`3809384`](https://github.com/John-Dennehy/wordball/tree/3809384/client/src).

|             | 2019                                       | 2026                                                        |
| ----------- | ------------------------------------------ | ----------------------------------------------------------- |
| Framework   | Create React App, class components, jQuery | TanStack Start, React 19                                    |
| Language    | JavaScript                                 | TypeScript (strict)                                         |
| Game logic  | Inside React components                    | A pure, framework-free engine with unit tests               |
| Physics     | Per-frame velocity tweaks                  | Fixed 120 Hz timestep, wall and bumper collisions           |
| Leaderboard | Express and MongoDB, trusts the client     | Neon Postgres, every score re-checked on the server         |
| Controls    | Mouse                                      | Mouse, touch and keyboard, with screen reader announcements |

## Architecture

```
src/
├── game/              Pure TypeScript engine, no React or DOM
│   ├── rng.ts         Seeded PRNG (FNV-1a + mulberry32)
│   ├── letters.ts     Scrabble values and a seeded letter bag
│   ├── physics.ts     Ball motion, damping, wall and bumper collisions
│   ├── arena.ts       Arena size, holes and bumpers
│   ├── skillRound.ts  Skill round state machine: launch, tick, bank, events
│   ├── wordRound.ts   Word round reducer
│   ├── words.ts       Dictionary, word scoring and solver
│   └── validateRun.ts Server-side check of a finished game
├── components/        Canvas renderer, rounds and results
├── server/            Server functions, Drizzle schema and score store
└── routes/            Home, play, leaderboard, then & now
```

The engine is plain functions over plain data, so it's tested without a browser. The React layer only runs the loop, draws the canvas and handles input. Rounds emit events (`sink`, `bank`, `bounce` and so on) that drive sound, particles and screen reader announcements.

The daily letters come from a seed of the UTC date. Because the seed fixes which letters were drawn, the server can check a submitted run on its own: the banked letters must come from that draw, each word must be real and spellable from them, the word score is recomputed, and the skill score has a hard ceiling.

The dictionary is built from [`word-list`](https://github.com/sindresorhus/word-list) at build time (115,000 words of 3–8 letters). The browser only downloads it as a separate chunk when the word round starts.

## Development

Needs Node 22 and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Without `DATABASE_URL` the leaderboard is kept in memory. To use Neon, copy `.env.example` to `.env`, set `DATABASE_URL`, and run `pnpm db:migrate`.

| Script                         | What it does                                     |
| ------------------------------ | ------------------------------------------------ |
| `pnpm test`                    | Unit tests (Vitest)                              |
| `pnpm test:e2e`                | Browser tests on desktop and mobile (Playwright) |
| `pnpm lint` / `pnpm typecheck` | Biome and TypeScript                             |
| `pnpm db:generate`             | New migration after a schema change              |
| `pnpm build` / `pnpm start`    | Production build and server                      |

## Deploying

The app deploys to Vercel as is. Add a Neon database through the Vercel integration so `DATABASE_URL` is set, and `vercel.json` runs the migrations before each build.
