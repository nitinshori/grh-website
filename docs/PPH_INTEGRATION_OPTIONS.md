# Pharmacy Plus Health — Integration Options

Spec for the Pharmacy Plus Health technical team. Companion document to `HUBRX_SSO_INTEGRATION.md`; the SSO mechanism described here is identical in shape to the HubRx one already in production, just scoped to PPH.

> Polished version for emailing to PPH lives at: `outputs/PPH-Integration-Options.docx` and `outputs/PPH-Integration-Options.pdf`.

## Executive summary

PPH pharmacists currently use the GRH PGD platform by signing into `getrealhealthpgd.co.uk` directly with their GPhC number. The workflow works, but PPH and GRH have been talking about deeper integration so that:

- PPH staff move between PPH systems and GRH without re-authenticating.
- The GRH portal carries PPH branding so it reads as a co-branded service.
- PPH head office can pull consultation activity into its own reporting tools.

Three options below; recommended path = Option A + C delivered in sequence.

## Where we are today

43 PPH pharmacists have GRH accounts, created via bulk import from Jane's spreadsheet. Login is direct via GPhC number, with forced password change on first sign-in.

**Already live for PPH:**

- 60+ PGDs across all clinical categories
- Bespoke PPH-signed PGDs for the four testosterone products (Testogel, Tostran, Sustanon, Nebido), the Chest Service (Acute Bacterial Bronchitis), and PPH-specific clinical amendments on Mounjaro, Wegovy, Mysimba, Saxenda, B12, Orlistat
- Pharmacy-admin self-serve PGD upload page (Janey / Sarah)
- Pharmacy-admin usage analytics page
- Pharmacy-admin self-serve password-reset button

**Not yet built:** SSO from PPH systems; PPH-branded subdomain; machine-to-machine API for head-office reporting.

## Three integration options

### Option A — SSO + PPH-branded portal

Pharmacists click a single link from PPH's internal page and land on a PPH-branded GRH subdomain (e.g. `pgds.pharmacyplushealth.co.uk` or `pph.getrealhealthpgd.co.uk`) already signed in.

Same integration model GRH has already shipped for HubRx Insights. Plumbing exists on the GRH side.

- **PPH provides:** shared signing secret + a server-side endpoint that mints short-lived JWTs when a logged-in PPH user clicks the GRH link.
- **GRH delivers:** tenant config (subdomain + theme tokens + logo), SSO endpoint validation, DNS + TLS, header/footer rebrand.
- **Timeline:** ≈ 2 weeks (HubRx equivalent took 9 working days).

### Option B — SSO only (no subdomain change)

Same SSO mechanism, but pharmacists still land on standard `getrealhealthpgd.co.uk` with GRH branding. Faster but less co-branded feel. Recommended only as a stepping stone toward Option A.

### Option C — Machine-to-machine data API

Authenticated REST endpoint that PPH head office can call on a schedule to pull a JSON report of consultation activity (per pharmacist, PGD, pharmacy, date range). Drop into PowerBI or any internal dashboard.

Independent of A and B.

- **Authentication:** rotatable API key, scoped to PPH pharmacy IDs, read-only.
- **Privacy:** patient identifying data omitted by default; aggregate + de-identified by default. Identifying data on a separate authenticated endpoint with audit logging if governance requires it.
- **Timeline:** ≈ 1 week.

## Recommended approach

**Phase 1** — Option A SSO + branded subdomain. Solves daily friction for 43 pharmacists; signals partnership externally.

**Phase 2** — Option C data API once activity volume builds.

Combined: ≈ 3 weeks of GRH delivery from the point PPH's tech team is ready, assuming PPH's SSO side is built in parallel.

## Technical specification — SSO token contract

Same shape as `HUBRX_SSO_INTEGRATION.md`. Summarised here.

### Endpoint

```
GET https://pph.getrealhealthpgd.co.uk/sso?token={JWT}&next={path}
```

| Param   | Required | Description |
|---------|----------|-------------|
| `token` | Yes      | JWT signed with HS256 using shared secret. |
| `next`  | No       | Path on GRH side to land on after sign-in. Must start with `/`. Defaults to `/for-pharmacies/dashboard`. |

On success → session cookie scoped to PPH subdomain, redirect to `next`. On failure → explanatory error page, no partial sign-in.

### Required JWT claims

