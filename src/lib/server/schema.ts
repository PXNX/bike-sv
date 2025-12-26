// src/lib/server/schema.ts
import {
	pgTable,
	text,
	timestamp,
	integer,
	real,
	jsonb,
	uniqueIndex,
	varchar,
	index,
	pgEnum,
	uuid,
	boolean
} from 'drizzle-orm/pg-core';

// todo: think if some of the ids could be autoincrementing ints instead of uuids

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	picture: text('picture'),
	isAdmin: boolean('is_admin').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const trips = pgTable('trips', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	gpxData: text('gpx_data').notNull(),
	startTime: timestamp('start_time').notNull(),
	isPublic: integer('is_public').default(0).notNull(), // 0 = private, 1 = public
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const pauses = pgTable('pauses', {
	id: text('id').primaryKey(),
	tripId: text('trip_id')
		.notNull()
		.references(() => trips.id, { onDelete: 'cascade' }),
	lat: real('lat').notNull(),
	lon: real('lon').notNull(),
	durationMinutes: integer('duration_minutes').notNull(),
	distanceKm: real('distance_km').notNull()
});
