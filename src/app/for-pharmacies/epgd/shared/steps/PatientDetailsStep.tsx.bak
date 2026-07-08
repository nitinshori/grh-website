"use client";

import type { BasePatientDetails } from "../types";
import { TextInput, Checkbox } from "../components/FormInputs";
import { GPPracticeSearch } from "../components/GPPracticeSearch";
import { ReturningPatientSearch } from "../components/ReturningPatientSearch";

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
}

export function PatientDetailsStep({ patient, onChange, genderOption, requireAdult = true }: PatientDetailsStepProps) {
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
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
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
            onChange("gpOdsCode", match.odsCode);
          }}
          onClear={() => {
            onChange("gpPractice", "");
            onChange("gpAddress", "");
            onChange("gpPhone", "");
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
      <TextInput
        label="GP practice email (optional — required to notify GP)"
        value={patient.gpEmail}
        onChange={(v) => onChange("gpEmail", v)}
        type="email"
        placeholder="practice.admin@nhs.net"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput
          label="NHS number (optional)"
          value={patient.nhsNumber}
          onChange={(v) => onChange("nhsNumber", v)}
          placeholder="123 456 7890"
        />
        <TextInput
          label="Phone (optional)"
          value={patient.phone}
          onChange={(v) => onChange("phone", v)}
          type="tel"
          placeholder="07..."
        />
      </div>
      <TextInput
        label="Address (optional)"
        value={patient.address}
        onChange={(v) => onChange("address", v)}
        placeholder="123 High Street, London"
      />
    </div>
  );
}
