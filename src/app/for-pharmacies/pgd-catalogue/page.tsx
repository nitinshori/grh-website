import type { Metadata } from "next";
import { PGDCatalogueClient } from "./PGDCatalogueClient";

export const metadata: Metadata = {
  title: "PGD Catalogue \u2014 60+ Services",
  description:
    "Browse our full PGD catalogue. 60+ services across travel, vaccines, weight management, sexual health, and more. Filter by category.",
};

export default function PGDCataloguePage() {
  return <PGDCatalogueClient />;
}
