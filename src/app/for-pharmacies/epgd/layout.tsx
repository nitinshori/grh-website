import type { ReactNode } from 'react';

// Force all ePGD pages to be dynamically rendered.
// Without this, Vercel statically caches PGD pages at the edge and serves
// stale builds for several minutes after a deploy. Records-saving wiring
// changes were not landing on the live site even after the JS bundle had
// rebuilt. Forcing dynamic rendering ensures every request runs the
// latest server component code.
export const dynamic = 'force-dynamic';

export default function ePGDLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
