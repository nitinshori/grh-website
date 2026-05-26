"use client";

import { useSession } from "next-auth/react";
import { hasPgdDocument } from "@/lib/pgd-documents";

interface PgdDocumentLinkProps {
  slug: string;
  /** Display variant: 'button' for ePGD pages, 'compact' for dashboard list */
  variant?: "button" | "compact";
  className?: string;
}

export function PgdDocumentLink({
  slug,
  variant = "button",
  className = "",
}: PgdDocumentLinkProps) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  // Prospects (preview accounts for interested pharmacies) cannot download
  // the signed PGD documents — they can browse the platform but not pull
  // the legal PDFs.
  if (role === "prospect") return null;

  // Hide button if no GRH master exists for this slug. If the pharmacy has
  // an override but no master, the admin needs to ensure both exist — edge
  // case for trt / testosterone-women / travellers-diarrhoea (no master).
  if (!hasPgdDocument(slug)) return null;

  // Route through the server resolver so the pharmacy sees its custom signed
  // version (if uploaded) or the GRH master. The auth + pharmacy_id resolution
  // happens server-side; the client only knows it's a download link.
  const url = `/api/dashboard/pgd-document/${slug}`;

  if (variant === "compact") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 transition-colors ${className}`}
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
        Download PGD
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-teal-300 transition-colors shadow-sm print:hidden ${className}`}
    >
      <svg
        className="w-4 h-4 text-teal-500"
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
      Download Written PGD (PDF)
    </a>
  );
}
