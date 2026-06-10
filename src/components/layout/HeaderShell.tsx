import { getTenant } from "@/lib/tenant-context"
import { Header } from "./Header"
import { TenantHeader } from "./TenantHeader"

/**
 * Server-side shell that picks the right header for the active tenant.
 * Default GRH tenant gets the full marketing-rich Header (untouched).
 * White-label tenants get the minimal TenantHeader.
 */
export async function HeaderShell() {
  const tenant = await getTenant()
  if (tenant.slug === "grh") return <Header />
  return <TenantHeader tenant={tenant} />
}
