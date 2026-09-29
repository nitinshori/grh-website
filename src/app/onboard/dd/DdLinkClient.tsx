'use client'

import { useState } from 'react'

interface Props {
  id: string
  companyName: string
  contactName: string
  pharmacies: string[]
  feeLine: string | null
  mandateDone: boolean
  approved: boolean
}

export default function DdLinkClient({ id, companyName, contactName, pharmacies, feeLine, mandateDone, approved }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/onboarding/${id}/start-mandate`, { method: 'POST' })
      const body = (await res.json()) as { redirectUrl?: string; error?: string; detail?: string }
      if (!res.ok || !body.redirectUrl) throw new Error(body.error || 'Could not start the Direct Debit')
      window.location.href = body.redirectUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Hello {contactName}. We have set up your Get Real Health subscription for {pharmacies.length === 1 ? 'this pharmacy' : `these ${pharmacies.length} pharmacies`}:
        </p>
      </div>
      <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
        {pharmacies.map((p) => <li key={p}>{p}</li>)}
      </ul>
      {feeLine && (
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm text-teal-900">
          <span className="font-semibold">Agreed fee:</span> {feeLine}. Every PGD, ePGD tool and training module is included; no per-consultation charges. Twelve month minimum term, then 30 days&apos; notice.
        </div>
      )}
      {approved ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
          Your account is approved and active. Use the login link we emailed you, or &quot;Forgotten your password?&quot; on the login page.
        </p>
      ) : mandateDone ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
          Your Direct Debit is set up. We approve accounts within one working day and will email your login link.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            The last step is the Direct Debit for {companyName}. You will be taken to a secure GoCardless page to enter the company bank details. Nothing is collected until the account is approved, and the Direct Debit Guarantee applies.
          </p>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <button
            onClick={start}
            disabled={busy}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            {busy ? 'Redirecting to GoCardless…' : `Set up Direct Debit for ${companyName}`}
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500">Questions? Reply to our email or write to info@getrealhealthpgd.co.uk.</p>
    </div>
  )
}
