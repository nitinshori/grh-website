import React from "react";
import { SmokingToolClient } from "./SmokingToolClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Smoking Cessation ePGD - Varenicline PGD",
  description:
    "UK Pharmacy ePGD Consultation for Varenicline (Champix) Smoking Cessation",
};

export default function SmokingCessationPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <SmokingToolClient />
    </div>
  );
}
