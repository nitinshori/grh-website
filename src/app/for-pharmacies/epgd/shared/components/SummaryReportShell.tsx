"use client";

import { useState } from "react";
import { usePharmacistProfile } from "../hooks/usePharmacistProfile";
import type { ClinicalAlert, AlertSeverity } from "../types";

// ─── Reusable summary report building blocks ───

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3 mt-6 first:mt-0 print:text-xs">
      {children}
    </h3>
  );
}

export function Row({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 col-span-1">{label}</dt>
      <dd className="text-xs text-navy-900 col-span-2">{value}</dd>
    </div>
  );
}

export function AlertSummary({ alerts }: { alerts: ClinicalAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-xs text-gray-500">No clinical alerts raised.</p>;
  }
  return (
    <div className="space-y-1.5">
      {alerts.map((alert) => (
        <div
          key={alert.code}
          className={`text-xs px-2 py-1.5 rounded ${
            alert.severity === "stop"
              ? "bg-red-50 text-red-700"
              : alert.severity === "caution"
                ? "bg-amber-50 text-amber-700"
                : "bg-orange-50 text-orange-700"
          }`}
        >
          <span className="font-semibold uppercase">{alert.severity}:</span>{" "}
          {alert.message}
        </div>
      ))}
    </div>
  );
}

export function CounsellingGrid({
  items,
}: {
  items: [string, boolean][];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {items.map(([label, checked]) => (
        <div key={label} className="flex items-center gap-2 py-0.5">
          {/* Print-safe tick: browsers drop background colours when printing,
              which used to leave a white check invisible on white paper
              (Rachel's bug). The tick is now drawn in a dark stroke that
              doesn't depend on the background surviving print, and we also
              ask the browser to keep colours where supported. */}
          <span
            className={`w-3 h-3 rounded border flex items-center justify-center [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${
              checked
                ? "bg-[color:var(--tenant-primary)]/100 border-[color:var(--tenant-primary)] text-white print:bg-white print:text-black print:border-black"
                : "border-gray-300"
            }`}
          >
            {checked && (
              <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor" strokeWidth={1}>
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          <span className="text-gray-700">{label}</span>
        </div>
      ))}
    </div>
  );
}

export type PractitionerRole = "pharmacist" | "technician";

export function PharmacistDeclaration({
  pgdName,
  pharmacistName,
  pharmacistGPhC,
  pharmacyName,
  onGphcChange,
  onNameChange,
}: {
  pgdName: string;
  pharmacistName: string;
  pharmacistGPhC: string;
  pharmacyName: string;
  /** When given, the GPhC line is typed into directly on screen (printed as
   *  text). Rachel Edwards at Smartway, 23 Sep 2026, tried to type her GPhC
   *  number into this printed line, could not, and could not save; the
   *  editable field was at the top of the step. */
  onGphcChange?: (v: string) => void;
  onNameChange?: (v: string) => void;
}) {
  // Role selector (Rachel's request, Jul 2026): GRH PGDs authorise
  // GPhC-registered pharmacy technicians as well as pharmacists, so the
  // person completing the consultation declares their own registration.
  // The radios are screen-only; the printed record shows the chosen role.
  // Default to the role on the practitioner's own record, so a technician
  // does not have to re-select it on every consultation. Until they choose,
  // the profile's role is used; a click overrides it.
  const profile = usePharmacistProfile();
  const [chosenRole, setRole] = useState<PractitionerRole | null>(null);
  const role: PractitionerRole =
    chosenRole ?? (profile?.practitionerRole === "technician" ? "technician" : "pharmacist");
  const roleLabel =
    role === "technician" ? "Pharmacy technician" : "Pharmacist";
  return (
    <>
      <SectionHeader>
        {roleLabel} Declaration
      </SectionHeader>
      <div className="mb-3 print:hidden">
        <p className="text-xs font-medium text-gray-500 mb-1">
          I am completing this consultation as a:
        </p>
        <div className="flex gap-4">
          {(
            [
              ["pharmacist", "Pharmacist"],
              ["technician", "Pharmacy technician (GPhC-registered)"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name="practitioner-role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="accent-teal-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-4">
        {role === "technician"
          ? `I confirm that I am a pharmacy technician registered with the General Pharmaceutical Council, that I am named and authorised to supply under the Patient Group Direction for ${pgdName}, that I have completed the required training, and that this consultation was conducted in accordance with that PGD — the patient met all inclusion criteria and no exclusion criteria applied.`
          : `I confirm that this consultation was conducted in accordance with the Patient Group Direction for ${pgdName}, and that the patient met all inclusion criteria and no exclusion criteria applied.`}
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            {roleLabel} name
          </p>
          {onNameChange ? (
            <>
              <input
                type="text"
                value={pharmacistName}
                onChange={(e) => onNameChange(e.target.value)}
                aria-label={`${roleLabel} name`}
                className="print:hidden w-full text-sm text-navy-900 border-0 border-b border-gray-300 pb-1 min-h-[1.5rem] bg-transparent focus:outline-none focus:border-teal-500"
              />
              <p className="hidden print:block text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistName || ""}</p>
            </>
          ) : (
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
              {pharmacistName || ""}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            GPhC number
          </p>
          {onGphcChange ? (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={pharmacistGPhC}
                onChange={(e) => onGphcChange(e.target.value)}
                placeholder="Type your GPhC number"
                aria-label="GPhC number"
                className="print:hidden w-full text-sm text-navy-900 border-0 border-b border-gray-300 pb-1 min-h-[1.5rem] bg-transparent focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
              />
              <p className="hidden print:block text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistGPhC || ""}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
                {pharmacistGPhC || ""}
              </p>
              {!pharmacistGPhC && (
                <p className="print:hidden text-[11px] text-amber-700 mt-1">
                  Enter your GPhC number in the &quot;GPhC registration number&quot; field at the top of this step; it will appear here.
                </p>
              )}
            </>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
            {pharmacyName || ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
      </div>
    </>
  );
}

export function ReportFooter({ pgdName }: { pgdName: string }) {
  return (
    <div className="mt-8 pt-4 border-t border-gray-300 text-center">
      <p className="text-[10px] text-gray-400">
        Get Real Health ePGD — {pgdName} Consultation Record | Confidential
        Patient Information | Retain for 8 years (adults)
      </p>
    </div>
  );
}
