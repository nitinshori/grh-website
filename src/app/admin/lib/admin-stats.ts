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
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
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
