"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Draft {
  id: string;
  pgdSlug: string;
  bookingType: "in_progress" | "phone_booking";
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDob: string | null;
  patientPhone: string | null;
  expectedVisitDate: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface PgdOption {
  id: string;
  title: string;
}

interface Props {
  initialDrafts: Draft[];
  pgdOptions: PgdOption[];
}

type FilterTab = "all" | "phone_booking" | "in_progress";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  // For YYYY-MM-DD dates
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntilExpiry(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function daysUntilVisit(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function DraftsClient({ initialDrafts, pgdOptions }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [showForm, setShowForm] = useState(false);

  const counts = useMemo(() => ({
    all: drafts.length,
    phone_booking: drafts.filter((d) => d.bookingType === "phone_booking").length,
    in_progress: drafts.filter((d) => d.bookingType === "in_progress").length,
  }), [drafts]);

  const visibleDrafts = useMemo(() => {
    const filtered = tab === "all" ? drafts : drafts.filter((d) => d.bookingType === tab);
    // Phone bookings: sort by expected visit date asc. In-progress: by updatedAt desc.
    return [...filtered].sort((a, b) => {
      if (a.bookingType === "phone_booking" && b.bookingType === "phone_booking") {
        return (a.expectedVisitDate ?? "").localeCompare(b.expectedVisitDate ?? "");
      }
      if (a.bookingType !== b.bookingType) {
        return a.bookingType === "phone_booking" ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [drafts, tab]);

  async function handleDelete(id: string, isBooking: boolean) {
    const noun = isBooking ? "phone booking" : "draft";
    if (!window.confirm(`Discard this ${noun}? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/consultation-drafts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert(`Could not delete ${noun}. Please try again.`);
      }
    } finally {
      setBusyId(null);
    }
  }

  function handleCreated(d: Draft) {
    setDrafts((prev) => [d, ...prev]);
    setShowForm(false);
    setTab("phone_booking");
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {([
            { key: "all", label: "All", count: counts.all },
            { key: "phone_booking", label: "Phone bookings", count: counts.phone_booking },
            { key: "in_progress", label: "In progress", count: counts.in_progress },
          ] as { key: FilterTab; label: string; count: number }[]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? "bg-teal-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${tab === t.key ? "text-teal-100" : "text-gray-500"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New phone booking
        </button>
      </div>

      {/* Empty state */}
      {visibleDrafts.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            {tab === "phone_booking"
              ? "No phone bookings yet."
              : tab === "in_progress"
              ? "No drafts in progress."
              : "No drafts or phone bookings."}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {tab === "phone_booking" || tab === "all"
              ? "Click “New phone booking” to capture a patient who phoned to book."
              : "While inside a PGD consultation, click Save as draft to come back to it later."}
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {visibleDrafts.map((d) => {
          const patient =
            d.patientFirstName || d.patientLastName
              ? `${d.patientFirstName ?? ""} ${d.patientLastName ?? ""}`.trim()
              : "(no patient name yet)";
          const expiryDays = daysUntilExpiry(d.expiresAt);
          const isBooking = d.bookingType === "phone_booking";
          const pgdTitle = pgdOptions.find((p) => p.id === d.pgdSlug)?.title ?? d.pgdSlug;

          return (
            <div
              key={d.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{patient}</span>
                  {isBooking ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-purple-100 text-purple-800">
                      Phone booking
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800">
                      In progress
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {pgdTitle} · DOB {d.patientDob || "—"}
                  {d.patientPhone && <> · {d.patientPhone}</>}
                </div>
                {isBooking && d.expectedVisitDate && (() => {
                  const days = daysUntilVisit(d.expectedVisitDate);
                  const label =
                    days === 0 ? "today" :
                    days === 1 ? "tomorrow" :
                    days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago` :
                    `in ${days} days`;
                  return (
                    <div className={`text-xs mt-1 font-medium ${days < 0 ? "text-red-600" : days <= 1 ? "text-teal-700" : "text-gray-700"}`}>
                      Expected visit: {formatDate(d.expectedVisitDate)} ({label})
                    </div>
                  );
                })()}
                {!isBooking && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Saved {formatDateTime(d.updatedAt)}
                  </div>
                )}
                {d.note && (
                  <div className="text-xs text-gray-700 mt-1.5 italic">&ldquo;{d.note}&rdquo;</div>
                )}
                <div className="text-xs text-amber-600 mt-1">
                  Expires in {expiryDays} day{expiryDays === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/for-pharmacies/epgd/${d.pgdSlug}?draftId=${d.id}`}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md font-medium transition-colors"
                >
                  {isBooking ? "Start consultation" : "Resume"}
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id, isBooking)}
                  disabled={busyId === d.id}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {busyId === d.id ? "…" : "Discard"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <PhoneBookingForm
          pgdOptions={pgdOptions}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Phone booking creation modal
// ──────────────────────────────────────────────────────────────────

interface FormProps {
  pgdOptions: PgdOption[];
  onCreated: (d: Draft) => void;
  onCancel: () => void;
}

function PhoneBookingForm({ pgdOptions, onCreated, onCancel }: FormProps) {
  const [pgdSlug, setPgdSlug] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pgdSlug) {
      setError("Please select which service the patient is booking for.");
      return;
    }
    if (!firstName.trim() && !lastName.trim()) {
      setError("Please enter at least a first or last name.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/consultation-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgdSlug,
          bookingType: "phone_booking",
          patientFirstName: firstName.trim() || undefined,
          patientLastName: lastName.trim() || undefined,
          patientDob: dob || undefined,
          patientPhone: phone.trim() || undefined,
          expectedVisitDate: visitDate || undefined,
          note: note.trim() || undefined,
          draftState: {},
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || `Failed to create booking (${res.status})`);
        return;
      }
      const { id } = (await res.json()) as { id: string };
      // Optimistic local insert — matches what the GET endpoint would return.
      const nowIso = new Date().toISOString();
      const expIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      onCreated({
        id,
        pgdSlug,
        bookingType: "phone_booking",
        patientFirstName: firstName.trim() || null,
        patientLastName: lastName.trim() || null,
        patientDob: dob || null,
        patientPhone: phone.trim() || null,
        expectedVisitDate: visitDate || null,
        note: note.trim() || null,
        createdAt: nowIso,
        updatedAt: nowIso,
        expiresAt: expIso,
      });
    } catch (err) {
      setError(`Network error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">New phone booking</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Capture a patient who phoned to book. The pharmacist will resume from here when they arrive.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-700 -mr-1 -mt-1 p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service (PGD) *</label>
            <select
              required
              value={pgdSlug}
              onChange={(e) => setPgdSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select a service…</option>
              {pgdOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0114 …"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expected visit date</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. patient asked about Mounjaro, wants morning appointment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save phone booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
