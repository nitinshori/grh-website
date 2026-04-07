import type { Metadata } from "next";
import { PGDCatalogueClient } from "./PGDCatalogueClient";

export const metadata: Metadata = {
  title: "PGD Catalogue \u2014 Services for UK Pharmacies",
  description:
    "Browse our PGD catalogue. Travel, vaccines, weight management, sexual health and more &mdash; filterable by category. Add services to your enquiry list and request a quote.",
};

export default function PGDCataloguePage() {
  return <PGDCatalogueClient />;
}
