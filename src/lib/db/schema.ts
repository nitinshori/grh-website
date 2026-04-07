import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ── Enums ───────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'pharmacy_admin',
  'pharmacist',
  'client',
])

// ── Pharmacies ──────────────────────────────────────────────────

export const pharmacies = pgTable('pharmacies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Users ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('pharmacist').notNull(),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Pharmacy PGD Assignments ────────────────────────────────────

export const pharmacyPgds = pgTable(
  'pharmacy_pgds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pharmacyId: uuid('pharmacy_id')
      .references(() => pharmacies.id, { onDelete: 'cascade' })
      .notNull(),
    pgdSlug: varchar('pgd_slug', { length: 255 }).notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('pharmacy_pgd_unique').on(table.pharmacyId, table.pgdSlug),
  ]
)

// ── PGD Consultations (Analytics) ─────────────────────────────

export const pgdConsultations = pgTable('pgd_consultations', {
  id: uuid('id').defaultRandom().primaryKey(),
  pharmacyId: uuid('pharmacy_id')
    .references(() => pharmacies.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  pgdSlug: varchar('pgd_slug', { length: 255 }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Voice Calls (AI Receptionist) ──────────────────────────────

export const voiceCalls = pgTable('voice_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  vapiCallId: varchar('vapi_call_id', { length: 255 }).unique(),
  callerNumber: varchar('caller_number', { length: 50 }),
  callerName: varchar('caller_name', { length: 255 }),
  callerEmail: varchar('caller_email', { length: 255 }),
  pharmacyName: varchar('pharmacy_name', { length: 255 }),
  enquiryType: varchar('enquiry_type', { length: 100 }), // sales | demo | support | other
  summary: text('summary'),
  transcript: text('transcript'),
  recordingUrl: text('recording_url'),
  durationSeconds: integer('duration_seconds'),
  appointmentBooked: boolean('appointment_booked').default(false).notNull(),
  appointmentTime: timestamp('appointment_time'),
  calendarEventId: varchar('calendar_event_id', { length: 255 }),
  status: varchar('status', { length: 50 }), // completed | voicemail | failed
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Type exports ────────────────────────────────────────────────

export type Pharmacy = typeof pharmacies.$inferSelect
export type NewPharmacy = typeof pharmacies.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type PharmacyPgd = typeof pharmacyPgds.$inferSelect
export type NewPharmacyPgd = typeof pharmacyPgds.$inferInsert
export type PgdConsultation = typeof pgdConsultations.$inferSelect
export type NewPgdConsultation = typeof pgdConsultations.$inferInsert
export type VoiceCall = typeof voiceCalls.$inferSelect
export type NewVoiceCall = typeof voiceCalls.$inferInsert
