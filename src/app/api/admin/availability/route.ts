import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingAvailability } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidateAvailabilityCache, type WeeklyDefaults, type DateOverrides } from "@/lib/booking-availability";

export const dynamic = "force-dynamic";

function isSuperAdmin(role?: string | null): boolean {
  return role === "super_admin";
}

// ── GET — fetch current config ─────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await db.select().from(bookingAvailability).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Config row missing — run migration 015." }, { status: 500 });
  }
  const r = rows[0];
  return NextResponse.json({
    weeklyDefaults: r.weeklyDefaults,
    dateOverrides: r.dateOverrides,
    slotMinutes: r.slotMinutes,
    updatedAt: r.updatedAt,
  });
}

// ── PUT — save updated config ──────────────────────────────────

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as {
    weeklyDefaults?: WeeklyDefaults;
    dateOverrides?: DateOverrides;
    slotMinutes?: number;
  } | null;

  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });

  // Validate weekly defaults
  if (body.weeklyDefaults) {
    for (const k of ["1", "2", "3", "4", "5", "6", "7"]) {
      const d = body.weeklyDefaults[k as keyof WeeklyDefaults];
      if (!d || typeof d.enabled !== "boolean" || typeof d.start !== "string" || typeof d.end !== "string") {
        return NextResponse.json({ error: `weeklyDefaults.${k} malformed` }, { status: 400 });
      }
      if (!/^\d{1,2}:\d{2}$/.test(d.start) || !/^\d{1,2}:\d{2}$/.test(d.end)) {
        return NextResponse.json({ error: `weeklyDefaults.${k} time format must be HH:MM` }, { status: 400 });
      }
    }
  }

  // Validate date overrides
  if (body.dateOverrides) {
    for (const [k, v] of Object.entries(body.dateOverrides)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) {
        return NextResponse.json({ error: `dateOverrides key '${k}' must be YYYY-MM-DD` }, { status: 400 });
      }
      if ("blocked" in v) {
        if (v.blocked !== true) {
          return NextResponse.json({ error: `dateOverrides[${k}].blocked must be true` }, { status: 400 });
        }
      } else if ("slots" in v) {
        if (!Array.isArray(v.slots) || v.slots.some((s) => !/^\d{1,2}:\d{2}$/.test(s))) {
          return NextResponse.json({ error: `dateOverrides[${k}].slots must be HH:MM strings` }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: `dateOverrides[${k}] must have slots or blocked` }, { status: 400 });
      }
    }
  }

  if (body.slotMinutes !== undefined && ![15, 30, 60].includes(body.slotMinutes)) {
    return NextResponse.json({ error: "slotMinutes must be 15, 30, or 60" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.weeklyDefaults) updates.weeklyDefaults = body.weeklyDefaults;
  if (body.dateOverrides) updates.dateOverrides = body.dateOverrides;
  if (body.slotMinutes !== undefined) updates.slotMinutes = body.slotMinutes;

  await db.update(bookingAvailability).set(updates).where(eq(bookingAvailability.id, 1));
  invalidateAvailabilityCache();

  return NextResponse.json({ ok: true, updatedAt: updates.updatedAt });
}
