import { db } from '@/lib/db'
import { voiceCalls } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

async function getCalls() {
  return db.select().from(voiceCalls).orderBy(desc(voiceCalls.startedAt)).limit(100)
}

const ENQUIRY_COLOURS: Record<string, string> = {
  sales: 'bg-blue-100 text-blue-800',
  demo: 'bg-purple-100 text-purple-800',
  support: 'bg-amber-100 text-amber-800',
  pricing: 'bg-emerald-100 text-emerald-800',
  general: 'bg-gray-100 text-gray-800',
  other: 'bg-gray-100 text-gray-800',
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
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function truncate(text: string | null, max: number): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

export default async function VoiceCallsPage() {
  const calls = await getCalls()

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Calls</h1>
          <p className="text-gray-600">
            All inbound calls answered by the AI receptionist
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {calls.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <p className="text-gray-500 font-medium">No calls yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Calls will appear here once the phone line is live.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      When
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Caller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Pharmacy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Booked
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calls.map((call) => {
                    const enquiryKey = (call.enquiryType || 'other').toLowerCase()
                    const colour = ENQUIRY_COLOURS[enquiryKey] || ENQUIRY_COLOURS.other
                    return (
                      <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <a href={`/admin/voice-calls/${call.id}`} className="hover:underline">
                            {formatDate(call.startedAt)}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={`/admin/voice-calls/${call.id}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {call.callerName || call.callerNumber || 'Unknown'}
                          </a>
                          {call.callerNumber && call.callerName && (
                            <div className="text-xs text-gray-500">{call.callerNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {call.pharmacyName || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {call.enquiryType ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colour}`}
                            >
                              {call.enquiryType}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDuration(call.durationSeconds)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          {truncate(call.summary, 100) || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {call.appointmentBooked ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Booked
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
