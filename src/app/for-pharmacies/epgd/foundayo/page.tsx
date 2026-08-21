import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PgdPageActions } from "@/components/PgdPageActions";
import PgdGate from "../PgdGate";
import { FoundayoClient } from "./FoundayoClient";

export const metadata = {
  title: "Foundayo (orforglipron) — Weight Management",
  description:
    "UK Pharmacy PGD tool for Foundayo (orforglipron) tablets: once-daily oral GLP-1 for weight management in adults with BMI ≥30, or ≥27 with a weight-related comorbidity.",
};

// Access is decided by the pharmacy's PGD assignment (PgdGate), not by an
// email allowlist. Foundayo went out to pharmacies holding oral Wegovy plus
// PPH, per migration 043, so the assignment table is the authority.
export default async function FoundayoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <PgdGate slug="foundayo" title="Foundayo (orforglipron) Tablets">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PgdPageActions />

          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
                For registered pharmacy professionals only
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
                Foundayo (orforglipron) — Weight Management
              </h1>
              <p className="text-gray-600 mb-4">
                Once-daily oral GLP-1 receptor agonist. Tablets of 0.8, 2.5,
                5.5, 9, 14.5 and 17.2 mg. Works to PGD v002, signed 21 August
                2026.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Unlike oral semaglutide, Foundayo has no food or water
                  restriction and can be taken at any time of day. Swallow
                  whole. The dose is increased one step at a time with at least
                  30 days at each step, to a maximum of 17.2 mg once daily.
                </p>
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Contraception.</strong> Orforglipron may reduce the
                  efficacy of oral hormonal contraceptives. A non-oral or
                  barrier method is needed for 30 days after starting and for 30
                  days after <em>every</em> dose increase. This tool will not let
                  you complete a supply without recording that advice.
                </p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Black triangle medicine. Report all suspected adverse reactions
                via the MHRA Yellow Card scheme. Supply under this PGD is a
                private service: orforglipron is not NHS funded and the NICE
                appraisal (ID6516) is in progress.
              </p>
            </div>
          </div>

          <FoundayoClient />

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Get Real Health ePGD — Foundayo (orforglipron) | Confidential
              Patient Information
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
