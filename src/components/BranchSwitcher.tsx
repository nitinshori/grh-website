'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/**
 * "Working at" selector for a pharmacist with more than one branch.
 * Changing it asks the server to move the session's pharmacyId to that
 * branch (validated in the JWT callback against user_pharmacy_access), then
 * reloads the server components so records, PGD access and the sign-off
 * register all follow the chosen branch. Rendered only when there is a
 * choice to make, or when the branch being worked at is no longer in the
 * list (deactivated) and they need to move.
 */
export default function BranchSwitcher({ options, currentId }: { options: Array<{ id: string; name: string; isHome: boolean }>; currentId: string | null }) {
  const { update } = useSession()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stranded = options.length >= 1 && !options.some((o) => o.id === currentId)
  if (options.length < 2 && !stranded) return null

  async function choose(id: string) {
    if (!id || id === currentId) return
    setBusy(true)
    setError(null)
    try {
      let next: Awaited<ReturnType<typeof update>>
      try {
        next = await update({ activePharmacyId: id })
      } catch {
        setError('Could not switch branch. Please try again.')
        return
      }
      const landed = (next?.user as { pharmacyId?: string | null } | undefined)?.pharmacyId
      if (landed !== id) {
        setError(next ? 'That branch is not available to you' : 'Could not switch branch. Please try again.')
        return
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full mb-4">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">Working at</label>
      <select
        value={stranded ? '' : (currentId ?? '')}
        disabled={busy}
        onChange={(e) => choose(e.target.value)}
        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-60"
      >
        {stranded && <option value="">Choose a branch</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}{o.isHome ? ' (home)' : ''}</option>
        ))}
      </select>
      {stranded && <p className="mt-1 text-xs text-amber-700">The branch you were working at is no longer active. Choose another to continue.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-[11px] text-gray-500">Records you make are filed under this branch.</p>
    </div>
  )
}
