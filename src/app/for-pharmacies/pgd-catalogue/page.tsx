import type { Metadata } from "next";
import { PGDCatalogueClient } from "./PGDCatalogueClient";

export const metadata: Metadata = {
  title: "PGD Catalogue \u2014 Services for UK Pharmacies",
  description:
    "Browse our full PGD catalogue. Testosterone, weight management, ED, menopause, travel health and more. One flat-fee package includes every PGD, the consultation tool, training and clinical support.",
};

export default function PGDCataloguePage() {
  return <PGDCatalogueClient />;
}
