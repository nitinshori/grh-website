"use client";

import { useState } from "react";

interface PostcodeLookupProps {
  /**
   * Called when a postcode resolves. Gives the locality + tidy postcode so the
   * parent can prefill the address field (pharmacist then adds house/street).
   */
  onResolved: (parts: { town: string; region: string; postcode: string }) => void;
}

/**
 * Free postcode lookup. Validates a UK postcode via /api/postcode (which
 * proxies postcodes.io) and returns the district/region so the address can be
 * part-filled. Does NOT provide house-level address selection — that needs a
 * paid PAF provider (getAddress.io / Ideal Postcodes / Loqate).
 */
export function PostcodeLookup({ onResolved }: PostcodeLookupProps) {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  async function lookup() {
    const trimmed = postcode.trim();
    if (!trimmed) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/postcode/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        onResolved({ town: data.town || "", region: data.region || "", postcode: data.postcode || trimmed });
        setStatus({ ok: true, msg: `✓ ${[data.town, data.region].filter(Boolean).join(", ") || data.postcode}` });
      } else {
        setStatus({ ok: false, msg: data.error || "Postcode not found" });
      }
    } catch {
      setStatus({ ok: false, msg: "Lookup failed — please type the address manually" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-navy-900 mb-1">
        Postcode lookup <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={postcode}
          onChange={(e) => { setPostcode(e.target.value.toUpperCase()); setStatus(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookup(); } }}
          placeholder="e.g. LE2 7LX"
          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
        />
        <button
          type="button"
          onClick={lookup}
          disabled={loading || !postcode.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: "var(--tenant-primary)" }}
        >
          {loading ? "Finding…" : "Find"}
        </button>
      </div>
      {status && (
        <p className={`text-xs mt-1.5 ${status.ok ? "text-[color:var(--tenant-primary)]" : "text-red-600"}`}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
