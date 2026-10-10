import type { Metadata } from 'next'
import OnboardClient from './OnboardClient'

export const metadata: Metadata = {
  title: 'Sign up',
  description:
    'Sign up your pharmacy for the Get Real Health PGD platform. One flat monthly fee, every PGD included. Sign up in about 10 minutes; we usually approve the same working day.',
}

/**
 * /onboard            one pharmacy (branches can still be added on step 1)
 * /onboard?group=1    opens in group mode: a second branch row is already
 *                     there and the copy speaks to a multi-site group.
 */
export default async function OnboardPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const sp = await searchParams
  return <OnboardClient groupMode={sp.group === '1' || sp.group === 'true'} />
}
