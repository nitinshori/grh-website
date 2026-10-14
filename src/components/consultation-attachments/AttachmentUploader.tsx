'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { prepareUpload } from './prepare-upload'

/**
 * "Attach signed paper form": pick one or more photos or PDFs of the
 * completed paper form and add them to a saved record. Files go up one per
 * request, compressed in the browser first (see prepare-upload.ts).
 */
export function AttachmentUploader({
  consultationRecordId,
  paperConsultationId,
  refreshOnUpload = true,
  label = 'Attach signed paper form',
}: {
  consultationRecordId?: string
  paperConsultationId?: string
  /** Re-render the server page so its attachment list updates. */
  refreshOnUpload?: boolean
  label?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState<Array<{ id: string; fileName: string }>>([])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setErrors([])
    const errs: string[] = []
    let added = 0
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      setBusy(files.length > 1 ? `Uploading ${i + 1} of ${files.length}...` : 'Uploading...')
      const prepared = await prepareUpload(f)
      if (!prepared.ok) {
        errs.push(`${f.name}: ${prepared.error}`)
        continue
      }
      const body = new FormData()
      body.append('file', prepared.file)
      if (consultationRecordId) body.append('consultationRecordId', consultationRecordId)
      if (paperConsultationId) body.append('paperConsultationId', paperConsultationId)
      try {
        const res = await fetch('/api/consultation-attachments', { method: 'POST', body })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          errs.push(`${f.name}: ${data.error || (res.status === 413 ? 'That file is too large. Please use a file under 4 MB.' : 'The upload failed. Please try again.')}`)
          continue
        }
        added += 1
        setDone((d) => [...d, { id: data.attachment.id, fileName: data.attachment.fileName }])
      } catch {
        errs.push(`${f.name}: The upload failed. Please check your connection and try again.`)
      }
    }
    setBusy(null)
    setErrors(errs)
    if (added > 0 && refreshOnUpload) router.refresh()
  }

  return (
    <div className="print:hidden">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif,application/pdf"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        disabled={!!busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-600 bg-white text-teal-700 text-sm font-semibold hover:bg-teal-50 disabled:opacity-60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {busy ?? label}
      </button>
      <p className="text-xs text-gray-500 mt-1.5">
        Photo (JPG, PNG or HEIC) or PDF, up to 10 MB each. You can choose several files.
      </p>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {errors.map((e) => (
            <li key={e} className="text-xs text-red-700">{e}</li>
          ))}
        </ul>
      )}
      {!refreshOnUpload && done.length > 0 && (
        <ul className="mt-2 space-y-1">
          {done.map((a) => (
            <li key={a.id} className="text-xs text-green-700">
              Attached:{' '}
              <a href={`/api/consultation-attachments/${a.id}/file`} target="_blank" rel="noopener noreferrer" className="underline">
                {a.fileName}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
