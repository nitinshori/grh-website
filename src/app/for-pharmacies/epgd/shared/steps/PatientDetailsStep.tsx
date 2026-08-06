"use client";

import { useState } from "react";
import type { BasePatientDetails } from "../types";
import { TextInput, Checkbox } from "../components/FormInputs";
import { GPPracticeSearch } from "../components/GPPracticeSearch";
import { ReturningPatientSearch } from "../components/ReturningPatientSearch";
import { PostcodeLookup } from "../components/PostcodeLookup";

interface PatientDetailsStepProps {
  patient: BasePatientDetails;
  onChange: (field: keyof BasePatientDetails, value: BasePatientDetails[keyof BasePatientDetails]) => void;
  genderOption?: {
    label: string;
    description: string;
    checked: boolean;
    onToggle: (v: boolean) => void;
  };
  /**
   * Whether to show the inline "Must be 18+" warning next to the
   * calculated age. Defaults to true to preserve behaviour for the
   * adult-only PGDs that use this shared step. Paediatric PGDs (e.g.
   * paediatric-uti, threadworms) pass false so under-18s aren't flagged
   * as ineligible.
   *
   * Note: this is purely visual. Real age gating lives in each PGD's
   * own validation file via the `minAge`/`maxAge` opts passed to
   * `validatePatientStep`.
   */
  requireAdult?: boolean;
  /**
   * Called when a returning patient is picked, in addition to the
   * demographic fan-out below. Weight management tools use this to carry
   * forward height, the last recorded weight and the current dose, so a
   * follow-up does not mean re-entering an initiation consultation.
   */
  onReturningPatient?: (patient: Partial<BasePatientDetails>) => void;
}

