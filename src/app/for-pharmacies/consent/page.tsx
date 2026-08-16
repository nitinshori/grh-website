import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────
// The first-use consent screen was withdrawn on 14 Aug 2026.
//
// It blocked users out of the portal rather than informing them: the accept
// button was white text on a background taken from --tenant-primary, a CSS
// variable not defined on this route, so on a partner tenant there was
// nothing visible to click. Jane Wilkins hit it in July and Mark Pedder on
// 14 Aug ("no option to get past ts & cs").
//
// The route is kept so that any bookmark, or a stale redirect from a cached
// page, lands somewhere sensible instead of a 404.
// ─────────────────────────────────────────────────────────────────────────

export default function ConsentPage() {
  redirect('/for-pharmacies/dashboard')
}
