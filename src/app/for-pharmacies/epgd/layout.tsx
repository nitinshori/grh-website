import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getTenant } from '@/lib/tenant-context';
import { auth } from '@/lib/auth';
import { needsConsent } from '@/lib/consent';
import { isAppointmentsOnlyPharmacy } from '@/lib/access-pharmacies';

// Force all ePGD pages to be dynamically rendered.
// Without this, Vercel statically caches PGD pages at the edge and serves
// stale builds for several minutes after a deploy.
export const dynamic = 'force-dynamic';

// Wraps every ePGD page (the index + each individual tool) in a div that
// injects the active tenant's primary brand colour as a CSS custom
// property. Any Tailwind `bg-[color:var(--tenant-primary)]` or similar
// reference in the children picks it up automatically. Means a HubRx
// pharmacist sees HubRx blue everywhere; GRH stays teal.
export default async function ePGDLayout({ children }: { children: ReactNode }) {
  // Appointments-only customers (e.g. Pritchards) have no PGD access — block
  // the whole ePGD section server-side, not just in the nav.
  const session = await auth();
  // SSO users must accept terms/data-processing before running consultations.
  if (session?.user?.id && (await needsConsent(session.user.id))) {
    redirect('/for-pharmacies/consent?next=/for-pharmacies/epgd');
  }
  if (
    session?.user?.pharmacyId &&
    (await isAppointmentsOnlyPharmacy(session.user.pharmacyId))
  ) {
    redirect('/for-pharmacies/dashboard/appointments');
  }

  const tenant = await getTenant();
  return (
    <div
      style={{
        ['--tenant-primary' as never]: tenant.theme.primary,
        ['--tenant-primary-hover' as never]: tenant.theme.primaryHover,
      }}
    >
      {children}
    </div>
  );
}
