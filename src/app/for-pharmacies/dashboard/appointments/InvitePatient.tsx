'use client'

import { useEffect, useState } from 'react'

/**
 * Invite a patient to book: emails the pharmacy's booking link with an
 * optional service and personal note, and shows the link and recent
 * invitations. Sits above the diary (migration 076).
 */
export default function InvitePatient({ bookingUrl, services }: { bookingUrl: string | null; services: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [service, setService] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [recent, setRecent] = useState<Array<{ id: string; toEmail: string; patientName: string | null; serviceName: string | null; sentAt: string; error: string | null }>>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/appointments/invite').then((r) => r.json()).then((d) => setRecent(d.invites ?? [])).catch(() => {})
  }, [open])

  async function send() {
    setNotice(null)
    if (!email.trim()) { setNotice({ kind: 'error', text: 'Enter the patient’s email address.' }); return }
    setBusy(true)
    try {
      const res = await fetch('/api/appointments/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: email, patientName: name || null, serviceName: service || null, message: message || null }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setNotice({ kind: 'error', text: d.error || `Failed (${res.status})` }); return }
      setNotice({ kind: 'ok', text: `Invitation sent to ${d.to}.` })
      setEmail(''); setName(''); setMessage('')
      const list = await fetch('/api/appointments/invite').then((r) => r.json()).catch(() => null)
      if (list?.invites) setRecent(list.invites)
    } finally { setBusy(false) }
  }

  async function copy() {
    if (!bookingUrl) return
    try { await navigator.clipboard.writeText(bookingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* no clipboard */ }
  }

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Invite patients to book</h2>
          <p className="text-xs text-gray-500">
            {bookingUrl ? <>Your booking page: <a href={bookingUrl} target="_blank" rel="noreferrer" className="text-[color:var(--tenant-primary)] underline break-all">{bookingUrl}</a></> : 'No booking page is set up for this pharmacy yet; contact Get Real Health.'}
          </p>
        </div>
        <div className="flex gap-2">
          {bookingUrl && <button onClick={copy} className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">{copied ? 'Copied' : 'Copy link'}</button>}
          <button onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 text-xs rounded-md bg-[color:var(--tenant-primary)] text-white font-medium">{open ? 'Close' : 'Email an invitation'}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Patient email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Patient first name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Service (optional)</label>
            <select value={service} onChange={(e) => setService(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">Any</option>
              {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700">Personal note (optional, replaces the standard wording)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={1000} placeholder="e.g. Following our chat today, here is the link to book your first weight management review." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          {notice && <div className={`sm:col-span-2 rounded-md p-2 text-sm ${notice.kind === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-900 border border-green-200'}`}>{notice.text}</div>}
          <div className="sm:col-span-2 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-gray-500">The email comes from your pharmacy&apos;s name with the booking link and your phone number; replies go to your pharmacy email. Patients get a confirmation when they book and a reminder the day before.</p>
            <button onClick={send} disabled={busy || !bookingUrl} className="px-4 py-2 text-sm rounded-md bg-[color:var(--tenant-primary)] text-white font-semibold disabled:opacity-50">{busy ? 'Sending…' : 'Send invitation'}</button>
          </div>
          {recent.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Recent invitations</p>
              <ul className="text-xs text-gray-600 divide-y divide-gray-100">
                {recent.slice(0, 8).map((r) => (
                  <li key={r.id} className="py-1 flex justify-between gap-3">
                    <span>{r.patientName ? `${r.patientName}, ` : ''}{r.toEmail}{r.serviceName ? ` (${r.serviceName})` : ''}</span>
                    <span className={r.error ? 'text-red-600' : 'text-gray-400'}>{r.error ? 'failed' : new Date(r.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
