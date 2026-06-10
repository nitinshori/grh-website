# HubRx Tenant Deployment Checklist

Steps to get the HubRx-branded portal live at `hubrx.getrealhealthpgd.co.uk`.

## 1. Apply DB migration

Run `drizzle/0001_add_auth_source.sql` against the production Neon DB. Adds
`auth_source` + `external_id` columns to `pharmacies` and `users`, with
indexes. Idempotent.

```bash
psql "$DATABASE_URL" -f drizzle/0001_add_auth_source.sql
```

Or paste into the Neon SQL editor.

## 2. Generate the SSO shared secret

```bash
openssl rand -hex 32
```

Save the output securely. You'll need it in two places:

- GRH side: `HUBRX_SSO_SECRET` env var in Vercel
- HubRx side: share with Sam (over a secure channel — Signal, 1Password, or
  Bitwarden Send. NOT email or Slack.)

## 3. Set the env var in Vercel

Project → Settings → Environment Variables → Add:

- Key: `HUBRX_SSO_SECRET`
- Value: (the secret from step 2)
- Environments: Production, Preview, Development

Redeploy to pick it up.

## 4. Add `hubrx` subdomain to Vercel

Project → Settings → Domains → Add domain:

- Domain: `hubrx.getrealhealthpgd.co.uk`
- Vercel will tell you the CNAME target (something like `cname.vercel-dns.com`)

## 5. Add DNS record at the domain registrar

Wherever you manage DNS for `getrealhealthpgd.co.uk`:

- Type: CNAME
- Host: `hubrx`
- Value: (the CNAME target Vercel gave you)
- TTL: 300 seconds (or default)

Wait 1-5 minutes for DNS to propagate, then Vercel will issue a Let's
Encrypt cert automatically.

## 6. Test SSL + tenant routing

Hit `https://hubrx.getrealhealthpgd.co.uk/login` in an incognito window:

- Cert valid (lock icon)
- Page shows HubRx-themed login screen (blue, no "For Pharmacies" nav)
- "Signed in to HubRx Insights?" callout visible
- No "Sign up" link (correct — partners are SSO-only)

Try hitting `https://hubrx.getrealhealthpgd.co.uk/about` — should 404.

## 7. Generate a test token + try SSO

Easiest way: a quick Node REPL.

```js
const jwt = require('jsonwebtoken')
const token = jwt.sign(
  {
    sub: 'test-user-001',
    email: 'sso-test@example.com',
    name: 'SSO Test User',
    pharmacy_id: 'test-pharm-001',
    pharmacy_name: 'SSO Test Pharmacy',
    role: 'pharmacist',
  },
  'YOUR_HUBRX_SSO_SECRET_HERE',
  { algorithm: 'HS256', expiresIn: '5m' },
)
console.log(`https://hubrx.getrealhealthpgd.co.uk/sso?token=${encodeURIComponent(token)}`)
```

Open the resulting URL. You should land on the dashboard, signed in as
"SSO Test User" attached to "SSO Test Pharmacy".

Check the DB:

```sql
SELECT id, name, auth_source, external_id FROM pharmacies WHERE auth_source = 'hubrx';
SELECT id, email, auth_source, external_id FROM users WHERE auth_source = 'hubrx';
```

You should see the test pharmacy + user with `auth_source = 'hubrx'`.

## 8. Send Sam the integration spec

Email Sam (`sam.barker@pharmacyplushealth.co.uk`) with:

- Link to `docs/HUBRX_SSO_INTEGRATION.md` (or paste contents inline)
- The shared secret (via secure channel, separately)
- The endpoint URL: `https://hubrx.getrealhealthpgd.co.uk/sso`
- An offer to do a 30-min screen-share to walk through the test token flow

## 9. Optional: add HubRx logo + tighten brand colours

Currently the HubRx tenant config (`src/lib/tenants.ts`) uses a text
wordmark and provisional blue tones. Once Sam shares brand assets:

1. Drop the logo file (SVG preferred, PNG OK) into `public/logos/hubrx.svg`
2. Edit `src/lib/tenants.ts`:
   - Set `logo.src = '/logos/hubrx.svg'`
   - Update `logo.width` / `logo.height` to actual dimensions
   - Update `theme.primary` / `theme.primaryHover` / `theme.navBg` to
     HubRx's actual brand hex codes (Chrome DevTools picker on their site
     is fastest)
3. Verify visually at `https://hubrx.getrealhealthpgd.co.uk/login`

## 10. Production smoke test with Sam

Have Sam mint a real token from his end and click through. End-to-end
verification.

## Rollback

If anything's wrong:

1. In Vercel, remove the `hubrx.getrealhealthpgd.co.uk` domain (instant —
   subdomain stops responding)
2. Or revert the relevant commits and re-deploy

The DB migration is additive (only adds nullable columns) so no rollback
needed there.
