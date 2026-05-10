"use client";

import { usePathname } from "next/navigation";
import { getPgdDocumentUrl } from "@/lib/pgd-documents";

/**
 * Renders "Back to Dashboard" and "Download Written PGD" links.
 * Auto-detects the PGD slug from the current URL path.
 * Place this as the first child inside the main content container.
 */
export function PgdPageActions() {
  const pathname = usePathname();
  // Extract slug from /for-pharmacies/epgd/{slug}
  const segments = pathname.split("/");
  const slug = segments[segments.indexOf("epgd") + 1] || "";
  const pdfUrl = getPgdDocumentUrl(slug);

  return (
    <div className="flex items-center justify-between mb-4 print:hidden">
      <a
        href="/for-pharmacies/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </a>
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Written PGD
        </a>
      )}
    </div>
  );
}
