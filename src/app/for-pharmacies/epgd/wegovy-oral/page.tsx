import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pgds, isPgdAccessibleByEmail } from "@/data/pgds";
import { PgdPageActions } from "@/components/PgdPageActions";
import { WegovyOralClient } from "./WegovyOralClient";

export const metadata = {
  title: "Oral Semaglutide for Weight Management (Off-label) — Restricted Pilot",
  description: "Restricted-access ePGD pilot. Off-label oral semaglutide for weight management.",
  robots: { index: false, follow: false },
};

export default async function WegovyOralPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Look up the PGD entry to get the allowlist and gate access here.
  const pgd = pgds.find((p) => p.id === "wegovy-oral");
  if (!pgd) notFound();

  if (!isPgdAccessibleByEmail(pgd, session.user.email)) {
    // Pretend the page doesn't exist for non-allowlisted users so the
    // route stays invisible.
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-6 p-4 bg-amber-100 border border-amber-400 rounded-lg">
          <p className="text-sm font-bold text-amber-900">
            ⚠️ RESTRICTED PILOT — OFF-LABEL USE
          </p>
          <p className="text-xs text-amber-900 mt-1">
            This consultation is for off-label use of oral semaglutide
            (Rybelsus 14 mg, or Wegovy oral 25/50 mg where available) for
            weight management. Visible only to allowlisted clinical leads.
            Not yet released to partner pharmacies. All consultations under
            this PGD require explicit informed consent for off-label use,
            and remain the personal clinical responsibility of the named
            clinician.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
              Pilot — clinical-lead only
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
              Oral Semaglutide — Weight Management
            </h1>
            <p className="text-gray-600">
              Off-label use of oral semaglutide. Strict empty-stomach
              administration. Informed consent for off-label is mandatory.
            </p>
          </div>
        </div>

        <WegovyOralClient />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Oral Semaglutide (Off-label Pilot)</p>
        </div>
      </div>
    </div>
  );
}
