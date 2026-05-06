import SmokingNRTClient from "./SmokingNRTClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Smoking Cessation — NRT ePGD | GRH Pharmacy",
  description: "Patient Group Direction for smoking cessation with nicotine replacement therapy",
};

export default function SmokingNRTPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <SmokingNRTClient />
    </div>
  );
}
