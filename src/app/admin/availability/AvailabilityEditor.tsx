"use client";

import { useState } from "react";
import type {
  AvailabilityConfig,
  WeeklyDefaults,
  DateOverride,
  DateOverrides,
} from "@/lib/booking-availability";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilityEditor({ initialConfig }: { initialConfig: AvailabilityConfig }) {
  const [weekly, setWeekly] = useState<WeeklyDefaults>(initialConfig.weeklyDefaults);
  const [overrides, setOverrides] = useState<DateOverrides>(initialConfig.dateOverrides);
  const [slotMinutes, setSlotMinutes] = useState<number>(initialConfig.slotMinutes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New-override form state
  const [newDate, setNewDate] = useState("");
  const [newMode, setNewMode] = useState<"blocked" | "custom">("custom");
  const [newSlotsText, setNewSlotsText] = useState("10:00, 10:30, 11:00");

  function updateDay(dow: keyof WeeklyDefaults, patch: Partial<WeeklyDefaults[keyof WeeklyDefaults]>) {
    setWeekly((w) => ({ ...w, [dow]: { ...w[dow], ...patch } }));
  }

  function addOverride() {
    setError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      setError("Date must be YYYY-MM-DD");
      return;
    }
    let entry: DateOverride;
    if (newMode === "blocked") {
      entry = { blocked: true };
    } else {
      const slots = newSlotsText
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const s of slots) {
        if (!/^\d{1,2}:\d{2}$/.test(s)) {
          setError(`Invalid time "${s}" — use HH:MM`);
          return;
        }
      }
      entry = { slots };
    }
    setOverrides((o) => ({ ...o, [newDate]: entry }));
    setNewDate("");
    setNewSlotsText("10:00, 10:30, 11:00");
  }

  function removeOverride(date: string) {
    setOverrides((o) => {
      const next = { ...o };
      delete next[date];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyDefaults: weekly, dateOverrides: overrides, slotMinutes }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      const data = (await res.json()) as { updatedAt: string };
      setSavedAt(data.updatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const sortedOverrides = Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      {/* Weekly defaults */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Weekly defaults</h2>
        <p className="text-sm text-gray-500 mb-4">
          Default working hours for each weekday. Bookings can be made within these windows
          unless a date-specific override below replaces them. Disabled days never offer slots.
        </p>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((dow) => {
            const key = String(dow) as keyof WeeklyDefaults;
            const day = weekly[key];
            return (
              <div
                key={dow}
                className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border ${
                  day.enabled ? "bg-teal-50/50 border-teal-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(key, { enabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span className="font-medium text-gray-900">{DAY_LABELS[dow - 1]}</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">From</label>
                  <input
                    type="time"
                    value={day.start}
                    onChange={(e) => updateDay(key, { start: e.target.value })}
                    disabled={!day.enabled}
                    className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <label className="text-xs text-gray-600">to</label>
                  <input
                    type="time"
                    value={day.end}
                    onChange={(e) => updateDay(key, { end: e.target.value })}
                    disabled={!day.enabled}
                    className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                {!day.enabled && (
                  <span className="text-xs text-gray-500 ml-auto">No slots offered</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-gray-700">Slot length</label>
          <select
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>
      </section>

      {/* Date overrides */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Date-specific overrides</h2>
        <p className="text-sm text-gray-500 mb-4">
          Replace the weekly default for a specific date. Use blocked to take a whole day off,
          or custom slots to offer only specific times (e.g. an evening session).
        </p>

        {/* Existing overrides */}
        {sortedOverrides.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No overrides set.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {sortedOverrides.map(([date, entry]) => (
              <div
                key={date}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <span className="font-medium text-gray-900 min-w-[120px]">{formatDate(date)}</span>
                <span className="text-sm text-gray-700 flex-1">
                  {"blocked" in entry
                    ? "Blocked (no slots)"
                    : `Slots: ${(entry as { slots: string[] }).slots.join(", ")}`}
                </span>
                <button
                  type="button"
                  onClick={() => removeOverride(date)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new override */}
        <div className="p-4 border border-dashed border-gray-300 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-3">Add an override</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
              <select
                value={newMode}
                onChange={(e) => setNewMode(e.target.value as "blocked" | "custom")}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="custom">Custom slots</option>
                <option value="blocked">Blocked (day off)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addOverride}
                disabled={!newDate}
                className="w-full px-4 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
          {newMode === "custom" && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Slot times (HH:MM, comma- or space-separated)
              </label>
              <input
                type="text"
                value={newSlotsText}
                onChange={(e) => setNewSlotsText(e.target.value)}
                placeholder="10:00, 10:30, 11:00"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm font-mono"
              />
            </div>
          )}
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 md:-mx-8 px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {error && <span className="text-red-600">⚠ {error}</span>}
          {!error && savedAt && (
            <span className="text-green-700">
              ✓ Saved {new Date(savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.
              Live within ~30 seconds.
            </span>
          )}
          {!error && !savedAt && <span>Edits are not saved until you click Save.</span>}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
