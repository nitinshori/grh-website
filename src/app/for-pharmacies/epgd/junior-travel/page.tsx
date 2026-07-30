import JuniorTravelClient from "./JuniorTravelClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Junior Travel Vaccines ePGD | GRH Pharmacy",
  description:
    "Patient Group Direction for paediatric travel vaccines, 12 months to 17 years: hepatitis A and B, typhoid, MenACWY, rabies, Japanese encephalitis and cholera",
};

export default function JuniorTravelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <JuniorTravelClient />
    </div>
  );
}
