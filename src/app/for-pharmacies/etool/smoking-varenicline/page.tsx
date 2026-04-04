import React from "react";
import { SmokingToolClient } from "./SmokingToolClient";

export const metadata = {
  title: "Smoking Cessation eTool - Varenicline PGD",
  description:
    "UK Pharmacy PGD Consultation eTool for Varenicline (Champix) Smoking Cessation",
};

export default function SmokingCessationPage(): React.ReactElement {
  return <SmokingToolClient />;
}
