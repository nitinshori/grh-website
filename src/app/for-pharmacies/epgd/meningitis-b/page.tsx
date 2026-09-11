import MeningitiBClient from "./MeningitiBClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export default function MeningitiBPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <PgdPageActions />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Meningitis B Vaccination (Bexsero and Trumenba)
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for privately funded meningococcal group B vaccination: Bexsero from 2 months of age, Trumenba from 10 years. Not for travel (use the MenACWY PGD) and not a replacement for the NHS routine infant programme. Meningococcal group B vaccine (Bexsero and Trumenba) PGD v004, issued 11 September 2026.
        </p>
      </div>
      <MeningitiBClient />
    </div>
  );
}
