"use client";

import { useState } from "react";

interface PostcodeLookupProps {
  /**
   * Called when a postcode resolves to a locality only (no address list —
   * free-tier lookup). Parent part-fills the address; pharmacist adds
   * house/street.
   */
  onResolved: (parts: { town: string; region: string; postcode: string }) => void;
  /**
   * Called when the pharmacist picks a specific address from the PAF list
   * (available when GETADDRESS_API_KEY is configured server-side). The
   * string is the full address minus postcode.
   */
  onAddressSelected?: (parts: { address: string; postcode: string }) => void;
}

/**
 * Postcode lookup. With a getAddress.io key configured on the server this
 * shows a pick-your-address dropdown (full Royal Mail PAF data); without
 * one it falls back to validating the postcode and filling town/region.
 */
export function PostcodeLookup({ onResolved, onAddressSelected }: PostcodeLookupProps) {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [resolvedPostcode, setResolvedPostcode] = useState("");

  async function lookup() {
    const trimmed = postcode.trim();
    if (!trimmed) return;
    setLoading(true);
    setStatus(null);
    setAddresses([]);
    try {
      const res = await fetch(`/api/postcode/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        if (Array.isArray(data.addresses) && data.addresses.length > 0) {
          // PAF tier — let the pharmacist pick the exact address.
          setAddresses(data.addresses);
          setResolvedPostcode(data.postcode || trimmed);
          setStatus({ ok: true, msg: `✓ ${data.addresses.length} addresses found — select below` });
        } else {
          onResolved({ town: data.town || "", region: data.region || "", postcode: data.postcode || trimmed });
          setStatus({ ok: true, msg: `✓ ${[data.town, data.region].filter(Boolean).join(", ") || data.postcode}` });
        }
      } else {
        setStatus({ ok: false, msg: data.error || "Postcode not found" });
      }
    } catch {
      setStatus({ ok: false, msg: "Lookup failed — please type the address manually" });
    } finally {
      setLoading(false);
    }
  }

  function pickAddress(value: string) {
    if (!value) return;
    if (onAddressSelected) {
      onAddressSelected({ address: value, postcode: resolvedPostcode });
    } else {
      // Parent only understands the locality callback — deliver the chosen
      // address through `town` so it still lands in the address field.
      onResolved({ town: value, region: "", postcode: resolvedPostcode });
    }
    setStatus({ ok: true, msg: "✓ Address filled" });
    setAddresses([]);
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
          onChange={(e) => { setPostcode(e.target.value.toUpperCase()); setStatus(null); setAddresses([]); }}
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
      {addresses.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => pickAddress(e.target.value)}
          className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
        >
          <option value="" disabled>Select the patient&apos;s address…</option>
          {addresses.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      )}
      {status && (
        <p className={`text-xs mt-1.5 ${status.ok ? "text-[color:var(--tenant-primary)]" : "text-red-600"}`}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
