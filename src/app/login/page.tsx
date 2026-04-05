import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Sign In | Get Real Health',
  description: 'Sign in to access your PGD consultation tools.',
}

export default function LoginPage() {
  return <LoginClient />
}
