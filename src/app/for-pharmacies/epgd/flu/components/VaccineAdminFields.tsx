'use client';

import React from 'react';
import { FluVaccineAdministration } from '../lib/flu-types';
import { TextInput, SelectInput } from '../../shared/components/FormInputs';

const VACCINE_OPTIONS = [
  { value: 'flucelvax-quad', label: 'Flucelvax Quad (cell-based, egg-free)' },
  { value: 'fluad-quad', label: 'Fluad Quad (egg-based with adjuvant)' },
  { value: 'fluzone-quad', label: 'Fluzone Quad (egg-based)' },
  { value: 'afluria-quad', label: 'Afluria Quad (egg-based)' },
];

const INJECTION_SITE_OPTIONS = [
  { value: 'left-deltoid', label: 'Left deltoid' },
  { value: 'right-deltoid', label: 'Right deltoid' },
  { value: 'left-thigh', label: 'Left thigh' },
  { value: 'right-thigh', label: 'Right thigh' },
];

const ROUTE_OPTIONS = [{ value: 'intramuscular', label: 'Intramuscular' }];

interface VaccineAdminFieldsProps {
  administration: FluVaccineAdministration;
  onVaccineChange: (vaccineName: string) => void;
  onBatchChange: (batchNumber: string) => void;
  onExpiryChange: (expiryDate: string) => void;
  onSiteChange: (injectionSite: string) => void;
  onRouteChange: (route: string) => void;
  onDoseChange: (doseVolume: string) => void;
  onAdministeredByChange: (administeredBy: string) => void;
  onTimeChange: (timeAdministered: string) => void;
}

export default function VaccineAdminFields({
  administration,
  onVaccineChange,
  onBatchChange,
  onExpiryChange,
  onSiteChange,
  onRouteChange,
  onDoseChange,
  onAdministeredByChange,
  onTimeChange,
}: VaccineAdminFieldsProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          label="Vaccine Name"
          value={administration.vaccineName}
          onChange={onVaccineChange}
          options={VACCINE_OPTIONS}
        />
        <TextInput
          label="Batch Number"
          value={administration.batchNumber}
          onChange={onBatchChange}
          placeholder="e.g., A1234567"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="Expiry Date"
          type="date"
          value={administration.expiryDate}
          onChange={onExpiryChange}
        />
        <TextInput
          label="Dose Volume"
          value={administration.doseVolume}
          onChange={onDoseChange}
          placeholder="0.5ml"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          label="Injection Site"
          value={administration.injectionSite}
          onChange={onSiteChange}
          options={INJECTION_SITE_OPTIONS}
        />
        <SelectInput
          label="Route"
          value={administration.route}
          onChange={onRouteChange}
          options={ROUTE_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="Administered By"
          value={administration.administeredBy}
          onChange={onAdministeredByChange}
          placeholder="Pharmacist name and GPhC number"
        />
        <TextInput
          label="Time Administered"
          type="time"
          value={administration.timeAdministered}
          onChange={onTimeChange}
        />
      </div>
    </div>
  );
}
