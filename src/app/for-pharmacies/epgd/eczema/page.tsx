import EczemaClient from "./EczemaClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Eczema Flare Management ePGD | GRH Pharmacy",
  description: "Patient Group Direction for eczema flare management",
};

export default function EczemaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <EczemaClient />
    </div>
  );
}
