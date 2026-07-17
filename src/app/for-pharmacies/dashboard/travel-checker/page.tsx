import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAppointmentsOnlyPharmacy } from '@/lib/access-pharmacies'
import { listDestinations } from '@/data/travel-destinations'
import { TravelCheckerClient } from './TravelCheckerClient'

export const metadata = {
  title: 'Travel destination checker | Get Real Health',
  description:
    'Enter the patient\'s destination — see the recommended vaccines, malaria risk, and entry requirements, then go straight into the matching ePGD.',
  robots: { index: false, follow: false },
}

export default async function TravelCheckerPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  if (session.user.pharmacyId && (await isAppointmentsOnlyPharmacy(session.user.pharmacyId))) {
    redirect('/for-pharmacies/dashboard/appointments')
  }

  const destinations = listDestinations()

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Travel destination checker
        </h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Tell us where the patient is travelling. We&apos;ll show the
          recommended vaccines, malaria status and entry requirements,
          then take you straight into the matching ePGD.
        </p>
      </header>

      <TravelCheckerClient destinations={destinations} />

      <p className="text-xs text-gray-500 mt-10 max-w-2xl">
        Clinical content is aligned to NaTHNaC (Travel Health Pro)
        published guidance. This tool supports decision-making — it does
        not replace pharmacist judgement or a personalised risk
        assessment carried out inside the ePGD consultation.
      </p>
    </div>
  )
}
