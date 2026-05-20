import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, auditLogs, pgdConsultations, pharmacies } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { ALL_PGDS } from "@/lib/pgd-access";

export const metadata = { title: "Demo Activity | Admin" };
export const dynamic = "force-dynamic";

interface FeedEntry {
  ts: Date;
  userId: string | null;
  userName: string;
  userEmail: string;
  kind: "audit" | "consultation";
  action: string;
  target: string;
  detail: string;
  ipAddress?: string | null;
}

const pgdTitleMap = new Map(ALL_PGDS.map((p) => [p.slug, p.title]));

function friendlyAction(a: string): string {
  return a.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DemoActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p>Forbidden — super admins only.</p>
      </div>
    );
  }

  const { user: filterUserId } = await searchParams;

  // ── 1) Find all prospect users (anywhere across the system) ───
  const prospectUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      pharmacyId: users.pharmacyId,
      pharmacyName: pharmacies.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(pharmacies, eq(users.pharmacyId, pharmacies.id))
    .where(eq(users.role, "prospect"))
    .orderBy(users.firstName);

  if (prospectUsers.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo activity</h1>
        <p className="text-sm text-gray-500">No prospect accounts yet.</p>
      </div>
    );
  }

  const prospectIds = prospectUsers.map((u) => u.id);
  const prospectById = new Map(prospectUsers.map((u) => [u.id, u]));

  // Optional filter
  const filterIds = filterUserId && prospectIds.includes(filterUserId) ? [filterUserId] : prospectIds;

  // ── 2) Pull audit log entries for these users (most recent 200) ─
  const auditRows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userEmail: auditLogs.userEmail,
      action: auditLogs.action,
      recordId: auditLogs.recordId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(inArray(auditLogs.userId, filterIds))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  // ── 3) Pull consultation start/complete events ──────────────────
  const consultRows = await db
    .select({
      id: pgdConsultations.id,
      userId: pgdConsultations.userId,
      pgdSlug: pgdConsultations.pgdSlug,
      startedAt: pgdConsultations.startedAt,
      completedAt: pgdConsultations.completedAt,
    })
    .from(pgdConsultations)
    .where(inArray(pgdConsultations.userId, filterIds))
    .orderBy(desc(pgdConsultations.startedAt))
    .limit(200);

  // ── 4) Merge into one chronological feed ────────────────────────
  const feed: FeedEntry[] = [];

  for (const a of auditRows) {
    const u = a.userId ? prospectById.get(a.userId) : null;
    feed.push({
      ts: a.createdAt,
      userId: a.userId,
      userName: u ? `${u.firstName} ${u.lastName}` : a.userEmail ?? "(unknown)",
      userEmail: u?.email ?? a.userEmail ?? "",
      kind: "audit",
      action: friendlyAction(a.action),
      target: a.recordId ? `record ${a.recordId.slice(0, 8)}…` : "",
      detail: a.details ?? "",
      ipAddress: a.ipAddress,
    });
  }

  for (const c of consultRows) {
    const u = c.userId ? prospectById.get(c.userId) : null;
    if (!u) continue;
    // Two entries per consultation: a "started" and (if present) a "completed"
    feed.push({
      ts: c.startedAt,
      userId: c.userId,
      userName: `${u.firstName} ${u.lastName}`,
      userEmail: u.email,
      kind: "consultation",
      action: "Consultation started",
      target: pgdTitleMap.get(c.pgdSlug) ?? c.pgdSlug,
      detail: "",
    });
    if (c.completedAt) {
      feed.push({
        ts: c.completedAt,
        userId: c.userId,
        userName: `${u.firstName} ${u.lastName}`,
        userEmail: u.email,
        kind: "consultation",
        action: "Consultation completed",
        target: pgdTitleMap.get(c.pgdSlug) ?? c.pgdSlug,
        detail: "",
      });
    }
  }

  feed.sort((a, b) => b.ts.getTime() - a.ts.getTime());

  // Per-user counts (always computed across all prospects, not filtered)
  const allCountsByUser = new Map<string, number>();
  for (const a of auditRows) {
    if (a.userId) allCountsByUser.set(a.userId, (allCountsByUser.get(a.userId) ?? 0) + 1);
  }
  for (const c of consultRows) {
    if (c.userId) allCountsByUser.set(c.userId, (allCountsByUser.get(c.userId) ?? 0) + (c.completedAt ? 2 : 1));
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo activity</h1>
          <p className="text-sm text-gray-600">
            What every prospect account has done — combined audit log + consultation events,
            most recent first. Useful for spotting what demo customers click on, where they
            get stuck, and what to follow up on.
          </p>
        </div>

        {/* User filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Filter by prospect</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/demo-activity"
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !filterUserId
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              All ({prospectUsers.length})
            </Link>
            {prospectUsers.map((u) => {
              const count = allCountsByUser.get(u.id) ?? 0;
              const active = filterUserId === u.id;
              return (
                <Link
                  key={u.id}
                  href={`/admin/demo-activity?user=${u.id}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {u.firstName} {u.lastName}
                  <span className={`ml-1.5 ${active ? "text-teal-100" : "text-gray-500"}`}>{count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Feed */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              {filterUserId
                ? `Activity for ${prospectById.get(filterUserId)?.firstName ?? "user"}`
                : "Combined feed"}{" "}
              <span className="text-gray-500 font-normal">({feed.length} events)</span>
            </h2>
          </div>
          {feed.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500 italic">
              No activity from prospect accounts yet. Activity will appear here as they log in
              and click around.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">When</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Who</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">What</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Target</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feed.map((e, i) => (
                    <tr key={`${e.kind}-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {e.ts.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{e.userName}</div>
                        <div className="text-[11px] text-gray-500">{e.userEmail}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            e.kind === "consultation"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {e.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{e.target || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs truncate" title={e.detail}>
                        {e.detail || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Shows the most recent 200 audit-log entries and 200 consultation events per filter.
          Audit log captures logins, record views, exports, downloads. Consultation events
          fire when a user starts or completes an ePGD form.
        </p>
      </div>
    </div>
  );
}
