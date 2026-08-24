/**
 * Server-side helpers for the admin dashboard charts.
 * All queries are read-only; safe to call from server components.
 */

import { db } from "@/lib/db";
import { pharmacies, users, onboardingRequests, pgdConsultations } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";

// ── Pharmacy signups over time (weekly buckets, last N weeks) ──

export interface PharmacySignupBucket {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekLabel: string; // e.g. "15 Apr"
  count: number;
}

export async function getPharmacySignupsByWeek(weeks: number = 12): Promise<PharmacySignupBucket[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);

  const rows = (await db.execute(sql`
    SELECT
      date_trunc('week', created_at)::date AS week_start,
      count(*)::int AS n
    FROM pharmacies
    WHERE created_at >= ${cutoff.toISOString()}
    GROUP BY 1
    ORDER BY 1 ASC
  `)) as unknown as { rows: { week_start: string; n: number }[] };

  // Build a continuous series with zeros for empty weeks
  const map = new Map<string, number>();
  for (const r of rows.rows ?? []) {
    map.set(r.week_start.slice(0, 10), Number(r.n));
  }

  const out: PharmacySignupBucket[] = [];
  const start = startOfWeek(cutoff);
  for (let i = 0; i < weeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      weekStart: iso,
      weekLabel: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      count: map.get(iso) ?? 0,
    });
  }
  return out;
}

// ── Consultations by day (last N days) ──────────────────────────

export interface ConsultationDayBucket {
  date: string;
  label: string;
  total: number;
  completed: number;
}

export async function getConsultationsByDay(days: number = 30): Promise<ConsultationDayBucket[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  let raw: { rows: { day: string; total: number; completed: number }[] };
  try {
    raw = (await db.execute(sql`
      SELECT
        date_trunc('day', started_at)::date AS day,
        count(*)::int AS total,
        count(completed_at)::int AS completed
      FROM pgd_consultations
      WHERE started_at >= ${cutoff.toISOString()}
      GROUP BY 1
      ORDER BY 1 ASC
    `)) as unknown as { rows: { day: string; total: number; completed: number }[] };
  } catch {
    return [];
  }

  const totalMap = new Map<string, number>();
  const completedMap = new Map<string, number>();
  for (const r of raw.rows ?? []) {
    const iso = r.day.slice(0, 10);
    totalMap.set(iso, Number(r.total));
    completedMap.set(iso, Number(r.completed));
  }

  const out: ConsultationDayBucket[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      date: iso,
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      total: totalMap.get(iso) ?? 0,
      completed: completedMap.get(iso) ?? 0,
    });
  }
  return out;
}

// ── GoCardless / onboarding status breakdown ────────────────────

export interface OnboardingStatusBreakdown {
  total: number;
  byStatus: { status: string; count: number }[];
  mandateActive: number;
  mandatePending: number;
  mandateFailed: number;
  noMandate: number;
  monthlyRevenuePence: number;
}

export async function getOnboardingBreakdown(): Promise<OnboardingStatusBreakdown> {
  try {
    const all = await db
      .select({
        status: onboardingRequests.status,
        mandateStatus: onboardingRequests.gocardlessMandateStatus,
        monthlyFeePence: onboardingRequests.monthlyFeePence,
      })
      .from(onboardingRequests);

    const byStatusMap = new Map<string, number>();
    let mandateActive = 0;
    let mandatePending = 0;
    let mandateFailed = 0;
    let noMandate = 0;
    let monthlyRevenuePence = 0;

    for (const row of all) {
      byStatusMap.set(row.status, (byStatusMap.get(row.status) ?? 0) + 1);
      const m = (row.mandateStatus ?? "").toLowerCase();
      if (!m) noMandate += 1;
      else if (m === "active") mandateActive += 1;
      else if (["pending_submission", "pending_customer_approval", "submitted"].includes(m)) mandatePending += 1;
      else if (["cancelled", "failed", "expired"].includes(m)) mandateFailed += 1;
      else noMandate += 1;

      if (row.status === "completed" && row.monthlyFeePence) {
        monthlyRevenuePence += row.monthlyFeePence;
      }
    }

    return {
      total: all.length,
      byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count })),
      mandateActive,
      mandatePending,
      mandateFailed,
      noMandate,
      monthlyRevenuePence,
    };
  } catch {
    return { total: 0, byStatus: [], mandateActive: 0, mandatePending: 0, mandateFailed: 0, noMandate: 0, monthlyRevenuePence: 0 };
  }
}

