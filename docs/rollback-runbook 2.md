# Rollback runbook

If something goes wrong during the launch-week feature push, you can roll back
in two layers — code and database — independently.

## Tag created before the launch-week features

`pre-launch-features-2026-05-09` — points at the merge commit that contains
Moin's batch-1 feedback (autofill, GP search, drafts, Hep A/B / Typhoid /
Yellow Fever, GP notification, booking-page tile) but does NOT include the
new self-serve onboarding, admin analytics, or any further hardening work.

## Code rollback (Vercel)

### Option A — instant rollback via Vercel UI

1. Go to https://vercel.com/nitinshoris-projects/grh-website/deployments
2. Find the deployment that succeeded **before** the offending change (the
   one for the `pre-launch-features-2026-05-09` tag is a safe target).
3. Click the three-dot menu → **Promote to Production**.
4. Within ~30 seconds, https://getrealhealthpgd.co.uk serves the older build.

### Option B — rollback main in git, then redeploy

```
git checkout main
git reset --hard pre-launch-features-2026-05-09
git push --force-with-lease origin main
```

Vercel will rebuild from the new HEAD. ~2 minutes.

> Use Option A for emergencies — it's faster and doesn't rewrite history.

## Database rollback (Neon eu-west-2)

Neon takes automatic point-in-time snapshots and retains them for 7 days on
the Free tier (longer on paid). To restore:

1. Open https://console.neon.tech/app/projects/aged-cloud-24161638
2. Click **Branches** → **Create branch** → **From a specific time**.
3. Pick the timestamp **just before** the problem (e.g. before a destructive
   migration ran).
4. Name it something like `rollback-to-saturday-evening`.
5. Copy the **pooled connection string** for that new branch.
6. In Vercel → Project → Settings → Environment Variables, edit
   `DATABASE_URL` to the new branch's pooled URL.
7. Trigger a redeploy.

The original branch and data are untouched — you can flip back at any time by
reverting `DATABASE_URL`.

## us-east-1 safety-net DB

Until **May 14 2026**, the original us-east-1 Neon project
(`late-recipe-27702361`) is still alive and reachable at the URL stored in
`DATABASE_URL_OLD` in `.env.local`. If both eu-west-2 branches get corrupted,
that project is the last-resort fallback.

After May 14, delete the us-east-1 project from the Neon console — eu-west-2
will be the sole copy.

## Test users (for smoke testing rollback)

If you need to verify the rolled-back build works without touching real users'
data, log in as either of:

- `test-moins@grhpharmacy.test` / `TestSmoke2026!`  → Moin's Chemist
- `test-pph@grhpharmacy.test` / `TestSmoke2026!`    → Pharmacy Plus Health