| Claim           | Type   | Notes |
|-----------------|--------|-------|
| `sub`           | string | PPH's stable unique user ID. |
| `email`         | string | Pharmacist's email. Unique across PPH users. |
| `name`          | string | Full name. Split on first whitespace for first/last. |
| `pharmacy_id`   | string | PPH's stable pharmacy ID. |
| `pharmacy_name` | string | Display name (branch name). |
| `exp`           | number | Unix expiry. ≤ 5 min from issuance recommended. |

### Optional JWT claims

| Claim   | Type   | Notes |
|---------|--------|-------|
| `role`  | string | `"pharmacist"` (default) or `"pharmacy_admin"`. |
| `gphc`  | string | GPhC reg number. Surfaced in audit logs. |
| `iat`   | number | Issued-at, recommended for audit clarity. |

### Example payload

```json
{
  "sub": "pph-user-1042",
  "email": "jane.doe@pph.example.co.uk",
  "name": "Jane Doe",
  "pharmacy_id": "branch-23",
  "pharmacy_name": "PPH Leeds Headingley",
  "role": "pharmacist",
  "gphc": "2068435",
  "exp": 1718750000,
  "iat": 1718749700
}
```

## Security and governance

GRH = CQC-registered Independent Medical Agency (provider ID 1-9971460462), HIW-registered. Records encrypted at rest, scoped per pharmacy, audit-logged. UK-region Vercel + EU Neon Postgres. ICO data-protection-fee registration in progress.

- **JWT secret rotation:** documented procedure. Existing sessions unaffected; old tokens stop validating at rotation moment.
- **Tenant isolation:** PPH user + consultation records tagged with PPH pharmacy IDs; invisible to other tenants. Same controls as HubRx.
- **Audit logging:** every SSO login logs partner identifier (`sub`), resolved GRH user, IP, user-agent, timestamp.
- **Clinical responsibility:** stays with GRH under its CQC registration. PPH is identity provider only.

## What PPH needs to provide

- Primary technical point of contact for SSO + DNS questions.
- Confirmation of the subdomain (PPH-owned vs GRH subdomain).
- Server-side endpoint that mints JWT for logged-in PPH user and 302-redirects to GRH SSO URL.
- Brand assets: PNG/SVG logo, primary + accent colour hex values, footer text and contact line.
- Sign-off on security/governance terms, or a signed DPA if governance requires.

## What GRH will deliver

- Tenant config (subdomain + theme tokens + logo).
- SSO endpoint validation against shared secret, with error logging and admin re-issue path.
- DNS, TLS, Vercel domain config for PPH-branded subdomain.
- Header / footer / login / post-login chrome rebranded.
- User provisioning: first sign-in creates GRH user record; subsequent sign-ins reuse.
- Audit log access for PPH compliance review.
- Integration sandbox URL + test token recipe.

## Commercials and timeline

Integration sits outside the standard £100 + VAT per pharmacy per month subscription — treated as a one-off project cost.

| Component                              | Estimate (ex VAT) | Calendar time |
|----------------------------------------|-------------------|---------------|
| Option A — SSO + branded subdomain     | £4,500            | ≈ 2 weeks     |
| Option C — Data API                    | £2,500            | ≈ 1 week      |
| A + C package                          | £6,000            | ≈ 3 weeks     |

Underlying GRH subscription unchanged post-integration.

## Open questions for the PPH tech team

1. Identity stack today — Active Directory, Microsoft Entra, Auth0, Okta, custom?
2. Subdomain on a PPH-owned domain or a GRH subdomain?
3. SAML/OIDC requirement vs bespoke JWT? Both feasible; JWT is faster.
4. Does PPH governance require its own DPA before user provisioning?
5. Rollout — all 43 pharmacists at once or pilot at a subset?

## Next steps

45-minute call with PPH tech lead suggested — Nitin + GRH platform engineer attend. Async Q&A by email also fine.

**Contact:** Dr Nitin Shori, Founder & Medical Director · nitin@getrealhealth.co.uk

## Annex — about Get Real Health

GRH Limited — UK pharmacy PGD provider, founded by Dr Nitin Shori (NHS GP, former Medical Director of Pharmacy2U Online Doctor Service). 60+ PGDs, training, ePGD platform, clinical governance — £100 + VAT per pharmacy per month flat.

CQC-registered Independent Medical Agency (provider ID 1-9971460462), HIW-registered. Head Pharmacist: Christopher Pilkington (IP, 30+ yrs community pharmacy). Company number 12744898. Registered office: Unit 55, First Floor, St. Asaph Business Park, St. Asaph, Denbighshire, LL17 0JG.
