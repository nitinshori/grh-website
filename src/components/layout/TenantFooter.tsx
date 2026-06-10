import type { TenantConfig } from "@/lib/tenants"

/**
 * Minimal footer for white-labelled tenants. Carries the partner's
 * legal-entity line plus a "Powered by Get Real Health" mark when
 * `tenant.showPoweredBy` is true.
 */

interface Props {
  tenant: TenantConfig
}

export function TenantFooter({ tenant }: Props) {
  return (
    <footer
      className="mt-auto py-8 px-4 sm:px-6 lg:px-8 text-sm"
      style={{
        backgroundColor: tenant.theme.navBg,
        color: "#cbd5e1",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="font-semibold text-white mb-2">
              {tenant.displayName}
            </div>
            <p className="text-xs leading-relaxed">
              {tenant.footerLegalEntity}
            </p>
            <p className="text-xs mt-3 text-slate-400">
              This service is intended for UK registered pharmacists and
              pharmacy technicians only.
            </p>
          </div>

          {tenant.showPoweredBy && (
            <div className="text-xs sm:text-right">
              <span className="text-slate-400">Powered by</span>{" "}
              <a
                href="https://getrealhealthpgd.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:underline"
              >
                Get Real Health
              </a>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
