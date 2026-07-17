"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// MenACWY vaccination certificate. Printed by pharmacist after a completed
// consultation so the patient has documentary proof of vaccination — for
// Hajj/Umrah authorities, university enrolment, employer travel records,
// etc.
//
// Built in response to Moin (June 2026): "previously I remember you had
// an option for ACWY vaccination certificate. Has that been removed? I
// assumed that was there for people who had been vaccinated at school or
// surgery and wanted a certificate for travel."
//
// Data flows in via sessionStorage so the patient + vaccine details from
// the consultation form get carried over without serialising them into
// the URL (avoids PHI in browser history). The MenACWY client writes
// `grh-menacwy-cert` before opening this route in a new tab.
//
// The page auto-triggers window.print() on load so the pharmacist can
// "Save as PDF" or print on paper without an extra click. @media print
// CSS in the styles below makes the layout look like an official
// certificate (A4 portrait, no chrome).
// ─────────────────────────────────────────────────────────────────────────

interface CertData {
  patientFirstName: string;
  patientLastName: string;
  patientDob: string;
  patientNhsNumber?: string;
  vaccineType: "nimenrix" | "menveo" | "";
  batchNumber: string;
  expiryDate: string;
  administrationSite: string;
  travelReason: string;
  consultationDate: string;
  pharmacistName: string;
  pharmacistGPhC: string;
  pharmacyName: string;
  pharmacyAddress: string;
}

const VACCINE_LABEL: Record<string, string> = {
  nimenrix: "Nimenrix (GlaxoSmithKline)",
  menveo: "Menveo (Sanofi)",
};

const SITE_LABEL: Record<string, string> = {
  "left-deltoid": "Left deltoid (intramuscular)",
  "right-deltoid": "Right deltoid (intramuscular)",
};

const TRAVEL_LABEL: Record<string, string> = {
  "hajj-umrah": "Hajj or Umrah pilgrimage",
  "meningitis-belt": "Travel to Sub-Saharan African meningitis belt",
  university: "University attendance",
  other: "Other travel",
};

