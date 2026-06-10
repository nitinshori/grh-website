/**
 * Server-side helper for reading the active tenant from the request.
 *
 * The middleware (src/middleware.ts) reads the Host header on every
 * matched request and injects an `x-tenant` header carrying the tenant
 * slug. This helper reads that header from React Server Components,
 * route handlers, and layouts, and returns the full TenantConfig.
 *
 * Usage in a server component:
 *
 *   import { getTenant } from '@/lib/tenant-context'
 *   const tenant = await getTenant()
 *   return <Header tenant={tenant} />
 *
 * If the header is missing (e.g. a route that isn't matched by the
 * middleware), this falls back to the default GRH tenant.
 */

import { headers } from 'next/headers'
import {
  type TenantConfig,
  type TenantSlug,
  ALL_TENANT_SLUGS,
  getTenantBySlug,
  tenantFromHost,
} from './tenants'

const TENANT_HEADER = 'x-tenant'

/** Returns the active tenant for the current request. */
export async function getTenant(): Promise<TenantConfig> {
  const h = await headers()
  const slug = h.get(TENANT_HEADER) as TenantSlug | null
  if (slug && ALL_TENANT_SLUGS.includes(slug)) {
    return getTenantBySlug(slug)
  }
  // Fall back to deriving from the Host header — handles cases where
  // the middleware didn't run (e.g. some edge routes) or in tests.
  const host = h.get('host')
  return tenantFromHost(host)
}

/** Returns just the tenant slug (cheaper if config not needed). */
export async function getTenantSlug(): Promise<TenantSlug> {
  return (await getTenant()).slug
}

export { TENANT_HEADER }
