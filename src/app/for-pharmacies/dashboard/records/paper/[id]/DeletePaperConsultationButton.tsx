'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Soft-delete (pharmacy_admin or super_admin), same rules as tool records.
 * Inline reason box rather than window.prompt: browsers that have had
 * dialogs silenced for the site return null from prompt() and the button
 * looks dead.
 */
export default function DeletePaperConsultationButton({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onDelete() {
    if (reason.trim().length < 3) {
      setError('Please give a reason, for example "entered in error".')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/paper-consultations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Could not delete the record. Please try again.')
        setBusy(false)
        return
      }
      router.push('/for-pharmacies/dashboard/records')
    } catch {
      setError('Could not delete the record. Please try again.')
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-red-600 hover:text-red-700"
      >
        Delete this record
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm">
      <label className="block text-xs font-medium text-red-800" htmlFor="paper-delete-reason">
        Why is this record being deleted?
      </label>
      <input
        id="paper-delete-reason"
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder='For example "entered in error" or "patient erasure request"'
        className="mt-1 w-full rounded-md border border-red-200 px-2 py-1 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? 'Deleting...' : 'Delete'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setReason(''); setError(null) }}
          disabled={busy}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  )
}
