import { neon } from '@neondatabase/serverless'
import { and, count, desc, eq, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { type NewScore, type ScoreRow, scores } from './schema'

export interface LeaderboardEntry {
	id: number
	name: string
	day: string
	total: number
	skillScore: number
	wordScore: number
	words: string[]
}

export interface ScoreStore {
	insert(score: NewScore): Promise<void>
	/** Best scores, for one day or across all days. */
	top(limit: number, day?: string): Promise<LeaderboardEntry[]>
	/** 1-based position a total would take on a day's board. */
	rank(day: string, total: number): Promise<number>
}

function toEntry(row: ScoreRow): LeaderboardEntry {
	return {
		id: row.id,
		name: row.name,
		day: row.day,
		total: row.total,
		skillScore: row.skillScore,
		wordScore: row.wordScore,
		words: row.words,
	}
}

function neonStore(url: string): ScoreStore {
	const db = drizzle(neon(url))
	return {
		async insert(score) {
			await db.insert(scores).values(score)
		},
		async top(limit, day) {
			const rows = await db
				.select()
				.from(scores)
				.where(day ? eq(scores.day, day) : undefined)
				.orderBy(desc(scores.total), scores.createdAt)
				.limit(limit)
			return rows.map(toEntry)
		},
		async rank(day, total) {
			const [row] = await db
				.select({ better: count() })
				.from(scores)
				.where(and(eq(scores.day, day), gt(scores.total, total)))
			return (row?.better ?? 0) + 1
		},
	}
}

/** Keeps scores in memory, so the game runs locally without a database. */
export function memoryStore(): ScoreStore {
	const rows: ScoreRow[] = []
	return {
		async insert(score) {
			rows.push({
				id: rows.length + 1,
				createdAt: new Date(),
				...score,
			} as ScoreRow)
		},
		async top(limit, day) {
			return rows
				.filter((r) => !day || r.day === day)
				.sort((a, b) => b.total - a.total || a.createdAt.getTime() - b.createdAt.getTime())
				.slice(0, limit)
				.map(toEntry)
		},
		async rank(day, total) {
			return rows.filter((r) => r.day === day && r.total > total).length + 1
		},
	}
}

let store: ScoreStore | undefined

export function getStore(): ScoreStore {
	store ??= process.env.DATABASE_URL ? neonStore(process.env.DATABASE_URL) : memoryStore()
	return store
}
