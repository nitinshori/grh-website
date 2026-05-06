import AnxietyPropranololClient from "./AnxietyPropranololClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Anxiety — Propranolol ePGD | GRH Pharmacy",
  description: "Patient Group Direction for situational anxiety with propranolol",
};

export default function AnxietyPropranololPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <AnxietyPropranololClient />
    </div>
  );
}
