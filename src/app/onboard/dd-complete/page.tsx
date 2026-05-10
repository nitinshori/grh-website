import type { Metadata } from 'next'
import DdCompleteClient from './DdCompleteClient'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Application received — Get Real Health',
  description: 'Your direct debit is set up. We review and activate within one working day.',
}

export default function DdCompletePage() {
  return (
    <Suspense fallback={<div />}>
      <DdCompleteClient />
    </Suspense>
  )
}
