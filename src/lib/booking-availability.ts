/**
 * Booking-availability config — reads from the single-row
 * `booking_availability` table. Used by the discovery-call /book
 * page to decide which slots to offer.
 *
 * On any DB error the helpers fall back to a sensible Mon-Fri 9-17
 * default so the booking page never goes blank even if the DB blips.
 */
import { db } from "@/lib/db";
import { bookingAvailability } from "@/lib/db/schema";

export interface DayDefault {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export type WeeklyDefaults = Record<"1" | "2" | "3" | "4" | "5" | "6" | "7", DayDefault>;

export type DateOverride =
  | { slots: string[] } // explicit list of HH:MM start times
  | { blocked: true };

export type DateOverrides = Record<string, DateOverride>;

export interface AvailabilityConfig {
  weeklyDefaults: WeeklyDefaults;
  dateOverrides: DateOverrides;
  slotMinutes: number;
}

const FALLBACK: AvailabilityConfig = {
  weeklyDefaults: {
    "1": { enabled: true, start: "09:00", end: "17:00" },
    "2": { enabled: true, start: "09:00", end: "17:00" },
    "3": { enabled: true, start: "09:00", end: "17:00" },
    "4": { enabled: true, start: "09:00", end: "17:00" },
    "5": { enabled: true, start: "09:00", end: "17:00" },
    "6": { enabled: false, start: "09:00", end: "17:00" },
    "7": { enabled: false, start: "09:00", end: "17:00" },
  },
  dateOverrides: {},
  slotMinutes: 30,
};

let cached: { value: AvailabilityConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30s — admin edits visible within half a minute

export async function getAvailabilityConfig(): Promise<AvailabilityConfig> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const rows = await db.select().from(bookingAvailability).limit(1);
    if (rows.length === 0) {
      cached = { value: FALLBACK, expiresAt: Date.now() + CACHE_TTL_MS };
      return FALLBACK;
    }
    const row = rows[0];
    const config: AvailabilityConfig = {
      weeklyDefaults: (row.weeklyDefaults as WeeklyDefaults) ?? FALLBACK.weeklyDefaults,
      dateOverrides: (row.dateOverrides as DateOverrides) ?? {},
      slotMinutes: row.slotMinutes ?? 30,
    };
    cached = { value: config, expiresAt: Date.now() + CACHE_TTL_MS };
    return config;
  } catch (err) {
    console.error("booking-availability fallback to defaults:", err);
    return FALLBACK;
  }
}

export function invalidateAvailabilityCache(): void {
  cached = null;
}

/**
 * Build the (hour, minute) candidate slots for a given UK-local date,
 * using the config's overrides or weekday defaults. Returns [] if the
 * day is blocked or disabled.
 */
export function candidatesForDate(config: AvailabilityConfig, dateKey: string, isoDow: number): Array<[number, number]> {
  // 1) Per-date override wins (even on weekends)
  const override = config.dateOverrides[dateKey];
  if (override) {
    if ("blocked" in override) return [];
    return override.slots.flatMap((hhmm) => parseHm(hhmm));
  }
  // 2) Weekly default — isoDow is 1..7 (Mon..Sun)
  const dow = String(isoDow) as keyof WeeklyDefaults;
  const def = config.weeklyDefaults[dow];
  if (!def || !def.enabled) return [];
  const [sh, sm] = parseHm(def.start)[0] ?? [9, 0];
  const [eh, em] = parseHm(def.end)[0] ?? [17, 0];
  const minutes = config.slotMinutes;
  const out: Array<[number, number]> = [];
  let cursor = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cursor + minutes <= end) {
    out.push([Math.floor(cursor / 60), cursor % 60]);
    cursor += minutes;
  }
  return out;
}

function parseHm(s: string): Array<[number, number]> {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return [];
  const h = parseInt(m[1], 10);
  const mn = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(mn) || h < 0 || h > 23 || mn < 0 || mn > 59) return [];
  return [[h, mn]];
}
