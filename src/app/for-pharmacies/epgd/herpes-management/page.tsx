import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Herpes Management Consultation ePGD",
  description: "Digital consultation tool for genital herpes management (aciclovir/valaciclovir) under Patient Group Direction. Supports first episode, recurrent episodic, and suppressive therapy.",
};

export default function HerpesToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Herpes Management ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Herpes Management — Genital HSV Treatment PGD</h1>
          <p className="text-sm text-gray-500 mt-1">Aciclovir and valaciclovir for first episode, recurrent, and suppressive therapy</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-center text-gray-600 text-sm">ePGD consultation wizard coming soon. Comprehensive sexual health and viral management framework in place.</p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD provides treatment regimens for HSV-1 and HSV-2, with counselling on viral shedding and prevention strategies.</p>
        </div>
      </div>
    </div>
  );
}
