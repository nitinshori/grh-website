import type { Metadata } from 'next'
import DdCompleteClient from './DdCompleteClient'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Direct Debit complete',
  description: 'Your Direct Debit is set up. We usually approve accounts the same working day, then email your login link.',
}

export default function DdCompletePage() {
  return (
    <Suspense fallback={<div />}>
      <DdCompleteClient />
    </Suspense>
  )
}
