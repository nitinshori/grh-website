"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_PGDS } from "@/lib/pgd-access";

type DocumentRow = {
  id: string;
  pgdSlug: string;
  documentUrl: string;
  filename: string | null;
  fileSizeBytes: number | null;
  version: number;
  signedByNames: string | null;
  notes: string | null;
  uploadedAt: string;
  uploadedBy: string | null;
};

function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PgdDocumentsClient() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSlug, setSelectedSlug] = useState("");
  const [signedByNames, setSignedByNames] = useState("");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const slugOptions = useMemo(
    () =>
      ALL_PGDS.map((p) => ({
        slug: p.slug,
        label: `${p.title}${p.subtitle ? " — " + p.subtitle : ""}`,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/dashboard/pgd-documents", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Failed to load documents");
        setDocuments([]);
      } else {
        setDocuments(data.documents || []);
      }
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Failed to load documents",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedSlug) {
      setUploadError("Pick a PGD from the dropdown first.");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a PDF file to upload.");
      return;
    }
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadError("File must be a PDF.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("PDF too large — 25 MB maximum.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pgdSlug", selectedSlug);
      if (signedByNames.trim()) formData.append("signedByNames", signedByNames);
      if (notes.trim()) formData.append("notes", notes);

      const res = await fetch("/api/dashboard/pgd-documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        const label =
          slugOptions.find((o) => o.slug === selectedSlug)?.label ||
          selectedSlug;
        setUploadSuccess(
          `Uploaded ${file.name} as ${label} (version ${data.version}). Your team will see this version on their dashboard.`,
        );
        setSelectedSlug("");
        setSignedByNames("");
        setNotes("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadDocuments();
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(slug: string) {
    const label =
      slugOptions.find((o) => o.slug === slug)?.label || slug;
    if (
      !window.confirm(
        `Remove your signed version of "${label}"?\n\n` +
          `Your team will go back to the GRH default document. ` +
          `Previous versions are kept for audit but no longer shown.`,
      )
    ) {
      return;
    }
    setDeletingSlug(slug);
    try {
      const res = await fetch(
        `/api/dashboard/pgd-documents?slug=${encodeURIComponent(slug)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "Delete failed");
      } else {
        await loadDocuments();
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Upload form ──────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Upload a signed PGD
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            PDF up to 25 MB. Should be password-protected against editing /
            copying. Each upload becomes a new version for that PGD.
          </p>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {uploadError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
            </div>
          )}
          {uploadSuccess && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-300">
              <p className="text-sm font-medium text-green-900">
                {uploadSuccess}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              PGD <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              required
            >
              <option value="">— select a PGD —</option>
              {slugOptions.map((opt) => (
                <option key={opt.slug} value={opt.slug}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              PDF file <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-[color:var(--tenant-primary)]/10 file:text-[color:var(--tenant-primary)] file:font-medium hover:file:bg-[color:var(--tenant-primary)]/15"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Signed by
              </label>
              <input
                type="text"
                value={signedByNames}
                onChange={(e) => setSignedByNames(e.target.value)}
                placeholder="e.g. Janey Tipping, Sarah Passmore"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional — e.g. expiry, version note"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: uploading ? "#999" : "var(--tenant-primary)" }}
          >
            {uploading ? "Uploading…" : "Upload PGD"}
          </button>
        </form>
      </div>

      {/* ── Current documents ─────────────────────────────── */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Your current signed PGDs
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              These are the versions your team currently sees on the
              pharmacist dashboard. PGDs not listed here use the GRH default
              document.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadDocuments()}
            className="text-sm text-[color:var(--tenant-primary)] hover:text-[color:var(--tenant-primary)] font-medium"
          >
            Refresh
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : loadError ? (
            <p className="text-sm text-red-700">{loadError}</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven&rsquo;t uploaded any signed PGD documents yet. Use the
              form above to add one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-gray-700">
                  <tr className="text-left">
                    <th className="py-2 pr-3 font-medium">PGD</th>
                    <th className="py-2 pr-3 font-medium">Filename</th>
                    <th className="py-2 pr-3 font-medium">Size</th>
                    <th className="py-2 pr-3 font-medium">Version</th>
                    <th className="py-2 pr-3 font-medium">Signed by</th>
                    <th className="py-2 pr-3 font-medium">Uploaded</th>
                    <th className="py-2 pr-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => {
                    const label =
                      slugOptions.find((o) => o.slug === d.pgdSlug)?.label ||
                      d.pgdSlug;
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 pr-3 align-top">{label}</td>
                        <td className="py-3 pr-3 align-top">
                          <a
                            href={d.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[color:var(--tenant-primary)] hover:underline"
                          >
                            {d.filename || "open PDF"}
                          </a>
                          {d.notes && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {d.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top text-gray-700">
                          {formatBytes(d.fileSizeBytes)}
                        </td>
                        <td className="py-3 pr-3 align-top text-gray-700">
                          v{d.version}
                        </td>
                        <td className="py-3 pr-3 align-top text-gray-700">
                          {d.signedByNames || "—"}
                        </td>
                        <td className="py-3 pr-3 align-top text-gray-700">
                          <div>{formatDate(d.uploadedAt)}</div>
                          {d.uploadedBy && (
                            <div className="text-xs text-gray-500">
                              by {d.uploadedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(d.pgdSlug)}
                            disabled={deletingSlug === d.pgdSlug}
                            className="text-xs text-red-700 hover:text-red-900 font-medium disabled:opacity-50"
                          >
                            {deletingSlug === d.pgdSlug
                              ? "Removing…"
                              : "Remove"}
                          </button>
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
    </div>
  );
}
