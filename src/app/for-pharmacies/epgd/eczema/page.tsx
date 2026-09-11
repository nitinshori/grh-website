import EczemaClient from "./EczemaClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Eczema and Dermatitis ePGD | GRH Pharmacy",
  description: "Eczema and Dermatitis PGD v005: clobetasone butyrate 0.05% or betamethasone valerate 0.1%, 12 years and over",
};

export default function EczemaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <EczemaClient />
    </div>
  );
}
