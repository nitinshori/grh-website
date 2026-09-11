import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PgdPageActions } from "@/components/PgdPageActions";
import PgdGate from "../PgdGate";
import { ChestServiceClient } from "./ChestServiceClient";

export const metadata = {
  title: "Chest Infection Service: Acute Bacterial Bronchitis",
  description:
    "UK Pharmacy PGD tool for acute bacterial bronchitis in patients aged 12 and over: doxycycline, amoxicillin or clarithromycin, with red flag screening and antimicrobial stewardship.",
};

export default async function ChestServicePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <PgdGate slug="chest-service" title="Chest Infection Service">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PgdPageActions />

          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
                For registered pharmacy professionals only
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
                Chest Infection Service
              </h1>
              <p className="text-gray-600 mb-4">
                Acute bacterial bronchitis in patients aged 12 and over.
                Doxycycline, amoxicillin or clarithromycin, per the signed PGD
                (version 008, issued 11 September 2026).
              </p>
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Most acute bronchitis is viral and needs no
                  antibiotic.</strong> The inclusion criteria are deliberately
                  narrow: purulent sputum PLUS either a higher-risk comorbidity
                  or symptoms beyond 14 days. Every observation in Appendix 1
                  must be measured and recorded before any supply, and the CRB
                  score (without the age point) must be 0.
                </p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                This service does not cover pneumonia, which needs same-day
                assessment, nor a cough lasting more than three weeks in a
                current or former smoker, which is referred in line with the
                lung cancer referral guidance. A pregnant or breastfeeding
                patient who is penicillin-allergic has no arm under this PGD
                and is referred the same day.
              </p>
            </div>
          </div>

          <ChestServiceClient />

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Get Real Health ePGD, Chest Infection Service | Confidential
              Patient Information
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
