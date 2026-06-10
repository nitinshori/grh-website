# HubRx Insights → GRH PGD Service: SSO Integration

How HubRx Insights authenticates its pharmacists into the GRH PGD platform.

## Overview

Pharmacists logged into HubRx Insights click a "PGDs" link, which generates a short-lived signed token and redirects them to the GRH PGD service at `https://hubrx.getrealhealthpgd.co.uk`. GRH validates the token, finds or creates the corresponding GRH user, and signs them in. From the pharmacist's perspective it's one click.

GRH is the regulated body delivering the PGD service (CQC + HIW registered as an Independent Medical Agency). HubRx is the identity provider only — GRH owns the consultation workflow, the patient records, and the clinical governance.

## Endpoint

```
GET https://hubrx.getrealhealthpgd.co.uk/sso?token={JWT}&next={optional safe path}
```

| Param   | Required | Description                                                                 |
|---------|----------|-----------------------------------------------------------------------------|
| `token` | Yes      | Signed JWT, see "Token contract" below.                                     |
| `next`  | No       | Path on the GRH side to redirect to after sign-in. Must start with `/`. Defaults to `/for-pharmacies/dashboard`. |

On success the user receives a NextAuth session cookie (scoped to `hubrx.getrealhealthpgd.co.uk`) and is redirected to `next` (or the dashboard).

On failure they see an error page explaining what to do next. No partial sign-in state.

## Token contract

JWT signed with **HS256** using a shared secret. Tokens must be short-lived (recommended **5 minutes** maximum lifetime — anything more increases replay risk).

### Required claims

| Claim           | Type     | Notes                                                                |
|-----------------|----------|----------------------------------------------------------------------|
| `sub`           | string   | The user's unique ID in HubRx Insights. Stable across sessions.      |
| `email`         | string   | Lower-cased recommended. Must be unique on GRH side.                 |
| `name`          | string   | Full name. We split on first whitespace into firstName/lastName.     |
| `pharmacy_id`   | string   | The pharmacy's unique ID in HubRx Insights. Stable across sessions.  |
| `pharmacy_name` | string   | Pharmacy display name. Required at first-ever sign-in of any user from this pharmacy. |
| `exp`           | number   | Unix timestamp. ≤ 5 min from `iat` recommended.                      |

### Optional claims

| Claim           | Type     | Notes                                                                |
|-----------------|----------|----------------------------------------------------------------------|
| `role`          | string   | `"pharmacist"` (default) or `"pharmacy_admin"`. Anything else maps to pharmacist. |
| `iat`           | number   | Issued-at timestamp. Recommended for audit clarity.                  |
| `iss`           | string   | Issuer. Currently ignored — reserved for future enforcement.         |
| `aud`           | string   | Audience. Currently ignored — reserved for future enforcement.       |

### Example token (decoded payload)

```json
{
  "sub": "hubrx-user-a1b2c3d4",
  "email": "jane.bloggs@bloggspharmacy.co.uk",
  "name": "Jane Bloggs",
  "pharmacy_id": "hubrx-pharm-9988",
  "pharmacy_name": "Bloggs Pharmacy, Sheffield",
  "role": "pharmacy_admin",
  "iat": 1717948200,
  "exp": 1717948500
}
```

### Signing example (Node)

