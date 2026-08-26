import type { Metadata } from "next";
import { PgdPageActions } from "@/components/PgdPageActions";
import PgdGate from "../PgdGate";
import { GenitalWartsClient } from "./GenitalWartsClient";

export const metadata: Metadata = {
  title: "Genital Warts ePGD | Pharmacy PGD",
  description:
    "UK Pharmacy Patient Group Direction for the treatment of external genital warts with podophyllotoxin 0.5% solution / 0.15% cream or imiquimod 5% cream.",
};

export default function GenitalWartsPage() {
  return (
    <PgdGate slug="genital-warts" title="Genital Warts">
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <PgdPageActions />

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Genital Warts ePGD
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Treatment of visible external genital and perianal warts in
              adults aged 18 and over. Patient-applied podophyllotoxin or
              imiquimod.
            </p>
            <div className="mt-4 rounded-lg bg-purple-50 border border-purple-200 p-4">
              <p className="text-sm text-purple-900">
                <strong>Two agents, one PGD.</strong> Podophyllotoxin 0.5%
                solution or 0.15% cream for small non-keratinised external
                warts, capped at 50 warts and a 10 cm² treatment area.
                Imiquimod 5% cream for larger or keratinised lesions, with no
                equivalent cap. Both exclude internal warts, pregnancy and
                breastfeeding. External perianal warts are in scope.
              </p>
            </div>
          </div>

          <GenitalWartsClient />

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Get Real Health ePGD — Genital Warts | Confidential Patient
              Information
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
