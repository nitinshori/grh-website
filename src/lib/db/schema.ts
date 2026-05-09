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
  groupSlug: varchar('group_slug', { length: 100 }),  // shared across multi-site groups e.g. "pritchards"
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  brandColor: varchar('brand_color', { length: 7 }),   // hex e.g. "#3d8b37" for white-label booking
  brandName: varchar('brand_name', { length: 255 }),    // display name for public booking page
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
  // Two-factor auth (TOTP / authenticator app). When totpEnabled is true the
  // login flow requires a 6-digit code in addition to email + password.
  totpSecret: varchar('totp_secret', { length: 64 }),
  totpEnabled: boolean('totp_enabled').default(false).notNull(),
  totpBackupCodes: text('totp_backup_codes'), // JSON array of one-use bcrypt hashes
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

// ── Clinicians ─────────────────────────────────────────────────

export const clinicians = pgTable('clinicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupSlug: varchar('group_slug', { length: 100 }).notNull(), // links to pharmacies.groupSlug
  name: varchar('name', { length: 255 }).notNull(),
  gphcNumber: varchar('gphc_number', { length: 20 }),
  role: varchar('role', { length: 100 }).default('Pharmacist'),  // Pharmacist, Technician, etc.
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Appointment Types ──────────────────────────────────────────

export const appointmentTypes = pgTable('appointment_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupSlug: varchar('group_slug', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  durationMinutes: integer('duration_minutes').default(15).notNull(),
  color: varchar('color', { length: 7 }).default('#25b4b4'),
  requiresDetails: boolean('requires_details').default(false).notNull(), // show "additional details" textarea
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Clinician Availability ─────────────────────────────────────
// Recurring weekly slots: "Jacqueline is available Mon 9:00–17:00 at Victoria Road"

export const clinicianAvailability = pgTable('clinician_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicianId: uuid('clinician_id')
    .references(() => clinicians.id, { onDelete: 'cascade' })
    .notNull(),
  pharmacyId: uuid('pharmacy_id')
    .references(() => pharmacies.id, { onDelete: 'cascade' })
    .notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday … 6=Saturday
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(),     // "17:00"
  isActive: boolean('is_active').default(true).notNull(),
})

// ── Appointments (Pharmacy Booking System) ─────────────────────

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'available',
  'booked',
  'completed',
  'cancelled',
  'no_show',
])

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  pharmacyId: uuid('pharmacy_id')
    .references(() => pharmacies.id, { onDelete: 'cascade' })
    .notNull(),
  clinicianId: uuid('clinician_id')
    .references(() => clinicians.id, { onDelete: 'set null' }),
  appointmentTypeId: uuid('appointment_type_id')
    .references(() => appointmentTypes.id, { onDelete: 'set null' }),
  createdByUserId: uuid('created_by_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: appointmentStatusEnum('status').default('available').notNull(),
  // Patient details
  patientName: varchar('patient_name', { length: 255 }),
  patientFirstName: varchar('patient_first_name', { length: 100 }),
  patientSurname: varchar('patient_surname', { length: 100 }),
  patientDob: varchar('patient_dob', { length: 10 }),  // "YYYY-MM-DD"
  patientPhone: varchar('patient_phone', { length: 50 }),
  patientEmail: varchar('patient_email', { length: 255 }),
  serviceDetails: text('service_details'),  // additional info for service
  notes: text('notes'),                      // internal staff notes
  bookedOnline: boolean('booked_online').default(false).notNull(),
  consentGiven: boolean('consent_given').default(false).notNull(),
  emailConfirmation: boolean('email_confirmation').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Consultation Records (Clinical Patient Data) ───────────────

export const consultationOutcomeEnum = pgEnum('consultation_outcome', [
  'completed',
  'referred',
  'not_supplied',
])

export const consultationRecords = pgTable('consultation_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  consultationId: uuid('consultation_id')
    .references(() => pgdConsultations.id, { onDelete: 'set null' }),
  pharmacyId: uuid('pharmacy_id')
    .references(() => pharmacies.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  pgdSlug: varchar('pgd_slug', { length: 255 }).notNull(),

  // Patient demographics (structured for search)
  patientFirstName: varchar('patient_first_name', { length: 100 }).notNull(),
  patientLastName: varchar('patient_last_name', { length: 100 }).notNull(),
  patientDob: varchar('patient_dob', { length: 10 }).notNull(),
  patientNhsNumber: varchar('patient_nhs_number', { length: 20 }),
  patientPhone: varchar('patient_phone', { length: 50 }),
  patientEmail: varchar('patient_email', { length: 255 }),
  patientAddress: text('patient_address'),
  patientGpName: varchar('patient_gp_name', { length: 255 }),
  patientGpPractice: varchar('patient_gp_practice', { length: 255 }),

  // Full clinical data as JSON (flexible per-PGD)
  clinicalData: text('clinical_data').notNull(),

  // Outcome (structured for queries)
  outcome: consultationOutcomeEnum('outcome').default('completed').notNull(),
  medicineSupplied: varchar('medicine_supplied', { length: 255 }),
  medicineDose: varchar('medicine_dose', { length: 255 }),
  medicineDuration: varchar('medicine_duration', { length: 100 }),
  medicineQuantity: varchar('medicine_quantity', { length: 50 }),

  // Pharmacist sign-off
  pharmacistName: varchar('pharmacist_name', { length: 255 }).notNull(),
  pharmacistGphc: varchar('pharmacist_gphc', { length: 50 }).notNull(),

  // Timestamps
  consultationDate: timestamp('consultation_date').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft-delete (GDPR Art. 17 right-to-erasure). Records are not visible to
  // pharmacists once deletedAt is set; admin tooling permanently purges
  // after a 30-day grace period.
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
  deletedReason: varchar('deleted_reason', { length: 255 }),
})

// ── Audit log ────────────────────────────────────────────────────
// Immutable record of every read or write touching consultation records.
// Required for CQC inspection and GDPR accountability.

export const auditActionEnum = pgEnum('audit_action', [
  'record_create',
  'record_view',
  'record_list',
  'record_export',
  'record_soft_delete',
  'record_purge',
  'login',
  'login_failed',
  'logout',
  'password_change',
])

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: varchar('user_email', { length: 255 }),
  action: auditActionEnum('action').notNull(),
  recordId: uuid('record_id'),         // consultation_records.id when applicable
  recordCount: integer('record_count'), // for list/export actions
  details: text('details'),             // JSON blob with extra context (filters, search query, etc.)
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Consultation drafts ─────────────────────────────────────────
// Pharmacy assistants can prep patient details / consent and save as a
// draft. The pharmacist later opens the draft, completes the clinical
// portion, and saves the final consultation_records row. Drafts auto-
// expire 7 days after creation (cron job hard-deletes them).

export const consultationDrafts = pgTable('consultation_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  pharmacyId: uuid('pharmacy_id')
    .references(() => pharmacies.id, { onDelete: 'cascade' })
    .notNull(),
  // The user (typically an assistant) who started the draft.
  createdByUserId: uuid('created_by_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  pgdSlug: varchar('pgd_slug', { length: 255 }).notNull(),
  // Light demographics for the drafts list view (no full clinical data on display).
  patientFirstName: varchar('patient_first_name', { length: 100 }),
  patientLastName: varchar('patient_last_name', { length: 100 }),
  patientDob: varchar('patient_dob', { length: 10 }),
  // The full PGD form state — opaque JSON the client serialises before save.
  draftState: text('draft_state').notNull(),
  // Pharmacist's optional note when handing off ("ready for clinical review").
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Auto-expire 7 days from creation. Cron deletes any row past expiresAt.
  expiresAt: timestamp('expires_at').notNull(),
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
export type Appointment = typeof appointments.$inferSelect
export type NewAppointment = typeof appointments.$inferInsert
export type Clinician = typeof clinicians.$inferSelect
export type NewClinician = typeof clinicians.$inferInsert
export type AppointmentType = typeof appointmentTypes.$inferSelect
export type NewAppointmentType = typeof appointmentTypes.$inferInsert
export type ClinicianAvailability = typeof clinicianAvailability.$inferSelect
export type NewClinicianAvailability = typeof clinicianAvailability.$inferInsert
export type ConsultationRecord = typeof consultationRecords.$inferSelect
export type NewConsultationRecord = typeof consultationRecords.$inferInsert
export type ConsultationDraft = typeof consultationDrafts.$inferSelect
export type NewConsultationDraft = typeof consultationDrafts.$inferInsert
