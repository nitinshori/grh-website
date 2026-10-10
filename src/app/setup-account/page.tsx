import type { Metadata } from 'next'
import { Suspense } from 'react'
import SetupAccountClient from './SetupAccountClient'

export const metadata: Metadata = {
  title: 'Set up your account',
  description: 'Choose a password for your new Get Real Health account.',
}

export default function SetupAccountPage() {
  return (
    <Suspense fallback={<div />}>
      <SetupAccountClient />
    </Suspense>
  )
}
