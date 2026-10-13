import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAppointmentsOnlyPharmacy } from "@/lib/access-pharmacies";
import { getPharmacyPgdSlugs } from "@/lib/pgd-queries";
import { EPGD_SEGMENT_ALIASES, WITHDRAWN_SLUGS } from "@/lib/pgd-access";
import { PATIENT_FORMS } from "@/data/patient-forms";

export const metadata = {
  title: "Patient forms | Get Real Health",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PatientFormsIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "prospect") redirect("/for-pharmacies/dashboard");
  if (
    session.user.pharmacyId &&
    (await isAppointmentsOnlyPharmacy(session.user.pharmacyId))
  ) {
    redirect("/for-pharmacies/dashboard/appointments");
  }

  // Only forms for PGDs the current pharmacy holds (approved assignments, the
  // same source as the ePGD index). Super admins see every form. A user with
  // no pharmacy sees none.
  const isSuperAdmin = session.user.role === "super_admin";
  const held = isSuperAdmin
    ? null
    : new Set(
        session.user.pharmacyId
          ? await getPharmacyPgdSlugs(session.user.pharmacyId)
          : [],
      );
  const forms = PATIENT_FORMS.filter((f) => {
    if (WITHDRAWN_SLUGS.has(f.slug)) return false;
    if (!held) return true;
    return [f.slug, ...(EPGD_SEGMENT_ALIASES[f.slug] ?? [])].some((s) =>
      held.has(s),
    );
  }).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Patient forms
      </h1>
      <p className="text-sm text-gray-600 max-w-3xl mb-6">
        Blank questionnaires you can print for patients to fill in by hand
        before their consultation, for example while they wait. The completed
        answers must still be entered into the ePGD tool, which applies the PGD
        and makes the clinical decision.
      </p>
      {forms.length === 0 && (
        <p className="text-sm text-gray-600 rounded-xl border border-gray-200 bg-white p-4">
          Your pharmacy does not hold any PGDs that have a printable patient
          form yet.
        </p>
      )}
      {forms.length > 0 && (
      <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {forms.map((f) => (
          <li
            key={f.slug}
            className="flex flex-col sm:flex-row sm:items-center gap-2 p-4"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{f.title}</p>
              <p className="text-xs text-gray-500">{f.ageNote}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <a
                href={`/for-pharmacies/dashboard/patient-forms/${f.slug}`}
                className="font-medium text-teal-600 hover:text-teal-700"
              >
                Open and print
              </a>
              <a
                href={`/for-pharmacies/epgd/${f.slug}`}
                className="text-gray-500 hover:text-teal-600"
              >
                ePGD tool
              </a>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
