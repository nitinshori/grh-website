import type { Metadata } from 'next'
import OnboardClient from './OnboardClient'

export const metadata: Metadata = {
  title: 'Sign up — Get Real Health',
  description:
    'Sign up your pharmacy for the Get Real Health PGD platform. One flat monthly fee, every PGD included, set up in minutes.',
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
