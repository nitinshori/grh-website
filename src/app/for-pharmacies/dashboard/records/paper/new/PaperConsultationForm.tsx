'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DateInput from '@/components/DateInput'
import { prepareUpload } from '@/components/consultation-attachments/prepare-upload'
import { PAPER_OUTCOMES, PAPER_OUTCOME_LABELS, PAPER_CONSULTATION_NOTE, type PaperOutcome } from '@/lib/paper-consultations-shared'

const input = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

export default function PaperConsultationForm({
  pgds,
  defaultPgd,
  defaultPharmacistName,
  defaultGphc,
}: {
  pgds: Array<{ slug: string; title: string }>
  defaultPgd: string
  defaultPharmacistName: string
  defaultGphc: string
}) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [pgdSlug, setPgdSlug] = useState(defaultPgd)
  const [consultationDate, setConsultationDate] = useState(today)
  const [patientName, setPatientName] = useState('')
  const [patientDob, setPatientDob] = useState('')
  const [outcome, setOutcome] = useState<PaperOutcome | ''>('')
  const [product, setProduct] = useState('')
  const [dose, setDose] = useState('')
  const [batch, setBatch] = useState('')
  const [batchExpiry, setBatchExpiry] = useState('')
  const [pharmacistName, setPharmacistName] = useState(defaultPharmacistName)
  const [pharmacistGphc, setPharmacistGphc] = useState(defaultGphc)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const needsProduct = outcome === 'supplied' || outcome === 'administered'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!pgdSlug) return setError('Please choose the PGD.')
    if (!consultationDate) return setError('Please enter the date of the consultation.')
    if (consultationDate > today) return setError('The consultation date cannot be in the future.')
    if (!patientName.trim()) return setError('Please enter the patient’s name.')
    if (!patientDob) return setError('Please enter the patient’s date of birth.')
    if (!outcome) return setError('Please choose the outcome.')
    if (needsProduct && !product.trim()) return setError('Please enter the product supplied or given.')
    if (!pharmacistName.trim() || !pharmacistGphc.trim()) return setError('Pharmacist name and GPhC number are required.')
    if (files.length === 0) return setError('Please attach the scanned paper form.')

    setBusy('Preparing files...')
    const prepared: File[] = []
    for (const f of files) {
      const p = await prepareUpload(f)
      if (!p.ok) {
        setBusy(null)
        return setError(`${f.name}: ${p.error}`)
      }
      prepared.push(p.file)
    }

    setBusy('Saving...')
    const body = new FormData()
    body.append('pgdSlug', pgdSlug)
    body.append('consultationDate', consultationDate)
    body.append('patientName', patientName.trim())
    body.append('patientDob', patientDob)
    body.append('outcome', outcome)
    body.append('product', product.trim())
    body.append('dose', dose.trim())
    body.append('batch', batch.trim())
    body.append('batchExpiry', batchExpiry)
    body.append('pharmacistName', pharmacistName.trim())
    body.append('pharmacistGphc', pharmacistGphc.trim())
    body.append('notes', notes.trim())
    body.append('file', prepared[0])

    let id: string
    try {
      const res = await fetch('/api/paper-consultations', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setBusy(null)
        return setError(data.error || (res.status === 413 ? 'That file is too large. Please use a file under 4 MB.' : 'Could not save. Please try again.'))
      }
      id = data.id
    } catch {
      setBusy(null)
      return setError('Could not save. Please check your connection and try again.')
    }

    // The record and its first scan are saved; add the rest one by one.
    const failed: string[] = []
    for (let i = 1; i < prepared.length; i++) {
      setBusy(`Uploading file ${i + 1} of ${prepared.length}...`)
      const fd = new FormData()
      fd.append('file', prepared[i])
      fd.append('paperConsultationId', id)
      try {
        const res = await fetch('/api/consultation-attachments', { method: 'POST', body: fd })
        if (!res.ok) failed.push(files[i].name)
      } catch {
        failed.push(files[i].name)
      }
    }
    const q = failed.length ? `?failed=${failed.length}` : ''
    router.push(`/for-pharmacies/dashboard/records/paper/${id}${q}`)
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>PGD *</label>
          <select value={pgdSlug} onChange={(e) => setPgdSlug(e.target.value)} className={input} required>
            <option value="">Choose the PGD</option>
            {pgds.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date of consultation *</label>
          <DateInput value={consultationDate} max={today} onChange={(e) => setConsultationDate(e.target.value)} className={input} />
        </div>
        <div />
        <div>
          <label className={labelCls}>Patient name *</label>
          <input value={patientName} onChange={(e) => setPatientName(e.target.value)} className={input} maxLength={255} autoComplete="off" />
        </div>
        <div>
          <label className={labelCls}>Patient date of birth *</label>
          <DateInput value={patientDob} max={today} onChange={(e) => setPatientDob(e.target.value)} className={input} />
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>Outcome *</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {PAPER_OUTCOMES.map((o) => (
            <label key={o} className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input type="radio" name="outcome" value={o} checked={outcome === o} onChange={() => setOutcome(o)} />
              {PAPER_OUTCOME_LABELS[o]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Product {needsProduct ? '*' : ''}</label>
          <input value={product} onChange={(e) => setProduct(e.target.value)} className={input} maxLength={255} />
        </div>
        <div>
          <label className={labelCls}>Dose given</label>
          <input value={dose} onChange={(e) => setDose(e.target.value)} className={input} maxLength={255} />
        </div>
        <div>
          <label className={labelCls}>Batch number (vaccines and medicines)</label>
          <input value={batch} onChange={(e) => setBatch(e.target.value)} className={input} maxLength={100} />
        </div>
        <div>
          <label className={labelCls}>Batch expiry</label>
          <DateInput value={batchExpiry} onChange={(e) => setBatchExpiry(e.target.value)} className={input} />
        </div>
        <div>
          <label className={labelCls}>Pharmacist name *</label>
          <input value={pharmacistName} onChange={(e) => setPharmacistName(e.target.value)} className={input} maxLength={255} />
        </div>
        <div>
          <label className={labelCls}>GPhC number *</label>
          <input value={pharmacistGphc} onChange={(e) => setPharmacistGphc(e.target.value)} className={input} maxLength={50} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={input} maxLength={5000} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Scanned paper form * (photo JPG, PNG or HEIC, or PDF, up to 10 MB each)</label>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif,application/pdf"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-gray-700 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-semibold"
        />
        {files.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{files.length} file{files.length === 1 ? '' : 's'} chosen. Photos are made smaller before upload.</p>
        )}
      </div>

      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        {PAPER_CONSULTATION_NOTE}
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!!busy}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60 transition-colors"
        >
          {busy ?? 'Save paper consultation'}
        </button>
      </div>
    </form>
  )
}
