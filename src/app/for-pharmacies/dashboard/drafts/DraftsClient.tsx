"use client";

import Link from "next/link";
import { useState } from "react";

interface Draft {
  id: string;
  pgdSlug: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDob: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface Props {
  initialDrafts: Draft[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntilExpiry(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function DraftsClient({ initialDrafts }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Discard this draft? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/consultation-drafts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert("Could not delete draft. Please try again.");
      }
    } finally {
      setBusyId(null);
    }
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-sm text-gray-500">No drafts in progress.</p>
        <p className="text-xs text-gray-400 mt-2">
          Tip: while inside a PGD consultation, click <strong>Save as draft</strong> to come back to it later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((d) => {
        const patient =
          d.patientFirstName || d.patientLastName
            ? `${d.patientFirstName ?? ""} ${d.patientLastName ?? ""}`.trim()
            : "(no patient name yet)";
        const days = daysUntilExpiry(d.expiresAt);
        return (
          <div
            key={d.id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{patient}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {d.pgdSlug} · DOB {d.patientDob || "—"} · saved {formatDate(d.updatedAt)}
              </div>
              {d.note && (
                <div className="text-xs text-gray-700 mt-1.5 italic">"{d.note}"</div>
              )}
              <div className="text-xs text-amber-600 mt-1">
                Expires in {days} day{days === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/for-pharmacies/epgd/${d.pgdSlug}?draftId=${d.id}`}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md font-medium transition-colors"
              >
                Resume
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(d.id)}
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
  );
}
