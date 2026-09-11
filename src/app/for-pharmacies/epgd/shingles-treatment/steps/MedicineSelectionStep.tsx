'use client';

import React, { useEffect, useMemo } from 'react';
import { SelectInput, TextInput } from '../../shared/components/FormInputs';
import { ShinglesMedicineSelection, ShinglesSymptoms, ShinglesMedicalHistory } from '../shingles-types';
import {
  getRecommendedDose,
  getMedicineAvailability,
  isWithinTreatmentWindow,
  hasNonSevereImmunosuppression,
} from '../shingles-clinical-logic';

interface MedicineSelectionStepProps {
  medicine: ShinglesMedicineSelection;
  symptoms: ShinglesSymptoms;
  medicalHistory: ShinglesMedicalHistory;
  onChange: (medicine: ShinglesMedicineSelection) => void;
}

const MEDICINE_LABELS: Record<'aciclovir' | 'valaciclovir' | 'famciclovir', string> = {
  aciclovir: 'Aciclovir 800 mg tablets or dispersible tablets (five times daily; cheapest; adherence is the practical problem)',
  valaciclovir: 'Valaciclovir 500 mg film-coated tablets (three times daily; preferred where five times daily dosing is impractical, or in non-severe immunosuppression)',
  famciclovir: 'Famciclovir 500 mg film-coated tablets (three times daily; not part of NHS Pharmacy First, private supply)',
};

export const MedicineSelectionStep: React.FC<MedicineSelectionStepProps> = ({
  medicine,
  symptoms,
  medicalHistory,
  onChange,
}) => {
  const availability = useMemo(() => getMedicineAvailability(medicalHistory), [medicalHistory]);

  const recommendedDose = useMemo(
    () => (medicine.medicine ? getRecommendedDose(medicine.medicine, medicalHistory) : null),
    [medicine.medicine, medicalHistory]
  );

  // The PGD specifies one complete course per agent. The regimen is filled
  // from the PGD whenever the agent changes and cannot be edited: a deviation
  // is a prescription, not a PGD supply (adversarial review, 11 Sep 2026).
  useEffect(() => {
    if (!recommendedDose) return;
    if (
      medicine.dose !== recommendedDose.dose ||
      medicine.frequency !== recommendedDose.frequency ||
      medicine.duration !== recommendedDose.duration ||
      medicine.quantity !== recommendedDose.quantity
    ) {
      onChange({
        ...medicine,
        dose: recommendedDose.dose,
        frequency: recommendedDose.frequency,
        duration: recommendedDose.duration,
        quantity: recommendedDose.quantity,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedDose]);

  const handleChange = <K extends keyof ShinglesMedicineSelection>(
    field: K,
    value: ShinglesMedicineSelection[K]
  ) => {
    onChange({ ...medicine, [field]: value });
  };

  const hoursSinceOnset = symptoms.hoursSinceOnset;
  const showExtendedWindowWarning =
    hoursSinceOnset !== null && !isWithinTreatmentWindow(hoursSinceOnset);

  return (
    <>
      <div className="space-y-6">
        {/* Treatment Window Warning */}
        {showExtendedWindowWarning && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">Treatment window</h3>
            <p className="text-amber-800">
              Rash onset was {hoursSinceOnset} hours ago, outside 72 hours. Supply is under the 7 day criteria. Start treatment as soon as possible: the benefit falls away the longer the delay after rash onset.
            </p>
          </div>
        )}

        {hasNonSevereImmunosuppression(medicalHistory) && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              Non-severe immunosuppression: use valaciclovir or famciclovir rather than aciclovir. The famciclovir course in this group is 10 days.
            </p>
          </div>
        )}

        {/* Medicine Selection */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-1">Select Medicine</h3>
          <p className="text-xs text-blue-800 mb-3">Choose one agent. Do not combine. One complete course; no repeat supply under this PGD.</p>

          <SelectInput
            label="Antiviral medicine"
            value={medicine.medicine}
            onChange={(v) => handleChange('medicine', v as ShinglesMedicineSelection['medicine'])}
            options={[
              { value: '', label: 'Select medicine...' },
              ...availability.map((a) => ({
                value: a.medicine,
                label: a.available
                  ? MEDICINE_LABELS[a.medicine]
                  : `NOT AVAILABLE (${a.reason}): ${a.medicine}`,
              })),
            ]}
            required
          />

          {medicine.medicine && recommendedDose && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
              <p className="text-sm text-gray-700">{recommendedDose.notes}</p>
            </div>
          )}
        </div>

        {/* Renal threshold notification */}
        {medicalHistory.renalImpairment === 'moderate' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="font-semibold text-yellow-900">eGFR 30 to 59: aciclovir only, at the standard dose.</p>
            <p className="text-sm text-yellow-800 mt-2">
              Valaciclovir and famciclovir are not supplied under this PGD below eGFR 60. The PGD does not operate the renal dosing ladder.
            </p>
          </div>
        )}

        {/* Dose Information */}
        {recommendedDose && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">PGD regimen</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-xs text-gray-600">Dose</p>
                  <p className="text-lg font-semibold text-purple-900">{recommendedDose.dose}</p>
                </div>
                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-xs text-gray-600">Frequency</p>
                  <p className="text-lg font-semibold text-purple-900">{recommendedDose.frequency}</p>
                </div>
                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-purple-900">{recommendedDose.duration}</p>
                </div>
                <div className="p-3 bg-white rounded border border-purple-200">
                  <p className="text-xs text-gray-600">Quantity</p>
                  <p className="text-lg font-semibold text-purple-900">{recommendedDose.quantity} tablets</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supply record */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Supply record</h3>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Brand / manufacturer supplied"
                value={medicine.brand}
                onChange={(v) => handleChange('brand', v)}
                placeholder="e.g. Wockhardt aciclovir 800 mg; Valtrex 500 mg"
              />
              <TextInput
                label="Batch number"
                value={medicine.batchNumber}
                onChange={(v) => handleChange('batchNumber', v)}
                placeholder="Batch number from the pack"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600">Dose per administration</p>
                <p className="font-medium text-gray-900">{medicine.dose || 'Select an agent'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Frequency</p>
                <p className="font-medium text-gray-900">{medicine.frequency || 'Select an agent'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="font-medium text-gray-900">{medicine.duration || 'Select an agent'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total quantity</p>
                <p className="font-medium text-gray-900">{medicine.quantity ? `${medicine.quantity} tablets` : 'Select an agent'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              The regimen is fixed by the PGD: one complete course as specified, no repeat supply. If this patient needs a different dose, frequency, duration or quantity (for example a renal adjustment), that is outside the PGD: do not supply, refer to a prescriber and record the advice given.
            </p>
          </div>
        </div>

        {/* Counselling Reminders */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Key Counselling Points</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Complete the full course even if symptoms improve</li>
            <li>Aciclovir: five doses a day is demanding and the course will not work well if doses are missed</li>
            <li>Maintain a good fluid intake throughout the course, particularly if elderly</li>
            <li>Start as soon as possible: the benefit falls away the longer the delay after rash onset</li>
            <li>Antivirals reduce the severity and duration of the episode but do not cure it instantly; some pain may persist</li>
            <li>Report any neurological symptoms (confusion, hallucinations, tremor)</li>
          </ul>
        </div>
      </div>
    </>
  );
};
