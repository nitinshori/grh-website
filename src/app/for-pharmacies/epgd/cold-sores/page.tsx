import ColdSoresClient from "./ColdSoresClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Cold Sores — Oral Aciclovir ePGD | GRH Pharmacy",
  description: "Patient Group Direction for cold sores treatment with oral aciclovir",
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
