# Verify Neon DB is in UK or EU

For UK pharmacy patient data, the Postgres database needs to live in the UK
or the EEA. Quick check:

1. Go to https://console.neon.tech
2. Open the project linked to `getrealhealthpgd.co.uk` (the same one whose
   connection string is in Vercel's `DATABASE_URL` env var).
3. Branches → main → look at "Region".
4. Acceptable: `aws-eu-west-1` (Ireland), `aws-eu-west-2` (London), or any
   `aws-eu-*` / `azure-eu-*` region.
5. Not acceptable for UK patient data: `aws-us-*`, `aws-ap-*`, etc.

## If it's in the wrong region

Neon doesn't currently support cross-region DB transfer in-place. The
migration is:

1. Create a new Neon project in the correct region.
2. `pg_dump` the existing DB.
3. Restore into the new project.
4. Update Vercel's `DATABASE_URL` env var across all environments.
5. Redeploy and verify.
6. Delete the old project after confirming all is working.

Keep a 7-day overlap before deleting the old project.
