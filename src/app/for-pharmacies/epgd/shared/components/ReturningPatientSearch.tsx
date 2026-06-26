"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BasePatientDetails } from "../types";
import { calculateAge } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// Returning-patient search box. Sits at the top of the patient-details
// step. Pharmacist types ≥2 chars of first name / last name / NHS number;
// matches scoped to their own pharmacy come back; clicking one pre-fills
// every field in the patient block so they don't have to re-type
// anything.
//
// Built in response to Moin (June 2026): "is there a way to have a patient
// registration so that you can select the patient and then have the
// service rather than having to fill out the information every single
// time as well?"
// ─────────────────────────────────────────────────────────────────────────

interface PatientResult {
  consultationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nhsNumber: string;
  phone: string;
  email: string;
  address: string;
  gpName: string;
  gpPractice: string;
  lastSeen: string;
  consultCount: number;
}

interface Props {
  onSelect: (patient: Partial<BasePatientDetails>) => void;
}

function formatDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReturningPatientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Debounced fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/recent-patients?q=${encodeURIComponent(query.trim())}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = (await res.json()) as { results: PatientResult[] };
          setResults(data.results || []);
          setOpen(true);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handlePick = useCallback(
    (r: PatientResult) => {
      // Build the patient details payload. The consumer can spread this
      // into their existing state — we DON'T set age here because the
      // existing state shape calculates age from DOB downstream.
      const payload: Partial<BasePatientDetails> = {
        firstName: r.firstName,
        lastName: r.lastName,
        dateOfBirth: r.dateOfBirth,
        age: calculateAge(r.dateOfBirth),
        nhsNumber: r.nhsNumber,
        phone: r.phone,
        email: r.email,
        address: r.address,
        gpName: r.gpName,
        gpPractice: r.gpPractice,
      };
      onSelect(payload);
      setQuery("");
      setResults([]);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <div
      ref={wrapperRef}
      className="relative bg-teal-50 border border-teal-200 rounded-lg p-3"
    >
      <label className="block text-xs font-medium text-teal-800 mb-1 uppercase tracking-wide">
        Returning patient? Search to pre-fill
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Type name (≥2 chars) or NHS number"
        className="w-full px-3 py-2 border border-teal-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-3 right-3 mt-1 bg-white border border-teal-300 rounded-lg shadow-lg max-h-80 overflow-y-auto z-10">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-2 text-xs text-gray-500">
              No previous patients matching “{query}”. Continue entering
              details below — they&apos;ll be available next time.
            </div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.consultationId}
                type="button"
                onClick={() => handlePick(r)}
                className="w-full text-left px-3 py-2 hover:bg-teal-50 border-b border-gray-100 last:border-0"
              >
                <div className="text-sm font-medium text-navy-900">
                  {r.firstName} {r.lastName}{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    · DOB {r.dateOfBirth}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  {r.nhsNumber && <span>NHS {r.nhsNumber}</span>}
                  {r.gpPractice && (
                    <span className="truncate max-w-[14rem]">
                      · {r.gpPractice}
                    </span>
                  )}
                  <span>· last seen {formatDate(r.lastSeen)}</span>
                  <span>
                    ·{" "}
                    {r.consultCount === 1
                      ? "1 consult"
                      : `${r.consultCount} consults`}
                  </span>
                </div>
              </button>
            ))}
        </div>
      )}
      <p className="text-[10px] text-teal-700/80 mt-1.5">
        Searches only consultations recorded at your pharmacy. Patient
        privacy maintained per tenant.
      </p>
    </div>
  );
}
