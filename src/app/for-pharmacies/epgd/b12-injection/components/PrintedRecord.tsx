"use client";

// Minimal printed consultation record. The tool used to print the whole
// form (adversarial review, 11 Sep 2026); the document's records row wants
// the patient, PGD and version, what was supplied (or that nothing was),
// batch and expiry, consent, advice, the practitioner and the date.
export function PrintedRecord({
  title,
  pgdLine,
  rows,
}: {
  title: string;
  pgdLine: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 print:border-0 print:p-0">
      <div className="border-b-2 border-navy-900 pb-2 mb-3">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">{title}</h2>
        <p className="text-xs text-gray-500">{pgdLine}</p>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0">
            <dt className="text-xs font-medium text-gray-500 col-span-1">{label}</dt>
            <dd className="text-xs text-navy-900 col-span-2 whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
      </div>
      <p className="mt-3 text-[10px] text-gray-400">Supplied or administered under a Patient Group Direction. Records are kept for 8 years for adults.</p>
    </div>
  );
}
