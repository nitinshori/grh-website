"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const pharmacyLinks = [
  {
    href: "/for-pharmacies",
    label: "Why Partner With Us",
    description: "How we differ from leading competitors.",
  },
  {
    href: "/for-pharmacies/pgd-catalogue",
    label: "PGD Catalogue",
    description: "60+ PGDs across travel, weight, sexual health and more.",
  },
  {
    href: "/services/comparison",
    label: "Service Comparison",
    description: "GRH vs Pharmacy First (England + Scotland) and Welsh CAS.",
  },
  {
    href: "/for-pharmacies/pricing",
    label: "Pricing",
    description: "Flat annual fee. Get in touch for a quote.",
  },
  {
    href: "/for-pharmacies/platform",
    label: "Our Platform",
    description: "The consultation tool, training hub, and dashboard.",
  },
  {
    href: "/pharmacy-plus-health",
    label: "Pharmacy+ Health Hub",
    description:
      "Our patient-facing directory \u2014 helps your customers find you.",
  },
  {
    href: "/for-pharmacies/growth",
    label: "Grow Your Pharmacy",
    description:
      "Practice Digital \u2014 we build your website, booking system and AI chatbot.",
  },
];

/* Patient links removed — site is for pharmacy professionals only */

const mainLinks = [
  { href: "/for-pharmacies/growth", label: "Grow Your Pharmacy" },
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pharmacyDropdown, setPharmacyDropdown] = useState(false);
  /* patientDropdown removed — site is for pharmacy professionals only */
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === "super_admin";
  const dashboardHref = isAdmin ? "/admin" : "/for-pharmacies/dashboard";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <svg
              width="190"
              height="32"
              viewBox="0 0 190 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-auto"
            >
              <rect x="1" y="3" width="26" height="26" rx="7" fill="#2a4d72" />
              <polyline
                points="5,17 9,17 12,10 15,24 18,14 20,17 23,17"
                stroke="#14b8a6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <text
                x="34"
                y="15"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="800"
                fontSize="13.5"
                fill="#2a4d72"
              >
                Get Real Health
              </text>
              <text
                x="34"
                y="27"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="600"
                fontSize="7"
                fill="#14b8a6"
                letterSpacing="1.2"
              >
                PHARMACY PGD SERVICES
              </text>
            </svg>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* For Pharmacies dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPharmacyDropdown(true)}
              onMouseLeave={() => setPharmacyDropdown(false)}
            >
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive("/for-pharmacies") || isActive("/pharmacy-plus-health")
                    ? "text-teal-600"
                    : "text-gray-700 hover:text-navy-900 hover:bg-gray-50"
                }`}
              >
                For Pharmacies
                <svg
                  className="inline-block ml-1 w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {pharmacyDropdown && (
                <div className="absolute top-full left-0 mt-0 w-80 bg-white border border-gray-100 rounded-lg shadow-lg py-2">
                  {pharmacyLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-3 text-sm transition-colors ${
                        isActive(link.href)
                          ? "text-teal-600 bg-teal-50"
                          : "text-gray-700 hover:text-navy-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium block">{link.label}</span>
                      {link.description && (
                        <span className="text-xs text-gray-500 mt-0.5 block leading-snug">
                          {link.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? "text-teal-600"
                    : "text-gray-700 hover:text-navy-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  className="text-sm font-medium text-navy-900 hover:text-teal-600 transition-colors"
                >
                  My Dashboard
                </Link>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                  {session?.user?.name && (
                    <span className="mt-0.5 text-[11px] leading-tight text-gray-500">
                      Signed in as {session.user.name}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-navy-900 hover:text-teal-600 transition-colors"
                >
                  Pharmacy Login
                </Link>
                <Link
                  href="/for-pharmacies/pricing"
                  className="text-sm font-medium text-navy-900 hover:text-teal-600 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/demo"
                  className="text-sm font-medium text-navy-900 hover:text-teal-600 transition-colors"
                >
                  See a demo
                </Link>
                <Link
                  href="/onboard"
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-navy-900"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-1">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              For Pharmacies
            </p>
            {pharmacyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 text-sm rounded-md ${
                  isActive(link.href)
                    ? "text-teal-600 bg-teal-50 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-3 border-t border-gray-100" />

            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 text-sm rounded-md ${
                  isActive(link.href)
                    ? "text-teal-600 bg-teal-50 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-3 border-t border-gray-100" />

            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  My Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="block w-full text-center px-5 py-3 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Sign out
                </button>
                {session?.user?.name && (
                  <p className="text-center text-xs text-gray-500">
                    Signed in as {session.user.name}
                  </p>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-5 py-3 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Pharmacy Login
                </Link>
                <Link
                  href="/demo"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-5 py-3 border border-teal-500 text-teal-700 text-sm font-semibold rounded-lg hover:bg-teal-50 transition-colors"
                >
                  See a demo
                </Link>
                <Link
                  href="/onboard"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
