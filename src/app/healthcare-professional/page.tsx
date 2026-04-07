import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Healthcare Professionals — Get Real Health",
  description:
    "This area of the Get Real Health website contains clinical and prescribing information intended for UK-registered healthcare professionals only.",
  // Don't index the gate page itself — it has no useful public content
  robots: { index: false, follow: false },
};

const HCP_COOKIE_NAME = "grh_hcp_confirmed";
const COOKIE_MAX_AGE_DAYS = 30;

// Whitelist of paths the user can be returned to after confirmation.
// Anything outside the whitelist falls back to the home page to prevent
// open-redirect abuse.
const ALLOWED_RETURN_PREFIXES = [
  "/for-pharmacies/pgd-catalogue",
  "/pharmacy-plus-health",
  "/resources",
];

function safeReturnPath(raw: string | undefined): string {
  if (!raw) return "/for-pharmacies";
  // Must be a relative path on this site
  if (!raw.startsWith("/")) return "/for-pharmacies";
  if (raw.startsWith("//")) return "/for-pharmacies";
  // Must match an allowed prefix
  if (ALLOWED_RETURN_PREFIXES.some((p) => raw === p || raw.startsWith(p + "/") || raw.startsWith(p + "?"))) {
    return raw;
  }
  return "/for-pharmacies";
}

// ── Server actions ────────────────────────────────────────────────────
async function confirmHcp(formData: FormData) {
  "use server";
  const returnTo = safeReturnPath(formData.get("returnTo")?.toString());
  const cookieStore = await cookies();
  cookieStore.set({
    name: HCP_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
  });
  redirect(returnTo);
}

export default async function HealthcareProfessionalGate({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.return);

  return (
    <section className="bg-gray-50 min-h-[70vh] flex items-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-3">
            For healthcare professionals
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-4 leading-tight">
            This area is for UK-registered healthcare professionals
          </h1>

          <div className="prose prose-sm text-gray-600 leading-relaxed mb-8">
            <p className="mb-4">
              The page you&apos;re trying to view contains clinical and
              prescribing information intended for healthcare professionals
              who are qualified to prescribe or supply prescription-only
              medicines in the UK &mdash; for example pharmacists registered
              with the GPhC, doctors registered with the GMC, and nurses or
              other prescribers registered with the NMC or HCPC.
            </p>
            <p className="mb-4">
              Under the Human Medicines Regulations 2012, information of this
              kind should not be promoted to the general public. By
              continuing, you confirm that you are a UK-registered healthcare
              professional and that you wish to access information intended
              for your professional role.
            </p>
            <p className="mb-0">
              If you are a member of the public looking for information about
              services available at your local pharmacy, please visit our{" "}
              <Link
                href="/for-patients"
                className="text-teal-700 underline-offset-2 hover:underline font-medium"
              >
                services for patients
              </Link>{" "}
              instead.
            </p>
          </div>

          <form action={confirmHcp} className="space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="w-full px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors text-base"
            >
              Yes &mdash; I am a UK-registered healthcare professional
            </button>
            <Link
              href="/for-patients"
              className="block w-full text-center px-6 py-3.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors text-base"
            >
              No &mdash; take me to patient information
            </Link>
          </form>

          <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
            Your confirmation is stored in a cookie on your device for 30 days.
            We do not record your name, registration number, or any personal
            information at this step.
          </p>
        </div>
      </div>
    </section>
  );
}