export function PatientDetailsStep({ patient, onChange, genderOption, requireAdult = true, onReturningPatient }: PatientDetailsStepProps) {
  // Set when a practice email was filled from a previous consultation, so
  // the pharmacist can see it was not typed by them this time.
  const [remembered, setRemembered] = useState<string | null>(null);

  // When pharmacist picks a returning patient from the search dropdown
  // we get back a partial BasePatientDetails. Fan it out to onChange so
  // every consumer's state updates without us caring which fields the
  // particular PGD tracks.
  function handleReturningPatientSelect(partial: Partial<BasePatientDetails>) {
    (Object.keys(partial) as (keyof BasePatientDetails)[]).forEach((key) => {
      const value = partial[key];
      if (value !== undefined) {
        onChange(key, value as BasePatientDetails[keyof BasePatientDetails]);
      }
    });
    onReturningPatient?.(partial);
  }

  // Remember the practice email once the pharmacist has finished typing it,
  // so the next consultation for this surgery fills itself in.
  function rememberGpEmail() {
    const email = patient.gpEmail?.trim();
    const odsCode = patient.gpOdsCode?.trim();
    if (!email || !odsCode || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;
    fetch("/api/gp-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        odsCode,
        email,
        phone: patient.gpPhone ?? "",
        practiceName: patient.gpPractice ?? "",
      }),
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <ReturningPatientSearch onSelect={handleReturningPatientSelect} />

      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput
          label="First name"
          value={patient.firstName}
          onChange={(v) => onChange("firstName", v)}
          required
          placeholder="John"
        />
        <TextInput
          label="Last name"
          value={patient.lastName}
          onChange={(v) => onChange("lastName", v)}
          required
          placeholder="Smith"
        />
      </div>
      {/* Address directly after the name (Rachel/Pritchards request) */}
      <PostcodeLookup
        onResolved={({ town, postcode }) => {
          // Prefill the locality + postcode; pharmacist adds house no./street.
          const locality = [town, postcode].filter(Boolean).join(", ");
          onChange("address", patient.address?.trim() ? `${patient.address.trim()}, ${locality}` : locality);
        }}
        onAddressSelected={({ address, postcode }) => {
          // Full PAF address picked from the dropdown — replaces the field.
          onChange("address", [address, postcode].filter(Boolean).join(", "));
        }}
      />
      <TextInput
        label="Patient address"
        value={patient.address}
        onChange={(v) => onChange("address", v)}
        placeholder="123 High Street, London"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput
          label="Mobile number (optional)"
          value={patient.phone}
          onChange={(v) => onChange("phone", v)}
          type="tel"
          placeholder="07..."
        />
        <TextInput
          label="Contact email (optional)"
          value={patient.email}
          onChange={(v) => onChange("email", v)}
          type="email"
          placeholder="patient@example.com"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Date of birth <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={patient.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Age (auto-calculated)
          </label>
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
            {patient.age !== null ? (
              <>
                {patient.age} years
                {requireAdult && patient.age < 18 && (
                  <span className="ml-2 text-red-500 text-xs font-medium">
                    Must be 18+
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400">Enter DOB above</span>
            )}
          </div>
        </div>
      </div>
      {genderOption && (
        <Checkbox
          label={genderOption.label}
          checked={genderOption.checked}
          onChange={genderOption.onToggle}
          description={genderOption.description}
        />
      )}
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1">
          GP practice
        </label>
        <GPPracticeSearch
          practice={patient.gpPractice}
          onSelect={(match) => {
            onChange("gpPractice", match.name);
            onChange("gpAddress", match.address);
            onChange("gpPhone", match.phone);
            if (match.email) onChange("gpEmail", match.email);
            onChange("gpOdsCode", match.odsCode);
            // NHS ODS publishes an email for only a minority of practices.
            // Where it does not, fall back to whatever was entered for this
            // practice before, so the same local surgeries stop needing to
            // be typed out every time.
            if (!match.email && match.odsCode) {
              setRemembered(null);
              fetch(`/api/gp-contacts?odsCode=${encodeURIComponent(match.odsCode)}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((d: { found?: boolean; email?: string; phone?: string } | null) => {
                  if (!d?.found) return;
                  if (d.email) {
                    onChange("gpEmail", d.email);
                    setRemembered(d.email);
                  }
                  if (d.phone && !match.phone) onChange("gpPhone", d.phone);
                })
                .catch(() => {});
            }
          }}
          onClear={() => {
            onChange("gpPractice", "");
            onChange("gpAddress", "");
            onChange("gpPhone", "");
            onChange("gpEmail", "");
            onChange("gpOdsCode", "");
          }}
        />
        {patient.gpAddress && (
          <p className="text-xs text-gray-500 mt-1.5">{patient.gpAddress}{patient.gpPhone ? ` · ${patient.gpPhone}` : ""}</p>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput
          label="GP name (the doctor)"
          value={patient.gpName}
          onChange={(v) => onChange("gpName", v)}
          placeholder="Dr. Jane Doe"
        />
        <TextInput
          label="Practice phone (optional)"
          value={patient.gpPhone}
          onChange={(v) => onChange("gpPhone", v)}
          type="tel"
          placeholder="Auto-fills from search"
        />
      </div>
      <div>
        <TextInput
          label="GP practice email (optional, required to notify GP)"
          value={patient.gpEmail}
          onChange={(v) => onChange("gpEmail", v)}
          onBlur={rememberGpEmail}
          type="email"
          placeholder="practice.admin@nhs.net"
        />
        {remembered && remembered === patient.gpEmail && (
          <p className="text-xs text-gray-500 mt-1">
            Filled in from the last time this practice was used.
          </p>
        )}
      </div>
      <TextInput
        label="NHS number (optional)"
        value={patient.nhsNumber}
        onChange={(v) => onChange("nhsNumber", v)}
        placeholder="123 456 7890"
      />
      <TextInput
        label="Delivery details (optional)"
        value={patient.deliveryDetails ?? ""}
        onChange={(v) => onChange("deliveryDetails", v)}
        placeholder="e.g. home delivery to address above; leave with neighbour at no. 5"
      />
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1">
          Consultation notes (optional)
        </label>
        <textarea
          value={patient.consultationNotes ?? ""}
          onChange={(e) => onChange("consultationNotes", e.target.value)}
          rows={3}
          placeholder="Anything worth recording about this consultation…"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent resize-y"
        />
      </div>
    </div>
  );
}
