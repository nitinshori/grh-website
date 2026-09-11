import ColdSoresClient from "./ColdSoresClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Cold Sores (Aciclovir cream and tablets) ePGD | GRH Pharmacy",
  description: "Patient Group Direction for recurrent cold sores (herpes labialis): aciclovir 5% cream or aciclovir 200 mg tablets, patients aged 12 and over. PGD version 002, issued 11 September 2026.",
};

export default function ColdSoresPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <ColdSoresClient />
    </div>
  );
}
