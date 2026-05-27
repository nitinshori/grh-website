import Link from "next/link";
import { legal } from "@/lib/legal";

const pharmacyLinks = [
  { href: "/for-pharmacies", label: "Why Partner With Us" },
  { href: "/for-pharmacies/pgd-catalogue", label: "PGD Catalogue" },
  { href: "/for-pharmacies/pricing", label: "Pricing" },
  { href: "/for-pharmacies/platform", label: "Our Platform" },
  { href: "/pharmacy-plus-health", label: "Pharmacy+ Health Hub" },
];

/* Patient links removed — site is for pharmacy professionals only */

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "/legal/cookies", label: "Cookie Policy" },
];

export function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      {/* CTA Band */}
      <div className="bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to stop sharing your revenue?
          </h2>
          <p className="text-blue-200 mb-6 max-w-xl mx-auto">
            One flat-fee package. Every PGD, the consultation tool, training
            and clinical governance &mdash; all included.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors"
            >
              View PGD Catalogue
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors border border-white/20"
            >
              See a demo
            </Link>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">&#9877;</span>
              <span className="text-lg font-bold tracking-tight">
                Get Real Health
              </span>
            </Link>
            <p className="text-sm text-blue-200 leading-relaxed mb-4">
              UK pharmacy PGD provider. Flat fee. Your data. Your business.
            </p>
            <a
              href="https://www.linkedin.com/company/get-real-health-uk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Real Health on LinkedIn"
              className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-white/5 hover:bg-teal-500 text-blue-200 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>

          {/* For Pharmacies */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              For Pharmacies
            </h3>
            <ul className="space-y-2.5">
              {pharmacyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-teal-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-teal-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-teal-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal entity / regulatory block */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-200">
            <div>
              <p className="font-semibold text-white mb-1">
                {legal.companyName}
              </p>
              <p>
                Registered in {legal.jurisdiction} &middot; Company number{" "}
                <a
                  href={legal.companyHouseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-300 underline-offset-2 hover:underline"
                >
                  {legal.companyNumber}
                </a>
              </p>
              <p className="text-blue-400">{legal.registeredOffice}</p>
            </div>
            <div className="md:text-right">
              <p>
                Registered with the Care Quality Commission as an Independent
                Medical Agency.
              </p>
              <p>
                CQC provider ID:{" "}
                <a
                  href={legal.cqcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-300 underline-offset-2 hover:underline"
                >
                  {legal.cqcProviderId}
                </a>
              </p>
              {legal.icoRegistration ? (
                <p>
                  ICO registration:{" "}
                  <span className="text-blue-200">{legal.icoRegistration}</span>
                </p>
              ) : (
                <p className="text-blue-400 italic">
                  ICO data protection fee registration in progress.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-blue-400">
            This website is intended for UK registered pharmacists and pharmacy technicians only.
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-blue-400">
            &copy; {new Date().getFullYear()} {legal.companyName}. All rights
            reserved.
          </p>
          <p className="text-xs text-blue-500">
            <Link href="/legal/cookies" className="hover:text-teal-300">
              Cookie preferences
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
