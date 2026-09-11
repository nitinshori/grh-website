import ChickenpoxClient from "./ChickenpoxClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export default function ChickenpoxPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <PgdPageActions />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Varicella (Chickenpox) Vaccination
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for varicella vaccination with Varivax or Varilrix in susceptible individuals aged 12 months and over with no history of chickenpox. Two 0.5 mL doses. Varivax and Varilrix Chickenpox Vaccination PGD v004, issued 11 September 2026.
        </p>
      </div>
      <ChickenpoxClient />
    </div>
  );
}
