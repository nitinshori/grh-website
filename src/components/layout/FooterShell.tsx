import { getTenant } from "@/lib/tenant-context"
import { Footer } from "./Footer"
import { TenantFooter } from "./TenantFooter"

/**
 * Server-side shell that picks the right footer for the active tenant.
 * Default GRH tenant gets the full marketing-rich Footer (untouched).
 * White-label tenants get the minimal TenantFooter.
 */
export async function FooterShell() {
  const tenant = await getTenant()
  if (tenant.slug === "grh") return <Footer />
  return <TenantFooter tenant={tenant} />
}
