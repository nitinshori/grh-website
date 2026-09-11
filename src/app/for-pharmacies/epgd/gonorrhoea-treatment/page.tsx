import type { Metadata } from "next";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Gonorrhoea Treatment Consultation ePGD",
  description: "Gonorrhoea Treatment Consultation ePGD - Coming Soon. Ceftriaxone 1 g IM (reconstituted with lidocaine 1%) under PGD version 004, issued 11 September 2026, for adults with a positive NAAT or strong clinical suspicion with a clear epidemiological link.",
};

export default function GonorrhoeaToolPage() {
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
            <span className="text-navy-900 font-medium">Gonorrhoea Treatment Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Gonorrhoea Treatment Consultation</h1>
          <p className="text-sm text-gray-600 mt-1">Ceftriaxone 1 g IM, reconstituted with 3.5 mL lidocaine 1%, under PGD version 004, issued 11 September 2026</p>
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
              <span>Ceftriaxone 1 g single IM dose into the gluteal muscle, reconstituted with 3.5 mL lidocaine 1% (both supplied under the PGD; never given intravenously), for adults aged 18 and over with a positive NAAT or strong clinical suspicion with a clear epidemiological link</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Exclusion screening: cephalosporin anaphylaxis, severe penicillin allergy, lidocaine hypersensitivity or SmPC contraindications, complicated infection (DGI, meningitis, endocarditis)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Anaphylaxis provision: adrenaline 1 in 1,000 immediately available, written protocol, 15 minute seated observation recorded, sharps disposal</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Partner notification guidance (contacts within 2 weeks)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Test of cure scheduling at 2 weeks</span>
            </li>
          </ul>
          <p className="text-amber-700 text-sm mt-4 pt-4 border-t border-gray-200">
            <strong>Note:</strong> Requires intramuscular injection competence, anaphylaxis recognition and management training and current basic life support training.
          </p>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm">
            This ePGD consultation tool is currently in development. No electronic consultation record is created for this PGD yet.
          </p>
        </div>

        {/* Interim Guidance */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">Until the tool is live: keep a full written record</h3>
          <p className="text-amber-900 text-sm mb-3">
            Work from the signed PGD (download above). The platform does not store anything for this PGD, so every item in the
            PGD&apos;s records list must be kept in writing, signed and dated, at the pharmacy for 8 years:
          </p>
          <ul className="text-amber-900 text-sm space-y-1 list-disc list-inside">
            <li>Valid informed consent, obtained before the injection</li>
            <li>Patient name, address, date of birth and GP</li>
            <li>Diagnosis basis: positive NAAT, or strong clinical suspicion with a clear epidemiological link; site of infection</li>
            <li>Every exclusion asked about and absent; allergy history (cephalosporins, penicillins, lidocaine)</li>
            <li>Adrenaline 1 in 1,000 immediately available and in date; written anaphylaxis protocol available</li>
            <li>Ceftriaxone batch number and expiry; lidocaine 1% batch number and expiry; injection site; given intramuscularly, never intravenously</li>
            <li>15 minute seated observation completed and the time recorded</li>
            <li>Advice given (partner notification within 2 weeks, abstinence, test of cure at 2 weeks, injection site, allergic reaction, severe diarrhoea), PIL supplied</li>
            <li>Advice given and the decision reached if the patient is excluded or declines; any adverse reaction and the action taken (Yellow Card)</li>
            <li>Name and GPhC number of the pharmacist, and that the medicine was supplied under this PGD</li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD requires a positive NAAT for N. gonorrhoeae or strong clinical suspicion with a clear epidemiological link. Partner notification and test of cure at 2 weeks are essential components. PGD version 004, issued 11 September 2026.</p>
        </div>
      </div>
    </div>
  );
}
