import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getModuleBySlug } from "@/data/training-modules";
import { pgds as PGD_CATALOGUE, isPgdAccessibleByEmail } from "@/data/pgds";
import { auth } from "@/lib/auth";
import { getPharmacyPgdSlugs } from "@/lib/pgd-queries";
import { ModulePlayer } from "./ModulePlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getModuleBySlug(slug);
  if (!m) return { title: "Training module not found" };
  return {
    title: `${m.title} — Training`,
    description: m.description,
  };
}

export default async function TrainingModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) notFound();

  // If this module backs any restricted PGD, gate access by email allowlist.
  const restrictedPgd = module.pgdSlugs
    .map((s) => PGD_CATALOGUE.find((p) => p.id === s))
    .find((p) => p && p.restrictedToEmails && p.restrictedToEmails.length > 0);
  if (restrictedPgd) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!isPgdAccessibleByEmail(restrictedPgd, session.user.email)) {
      notFound();
    }
  }

  // PGD-tied modules are only accessible when at least one of their PGDs is
  // APPROVED for the viewer's pharmacy (mirrors the training list — deep
  // links must not bypass a clinical lead's approval scope). General modules
  // and pharmacy-less viewers (super_admin, reviewers) are unaffected.
  if (module.pgdSlugs.length > 0) {
    const session = await auth();
    if (session?.user?.pharmacyId) {
      const approved = new Set(
        await getPharmacyPgdSlugs(session.user.pharmacyId),
      );
      if (!module.pgdSlugs.some((s) => approved.has(s))) {
        notFound();
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/for-pharmacies/dashboard/training"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-900 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All training modules
        </Link>
        <ModulePlayer module={module} />
      </div>
    </div>
  );
}
