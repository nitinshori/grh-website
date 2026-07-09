import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'

// ── Enums ───────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'pharmacy_admin',
  'pharmacist',
  'client',
  'prospect', // browse-only access for interested pharmacies; cannot download PGDs
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
  // ── Tenant / partner attribution ─────────────────────────────
  // Which acquisition channel this pharmacy came in via. 'direct' for
  // pharmacies that signed up via /onboard or were manually provisioned.
  // 'hubrx' for pharmacies SSO'd through HubRx Insights. Used by the
  // white-label theming and by future partner reporting.
  authSource: varchar('auth_source', { length: 32 }).default('direct').notNull(),
  // Partner-side identifier — e.g. the HubRx pharmacy id passed in the
  // SSO JWT. Lets us reliably re-resolve the same pharmacy on subsequent
  // SSO calls even if name / email change.
  externalId: varchar('external_id', { length: 255 }),
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
  // Single-use setup token for inviting a new user. When a pharmacy admin
  // invites a staff member, a random token is hashed here, expiry is set,
  // and the user is emailed a /set-password link. Token is cleared once
  // used (setup_token_used_at set).
  setupTokenHash: varchar('setup_token_hash', { length: 255 }),
  setupTokenExpiresAt: timestamp('setup_token_expires_at'),
  setupTokenUsedAt: timestamp('setup_token_used_at'),
  // ── Tenant / partner attribution ─────────────────────────────
  // Same semantics as on `pharmacies`. 'direct' for users created
  // via /onboard, admin console, or pharmacy-admin invite. 'hubrx'
  // for users provisioned via the HubRx SSO endpoint.
  authSource: varchar('auth_source', { length: 32 }).default('direct').notNull(),
  // Partner-side identifier (e.g. HubRx Insights user id). Required for
  // SSO'd users so we can re-resolve the same GRH user on each token.
  externalId: varchar('external_id', { length: 255 }),
  // ── Alternate login identifier ────────────────────────────────
  // For pharmacists onboarded in bulk via a partner where personal
  // emails aren't available (e.g. PPH's 43 staff pharmacists). We
  // store the GPHC registration number here, and login accepts either
  // email OR username. Direct/self-signup users never have a username
  // set; only the partner-import script populates it.
  // Unique-when-set is enforced via a partial index in the migration.
  username: varchar('username', { length: 64 }),
  // When true, the user is forced to change their password on next
  // login. Set by the bulk-import script (since the initial temp
  // password is shared with their pharmacy admin) and by admin
  // password-reset actions.
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
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

// ── Per-pharmacy PGD document overrides ─────────────────────────
//
// For customers (e.g. Pharmacy Plus Health) who supply their own
// clinically-signed versions of specific PGDs. The clinical engine
// stays canonical; only the downloadable PDF is per-pharmacy.

export const pharmacyPgdDocuments = pgTable(
  'pharmacy_pgd_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pharmacyId: uuid('pharmacy_id')
      .references(() => pharmacies.id, { onDelete: 'cascade' })
      .notNull(),
    pgdSlug: varchar('pgd_slug', { length: 255 }).notNull(),
    documentUrl: text('document_url').notNull(),
    filename: varchar('filename', { length: 500 }),
    fileSizeBytes: integer('file_size_bytes'),
    version: integer('version').default(1).notNull(),
    signedByNames: text('signed_by_names'),
    notes: text('notes'),
    isCurrent: boolean('is_current').default(true).notNull(),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('pharmacy_pgd_documents_pharmacy_slug_idx').on(table.pharmacyId, table.pgdSlug),
  ],
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

// ── User Consents (SSO first-use terms/DPA acceptance) ─────────

export const userConsents = pgTable('user_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  document: varchar('document', { length: 100 }).default('terms-dpa').notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  acceptedAt: timestamp('accepted_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
})

