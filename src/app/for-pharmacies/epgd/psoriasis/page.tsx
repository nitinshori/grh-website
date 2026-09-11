import PsoriasisClient from "./PsoriasisClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Psoriasis ePGD | GRH Pharmacy",
  description: "Plaque Psoriasis PGD v006: calcipotriol 50 micrograms/g with betamethasone 0.5 mg/g, adults 18 and over, stable plaque psoriasis",
};

export default function PsoriasisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <PsoriasisClient />
    </div>
  );
}