// ── Recent onboarding requests (for table on dashboard) ─────────

export interface RecentOnboarding {
  id: string;
  pharmacyName: string;
  // Contact fields are nullable since migration 018 — they're collected at
  // step 2 of the onboarding wizard, not step 1. A row at step 1 only has
  // pharmacy details. UI consumers must handle null.
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
  status: string;
  gocardlessMandateStatus: string | null;
  gocardlessMandateId: string | null;
  gocardlessSubscriptionId: string | null;
  monthlyFeePence: number | null;
  createdAt: Date;
  approvedAt: Date | null;
}

export async function getRecentOnboardingRequests(limit: number = 20): Promise<RecentOnboarding[]> {
  try {
    const rows = await db
      .select({
        id: onboardingRequests.id,
        pharmacyName: onboardingRequests.pharmacyName,
        contactFirstName: onboardingRequests.contactFirstName,
        contactLastName: onboardingRequests.contactLastName,
        contactEmail: onboardingRequests.contactEmail,
        status: onboardingRequests.status,
        gocardlessMandateStatus: onboardingRequests.gocardlessMandateStatus,
        gocardlessMandateId: onboardingRequests.gocardlessMandateId,
        gocardlessSubscriptionId: onboardingRequests.gocardlessSubscriptionId,
        monthlyFeePence: onboardingRequests.monthlyFeePence,
        createdAt: onboardingRequests.createdAt,
        approvedAt: onboardingRequests.approvedAt,
      })
      .from(onboardingRequests)
      .orderBy(sql`${onboardingRequests.createdAt} desc`)
      .limit(limit);
    return rows;
  } catch {
    return [];
  }
}

// ── Helper ──────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Needs-attention checks.
//
// Stag Chemist paid on 18 Aug and sat unnoticed: their request was in the
// onboarding queue awaiting approval, but a hydration bug blanked that page
// so nobody saw it. Alwoodley has been active since 16 July with no PGDs
// assigned. Both are the same failure: a customer stuck between paying and
// being able to use the service, with nothing telling anyone.
//
// These counts surface on the admin dashboard so a stuck customer is
// visible on the page everyone opens first, not only on the page that has
// to be sought out.
// ─────────────────────────────────────────────────────────────────────────

export interface NeedsAttention {
  /** Signed up and awaiting approval, so not yet provisioned. */
  awaitingApproval: number
  /** Mandate set up with GoCardless but no pharmacy record created. */
  payingWithoutAccount: number
  /** Active pharmacy with no PGDs assigned, so nothing to use. */
  activeWithoutPgds: number
}

export async function getNeedsAttention(): Promise<NeedsAttention> {
  const [awaiting] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(onboardingRequests)
    .where(sql`status IN ('submitted', 'pending', 'awaiting_approval', 'started')`)

  const [paying] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(onboardingRequests)
    .where(sql`gocardless_mandate_id IS NOT NULL AND pharmacy_id IS NULL`)

  // db.execute returns { rows }, which is how every other query in this file
  // unwraps it. This one originally guessed at the shape with an
  // Array.isArray check and a .then(), which is what took /admin down: any
  // throw in here brought the whole dashboard with it, because the caller
  // runs these in a bare Promise.all.
  const noPgdsRaw = (await db.execute(sql`
    SELECT COUNT(*)::int AS n
      FROM pharmacies p
     WHERE p.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM pharmacy_pgds x
          WHERE x.pharmacy_id = p.id AND x.status = 'approved'
       )
  `)) as unknown as { rows: { n: number }[] }
  const noPgds = (noPgdsRaw?.rows ?? [])[0]

  return {
    awaitingApproval: awaiting?.n ?? 0,
    payingWithoutAccount: paying?.n ?? 0,
    activeWithoutPgds: noPgds?.n ?? 0,
  }
}

/**
 * Never-throwing wrapper. The admin dashboard is the first thing anyone
 * opens, so a single failing count must not be able to 500 the page. If
 * this returns zeros the banner simply does not render.
 */
export async function getNeedsAttentionSafe(): Promise<NeedsAttention> {
  try {
    return await getNeedsAttention()
  } catch (err) {
    console.error('[admin] getNeedsAttention failed, returning zeros:', err)
    return { awaitingApproval: 0, payingWithoutAccount: 0, activeWithoutPgds: 0 }
  }
}
