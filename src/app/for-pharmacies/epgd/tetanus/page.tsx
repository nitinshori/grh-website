import TetanusClient from "./TetanusClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Tetanus, Diphtheria and Polio ePGD | GRH Pharmacy",
  description:
    "Patient Group Direction for low-dose diphtheria, tetanus and inactivated poliomyelitis vaccine (Td/IPV, Revaxis), 10 years and over",
};

export default function TetanusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <TetanusClient />
    </div>
  );
}
