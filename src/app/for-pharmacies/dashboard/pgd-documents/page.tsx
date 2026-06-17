import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PgdDocumentsClient } from "./PgdDocumentsClient";

export const metadata = { title: "Signed PGD Documents | Get Real Health" };
export const dynamic = "force-dynamic";

export default async function PgdDocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "pharmacy_admin" && role !== "super_admin") {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Signed PGD Documents
        </h1>
        <p className="text-sm text-gray-600">
          Only pharmacy admins can upload signed PGD documents. Ask your
          pharmacy admin to add or replace documents on your behalf.
        </p>
      </div>
    );
  }

  if (!session.user.pharmacyId) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Signed PGD Documents
        </h1>
        <p className="text-sm text-gray-600">
          No pharmacy assigned to your account. Contact Get Real Health to
          resolve this.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Signed PGD Documents
        </h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Upload PGDs that have been signed by your own clinical lead and
          superintendent. Once uploaded, your team will see this version on
          the pharmacist dashboard instead of the GRH default. Each upload
          becomes a new version of the document for that PGD — previous
          versions are kept for audit but no longer shown to the team.
        </p>
      </div>
      <PgdDocumentsClient />
    </div>
  );
}
