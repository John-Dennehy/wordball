import {
	date,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core'

/** Daily challenge results. Practice games aren't recorded: anyone can reroll practice letters. */
export const scores = pgTable(
	'scores',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 16 }).notNull(),
		/** The UTC day of the daily challenge, which also fixes its letters. */
		day: date('day').notNull(),
		skillScore: integer('skill_score').notNull(),
		wordScore: integer('word_score').notNull(),
		total: integer('total').notNull(),
		words: text('words').array().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('scores_day_total_idx').on(t.day, t.total), index('scores_total_idx').on(t.total)],
)

export type ScoreRow = typeof scores.$inferSelect
export type NewScore = typeof scores.$inferInsert
