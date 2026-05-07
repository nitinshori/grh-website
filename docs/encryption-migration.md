# Application-level encryption — migration plan

The `clinical_data` column on `consultation_records` is the largest concentration
of patient PHI on the platform. It's currently stored as plaintext JSON in
Postgres. The DB is encrypted at rest by Neon, but if a Neon-side breach happened
the records would all be readable.

We've built `src/lib/encryption.ts` (AES-256-GCM with a versioned payload format)
as the primitive. This doc covers how to roll it out without risking data loss.

## Phase 1 — write path only (safe)

1. Add `DATA_ENCRYPTION_KEY` env var to all Vercel environments. Generate with:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. In `POST /api/consultation-records`, wrap `JSON.stringify(clinicalData)` with
   `encrypt()` before insert.
3. The decrypt helper is **already** prefix-aware — it returns plaintext rows
   unchanged. So old rows keep working; new rows get encrypted.
4. Update `GET /api/consultation-records/[id]` to call `decrypt()` on
   `record.clinicalData` before returning. Same for the records detail page.

Ship Phase 1 alone. Verify a freshly-saved record can be opened and a record
saved before the change can still be opened.

## Phase 2 — backfill (requires care)

Once Phase 1 has been live for a week with no issues, run a one-off script to
re-encrypt existing plaintext rows:

```ts
const rows = await db.select().from(consultationRecords)
  .where(sql`clinical_data NOT LIKE 'v1:%'`).limit(500)
for (const r of rows) {
  await db.update(consultationRecords)
    .set({ clinicalData: encrypt(r.clinicalData) })
    .where(eq(consultationRecords.id, r.id))
}
```

Run in batches of 500, in a maintenance window, with full backups taken first.

## Phase 3 — search

Encrypted JSON cannot be searched by ILIKE. The structured columns
(patientFirstName, patientLastName, NHS number, medicineSupplied, etc.) are
already separate plaintext columns, so search continues to work. If full-text
search inside clinical notes is needed later, options are:

- Deterministic encryption on a small index column (HMAC of search keywords)
- Application-side decrypt-and-grep over a candidate set narrowed by structured
  fields (works up to a few thousand results)
- Switch to a search-aware approach like CipherStash CLI

## Phase 4 — key rotation

Add `DATA_ENCRYPTION_KEY_PREVIOUS`. Update `decrypt()` to try current key first
then previous on failure. Update insert/update paths to always re-encrypt with
current key. After a quarter, audit and remove the previous key.

## Risk register

- **Wrong key → data loss.** Mitigation: env vars must be backed up to
  password-manager vault before deployment; never rotate without keeping the
  previous key around for at least one quarter.
- **Performance.** AES-GCM is fast; benchmark before/after but expect <1ms
  added per record.
- **Backup/restore.** Backups now contain ciphertext — anyone restoring needs
  the matching key.
