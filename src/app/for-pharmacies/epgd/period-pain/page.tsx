import PeriodPainClient from "./PeriodPainClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Period Pain ePGD | GRH Pharmacy",
  description: "Patient Group Direction for primary dysmenorrhoea — naproxen / mefenamic acid",
};

export default function PeriodPainPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <PeriodPainClient />
    </div>
  );
}
