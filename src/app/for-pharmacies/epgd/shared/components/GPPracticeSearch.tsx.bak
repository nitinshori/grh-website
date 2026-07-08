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
 *
 * Three search modes (the API decides which):
 *   • Name — typed first chars of the surgery name (startswith)
 *   • Postcode — query looks like a postcode (LE2, BS1, SW1A...)
 *   • City fallback — user typed a known UK city name → fan out across
 *     the city's postcode prefixes (LE1–LE5 for Leicester, etc.)
 */
export function GPPracticeSearch({ practice, onSelect, onClear }: GPPracticeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [matchedCity, setMatchedCity] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"name" | "postcode" | "city-fallback" | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search. Allow 2-char queries when they look like postcode
  // area codes (e.g. "LE", "BS") because the backend handles postcode
  // searches separately from name searches.
  useEffect(() => {
    const isPostcodeish = /^[A-Z]{1,2}\d/i.test(query.trim());
    const minChars = isPostcodeish ? 2 : 3;
    if (!query || query.length < minChars) {
      setResults([]);
      setMatchedCity(null);
      setSearchMode(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gp-search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          if (!cancelled) {
            setResults([]);
            setMatchedCity(null);
            setSearchMode(null);
          }
          return;
        }
        const data = (await res.json()) as {
          results: SearchResult[];
          matchedCity?: string | null;
          searchMode?: "name" | "postcode" | "city-fallback";
        };
        if (!cancelled) {
          setResults(data.results ?? []);
          setMatchedCity(data.matchedCity ?? null);
          setSearchMode(data.searchMode ?? null);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setMatchedCity(null);
          setSearchMode(null);
        }
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
      <div className="flex items-start gap-2 px-3 py-2.5 bg-teal-50 border border-teal-200 rounded-lg text-sm">
        <svg className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        placeholder="Search by name, postcode (LE2), or city (Leicester)…"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      />
      {open && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500">Searching NHS directory…</div>
          )}

          {!loading && searchMode === "city-fallback" && matchedCity && results.length > 0 && (
            <div className="px-3 py-2 text-[11px] text-teal-800 bg-teal-50 border-b border-teal-100">
              Showing GP practices in <strong className="capitalize">{matchedCity}</strong> by postcode.
              For an exact match, try the surgery name (e.g. &ldquo;Highfields&rdquo;).
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-xs text-gray-600 space-y-2">
              <p className="text-gray-700 font-medium">No matches for &ldquo;{query}&rdquo;.</p>
              <p>Three things you can try:</p>
              <ul className="list-disc ml-4 space-y-1 text-gray-600">
                <li><strong>Postcode</strong> — type the start (e.g. <code className="px-1 py-0.5 bg-gray-100 rounded">LE2</code> for central Leicester)</li>
                <li><strong>Surgery name</strong> — type the start (e.g. <code className="px-1 py-0.5 bg-gray-100 rounded">Highfields</code> not &ldquo;The Highfields Practice&rdquo;)</li>
                <li><strong>City</strong> — works for major UK cities (Leicester, Bradford, Manchester, etc.)</li>
              </ul>
            </div>
          )}

          {!loading && results.map((r) => (
            <button
              key={r.odsCode}
              type="button"
              onClick={() => handlePick(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 border-b border-gray-100 last:border-0"
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
        Search by surgery name, postcode (e.g. LE2), or city (e.g. Leicester). Pulls live data from NHS Spine ODS.
      </p>
    </div>
  );
}
