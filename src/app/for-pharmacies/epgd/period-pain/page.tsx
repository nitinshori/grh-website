import PeriodPainClient from "./PeriodPainClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Period Pain ePGD | GRH Pharmacy",
  description: "Patient Group Direction for primary dysmenorrhoea, naproxen or mefenamic acid, version 004, issued 11 September 2026",
};

export default function PeriodPainPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
        <div className="mt-4">
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Period Pain Consultation</h1>
          <p className="text-gray-600">Naproxen or Mefenamic acid for Period Pain (Dysmenorrhoea) PGD, version 004, issued 11 September 2026. Females aged 16 years and older; one cycle per supply.</p>
        </div>
      </div>
      <PeriodPainClient />
    </div>
  );
}
