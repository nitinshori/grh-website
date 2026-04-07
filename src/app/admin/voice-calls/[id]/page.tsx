import { db } from '@/lib/db'
import { voiceCalls } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export default async function VoiceCallDetailPage({ params }: PageProps) {
  const { id } = await params

  const result = await db
    .select()
    .from(voiceCalls)
    .where(eq(voiceCalls.id, id))
    .limit(1)

  const call = result[0]
  if (!call) notFound()

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/admin/voice-calls"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to all calls
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {call.callerName || call.callerNumber || 'Unknown caller'}
          </h1>
          <p className="text-gray-600">{formatDate(call.startedAt)}</p>
        </div>

        {/* Booking banner */}
        {call.appointmentBooked && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <div>
                <p className="font-semibold text-green-900">Appointment booked</p>
                {call.appointmentTime && (
                  <p className="text-sm text-green-800 mt-1">
                    {formatDate(call.appointmentTime)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Caller details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Caller details
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-gray-900">{call.callerName || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Pharmacy</dt>
              <dd className="text-gray-900">{call.pharmacyName || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-gray-900">{call.callerNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-gray-900">
                {call.callerEmail ? (
                  <a href={`mailto:${call.callerEmail}`} className="text-teal-600 hover:underline">
                    {call.callerEmail}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Enquiry type</dt>
              <dd className="text-gray-900">{call.enquiryType || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Duration</dt>
              <dd className="text-gray-900">{formatDuration(call.durationSeconds)}</dd>
            </div>
          </dl>
        </div>

        {/* Recording */}
        {call.recordingUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recording</h2>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls className="w-full" src={call.recordingUrl}>
              Your browser does not support the audio element.
            </audio>
            <p className="mt-2 text-sm">
              <a
                href={call.recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline"
              >
                Open recording in new tab ↗
              </a>
            </p>
          </div>
        )}

        {/* Summary */}
        {call.summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {call.summary}
            </p>
          </div>
        )}

        {/* Transcript */}
        {call.transcript && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Full transcript</h2>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-md leading-relaxed">
              {call.transcript}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