// ── Clinical sign-offs ─────────────────────────────────────────
// Digital sign-off register (Chris's review area): one row per sign-off
// of a PGD document, ePGD tool or training module. History retained —
// re-signing after a version change inserts a new row.
export const clinicalSignoffs = pgTable('clinical_signoffs', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemType: varchar('item_type', { length: 32 }).notNull(),
  itemSlug: varchar('item_slug', { length: 255 }).notNull(),
  itemTitle: varchar('item_title', { length: 500 }),
  itemVersion: varchar('item_version', { length: 100 }),
  signedByUserId: uuid('signed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  signedByName: varchar('signed_by_name', { length: 255 }).notNull(),
  signedByRole: varchar('signed_by_role', { length: 255 }),
  declaration: text('declaration').notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  signedAt: timestamp('signed_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── Staff Members ──────────────────────────────────────────────
// Whole-team list per group ("who booked this appointment") — distinct
// from clinicians, who deliver the consultations.

export const staffMembers = pgTable('staff_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupSlug: varchar('group_slug', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
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
  bookedByStaffId: uuid('booked_by_staff_id')
    .references(() => staffMembers.id, { onDelete: 'set null' }),
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
  deliveryDetails: text('delivery_details'),
  consultationNotes: text('consultation_notes'),

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

  // Network fingerprint of the device that saved the record. Used by the
  // admin fair-use checker — pharmacies whose consults originate from many
  // distinct /24 subnets are flagged for review (we charge per location).
  // /24 lookup is done at query time so we don't store sensitive bytes.
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),

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
// Two flavours, both stored in the same table:
//   • in_progress  — pharmacy team has started a consultation and saved
//                    it mid-way for the pharmacist to complete.
//   • phone_booking — patient phoned to book; team captured details and
//                    expected visit date; pharmacist resumes when patient
//                    arrives. draftState starts as '{}' and is populated
//                    once the consultation actually begins.
// Drafts auto-expire 30 days after creation (cron job hard-deletes them).

export const consultationDrafts = pgTable('consultation_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  pharmacyId: uuid('pharmacy_id')
    .references(() => pharmacies.id, { onDelete: 'cascade' })
    .notNull(),
  // The user (typically an assistant) who started the draft.
  createdByUserId: uuid('created_by_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  pgdSlug: varchar('pgd_slug', { length: 255 }).notNull(),
  // 'in_progress' (default) or 'phone_booking'.
  bookingType: varchar('booking_type', { length: 20 }).default('in_progress').notNull(),
  // Light demographics for the drafts list view (no full clinical data on display).
  patientFirstName: varchar('patient_first_name', { length: 100 }),
  patientLastName: varchar('patient_last_name', { length: 100 }),
  patientDob: varchar('patient_dob', { length: 10 }),
  // Patient contact number (phone bookings — for callbacks if needed).
  patientPhone: varchar('patient_phone', { length: 50 }),
  // Expected visit date — phone bookings only.
  expectedVisitDate: varchar('expected_visit_date', { length: 10 }),
  // The full PGD form state — opaque JSON the client serialises before save.
  draftState: text('draft_state').notNull(),
  // Pharmacist's optional note when handing off ("ready for clinical review").
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Auto-expire 30 days from creation. Cron deletes any row past expiresAt.
  expiresAt: timestamp('expires_at').notNull(),
})

// ── Onboarding requests ─────────────────────────────────────────
// Self-serve sign-up flow for new pharmacies. Created when the customer
// fills the public /onboard form. Moves through GoCardless and admin
// approval before becoming a real pharmacy + user pair.

export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'started',
  'dd_pending',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed',
])

export const onboardingRequests = pgTable('onboarding_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: onboardingStatusEnum('status').default('started').notNull(),

  pharmacyName: varchar('pharmacy_name', { length: 255 }).notNull(),
  pharmacyAddress: text('pharmacy_address'),
  pharmacyPostcode: varchar('pharmacy_postcode', { length: 20 }),
  pharmacyPhone: varchar('pharmacy_phone', { length: 50 }),
  pharmacyEmail: varchar('pharmacy_email', { length: 255 }),
  pharmacyGphc: varchar('pharmacy_gphc', { length: 50 }),
  pharmacyOdsCode: varchar('pharmacy_ods_code', { length: 20 }),

  // Contact fields were notNull until migration 018. They now allow null
  // because step 1 of the /onboard flow captures pharmacy details only —
  // contact details land on step 2. See last_step_completed below.
  contactFirstName: varchar('contact_first_name', { length: 100 }),
  contactLastName: varchar('contact_last_name', { length: 100 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactGphc: varchar('contact_gphc', { length: 50 }),
  contactRole: varchar('contact_role', { length: 50 }),
  // Furthest step the customer has completed in the /onboard wizard.
  //   1 = pharmacy details captured
  //   2 = pharmacist details captured
  //   3 = DD flow started (mandate redirect generated)
  lastStepCompleted: integer('last_step_completed').default(0).notNull(),

  gocardlessRedirectFlowId: varchar('gocardless_redirect_flow_id', { length: 100 }),
  gocardlessCustomerId: varchar('gocardless_customer_id', { length: 100 }),
  gocardlessMandateId: varchar('gocardless_mandate_id', { length: 100 }),
  gocardlessMandateStatus: varchar('gocardless_mandate_status', { length: 50 }),
  gocardlessSubscriptionId: varchar('gocardless_subscription_id', { length: 100 }),
  /** Monthly fee in pence (e.g. 49500 = £495). Captured at approval time. */
  monthlyFeePence: integer('monthly_fee_pence'),

  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id, { onDelete: 'set null' }),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  rejectedReason: text('rejected_reason'),

  setupTokenHash: varchar('setup_token_hash', { length: 255 }),
  setupTokenExpiresAt: timestamp('setup_token_expires_at'),
  setupTokenUsedAt: timestamp('setup_token_used_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Training attempts ───────────────────────────────────────────
// One row per quiz attempt at a training module. Used both for the live
// "is this pharmacist currently certified to deliver PGD X?" lookup and
// as an audit log of CPD activity. The pharmacist is considered competent
// in PGD X if the latest `passed=true` attempt's `module_version` is >=
// the current published version of that module (and the module has not
// had a `materialClinicalChange` published since).

export const trainingAttempts = pgTable(
  'training_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id, { onDelete: 'set null' }),
    moduleSlug: varchar('module_slug', { length: 100 }).notNull(),
    /** Semver of the module the user attempted (e.g. "1.0.0"). */
    moduleVersion: varchar('module_version', { length: 20 }).notNull(),
    correctCount: integer('correct_count').notNull(),
    totalCount: integer('total_count').notNull(),
    /** 0.0000–1.0000 — exact fraction of correct answers. */
    scoreFraction: numeric('score_fraction', { precision: 5, scale: 4 }).notNull(),
    passed: boolean('passed').notNull(),
    /**
     * Question IDs the user got wrong AND that were marked `critical: true`
     * on the module. If non-empty, the attempt fails regardless of overall
     * score.
     */
    failedCriticalQuestionIds: jsonb('failed_critical_question_ids').$type<string[]>(),
    /**
     * Submitted answers, keyed by question id → option ids. Stored verbatim
     * for audit defensibility.
     */
    answers: jsonb('answers').$type<Record<string, string[]>>().notNull(),
    attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  },
  (t) => ({
    userModuleIdx: index('idx_training_attempts_user_module').on(t.userId, t.moduleSlug),
    latestPassIdx: index('idx_training_attempts_latest_pass').on(
      t.userId,
      t.moduleSlug,
      t.passed,
      t.attemptedAt,
    ),
  }),
)

// ── Custom PGDs (admin PGD Builder) ─────────────────────────────
// Self-serve PGDs authored in /admin/pgd-builder. Each row holds the
// full structured definition (screening questions, medicines, doses,
// document sections) as JSON — one generic engine renders the ePGD
// tool and the printable PGD document from it, so new services need
// no code. `status` gates visibility: drafts are only usable by
// super_admin (with a banner); live PGDs behave exactly like the
// hand-built ones, gated per pharmacy via pharmacy_pgds.

export const customPgdStatusEnum = pgEnum('custom_pgd_status', [
  'draft',
  'live',
  'archived',
])

export const customPgds = pgTable(
  'custom_pgds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: varchar('subtitle', { length: 255 }).default('').notNull(),
    category: varchar('category', { length: 100 }).default('Custom').notNull(),
    status: customPgdStatusEnum('status').default('draft').notNull(),
    /** CustomPgdDefinition JSON — see src/lib/custom-pgd/types.ts */
    definition: jsonb('definition').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('custom_pgds_slug_unique').on(t.slug)],
)

export type CustomPgd = typeof customPgds.$inferSelect
export type NewCustomPgd = typeof customPgds.$inferInsert

// ── Device tokens (mobile push notifications) ───────────────────
// One row per app install that has granted notification permission.
// iOS rows hold raw APNs tokens; Android rows hold FCM registration
// tokens. The sender in lib/push.ts routes on `platform`. Tokens are
// upserted on every app launch (lastSeenAt refresh) and deleted when
// the provider reports them invalid.

export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    token: text('token').notNull(),
    platform: varchar('platform', { length: 10 }).notNull(), // 'ios' | 'android'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('device_tokens_token_unique').on(t.token),
    index('device_tokens_user_idx').on(t.userId),
  ],
)

export type DeviceToken = typeof deviceTokens.$inferSelect
export type NewDeviceToken = typeof deviceTokens.$inferInsert

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
export type OnboardingRequest = typeof onboardingRequests.$inferSelect
export type NewOnboardingRequest = typeof onboardingRequests.$inferInsert
export type TrainingAttempt = typeof trainingAttempts.$inferSelect
export type NewTrainingAttempt = typeof trainingAttempts.$inferInsert

// ── Booking availability ───────────────────────────────────────
// Single-row table holding the working-hours envelope + per-date
// overrides for the /book discovery-call page. Read on every booking
// request — admin edits are live immediately, no redeploy needed.

export const bookingAvailability = pgTable('booking_availability', {
  id: integer('id').primaryKey().default(1),
  weeklyDefaults: jsonb('weekly_defaults').notNull(),
  dateOverrides: jsonb('date_overrides').notNull(),
  slotMinutes: integer('slot_minutes').notNull().default(30),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
export type BookingAvailability = typeof bookingAvailability.$inferSelect
