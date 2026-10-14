'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Remove one attached scan (pharmacy_admin or super_admin). Asks for a reason inline. */
export function RemoveAttachmentButton({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    if (reason.trim().length < 3) {
      setError('Please give a reason.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/consultation-attachments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Could not remove the file. Please try again.')
        setBusy(false)
        return
      }
      setOpen(false)
      setReason('')
      setBusy(false)
      router.refresh()
    } catch {
      setError('Could not remove the file. Please try again.')
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-red-600 hover:text-red-700 print:hidden"
      >
        Remove
      </button>
    )
  }

  return (
    <div className="w-full mt-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason, e.g. wrong patient"
          maxLength={255}
          autoFocus
          className="flex-1 min-w-[12rem] rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? 'Removing...' : 'Remove file'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={busy}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  )
}
