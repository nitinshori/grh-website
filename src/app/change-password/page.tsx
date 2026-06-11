import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ChangePasswordClient } from './ChangePasswordClient'

export const metadata = {
  title: 'Change your password | Get Real Health',
  description: 'Set a new password for your account.',
  robots: { index: false, follow: false },
}

export default async function ChangePasswordPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login?callbackUrl=/change-password')
  }
  return <ChangePasswordClient />
}
