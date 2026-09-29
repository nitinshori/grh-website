import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewSignupClient from './NewSignupClient'

export const metadata = { title: 'Create a sign-up — Admin' }
export const dynamic = 'force-dynamic'

export default async function NewSignupPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return <div className="max-w-4xl mx-auto p-8"><p>Forbidden: admin only.</p></div>
  }
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a sign-up for a customer</h1>
        <p className="text-sm text-gray-500 mb-6">
          For a customer who has sent their details by email. Fill in what they gave you; they receive one link that shows the summary and starts the Direct Debit. A company with several branches is one sign-up; two legal entities need two sign-ups (one mandate each), attached to the same group at approval.
        </p>
        <NewSignupClient />
      </div>
    </div>
  )
}