```ts
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  {
    sub: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    pharmacy_id: user.pharmacyId,
    pharmacy_name: user.pharmacyName,
    role: user.isAdmin ? 'pharmacy_admin' : 'pharmacist',
  },
  process.env.GRH_SSO_SECRET, // shared with GRH
  {
    algorithm: 'HS256',
    expiresIn: '5m',
  },
)

// Then redirect the user to:
res.redirect(
  `https://hubrx.getrealhealthpgd.co.uk/sso?token=${encodeURIComponent(token)}`,
)
```

## Shared secret

A single HS256 secret is shared between HubRx Insights and GRH:

- Minimum 32 characters
- Recommended 64 random hex characters or base64 (≥48 chars when base64)
- Stored as `HUBRX_SSO_SECRET` in GRH's Vercel env
- Stored as `GRH_SSO_SECRET` (or equivalent) in HubRx Insights env
- **Never put it in source control, browser code, or logs.**

### Rotation

If the secret is suspected of being compromised, rotate it:

1. Generate a new secret.
2. HubRx deploys the new secret first (their side keeps signing).
3. GRH adds the new secret as an *additional* accepted secret for 24h (running both).
4. After 24h, GRH removes the old secret.

(In v1 we accept one secret at a time. If we need overlap-rotation, GRH will add a `HUBRX_SSO_SECRET_PREVIOUS` env var — ping us before rotating.)

## User lifecycle

### First sign-in

When a token arrives for a user GRH has never seen, GRH:

1. Looks up the pharmacy by `(auth_source='hubrx', external_id=pharmacy_id)`. If not found, creates the pharmacy record.
2. Looks up the user by `(auth_source='hubrx', external_id=sub)`. If not found, also checks by `email` to avoid duplicates. If still not found, creates the user, attaches them to the pharmacy, marks `auth_source='hubrx'` and `external_id=sub`.
3. Sets a random unguessable password hash on the user. The user can later set a real password via GRH's `/account/set-password` flow if they want a direct-login fallback.

### Returning sign-in

The token's `sub` and `pharmacy_id` are sufficient to identify both user and pharmacy. We don't re-create. If the `email` or `name` claims have changed in HubRx since last sign-in, we don't update them on the GRH side automatically — talk to us if you want that behaviour.

### Deactivating a user

When HubRx removes a user, **call GRH's deactivation webhook**:

```
POST https://hubrx.getrealhealthpgd.co.uk/api/sso/deactivate
Authorization: Bearer {HUBRX_SSO_SECRET}   # same shared secret, used as bearer
Content-Type: application/json

{ "external_id": "hubrx-user-a1b2c3d4" }
```

GRH marks `is_active = false` on that user. Within 60 seconds (cache TTL) any active session is forcibly logged out at the next request.

> *Webhook endpoint isn't built yet — flagged on the task list. For v1 we can do this manually until the webhook lands. Tell Nitin if a HubRx user leaves so he can deactivate.*

## Training gate

GRH requires all pharmacists to complete the relevant clinical training module + competency assessment before any PGD becomes accessible to them. This is non-negotiable from a CQC/HIW point of view.

In practical terms: first-time HubRx users who SSO in will be able to view the dashboard and the PGD catalogue, but the "Start ePGD" buttons will redirect them to `/for-pharmacies/dashboard/training` until they've completed the relevant assessments. This is the same behaviour every other GRH pharmacist sees.

## What we do NOT support

- **Iframe embedding**. The GRH portal sets `X-Frame-Options: DENY`. Open in a new tab instead.
- **OAuth / OIDC**. v1 is just signed JWT in URL. If you want OIDC later, we can build it.
- **API access to raw PGD content**. PGDs and the consultation workflow stay inside the GRH-regulated platform. SSO is the integration boundary.
- **Patient data flowing back to HubRx**. Patient records are GRH-controlled with the HubRx pharmacy as data controller, same as our other partners.

## Errors

| Status | Body                                                  | Meaning                                                   |
|--------|-------------------------------------------------------|-----------------------------------------------------------|
| 400    | "Missing token"                                       | `token` query param absent.                               |
| 400    | "Sign-in failed"                                      | Token signature invalid, expired, or claims malformed.    |
| 404    | "Not found"                                           | Tenant doesn't support SSO (e.g. someone hit `/sso` on the main GRH domain). |

All error pages are fully styled (HubRx blue) and tell the user to return to HubRx Insights and try again.

## Sandbox / dev

GRH can issue you a dev secret and a sandbox subdomain. Ask Nitin.

For local end-to-end testing, point your hosts file:

```
127.0.0.1 hubrx.localhost
```

Then HubRx Insights running locally can redirect to `http://hubrx.localhost:3000/sso?token=...`. GRH's tenant resolver accepts `hubrx.localhost` and `hubrx.lvh.me` as alternate hostnames for this purpose.

## Questions

Contact: Dr Nitin Shori, `nitinshori@me.com`.
