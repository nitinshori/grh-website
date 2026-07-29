import PsoriasisClient from "./PsoriasisClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Psoriasis ePGD | GRH Pharmacy",
  description: "Patient Group Direction for mild-to-moderate plaque psoriasis — calcipotriol / betamethasone",
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
