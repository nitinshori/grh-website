import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StaffClient } from "./StaffClient";

export const metadata = { title: "Manage Staff | Get Real Health" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  // Only pharmacy_admin and super_admin can manage staff
  if (role !== "pharmacy_admin" && role !== "super_admin") {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Staff</h1>
        <p className="text-sm text-gray-600">
          Only pharmacy admins can manage staff. Ask your pharmacy admin to add or modify accounts.
        </p>
      </div>
    );
  }

  if (!session.user.pharmacyId) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Staff</h1>
        <p className="text-sm text-gray-600">No pharmacy assigned to your account.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage staff</h1>
        <p className="text-sm text-gray-600">
          Add, deactivate, or resend invites for your pharmacy team. New staff get an email with a link
          to set their own password.
        </p>
      </div>
      <StaffClient currentUserId={session.user.id} />
    </div>
  );
}
