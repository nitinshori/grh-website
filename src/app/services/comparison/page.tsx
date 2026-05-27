import type { Metadata } from "next";
import Link from "next/link";
import {
  SERVICE_COMPARISON,
  getCoverageCounts,
} from "@/data/service-comparison";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Service Comparison: GRH vs NHS Pharmacy First & Welsh CAS",
  description:
    "Side-by-side comparison of clinical services available to UK pharmacies — Get Real Health PGDs, NHS Pharmacy First (England & Scotland), and the Welsh Common Ailment Service / Choose Pharmacy.",
};

export default function ServiceComparisonPage() {
  const counts = getCoverageCounts();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white px-4 sm:px-6 py-14">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What can your pharmacy offer?
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            How Get Real Health&apos;s 70+ private PGDs compare with the NHS-funded
            Pharmacy First (England), Pharmacy First Scotland, and the Welsh
            Common Ailment Service. Use this to see what you can already deliver
            on the NHS — and where private PGDs unlock additional revenue.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <CountTile label="GRH PGDs" value={counts.grh} accent="text-teal-700" />
            <CountTile label="Pharmacy First (Eng)" value={counts.pfe} accent="text-blue-700" />
            <CountTile label="Pharmacy First (Sct)" value={counts.pfs} accent="text-indigo-700" />
            <CountTile label="Welsh CAS / IPS" value={counts.wales} accent="text-rose-700" />
          </div>
        </div>
      </section>

      {/* Legend */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
            <strong className="text-gray-900">Legend:</strong>{" "}
            <span className="inline-flex items-center gap-1.5 ml-2">
              <span className="text-teal-600 font-bold">✓</span> Service offered
            </span>
            <span className="inline-flex items-center gap-1.5 ml-3 text-gray-500">
              <span className="text-gray-400">—</span> Not covered
            </span>
            <span className="block sm:inline sm:ml-3 mt-2 sm:mt-0 text-xs text-gray-500">
              GRH services are private/paid. NHS schemes are free at point of
              use for eligible patients but limited in scope. Reviewed May 2026.
            </span>
          </div>
        </div>
      </section>

      {/* Comparison tables — one per category */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {SERVICE_COMPARISON.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {cat.category}
              </h2>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[220px]">
                        Service
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-teal-700 min-w-[280px]">
                        GRH
                        <div className="text-[11px] font-normal text-gray-500">
                          Private / paid
                        </div>
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-blue-700 w-[140px]">
                        PF England
                        <div className="text-[11px] font-normal text-gray-500">NHS, free</div>
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-indigo-700 w-[140px]">
                        PF Scotland
                        <div className="text-[11px] font-normal text-gray-500">NHS, free</div>
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-rose-700 w-[140px]">
                        Welsh CAS
                        <div className="text-[11px] font-normal text-gray-500">NHS, free</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.rows.map((row, i) => (
                      <tr
                        key={`${cat.category}-${i}`}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium align-top">
                          {row.condition}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {row.grhOffered ? (
                            <div>
                              <div className="flex items-start gap-1.5">
                                <span className="text-teal-600 font-bold mt-0.5">✓</span>
                                <div>
                                  {row.grhDrugs && (
                                    <div className="text-gray-700 leading-snug">
                                      {row.grhDrugs}
                                    </div>
                                  )}
                                  {row.grhNotes && (
                                    <div className="text-xs text-amber-700 mt-0.5">
                                      {row.grhNotes}
                                    </div>
                                  )}
                                  {row.pgdSlug && (
                                    <Link
                                      href={`/for-pharmacies/pgd-catalogue#${row.pgdSlug}`}
                                      className="text-xs text-teal-600 hover:text-teal-700 hover:underline mt-0.5 inline-block"
                                    >
                                      View PGD
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <SchemeCell scheme={row.pfe} />
                        <SchemeCell scheme={row.pfs} />
                        <SchemeCell scheme={row.wales} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Stack private revenue on top of NHS Pharmacy First
          </h2>
          <p className="text-gray-600 mb-6">
            NHS schemes are free for patients but cover only a handful of
            conditions. Adding GRH&apos;s 70+ private PGDs lets you serve patients
            who fall outside NHS criteria — and capture the revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/for-pharmacies/pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
            >
              See pricing
            </Link>
            <Link
              href="/for-pharmacies"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 hover:border-teal-300 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Why partner with us
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>
    </div>
  );
}

function CountTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className={`text-3xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}

function SchemeCell({
  scheme,
}: {
  scheme: { offered: boolean; notes?: string };
}) {
  return (
    <td className="px-3 py-3 text-center align-top">
      {scheme.offered ? (
        <>
          <div className="text-teal-600 font-bold text-lg">✓</div>
          {scheme.notes && (
            <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
              {scheme.notes}
            </div>
          )}
        </>
      ) : (
        <span className="text-gray-300">—</span>
      )}
    </td>
  );
}
