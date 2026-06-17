import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultationRecords, users } from "@/lib/db/schema";
import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ALL_PGDS } from "@/lib/pgd-access";

export const metadata = { title: "Usage Analytics | Get Real Health" };
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────
// Pharmacy-admin facing usage analytics.
//
// Built to unblock Janey at PPH so she can see who in her team is delivering
// services and at what volume — without needing me/Nitin to run queries by
// hand. Mirrors the per-pharmacist breakdown we'd otherwise get from the
// super-admin /admin/analytics page, but scoped to the caller's own
// pharmacy and accessible to pharmacy_admin (not just super_admin).
//
// Counts are taken from `consultation_records` rather than `pgd_consultations`
// because completed consultations are what actually record patient data —
// half-finished sessions that don't reach the summary step never produce a
// record row. So this counts consults that were actually delivered, not
// browser tabs left open.
// ─────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

const PGD_TITLE_BY_SLUG = new Map(ALL_PGDS.map((p) => [p.slug, p.title]));

function fmtNum(n: number): string {
  return n.toLocaleString("en-GB");
}

export default async function PharmacyAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "pharmacy_admin" && role !== "super_admin") {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Usage Analytics
        </h1>
        <p className="text-sm text-gray-600">
          Only pharmacy admins can view team analytics. Ask your pharmacy
          admin if you need a usage report.
        </p>
      </div>
    );
  }

  const pharmacyId = session.user.pharmacyId;
  if (!pharmacyId) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Usage Analytics
        </h1>
        <p className="text-sm text-gray-600">
          No pharmacy assigned to your account. Contact Get Real Health to
          resolve this.
        </p>
      </div>
    );
  }

  // Time window
  const params = await searchParams;
  const daysParam = parseInt(params.days || "30", 10);
  const days = isNaN(daysParam)
    ? 30
    : Math.min(365, Math.max(1, daysParam));
  const since = new Date(Date.now() - days * DAY_MS);

  const baseFilter = and(
    eq(consultationRecords.pharmacyId, pharmacyId),
    isNull(consultationRecords.deletedAt),
    gte(consultationRecords.createdAt, since),
  );

  // ── Headline totals ──────────────────────────────────────────
  const [totalsRow] = await db
    .select({
      totalConsults: count(),
      distinctPharmacists: sql<number>`count(distinct ${consultationRecords.userId})::int`,
      distinctPgds: sql<number>`count(distinct ${consultationRecords.pgdSlug})::int`,
      distinctPatients: sql<number>`count(distinct (${consultationRecords.patientFirstName} || '|' || ${consultationRecords.patientLastName} || '|' || ${consultationRecords.patientDob}))::int`,
    })
    .from(consultationRecords)
    .where(baseFilter);

  // ── Per-pharmacist breakdown ─────────────────────────────────
  const perPharmacist = await db
    .select({
      userId: consultationRecords.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
      total: count(),
      lastConsultAt: sql<Date>`max(${consultationRecords.createdAt})`,
    })
    .from(consultationRecords)
    .leftJoin(users, eq(consultationRecords.userId, users.id))
    .where(baseFilter)
    .groupBy(
      consultationRecords.userId,
      users.firstName,
      users.lastName,
      users.email,
      users.username,
    )
    .orderBy(desc(count()));

  // ── Per-PGD breakdown ────────────────────────────────────────
  const perPgd = await db
    .select({
      pgdSlug: consultationRecords.pgdSlug,
      total: count(),
    })
    .from(consultationRecords)
    .where(baseFilter)
    .groupBy(consultationRecords.pgdSlug)
    .orderBy(desc(count()));

  // ── Daily timeline (last N days, smaller of N or 30 to keep the row visible) ──
  const timelineDays = Math.min(30, days);
  const timelineSince = new Date(Date.now() - timelineDays * DAY_MS);
  const dailyRows = await db
    .select({
      day: sql<string>`to_char(${consultationRecords.createdAt}::date, 'YYYY-MM-DD')`,
      total: count(),
    })
    .from(consultationRecords)
    .where(
      and(
        eq(consultationRecords.pharmacyId, pharmacyId),
        isNull(consultationRecords.deletedAt),
        gte(consultationRecords.createdAt, timelineSince),
      ),
    )
    .groupBy(sql`${consultationRecords.createdAt}::date`)
    .orderBy(sql`${consultationRecords.createdAt}::date`);

  const dailyMap = new Map(dailyRows.map((r) => [r.day, r.total]));
  const today = new Date();
  const timeline: { day: string; label: string; total: number }[] = [];
  for (let i = timelineDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const day = d.toISOString().slice(0, 10);
    timeline.push({
      day,
      label: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      total: dailyMap.get(day) ?? 0,
    });
  }
  const peak = Math.max(1, ...timeline.map((t) => t.total));

  const windowOptions = [
    { days: 7, label: "Last 7 days" },
    { days: 30, label: "Last 30 days" },
    { days: 90, label: "Last 90 days" },
    { days: 180, label: "Last 6 months" },
    { days: 365, label: "Last 12 months" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Usage Analytics
          </h1>
          <p className="text-sm text-gray-600 max-w-3xl">
            Completed consultations delivered by your team. Counts patients
            seen, PGDs used, and which pharmacists are active. Window:{" "}
            <strong>{windowOptions.find((w) => w.days === days)?.label ?? `Last ${days} days`}</strong>.
          </p>
        </div>

        {/* Time window selector — server-side via GET form */}
        <form className="flex items-center gap-2">
          <label htmlFor="days" className="text-sm font-medium text-gray-700">
            Window:
          </label>
          <select
            id="days"
            name="days"
            defaultValue={String(days)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {windowOptions.map((w) => (
              <option key={w.days} value={w.days}>
                {w.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "#25b4b4" }}
          >
            Update
          </button>
        </form>
      </div>

      {/* ── Headline metric tiles ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricTile
          label="Consultations"
          value={fmtNum(totalsRow?.totalConsults ?? 0)}
          tone="teal"
        />
        <MetricTile
          label="Pharmacists active"
          value={fmtNum(totalsRow?.distinctPharmacists ?? 0)}
          tone="blue"
        />
        <MetricTile
          label="Distinct patients"
          value={fmtNum(totalsRow?.distinctPatients ?? 0)}
          tone="emerald"
        />
        <MetricTile
          label="PGDs used"
          value={fmtNum(totalsRow?.distinctPgds ?? 0)}
          tone="violet"
        />
      </div>

      {/* ── Per-pharmacist breakdown ──────────────────────── */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Consultations by pharmacist
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Who in your team has delivered consultations in this window,
            sorted by volume. Zero-row pharmacists are not listed.
          </p>
        </div>
        <div className="p-6">
          {perPharmacist.length === 0 ? (
            <p className="text-sm text-gray-500">
              No completed consultations in this window. Either nothing has
              been recorded yet, or your team is delivering services without
              completing the consultation flow.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-gray-700">
                  <tr className="text-left">
                    <th className="py-2 pr-3 font-medium">Pharmacist</th>
                    <th className="py-2 pr-3 font-medium">Login</th>
                    <th className="py-2 pr-3 font-medium text-right">
                      Consults
                    </th>
                    <th className="py-2 pr-3 font-medium text-right">
                      % of total
                    </th>
                    <th className="py-2 pr-3 font-medium">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {perPharmacist.map((p) => {
                    const name =
                      p.firstName || p.lastName
                        ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
                        : "(unknown user)";
                    const login = p.username
                      ? `${p.username} (GPhC)`
                      : p.email || "—";
                    const pct = totalsRow?.totalConsults
                      ? ((p.total / totalsRow.totalConsults) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <tr
                        key={p.userId}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 pr-3 font-medium text-gray-900">
                          {name}
                        </td>
                        <td className="py-3 pr-3 text-gray-700">{login}</td>
                        <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                          {fmtNum(p.total)}
                        </td>
                        <td className="py-3 pr-3 text-right text-gray-600 tabular-nums">
                          {pct}%
                        </td>
                        <td className="py-3 pr-3 text-gray-700">
                          {p.lastConsultAt
                            ? new Date(p.lastConsultAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Per-PGD breakdown ─────────────────────────────── */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Consultations by PGD
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Which services your team is actually delivering. Useful for
            tracking adoption of new PGDs and spotting unused ones.
          </p>
        </div>
        <div className="p-6">
          {perPgd.length === 0 ? (
            <p className="text-sm text-gray-500">No data in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-gray-700">
                  <tr className="text-left">
                    <th className="py-2 pr-3 font-medium">PGD</th>
                    <th className="py-2 pr-3 font-medium text-right">
                      Consults
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      Share of activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {perPgd.map((p) => {
                    const title =
                      PGD_TITLE_BY_SLUG.get(p.pgdSlug) || p.pgdSlug;
                    const pct = totalsRow?.totalConsults
                      ? (p.total / totalsRow.totalConsults) * 100
                      : 0;
                    return (
                      <tr
                        key={p.pgdSlug}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 pr-3 font-medium text-gray-900">
                          {title}
                          <div className="text-xs text-gray-500 font-normal">
                            {p.pgdSlug}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                          {fmtNum(p.total)}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full bg-teal-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 tabular-nums">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Daily consultations
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Last {timelineDays} days. Bar height is relative to your busiest
            day in the window (peak: {peak} consults).
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-1 h-32">
            {timeline.map((t) => {
              const h = Math.max(2, Math.round((t.total / peak) * 100));
              return (
                <div
                  key={t.day}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  title={`${t.label}: ${t.total}`}
                >
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${h}%`,
                      backgroundColor: t.total > 0 ? "#25b4b4" : "#e5e7eb",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-end gap-1 mt-1">
            {timeline.map((t, i) => (
              <div
                key={t.day}
                className="flex-1 text-center text-[10px] text-gray-500"
                style={{
                  visibility:
                    i === 0 ||
                    i === timeline.length - 1 ||
                    i === Math.floor(timeline.length / 2)
                      ? "visible"
                      : "hidden",
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Need more detail? You can drill into individual consultations from{" "}
        <Link
          href="/for-pharmacies/dashboard/records"
          className="text-teal-700 hover:underline"
        >
          Patient Records
        </Link>
        .
      </p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "teal" | "blue" | "emerald" | "violet";
}) {
  const colors: Record<typeof tone, { bg: string; text: string }> = {
    teal: { bg: "bg-teal-50", text: "text-teal-700" },
    blue: { bg: "bg-blue-50", text: "text-blue-700" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
    violet: { bg: "bg-violet-50", text: "text-violet-700" },
  };
  const c = colors[tone];
  return (
    <div className={`rounded-lg ${c.bg} border border-gray-200 p-4`}>
      <p className={`text-xs font-medium ${c.text} uppercase tracking-wider`}>
        {label}
      </p>
      <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">
        {value}
      </p>
    </div>
  );
}
