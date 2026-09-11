'use client';

import { useEffect } from 'react';
import { ImpetigoTreatmentSelection, ImpetigoLesionAssessment, ImpetigoFormulation, ImpetigoTreatment } from './impetigo-types';
import {
  TreatmentRecommendation,
  ImpetigoRoute,
  getDoseOptions,
  formulationOptions,
  fixedFrequency,
  computeQuantity,
} from './impetigo-clinical-logic';
import { SelectInput, TextInput, TextArea } from '../shared/components/FormInputs';

interface TreatmentSelectionStepProps {
  treatment: ImpetigoTreatmentSelection;
  recommendation: TreatmentRecommendation | null;
  route: ImpetigoRoute;
  pregnant: boolean;
  age: number;
  weightKg: string;
  hydrogenPeroxide: ImpetigoLesionAssessment['hydrogenPeroxide'];
  onChange: (treatment: ImpetigoTreatmentSelection) => void;
}

/**
 * Only the document's regimens are offered. Dose is a select generated for
 * the arm, age and weight band; frequency and quantity are derived. There is
 * no free text for dose, frequency or quantity and no override: a PGD
 * authorises no deviation (adversarial review, 11 Sep 2026).
 */
export function TreatmentSelectionStep({
  treatment,
  recommendation,
  route,
  pregnant,
  age,
  weightKg,
  hydrogenPeroxide,
  onChange,
}: TreatmentSelectionStepProps) {
  const doseOptions = getDoseOptions(treatment.treatment, age, weightKg);
  const selectedDose = doseOptions.find((d) => d.value === treatment.doseValue);
  const formulations = formulationOptions(treatment.treatment, age);
  const frequency = fixedFrequency(treatment.treatment);
  const durationDays = treatment.duration === '7 days' ? 7 : treatment.duration === '5 days' ? 5 : 0;
  const computed = computeQuantity(treatment.treatment, treatment.formulation, selectedDose, durationDays);

  // Keep the derived fields (dose label, frequency, quantity) in state so the
  // saved record and the printed record carry them.
  useEffect(() => {
    const next: ImpetigoTreatmentSelection = {
      ...treatment,
      formulation: formulations.length === 1 ? formulations[0].value : treatment.formulation,
      dose: selectedDose ? selectedDose.label : '',
      frequency: frequency.label,
      quantity: computed.quantity,
      quantityUnit: computed.unit,
    };
    if (
      next.formulation !== treatment.formulation ||
      next.dose !== treatment.dose ||
      next.frequency !== treatment.frequency ||
      next.quantity !== treatment.quantity ||
      next.quantityUnit !== treatment.quantityUnit
    ) {
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatment.treatment, treatment.formulation, treatment.doseValue, treatment.duration, selectedDose?.label, frequency.label, computed.quantity, computed.unit]);

  const handleTreatmentChange = (value: string) => {
    onChange({
      ...treatment,
      treatment: value as ImpetigoTreatment,
      formulation: '',
      doseValue: '',
      dose: '',
      frequency: '',
      severeDoseReason: '',
      quantity: 0,
      quantityUnit: '',
    });
  };

  // Only the arm the document sends this patient to is offered. Fusidic acid
  // is authorised only where hydrogen peroxide 1% is unsuitable or
  // ineffective: where it was sold as a P medicine, there is no PGD supply.
  const fusidicAllowed = hydrogenPeroxide === 'unsuitable' || hydrogenPeroxide === 'ineffective';
  const treatmentOptions = [
    { value: '', label: 'Select treatment...' },
    ...(route === 'topical'
      ? [
          ...(hydrogenPeroxide === 'offered-p-sale' || !fusidicAllowed
            ? [{ value: 'hydrogen-peroxide', label: 'Hydrogen peroxide 1% cream (P sale; NOT a PGD supply)' }]
            : []),
          ...(fusidicAllowed
            ? [{ value: 'fusidic-acid', label: 'Fusidic acid 2% cream, three times a day for 5 days (hydrogen peroxide unsuitable or ineffective)' }]
            : []),
        ]
      : []),
    ...(route === 'flucloxacillin'
      ? [{ value: 'flucloxacillin', label: 'Flucloxacillin 250mg/5ml oral suspension, four times a day for 5 days (children 3 months to 17)' }]
      : []),
    ...(route === 'macrolide'
      ? pregnant
        ? [{ value: 'erythromycin', label: 'Erythromycin 250mg tablets or oral suspension, four times a day for 5 days (pregnancy)' }]
        : [{ value: 'clarithromycin', label: 'Clarithromycin, twice a day for 5 days (penicillin allergy or flucloxacillin unsuitable)' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {recommendation && (
        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-green-900 mb-2">The arm the document sends this patient to</h3>
          <p className="text-green-800 font-medium">{recommendation.treatment}</p>
          <p className="text-sm text-green-700 mt-2">{recommendation.rationale}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold text-green-800">Dose:</span>
              <p className="text-green-700">{recommendation.dose}</p>
            </div>
            <div>
              <span className="font-semibold text-green-800">Frequency:</span>
              <p className="text-green-700">{recommendation.frequency}</p>
            </div>
            <div>
              <span className="font-semibold text-green-800">Duration:</span>
              <p className="text-green-700">{recommendation.duration}</p>
            </div>
            <div>
              <span className="font-semibold text-green-800">Quantity:</span>
              <p className="text-green-700">
                {recommendation.quantity > 0 ? `${recommendation.quantity} ` : ''}
                {recommendation.quantityUnit || ''}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
        Do NOT combine a topical and an oral antibiotic. One course per episode; no repeat supply under this PGD.
        Only the document&apos;s regimens are offered below: a PGD authorises no other dose, frequency or quantity.
      </div>

      {route === 'topical' && hydrogenPeroxide === 'offered-p-sale' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
          Hydrogen peroxide 1% was offered as a P sale. Fusidic acid under this PGD is authorised only where hydrogen peroxide is unsuitable or ineffective, so it is not offered for this visit.
        </div>
      )}

      <SelectInput
        label="Selected treatment"
        value={treatment.treatment}
        onChange={handleTreatmentChange}
        options={treatmentOptions}
        required
      />

      {treatment.treatment && formulations.length > 1 && (
        <SelectInput
          label="Formulation"
          value={treatment.formulation}
          onChange={(v) => onChange({ ...treatment, formulation: v as ImpetigoFormulation })}
          options={[{ value: '', label: 'Select formulation...' }, ...formulations]}
          required
        />
      )}
      {treatment.treatment && formulations.length === 1 && (
        <TextInput label="Formulation" value={formulations[0].label} onChange={() => undefined} disabled />
      )}

      {treatment.treatment && (
        <div>
          <SelectInput
            label="Dose (from the document's regimens for this arm, age and weight)"
            value={treatment.doseValue}
            onChange={(v) => onChange({ ...treatment, doseValue: v, severeDoseReason: v === 'clari-500' ? treatment.severeDoseReason : '' })}
            options={[
              { value: '', label: doseOptions.length ? 'Select dose...' : 'No dose is stated in the document for this patient: refer' },
              ...doseOptions.map((d) => ({ value: d.value, label: d.label })),
            ]}
            required
          />
          {treatment.treatment === 'clarithromycin' && age < 12 && (
            <p className="text-xs text-gray-600 mt-1">
              Weight is rounded to the nearest kilogram before banding (the document&apos;s bands are whole kilograms). Under 8 kg the dose is 7.5 mg/kg at the measured weight.
            </p>
          )}
        </div>
      )}

      {treatment.doseValue === 'clari-500' && (
        <TextArea
          label="Clarithromycin 500mg twice a day: reason (severe infection; required by the document)"
          value={treatment.severeDoseReason}
          onChange={(v) => onChange({ ...treatment, severeDoseReason: v })}
          placeholder="Record why the infection is severe enough for the higher dose"
          rows={2}
          required
        />
      )}

      {treatment.treatment && (
        <TextInput label="Frequency (fixed by the document)" value={frequency.label} onChange={() => undefined} disabled />
      )}

      <div>
        <SelectInput
          label="Duration"
          value={treatment.duration}
          onChange={(v) => onChange({ ...treatment, duration: v as ImpetigoTreatmentSelection['duration'], extensionReason: v === '7 days' ? treatment.extensionReason : '' })}
          options={[
            { value: '', label: 'Select duration...' },
            { value: '5 days', label: '5 days (standard course)' },
            { value: '7 days', label: '7 days (clinical judgement only, lesions severe or numerous; reason required)' },
          ]}
          required
        />
        <p className="text-xs text-gray-600 mt-1">Courses are 5 days. Maximum 7 days, extended only on clinical judgement with the reason recorded.</p>
        {treatment.duration === '7 days' && (
          <div className="mt-3">
            <TextArea
              label="Reason for extending to 7 days"
              value={treatment.extensionReason}
              onChange={(v) => onChange({ ...treatment, extensionReason: v })}
              placeholder="E.g., numerous lesions over both forearms"
              rows={2}
              required
            />
          </div>
        )}
      </div>

      <TextInput
        label="Quantity (computed from the dose, formulation and duration)"
        value={computed.quantity > 0 ? `${computed.quantity} ${computed.unit}` : 'Select the dose and duration'}
        onChange={() => undefined}
        disabled
        required
      />
    </div>
  );
}
