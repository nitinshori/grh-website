import SkinInfectionClient from "../skin-infection/SkinInfectionClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Cellulitis ePGD | GRH Pharmacy",
  description:
    "Patient Group Direction for mild cellulitis and erysipelas — flucloxacillin, clarithromycin or doxycycline",
};

// Dedicated Cellulitis entry (per PPH's signed Cellulitis PGD). The
// clinical pathway, drugs, exclusions and dosing are identical to the
// Skin Infection PGD, so the consultation client is shared with the
// infection type preset to cellulitis/erysipelas.
export default function CellulitisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <SkinInfectionClient variant="cellulitis" />
    </div>
  );
}
