import type { Metadata } from 'next'
import OnboardClient from './OnboardClient'

export const metadata: Metadata = {
  title: 'Sign up — Get Real Health',
  description:
    'Sign up your pharmacy for the Get Real Health PGD platform. One flat monthly fee, every PGD included, set up in minutes.',
}

export default function OnboardPage() {
  return <OnboardClient />
}