function formatDateUK(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function MenACWYCertificatePage() {
  const [data, setData] = useState<CertData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      // Primary: localStorage handoff (survives the `noopener` new tab —
      // sessionStorage does not). Read once, then delete immediately so
      // patient data doesn't persist; ignore payloads older than 5 minutes.
      const rawLocal = localStorage.getItem("grh-menacwy-cert");
      if (rawLocal) {
        localStorage.removeItem("grh-menacwy-cert");
        const parsed = JSON.parse(rawLocal) as { ts?: number; data?: CertData };
        if (parsed?.data && typeof parsed.ts === "number" && Date.now() - parsed.ts < 5 * 60_000) {
          setData(parsed.data);
          return;
        }
      }
      // Legacy fallback: sessionStorage (pre-fix payload shape).
      const raw = sessionStorage.getItem("grh-menacwy-cert");
      if (!raw) {
        setMissing(true);
        return;
      }
      setData(JSON.parse(raw) as CertData);
    } catch {
      setMissing(true);
    }
  }, []);

  // Auto-trigger print once data is loaded. Tiny delay lets the layout
  // settle before the print dialog opens.
  useEffect(() => {
    if (data) {
      const t = window.setTimeout(() => window.print(), 500);
      return () => window.clearTimeout(t);
    }
  }, [data]);

  if (missing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8 print:bg-white">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            No certificate data available
          </h1>
          <p className="text-sm text-gray-600">
            This page generates a vaccination certificate using data carried
            over from the consultation. Open it via the &quot;Generate
            Vaccination Certificate&quot; button at the end of a completed
            MenACWY consultation.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-gray-500">Loading certificate…</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 16mm;
          }
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top control bar — visible on screen, hidden when printing */}
      <div className="no-print bg-slate-900 text-white px-6 py-3 flex items-center justify-between sticky top-0">
        <p className="text-sm">
          MenACWY Vaccination Certificate — preview. Use your browser&apos;s
          print dialog to save as PDF or print to paper.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-1.5 rounded bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-sm font-medium"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Certificate body */}
      <div className="max-w-[210mm] mx-auto p-10 print:p-0 text-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-navy-900 pb-5 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-[color:var(--tenant-primary)] font-semibold">
              Get Real Health
            </p>
            <h1 className="text-3xl font-bold text-navy-900 mt-1">
              Certificate of Vaccination
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Meningococcal ACWY (MenACWY) Conjugate Vaccine
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Issued by</p>
            <p className="font-semibold text-gray-900 mt-0.5">
              {data.pharmacyName || "—"}
            </p>
            <p className="max-w-[60mm]">{data.pharmacyAddress || ""}</p>
          </div>
        </div>

        {/* Patient panel */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
            Patient
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field
              label="Full name"
              value={`${data.patientFirstName} ${data.patientLastName}`.trim()}
            />
            <Field
              label="Date of birth"
              value={formatDateUK(data.patientDob)}
            />
            {data.patientNhsNumber && (
              <Field label="NHS number" value={data.patientNhsNumber} />
            )}
            {data.travelReason && (
              <Field
                label="Reason for vaccination"
                value={TRAVEL_LABEL[data.travelReason] || data.travelReason}
              />
            )}
          </div>
        </section>

        {/* Vaccination panel */}
        <section className="mb-6 bg-[color:var(--tenant-primary)]/10/40 border border-[color:var(--tenant-primary)]/30 rounded-lg p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--tenant-primary)] mb-3">
            Vaccination administered
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field
              label="Vaccine"
              value={VACCINE_LABEL[data.vaccineType] || data.vaccineType || "—"}
            />
            <Field
              label="Date administered"
              value={formatDateUK(data.consultationDate)}
            />
            <Field label="Batch number" value={data.batchNumber} />
            <Field
              label="Expiry date"
              value={formatDateUK(data.expiryDate)}
            />
            <Field
              label="Administration site"
              value={
                SITE_LABEL[data.administrationSite] ||
                data.administrationSite ||
                "—"
              }
            />
            <Field label="Dose" value="0.5 mL intramuscular, single dose" />
          </div>
          <p className="text-xs text-[color:var(--tenant-primary)] mt-4 leading-relaxed">
            The MenACWY vaccine listed above provides protection against
            meningococcal serogroups A, C, W and Y. Protection begins
            approximately 10 days after administration and is considered
            valid for travel purposes — including Saudi Arabian visa
            requirements for Hajj and Umrah — for at least three years from
            the date of administration.
          </p>
        </section>

        {/* Authorisation panel */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
            Administered by
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field label="Pharmacist" value={data.pharmacistName} />
            <Field
              label="GPhC registration"
              value={data.pharmacistGPhC}
            />
            <Field label="Pharmacy" value={data.pharmacyName} />
            <Field
              label="Pharmacy address"
              value={data.pharmacyAddress}
            />
          </div>
        </section>

        {/* Signature block */}
        <section className="mt-12 grid grid-cols-2 gap-12 text-sm">
          <div>
            <div className="border-b border-gray-800 h-12"></div>
            <p className="text-xs text-gray-600 mt-1">
              Pharmacist signature
            </p>
            <p className="text-xs font-medium text-gray-900 mt-0.5">
              {data.pharmacistName}
            </p>
          </div>
          <div>
            <div className="border-b border-gray-800 h-12"></div>
            <p className="text-xs text-gray-600 mt-1">Date</p>
            <p className="text-xs font-medium text-gray-900 mt-0.5">
              {formatDateUK(data.consultationDate)}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t border-gray-200 text-[10px] text-gray-500 leading-relaxed">
          <p>
            <strong>Get Real Health Limited</strong> — UK pharmacy PGD provider.
            Company number 12744898. Registered office: Unit 55, First Floor,
            St. Asaph Business Park, St. Asaph, Denbighshire, LL17 0JG.
            Registered with the Care Quality Commission as an Independent
            Medical Agency (CQC provider ID 1-9971460462) and Healthcare
            Inspectorate Wales.
          </p>
          <p className="mt-2">
            This certificate confirms that the vaccination listed above was
            administered under a Patient Group Direction at the pharmacy
            shown, by the named pharmacist. It is not a substitute for the
            International Certificate of Vaccination or Prophylaxis (ICVP)
            issued by a designated Yellow Fever Vaccination Centre, which is
            specific to yellow fever vaccination. Saudi authorities accept
            this certificate as documentary evidence of MenACWY vaccination
            for Hajj and Umrah visa applications.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}
