import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AppointmentDiary from './AppointmentDiary'

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

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <AppointmentDiary />
    </div>
  )
}
