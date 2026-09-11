import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pgds, isPgdAccessibleByEmail } from "@/data/pgds";
import { PgdPageActions } from "@/components/PgdPageActions";
import { WegovyOralClient } from "./WegovyOralClient";

export const metadata = {
  title: "Oral Wegovy (Oral Semaglutide 1.5 to 25 mg), Weight Management",
  description:
    "UK Pharmacy PGD for licensed Wegovy tablets (oral semaglutide 1.5, 4, 9 and 25 mg): weight management in adults aged 18 to 85 with BMI 30 or above, or BMI 27 or above with a weight-related comorbidity.",
};

export default async function WegovyOralPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Look up the PGD entry. Access gating is still applied: when the
  // restrictedToEmails allowlist is removed from the catalogue entry,
  // isPgdAccessibleByEmail returns true for everyone, so this becomes
  // a no-op rather than a hard block.
  const pgd = pgds.find((p) => p.id === "wegovy-oral");
  if (!pgd) notFound();

  if (!isPgdAccessibleByEmail(pgd, session.user.email)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
              Oral Wegovy, Weight Management
            </h1>
            <p className="text-gray-600 mb-4">
              Semaglutide 1.5, 4, 9 and 25 mg oral tablets. Licensed in the UK for
              weight management in adults. Wegovy (semaglutide) Tablets PGD
              version 010, issued 11 September 2026.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Wegovy tablets are licensed as an adjunct to a reduced-calorie diet
                and increased physical activity for weight management in adults
                with a BMI of 30 kg/m² or above (obesity) or 27 kg/m² to below
                30 kg/m² (overweight) in the presence of at least one weight-related
                comorbidity. This PGD covers adults aged 18 to 85. Start at 1.5 mg
                once daily and escalate monthly through 4 mg and 9 mg to 25 mg.
                Take on an empty stomach after a fast of at least 8 hours, with no
                more than half a glass of water (about 120 mL), and wait at least
                30 minutes before food, drink or other oral medicines. One pack of
                30 tablets per appointment.
              </p>
            </div>
          </div>
        </div>

        <WegovyOralClient />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health ePGD, Oral Wegovy | Confidential Patient Information
          </p>
        </div>
      </div>
    </div>
  );
}
