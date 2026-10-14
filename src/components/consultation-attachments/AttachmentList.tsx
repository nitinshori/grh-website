import { RemoveAttachmentButton } from './RemoveAttachmentButton'

/**
 * Attached scans of paper forms, each opened through the access-checked
 * file route (the Blob store is private). pharmacy_admin and super_admin
 * also get a Remove button.
 */
export function AttachmentList({
  attachments,
  role,
}: {
  role?: string | null
  attachments: Array<{ id: string; fileName: string; contentType: string; sizeBytes: number; createdAt: Date | string }>
}) {
  const canRemove = role === 'pharmacy_admin' || role === 'super_admin'
  if (attachments.length === 0) {
    return <p className="text-sm text-gray-500">No paper forms attached.</p>
  }
  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
      {attachments.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
          <span className="text-xs font-semibold uppercase text-gray-500 w-10">
            {a.contentType === 'application/pdf' ? 'PDF' : 'Photo'}
          </span>
          <span className="flex-1 truncate text-gray-900">{a.fileName}</span>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {(a.sizeBytes / 1024 / 1024).toFixed(1)} MB,{' '}
            {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <a
            href={`/api/consultation-attachments/${a.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 font-medium print:hidden"
          >
            View
          </a>
          {canRemove && <RemoveAttachmentButton id={a.id} />}
        </li>
      ))}
    </ul>
  )
}
