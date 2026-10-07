import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appointmentTypes, pharmacies } from '@/lib/db/schema'
import AppointmentDiary from './AppointmentDiary'
import InvitePatient from './InvitePatient'

export const metadata = {
  title: 'Appointment Diary | Get Real Health',
  description: 'Manage your pharmacy appointment slots and patient bookings.',
}

export default async function AppointmentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!session.user.pharmacyId) {
    return (
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No pharmacy linked
          </h3>
          <p className="text-gray-500">
            Your account is not linked to a pharmacy. Please contact your
            administrator.
          </p>
        </div>
      </div>
    )
  }

  const [ph] = await db.select({ groupSlug: pharmacies.groupSlug }).from(pharmacies).where(eq(pharmacies.id, session.user.pharmacyId)).limit(1)
  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const bookingUrl = ph?.groupSlug ? `${appUrl}/book/${ph.groupSlug}` : null
  const services = ph?.groupSlug
    ? await db.select({ id: appointmentTypes.id, name: appointmentTypes.name }).from(appointmentTypes).where(and(eq(appointmentTypes.groupSlug, ph.groupSlug), eq(appointmentTypes.isActive, true))).orderBy(appointmentTypes.sortOrder, appointmentTypes.name)
    : []

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <InvitePatient bookingUrl={bookingUrl} services={services} />
      <AppointmentDiary />
    </div>
  )
}
