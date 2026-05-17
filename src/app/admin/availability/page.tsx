import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { getAvailabilityConfig } from "@/lib/booking-availability";

export const metadata = { title: "Booking Availability — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Forbidden — admin only.</p>
      </div>
    );
  }

  const config = await getAvailabilityConfig();

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking availability</h1>
          <p className="text-gray-600">
            Controls the slots offered on the public <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">/book</code>
            {" "}discovery-call page. Changes are live within ~30 seconds of saving — no redeploy needed.
          </p>
        </div>

        <AvailabilityEditor initialConfig={config} />
      </div>
    </div>
  );
}
