import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gonorrhoea Treatment Consultation ePGD",
  description: "Digital consultation tool for gonorrhoea treatment (ceftriaxone) under Patient Group Direction. NAAT confirmation required.",
};

export default function GonorrhoeaToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Gonorrhoea Treatment ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Gonorrhoea — Antibiotic Treatment PGD</h1>
          <p className="text-sm text-gray-500 mt-1">Ceftriaxone single dose with partner notification and co-testing support</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-center text-gray-600 text-sm">ePGD consultation wizard coming soon. Sexual health assessment framework in place.</p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD requires NAAT confirmation of gonorrhoea diagnosis. Partner notification and test of cure are essential components.</p>
        </div>
      </div>
    </div>
  );
}
