import MMRClient from "./MMRClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export default function MMRPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <PgdPageActions />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          MMR Top-up Vaccination
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for measles, mumps and rubella vaccination with MMRVaxPRO or Priorix (version 004, issued 11 September 2026). Individuals aged 12 months and over without two documented doses. Two doses of 0.5 mL subcutaneously, at least 4 weeks apart.
        </p>
      </div>
      <MMRClient />
    </div>
  );
}
