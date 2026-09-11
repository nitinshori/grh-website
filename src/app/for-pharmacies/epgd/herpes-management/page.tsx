import type { Metadata } from "next";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Herpes Management ePGD",
  description: "Herpes Management ePGD - Coming Soon. Aciclovir and valaciclovir supply for initial episodes and suppressive therapy.",
};

export default function HerpesToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-4 print:hidden">
          <a
            href="/for-pharmacies/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies/dashboard" className="hover:text-[color:var(--tenant-primary)]">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Herpes Management ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Herpes Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Aciclovir 400 mg tablets or valaciclovir 500 mg tablets for genital herpes (HSV-1 and HSV-2), patients aged 16 and over.
            Genital Herpes Management PGD, version 003, issued 11 September 2026.
          </p>
        </div>

        {/* Coming Soon Badge */}
        <div className="mb-6">
          <span className="inline-block bg-amber-100 border border-amber-300 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>

        {/* Clinical Description */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-3">What This Tool Will Include</h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Aciclovir 400 mg or valaciclovir 500 mg tablets for first episodes, recurrent episodes (started within 48 hours of onset) and suppressive therapy (6 or more recurrences a year, maximum 3 months' supply before GP or GUM review)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Episode assessment for confirmed or highly suspected genital herpes</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Exclusion checks: hypersensitivity, eGFR below 30, severe hepatic impairment, immunocompromise (any presentation), pregnancy at any gestation or breastfeeding, and emergency features (disseminated infection, meningitis, encephalitis, urinary retention)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Counselling on transmission risk and prevention, and the PGD follow-up advice</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Records: consent, name and brand of medicine, dose, form, route and quantity supplied</span>
            </li>
          </ul>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm">
            This ePGD consultation tool is currently in development. We're creating a comprehensive herpes management framework to support HSV assessment and antiviral supply.
          </p>
        </div>

        {/* Interim Guidance */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">In the meantime</h3>
          <p className="text-amber-900 text-sm">
            Please refer to the signed Genital Herpes Management PGD (version 003, issued 11 September 2026) for clinical guidance and supply under it on paper.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">No electronic consultation tool exists yet for this PGD. Any supply of aciclovir or valaciclovir for genital herpes must be made on paper under the signed Genital Herpes Management PGD (version 003).</p>
        </div>
      </div>
    </div>
  );
}
