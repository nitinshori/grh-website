import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trainingAttempts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { modules } from "@/data/training-modules";
import { pgds as PGD_CATALOGUE, isPgdAccessibleByEmail } from "@/data/pgds";
import { isAppointmentsOnlyPharmacy } from "@/lib/access-pharmacies";
import { getPharmacyPgdSlugs } from "@/lib/pgd-queries";

export const metadata: Metadata = {
  title: "Training Modules",
  description: "PGD training modules for your team.",
};

export const dynamic = "force-dynamic";

interface ModuleStatus {
  state: "not-started" | "passed-current" | "needs-revalidation" | "failed-last";
  attemptedAt?: Date;
  attemptVersion?: string;
  lastScore?: number;
}

function statusFor(
  currentVersion: string,
  latestAttempt:
    | { passed: boolean; moduleVersion: string; attemptedAt: Date; scoreFraction: string }
    | undefined,
): ModuleStatus {
  if (!latestAttempt) return { state: "not-started" };
  if (latestAttempt.passed) {
    if (latestAttempt.moduleVersion === currentVersion) {
      return {
        state: "passed-current",
        attemptedAt: latestAttempt.attemptedAt,
        attemptVersion: latestAttempt.moduleVersion,
        lastScore: parseFloat(latestAttempt.scoreFraction),
      };
    }
    // Passed an old version → needs re-validation
    return {
      state: "needs-revalidation",
      attemptedAt: latestAttempt.attemptedAt,
      attemptVersion: latestAttempt.moduleVersion,
      lastScore: parseFloat(latestAttempt.scoreFraction),
    };
  }
  return {
    state: "failed-last",
    attemptedAt: latestAttempt.attemptedAt,
    attemptVersion: latestAttempt.moduleVersion,
    lastScore: parseFloat(latestAttempt.scoreFraction),
  };
}

export default async function TrainingIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.pharmacyId && (await isAppointmentsOnlyPharmacy(session.user.pharmacyId))) {
    redirect("/for-pharmacies/dashboard/appointments");
  }

  // Pull the latest attempt for each module for this user
  const allAttempts = await db
    .select({
      moduleSlug: trainingAttempts.moduleSlug,
      moduleVersion: trainingAttempts.moduleVersion,
      passed: trainingAttempts.passed,
      scoreFraction: trainingAttempts.scoreFraction,
      attemptedAt: trainingAttempts.attemptedAt,
    })
    .from(trainingAttempts)
    .where(eq(trainingAttempts.userId, session.user.id))
    .orderBy(desc(trainingAttempts.attemptedAt));

  const latestByModule = new Map<string, (typeof allAttempts)[number]>();
  for (const a of allAttempts) {
    if (!latestByModule.has(a.moduleSlug)) {
      latestByModule.set(a.moduleSlug, a);
    }
  }

  // Hide training modules that are tied to restricted PGDs the current user
  // is not on the allowlist for (e.g. wegovy-oral pilot).
  const userEmail = session.user.email ?? null;
  const restrictedPgdsBySlug = new Map(
    PGD_CATALOGUE.filter((p) => p.restrictedToEmails && p.restrictedToEmails.length > 0).map((p) => [p.id, p])
  );
  // Training mirrors the pharmacy's APPROVED PGD list (approval status per
  // pharmacy — e.g. Jane's signed-off subset at PPH). Modules tied to a PGD
  // show only if at least one of its PGDs is approved for this pharmacy;
  // general modules (no pgdSlugs) always show. Users without a pharmacy
  // (super_admin, clinical reviewers) see everything.
  const approvedSlugs = session.user.pharmacyId
    ? new Set(await getPharmacyPgdSlugs(session.user.pharmacyId))
    : null;

  const visibleModules = modules.filter((m) => {
    for (const pgdSlug of m.pgdSlugs) {
      const restricted = restrictedPgdsBySlug.get(pgdSlug);
      if (restricted && !isPgdAccessibleByEmail(restricted, userEmail)) {
        return false;
      }
    }
    if (approvedSlugs && m.pgdSlugs.length > 0) {
      return m.pgdSlugs.some((s) => approvedSlugs.has(s));
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Training</h1>
          <p className="text-sm text-gray-500 mt-1">
            CPD-style training modules for each PGD. Complete a module's quiz with at least
            80% to be authorised to deliver consultations under that PGD.
          </p>
        </header>

        <div className="space-y-3">
          {visibleModules.map((m) => {
            const status = statusFor(m.version, latestByModule.get(m.slug));
            return (
              <Link
                key={m.slug}
                href={`/for-pharmacies/dashboard/training/${m.slug}`}
                className="block bg-white border border-gray-200 hover:border-[color:var(--tenant-primary)] rounded-xl p-5 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-navy-900 group-hover:text-[color:var(--tenant-primary)] transition-colors">
                      {m.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {m.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span>{m.estimatedMinutes} min</span>
                      <span>·</span>
                      <span>{m.quiz.length}-question quiz</span>
                      <span>·</span>
                      <span>v{m.version}</span>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>
              </Link>
            );
          })}
        </div>

        {visibleModules.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">No training modules available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  switch (status.state) {
    case "passed-current":
      return (
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
          ✓ Passed
        </span>
      );
    case "needs-revalidation":
      return (
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
          ⚠ Re-validate
        </span>
      );
    case "failed-last":
      return (
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
          Retake required
        </span>
      );
    default:
      return (
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
          Not started
        </span>
      );
  }
}
