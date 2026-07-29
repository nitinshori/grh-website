import SkinInfectionClient from "./SkinInfectionClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Skin Infection ePGD | GRH Pharmacy",
  description:
    "Patient Group Direction for mild-to-moderate bacterial skin infections — flucloxacillin, clarithromycin or doxycycline",
};

export default function SkinInfectionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <SkinInfectionClient />
    </div>
  );
}
