import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import DdLinkClient from './DdLinkClient'

export const metadata: Metadata = {
  title: 'Set up your Direct Debit',
  description: 'Confirm your pharmacies and set up the Direct Debit for your Get Real Health subscription.',
}
export const dynamic = 'force-dynamic'

function gbp(pence: number): string {
  return '£' + (pence / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })
}

/**
 * /onboard/dd?id=<request>&key=<resumeKey>
 * A sign-up we created for the customer. Shows what we set up and one
 * button that starts the GoCardless mandate. The key is a 48-hex secret
 * only ever sent to the contact, so nobody can start a mandate on someone
 * else's request by guessing the id.
 */
export default async function DdLinkPage({ searchParams }: { searchParams: Promise<{ id?: string; key?: string }> }) {
  const { id, key } = await searchParams
  const shell = (body: React.ReactNode) => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">{body}</div>
    </div>
  )
  if (!id || !key || !/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f]{48}$/.test(key)) {
    return shell(<Notice title="This link is not valid" body="Please use the link from our email, or reply to it and we will send a new one." />)
  }
  const [req] = await db.select().from(onboardingRequests).where(eq(onboardingRequests.id, id)).limit(1)
  if (!req || !req.resumeKey || req.resumeKey !== key) {
    return shell(<Notice title="This link is not valid" body="Please use the link from our email, or reply to it and we will send a new one." />)
  }
  if (req.status === 'rejected') {
    return shell(<Notice title="This sign-up is closed" body="Please contact us at info@getrealhealthpgd.co.uk." />)
  }
  const mandateDone = !!req.gocardlessMandateId
  const names = [req.pharmacyName, ...req.branches.map((b) => b.name)]
  const n = names.length
  const fee = req.monthlyFeePence
  const feeLine = fee != null
    ? `${gbp(fee)} per pharmacy per month (${gbp(fee * n)} per month for ${n} ${n === 1 ? 'pharmacy' : 'pharmacies'})` +
      (req.feeChangePence != null && req.feeChangeOn ? `, changing to ${gbp(req.feeChangePence)} per pharmacy from ${new Date(req.feeChangeOn + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}` : '')
    : null

  return shell(
    <DdLinkClient
      id={req.id}
      companyName={req.groupName || req.pharmacyName}
      contactName={`${req.contactFirstName ?? ''} ${req.contactLastName ?? ''}`.trim()}
      pharmacies={names}
      feeLine={feeLine}
      mandateDone={mandateDone}
      approved={req.status === 'approved' || req.status === 'completed'}
    />,
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-600 mt-2">{body}</p>
    </div>
  )
}
