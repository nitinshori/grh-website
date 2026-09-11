'use client';

import React from 'react';
import { FluVaccineAdministration, FluVaccineType, FLU_VACCINES } from '../lib/flu-types';
import { TextInput, SelectInput, Checkbox } from '../../shared/components/FormInputs';

// Aligned to the seasonal influenza vaccines PGD (IIVc, aIIV, IIVr, IIVe), 2026/27 season,
// version 005, issued 11 September 2026.

const INJECTION_SITE_OPTIONS = [
  { value: 'left-deltoid', label: 'Left deltoid (upper arm)' },
  { value: 'right-deltoid', label: 'Right deltoid (upper arm)' },
  { value: 'left-thigh', label: 'Left anterolateral thigh (young children with insufficient deltoid bulk)' },
  { value: 'right-thigh', label: 'Right anterolateral thigh (young children with insufficient deltoid bulk)' },
];

const ROUTE_OPTIONS = [{ value: 'intramuscular', label: 'Intramuscular' }];

interface VaccineAdminFieldsProps {
  administration: FluVaccineAdministration;
  /** Vaccine types permitted for this patient under the PGD (age range and egg allergy). */
  permittedTypes: Exclude<FluVaccineType, ''>[];
  /** Child under 9 having influenza vaccine for the first time: two-dose schedule. */
  twoDoseSchedule: boolean;
  onVaccineChange: (vaccineName: string) => void;
  onBrandChange: (brandName: string) => void;
  onBatchChange: (batchNumber: string) => void;
  onExpiryChange: (expiryDate: string) => void;
  onSiteChange: (injectionSite: string) => void;
  onRouteChange: (route: string) => void;
  onDoseChange: (doseVolume: string) => void;
  onAdministeredByChange: (administeredBy: string) => void;
  onTimeChange: (timeAdministered: string) => void;
  onDoseNumberChange: (doseNumber: string) => void;
  onPreviousDoseDateChange: (date: string) => void;
  onNextDoseDueChange: (date: string) => void;
  onAdrenalineChange: (value: boolean) => void;
  onCoAdministeredChange: (value: string) => void;
}

export default function VaccineAdminFields({
  administration,
  permittedTypes,
  twoDoseSchedule,
  onVaccineChange,
  onBrandChange,
  onBatchChange,
  onExpiryChange,
  onSiteChange,
  onRouteChange,
  onDoseChange,
  onAdministeredByChange,
  onTimeChange,
  onDoseNumberChange,
  onPreviousDoseDateChange,
  onNextDoseDueChange,
  onAdrenalineChange,
  onCoAdministeredChange,
}: VaccineAdminFieldsProps): React.ReactNode {
  const vaccineOptions = permittedTypes.map((t) => ({ value: t, label: FLU_VACCINES[t].label }));
  const chosen = administration.vaccineName ? FLU_VACCINES[administration.vaccineName] : null;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
        <Checkbox
          label="Adrenaline (epinephrine) 1 in 1,000 injection and a telephone are immediately available, with facilities and trained staff for the management of anaphylaxis"
          checked={administration.adrenalineAvailable}
          onChange={onAdrenalineChange}
          description="Required by the PGD before any vaccine is given. Vaccinate seated; have procedures in place to avoid injury from faints."
          required
        />
      </div>

      {permittedTypes.length === 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-sm text-red-900">
          No vaccine in this PGD is licensed and permitted for this patient (age range or egg allergy). Do not administer; arrange supply of a suitable vaccine or refer.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          label="Vaccine type (as permitted for this patient)"
          value={administration.vaccineName}
          onChange={onVaccineChange}
          options={vaccineOptions}
          required
        />
        <TextInput
          label="Brand name as printed on the pack"
          value={administration.brandName}
          onChange={onBrandChange}
          placeholder="e.g. Cell-based Trivalent Influenza Vaccine Seqirus, Supemtek, Vaxigrip"
          required
        />
      </div>

      {chosen && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
          <p className="font-semibold">{chosen.label}</p>
          <p className="mt-1">{chosen.notes}</p>
          <p className="mt-1">
            Single 0.5 ml intramuscular dose into the deltoid; anterolateral thigh in younger children where deltoid bulk is insufficient. Confirm the presentation, licensed age range and 2026/27 strain statement against the current SPC and the pack before administration. Shake or invert the syringe as directed and inspect visually.
          </p>
        </div>
      )}

      {twoDoseSchedule && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-4">
          <p className="text-sm font-semibold text-amber-900">
            Child under 9 receiving influenza vaccine for the first time: 2 doses at least 4 weeks apart
          </p>
          {/* The dose number is derived from the screening answers (never
              vaccinated: dose 1; dose 1 of this season's course already
              given: dose 2). It is not a free choice, so a child cannot be
              recorded for a third dose in a season (adversarial review). */}
          <p className="text-sm text-amber-900">
            <span className="font-medium">Dose number: </span>
            {administration.doseNumber === '2'
              ? `Dose 2 of 2 (dose 1 given ${administration.previousDoseDate || 'date not recorded'}; at least 4 weeks after dose 1)`
              : administration.doseNumber === '1'
                ? 'Dose 1 of 2'
                : 'Not determined: check the vaccination history on the screening step'}
          </p>
          {administration.doseNumber === '1' && (
            <TextInput
              label="Second dose booked for (at least 4 weeks from today)"
              type="date"
              value={administration.nextDoseDue}
              onChange={onNextDoseDueChange}
              required
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="Batch Number"
          value={administration.batchNumber}
          onChange={onBatchChange}
          placeholder="e.g., A1234567"
          required
        />
        <TextInput
          label="Expiry Date"
          type="date"
          value={administration.expiryDate}
          onChange={onExpiryChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          label="Injection Site"
          value={administration.injectionSite}
          onChange={onSiteChange}
          options={INJECTION_SITE_OPTIONS}
          required
        />
        <SelectInput
          label="Route"
          value={administration.route}
          onChange={onRouteChange}
          options={ROUTE_OPTIONS}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="Dose Volume"
          value={administration.doseVolume}
          onChange={onDoseChange}
          placeholder="0.5 ml"
          required
        />
        <TextInput
          label="Other vaccine given at this visit and its site (if any)"
          value={administration.coAdministeredVaccine}
          onChange={onCoAdministeredChange}
          placeholder="e.g. COVID-19 vaccine, left deltoid (separate site, preferably a different limb, or at least 2.5 cm apart)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="Administered By (name of immuniser)"
          value={administration.administeredBy}
          onChange={onAdministeredByChange}
          placeholder="Name of the person giving the vaccine"
          required
        />
        <TextInput
          label="Time Administered"
          type="time"
          value={administration.timeAdministered}
          onChange={onTimeChange}
          required
        />
      </div>
    </div>
  );
}
