import type { Metadata } from "next";
import { SoreThroatToolPage } from "./SoreThroatToolPage";

export const metadata: Metadata = {
  title: "Sore Throat Test & Treat eTool | Get Real Health",
  description:
    "UK pharmacy PGD consultation tool for sore throat assessment and management. Includes FeverPAIN scoring, rapid strep A testing guidance, and antibiotic recommendations.",
};

export default function Page() {
  return <SoreThroatToolPage />;
}
