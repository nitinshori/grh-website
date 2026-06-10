"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import type { TenantConfig } from "@/lib/tenants"

/**
 * Minimal header for white-labelled tenants (HubRx, future partners).
 *
 * No marketing links (those are 404'd by middleware on these tenants
 * anyway). Logo on the left, dashboard / sign-out on the right when
 * authenticated, otherwise nothing. Themed using the tenant's primary
 * brand colour.
 */

interface Props {
  tenant: TenantConfig
}

export function TenantHeader({ tenant }: Props) {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const dashboardHref = "/for-pharmacies/dashboard"

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm"
      style={{
        // CSS variables drive button + accent colours below
        ["--tenant-primary" as never]: tenant.theme.primary,
        ["--tenant-primary-hover" as never]: tenant.theme.primaryHover,
        ["--tenant-nav-bg" as never]: tenant.theme.navBg,
        ["--tenant-text-on-primary" as never]: tenant.theme.textOnPrimary,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {tenant.logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo.src}
                alt={tenant.logo.alt}
                width={tenant.logo.width}
                height={tenant.logo.height}
                className="h-10 w-auto"
              />
            ) : (
              // Text fallback until the partner ships a logo file.
              <span
                className="font-bold text-lg lg:text-xl"
                style={{ color: tenant.theme.primary }}
              >
                {tenant.displayName}
              </span>
            )}
          </Link>

          {/* Right side: dashboard / sign-out, or nothing for anon users */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  My Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                  style={{
                    backgroundColor: tenant.theme.primary,
                    color: tenant.theme.textOnPrimary,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      tenant.theme.primaryHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      tenant.theme.primary)
                  }
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{
                  backgroundColor: tenant.theme.primary,
                  color: tenant.theme.textOnPrimary,
                }}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
