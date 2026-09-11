import FungalInfectionClient from "./FungalInfectionClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Fungal Skin Infection ePGD | GRH Pharmacy",
  description: "Patient Group Direction for superficial fungal skin infections (miconazole 2% cream) and inflamed intertrigo or infected eczema with a suspected secondary component (Trimovate cream). Version 004, issued 11 September 2026.",
};

export default function FungalInfectionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <FungalInfectionClient />
    </div>
  );
}
