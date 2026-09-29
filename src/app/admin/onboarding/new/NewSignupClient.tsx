'use client'

import { useState } from 'react'

interface Branch { name: string; gphc: string; address: string; postcode: string; phone: string; email: string }
const emptyBranch: Branch = { name: '', gphc: '', address: '', postcode: '', phone: '', email: '' }

const STANDARD_FEE_POUNDS = 100

function oneYearFromToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return `${Number(parts.slice(0, 4)) + 1}${parts.slice(4)}`
}

export default function NewSignupClient() {
  const [f, setF] = useState({
    groupName: '',
    pharmacyName: '', pharmacyGphc: '', pharmacyAddress: '', pharmacyPostcode: '', pharmacyPhone: '', pharmacyEmail: '',
    contactFirstName: '', contactLastName: '', contactEmail: '', contactPhone: '', contactGphc: '', contactRole: 'manager',
    feePounds: String(STANDARD_FEE_POUNDS), changePounds: '', changeOn: '', feeNote: '',
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ link: string; pharmacies: number } | null>(null)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }))
  const setBranch = (i: number, k: keyof Branch) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBranches((list) => list.map((b, j) => (j === i ? { ...b, [k]: e.target.value } : b)))

  async function submit() {
    setBusy(true); setError(null)
    try {
      const fee = Math.round(parseFloat(f.feePounds) * 100)
      const hasChange = f.changePounds.trim() !== '' || f.changeOn.trim() !== ''
      const res = await fetch('/api/admin/onboarding/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...f,
          branches: branches.filter((b) => b.name.trim()),
          monthlyFeePence: Number.isFinite(fee) ? fee : null,
          feeChangePence: hasChange ? Math.round(parseFloat(f.changePounds) * 100) : null,
          feeChangeOn: hasChange ? f.changeOn : null,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setResult({ link: body.link, pharmacies: body.pharmacies })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setBusy(false) }
  }

  const n = branches.filter((b) => b.name.trim()).length + 1
  const feeNum = parseFloat(f.feePounds) || 0

  if (result) {
    return (
      <div className="bg-white border border-green-300 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-green-800">Sign-up created: {result.pharmacies} {result.pharmacies === 1 ? 'pharmacy' : 'pharmacies'}</h2>
        <p className="text-sm text-gray-700">Send the contact this link. It shows what you set up and starts the Direct Debit when they click. Once the mandate completes the request appears in the queue as awaiting approval with the fee pre-filled.</p>
        <div className="flex gap-2 items-center">
          <code className="flex-1 text-xs bg-gray-50 border border-gray-200 px-2 py-2 rounded overflow-x-auto select-all">{result.link}</code>
          <button onClick={() => navigator.clipboard?.writeText(result.link)} className="text-xs px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50">Copy</button>
        </div>
        <div className="flex gap-3 pt-2">
          <a href="/admin/onboarding/new" className="text-sm text-teal-700 underline">Create another</a>
          <a href="/admin/onboarding" className="text-sm text-teal-700 underline">Back to the queue</a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Section title="Company or group">
        <Input label="Company or group name (the Direct Debit is set up in this name)" value={f.groupName} onChange={set('groupName')} placeholder="e.g. Delmergate Ltd" />
      </Section>

      <Section title="First pharmacy">
        <Input label="Pharmacy name *" value={f.pharmacyName} onChange={set('pharmacyName')} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="GPhC premises number" value={f.pharmacyGphc} onChange={set('pharmacyGphc')} />
          <Input label="Phone" value={f.pharmacyPhone} onChange={set('pharmacyPhone')} />
        </div>
        <Input label="Address" value={f.pharmacyAddress} onChange={set('pharmacyAddress')} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Postcode" value={f.pharmacyPostcode} onChange={set('pharmacyPostcode')} />
          <Input label="Pharmacy email" value={f.pharmacyEmail} onChange={set('pharmacyEmail')} />
        </div>
      </Section>

      <Section title="Other branches" action={<button type="button" onClick={() => setBranches((l) => [...l, { ...emptyBranch }])} className="text-sm text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50">+ Add a branch</button>}>
        {branches.length === 0 && <p className="text-xs text-gray-500">None. Add one for each further branch on the same company&apos;s Direct Debit.</p>}
        {branches.map((b, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Branch {i + 2}</span>
              <button type="button" onClick={() => setBranches((l) => l.filter((_, j) => j !== i))} className="text-xs text-gray-500 hover:text-red-600">Remove</button>
            </div>
            <Input label="Pharmacy name *" value={b.name} onChange={setBranch(i, 'name')} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="GPhC premises number" value={b.gphc} onChange={setBranch(i, 'gphc')} />
              <Input label="Phone" value={b.phone} onChange={setBranch(i, 'phone')} />
            </div>
            <Input label="Address" value={b.address} onChange={setBranch(i, 'address')} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Postcode" value={b.postcode} onChange={setBranch(i, 'postcode')} />
              <Input label="Branch email" value={b.email} onChange={setBranch(i, 'email')} />
            </div>
          </div>
        ))}
      </Section>

      <Section title="Account holder (receives the link and the login)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="First name *" value={f.contactFirstName} onChange={set('contactFirstName')} />
          <Input label="Last name *" value={f.contactLastName} onChange={set('contactLastName')} />
        </div>
        <Input label="Email *" value={f.contactEmail} onChange={set('contactEmail')} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="Phone" value={f.contactPhone} onChange={set('contactPhone')} />
          <Input label="GPhC number (if a pharmacist)" value={f.contactGphc} onChange={set('contactGphc')} />
          <div>
            <label className="block text-xs font-medium text-gray-700">Role</label>
            <select value={f.contactRole} onChange={set('contactRole')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="owner">Owner / Director</option>
              <option value="superintendent">Superintendent pharmacist</option>
              <option value="manager">Manager / head office</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Agreed fee">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Input label="Monthly fee per pharmacy (£ ex VAT)" value={f.feePounds} onChange={set('feePounds')} type="number" />
            <p className="text-[11px] text-gray-500 mt-1">{n} {n === 1 ? 'pharmacy' : 'pharmacies'}: £{(feeNum * n).toLocaleString('en-GB')}/month on this Direct Debit.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Scheduled change (optional)</label>
            <div className="mt-1 flex gap-2">
              <input type="number" placeholder="£ per pharmacy" value={f.changePounds} onChange={set('changePounds')} className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm" />
              <input type="date" value={f.changeOn} onChange={set('changeOn')} className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              <button type="button" className="text-teal-700 underline" onClick={() => setF((x) => ({ ...x, changePounds: String(STANDARD_FEE_POUNDS), changeOn: oneYearFromToday() }))}>Standard rate in one year</button>
            </p>
          </div>
        </div>
        <Input label="Note for the billing page" value={f.feeNote} onChange={set('feeNote')} placeholder="e.g. 10% group rate agreed for year one" />
      </Section>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
      <button onClick={submit} disabled={busy || !f.pharmacyName || !f.contactFirstName || !f.contactLastName || !f.contactEmail} className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold rounded-lg">
        {busy ? 'Creating…' : 'Create sign-up and get the link'}
      </button>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
  )
}
