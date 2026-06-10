import type { Metadata } from 'next'
import LoginClient from './LoginClient'
import { getTenant } from '@/lib/tenant-context'

export const metadata: Metadata = {
  title: 'Sign In | Get Real Health',
  description: 'Sign in to access your PGD consultation tools.',
}

export default async function LoginPage() {
  const tenant = await getTenant()
  return <LoginClient tenant={tenant} />
}
