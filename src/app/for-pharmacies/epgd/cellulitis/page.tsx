import SkinInfectionClient from "../skin-infection/SkinInfectionClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Cellulitis ePGD | GRH Pharmacy",
  description:
    "Patient Group Direction for mild cellulitis (Eron class I) of a limb or the trunk in adults aged 18 and over: flucloxacillin, clarithromycin or doxycycline",
};

// Dedicated Cellulitis entry for the Cellulitis PGD (version 003, issued
// 11 September 2026). This is a DIFFERENT document from the Skin and Soft
// Tissue Infection PGD: adults 18 and over only, MILD cellulitis (Eron
// class I) of a limb or the trunk, its own exclusion list and adult sepsis
// thresholds, and pregnancy or breastfeeding excludes all three arms. The
// consultation client is shared; variant="cellulitis" switches every gate,
// dose and counselling item to the cellulitis document.
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
