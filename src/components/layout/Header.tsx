"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const pharmacyLinks = [
  { href: "/for-pharmacies", label: "Why Partner With Us" },
  { href: "/for-pharmacies/pgd-catalogue", label: "PGD Catalogue" },
  { href: "/for-pharmacies/pricing", label: "Pricing" },
  { href: "/for-pharmacies/platform", label: "Our Platform" },
];

const mainLinks = [
  { href: "/for-patients/find-service", label: "Find a Service" },
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pharmacyDropdown, setPharmacyDropdown] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">&#9877;</span>
            <div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">
                Get Real Health
              </span>
            </div>
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
                  isActive("/for-pharmacies")
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
                <div className="absolute top-full left-0 mt-0 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2">
                  {pharmacyLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        isActive(link.href)
                          ? "text-teal-600 bg-teal-50"
                          : "text-gray-700 hover:text-navy-900 hover:bg-gray-50"
                      }`}
                    >
                      {link.label}
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
            <Link
              href="/for-pharmacies/pricing"
              className="text-sm font-medium text-navy-900 hover:text-teal-600 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Book a Demo
            </Link>
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

            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
