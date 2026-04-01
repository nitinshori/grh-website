import type { Metadata } from "next";
import { FindServiceClient } from "./FindServiceClient";

export const metadata: Metadata = {
  title: "Find a Service Near You",
  description:
    "Search for private health services at a pharmacy near you. Travel vaccinations, weight management, sexual health, and more — no GP referral needed.",
};

export default function FindServicePage() {
  return <FindServiceClient />;
}
