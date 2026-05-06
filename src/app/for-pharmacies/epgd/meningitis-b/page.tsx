import MeningitiBClient from "./MeningitiBClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export default function MeningitiBPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <PgdPageActions />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Meningitis B Vaccination (Bexsero)
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for meningococcal serogroup B vaccination in high-risk groups.
        </p>
      </div>
      <MeningitiBClient />
    </div>
  );
}
