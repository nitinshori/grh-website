import AlcoholReductionClient from "./AlcoholReductionClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Alcohol Reduction — Nalmefene ePGD | GRH Pharmacy",
  description: "Patient Group Direction for alcohol reduction with nalmefene",
};

export default function AlcoholReductionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <AlcoholReductionClient />
    </div>
  );
}
