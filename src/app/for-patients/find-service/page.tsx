import type { Metadata } from "next";
import { FindServiceClient } from "./FindServiceClient";

export const metadata: Metadata = {
  // Self-referencing canonical. A site-wide canonical in the root
  // layout once pointed every page at the homepage, which told Google
  // they were all duplicates of it. Declaring each page's own URL is
  // what undoes that.
  alternates: { canonical: "https://getrealhealthpgd.co.uk/for-patients/find-service" },
  title: "Find a Service Near You",
  description:
    "Search for private health services at a pharmacy near you. Travel vaccinations, weight management, sexual health, and more — no GP referral needed.",
};

export default function FindServicePage() {
  return <FindServiceClient />;
}
