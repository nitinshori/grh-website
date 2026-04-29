import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import SettingsPanel from './SettingsPanel'

export const metadata = {
  title: 'Appointment Settings | Get Real Health',
  description: 'Manage appointment types, clinicians, and availability.',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.pharmacyId) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <p className="text-gray-500">No pharmacy linked to your account.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <SettingsPanel />
    </div>
  )
}
