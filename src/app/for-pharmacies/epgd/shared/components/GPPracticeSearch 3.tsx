"use client";

import { useEffect, useRef, useState } from "react";

interface GPPracticeSearchProps {
  /** Current GP practice name (read-only display once selected; user can also clear). */
  practice: string;
  /** Called with the matched practice. address/phone/odsCode are all optional. */
  onSelect: (match: { name: string; address: string; phone: string; odsCode: string }) => void;
  /** Called when user clears the practice selection. */
  onClear: () => void;
}

interface SearchResult {
  odsCode: string;
  name: string;
  postcode: string;
}

/**
 * Searches NHS ODS Spine for GP practices. User types ≥3 chars, picks one,
 * we fetch detail (address, phone) and call onSelect.
 */
export function GPPracticeSearch({ practice, onSelect, onClear }: GPPracticeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gp-search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          if (!cancelled) setResults([]);
          return;
        }
        const data = (await res.json()) as { results: SearchResult[] };
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handlePick(r: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    // Fetch full details to get address + phone
    try {
      const res = await fetch(`/api/gp-search/${r.odsCode}`);
      if (res.ok) {
        const data = (await res.json()) as { name: string; address: string; phone: string; odsCode: string };
        onSelect({ name: data.name, address: data.address, phone: data.phone, odsCode: data.odsCode });
        return;
      }
    } catch { /* fall through */ }
    // Fallback: at least set the name
    onSelect({ name: r.name, address: "", phone: "", odsCode: r.odsCode });
  }

  if (practice) {
    // Already selected → show as a chip with a clear button
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg text-sm">
        <svg className="w-4 h-4 text-[color:var(--tenant-primary)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="flex-1 text-navy-900">{practice}</span>
        <button
          type="button"
          onClick={() => { onClear(); setQuery(""); }}
          className="text-xs text-gray-500 hover:text-red-600 font-medium"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search NHS GP practices by name…"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
      />
      {open && query.length >= 3 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500">Searching NHS directory…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No matches. Type more characters.</div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.odsCode}
              type="button"
              onClick={() => handlePick(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[color:var(--tenant-primary)]/10 border-b border-gray-100 last:border-0"
            >
              <div className="text-navy-900 font-medium">{r.name}</div>
              <div className="text-xs text-gray-500">
                {r.postcode || "—"} · ODS {r.odsCode}
              </div>
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Search by practice name (3+ chars). Pulls live data from the NHS Spine ODS.
      </p>
    </div>
  );
}
