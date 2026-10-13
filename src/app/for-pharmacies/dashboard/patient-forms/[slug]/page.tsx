import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAppointmentsOnlyPharmacy } from "@/lib/access-pharmacies";
import { getPatientForm } from "@/data/patient-forms";
import { getPharmacyPgdSlugs } from "@/lib/pgd-queries";
import { EPGD_SEGMENT_ALIASES, WITHDRAWN_SLUGS } from "@/lib/pgd-access";
import { PatientFormSheet } from "@/components/patient-form/PatientFormSheet";

// Login is enforced by src/proxy.ts (/for-pharmacies/dashboard prefix) and
// by the dashboard layout; checked again here because the forms name
// prescription-only medicines.

// Rendered per request (session check), not prerendered. Unknown slugs 404.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = getPatientForm(slug);
  return {
    title: form
      ? `${form.title}: patient form | Get Real Health`
      : "Patient form | Get Real Health",
    robots: { index: false, follow: false },
  };
}

export default async function PatientFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "prospect") redirect("/for-pharmacies/dashboard");
  if (
    session.user.pharmacyId &&
    (await isAppointmentsOnlyPharmacy(session.user.pharmacyId))
  ) {
    redirect("/for-pharmacies/dashboard/appointments");
  }

  const { slug } = await params;
  const form = getPatientForm(slug);
  if (!form) notFound();
  if (WITHDRAWN_SLUGS.has(form.slug)) notFound();

  // Only for PGDs the current pharmacy holds (approved assignments, the same
  // source as the ePGD index). Super admins can open every form.
  if (session.user.role !== "super_admin") {
    const held = new Set(
      session.user.pharmacyId
        ? await getPharmacyPgdSlugs(session.user.pharmacyId)
        : [],
    );
    const candidates = [form.slug, ...(EPGD_SEGMENT_ALIASES[form.slug] ?? [])];
    if (!candidates.some((s) => held.has(s))) {
      return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{form.title}</h1>
          <p className="text-sm text-gray-600 mb-4">
            Your pharmacy does not have this PGD, so this patient form is not
            available.
          </p>
          <Link
            href="/for-pharmacies/dashboard/patient-forms"
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Back to patient forms
          </Link>
        </div>
      );
    }
  }

  return <PatientFormSheet form={form} />;
}
