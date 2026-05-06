import type { Metadata } from "next";
import { SoreThroatToolPage } from "./SoreThroatToolPage";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Sore Throat Test & Treat ePGD | Get Real Health",
  description:
    "UK pharmacy PGD consultation tool for sore throat assessment and management. Includes FeverPAIN scoring, rapid strep A testing guidance, and antibiotic recommendations.",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <SoreThroatToolPage />
    </div>
  );
}
