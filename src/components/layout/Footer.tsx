import Link from "next/link";

const pharmacyLinks = [
  { href: "/for-pharmacies", label: "Why Partner With Us" },
  { href: "/for-pharmacies/pgd-catalogue", label: "PGD Catalogue" },
  { href: "/for-pharmacies/pricing", label: "Pricing" },
  { href: "/for-pharmacies/platform", label: "Our Platform" },
  { href: "/pharmacy-plus-health", label: "Pharmacy Plus Health Hub" },
];

const patientLinks = [
  { href: "/for-patients/find-service", label: "Find a Service" },
  { href: "/for-patients/services/travel", label: "Travel Vaccinations" },
  { href: "/for-patients/services/weight", label: "Weight Management" },
  { href: "/for-patients/services/sexual-health", label: "Sexual Health" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
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
            See our PGD catalogue and transparent pricing &mdash; no
            registration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors"
            >
              View PGD Catalogue
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors border border-white/20"
            >
              Book a Demo
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
            <p className="text-sm text-blue-300 leading-relaxed">
              UK pharmacy PGD provider. Flat fee. Your data. Your business.
            </p>
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
                    className="text-sm text-blue-300 hover:text-teal-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Patients */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              For Patients
            </h3>
            <ul className="space-y-2.5">
              {patientLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-300 hover:text-teal-300 transition-colors"
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
                    className="text-sm text-blue-300 hover:text-teal-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-blue-400">
            &copy; {new Date().getFullYear()} Get Real Health. All rights
            reserved.
          </p>
          <p className="text-xs text-blue-500">
            Registered with the Care Quality Commission as an Independent
            Medical Agency.
          </p>
        </div>
      </div>
    </footer>
  );
}
