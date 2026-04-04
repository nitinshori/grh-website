import React from "react";
import { SmokingToolClient } from "./SmokingToolClient";

export const metadata = {
  title: "Smoking Cessation ePGD - Varenicline PGD",
  description:
    "UK Pharmacy ePGD Consultation for Varenicline (Champix) Smoking Cessation",
};

export default function SmokingCessationPage(): React.ReactElement {
  return <SmokingToolClient />;
}
