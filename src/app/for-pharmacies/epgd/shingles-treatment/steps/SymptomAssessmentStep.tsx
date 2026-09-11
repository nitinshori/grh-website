'use client';

import React from 'react';
import { TextInput, SelectInput, TextArea, Checkbox } from '../../shared/components/FormInputs';
import { ShinglesSymptoms } from '../shingles-types';
import {
  calculateHoursSinceOnset,
  isWithinTreatmentWindow,
  isWithinSevenDays,
  getTreatmentWindow,
  describeTreatmentWindow,
} from '../shingles-clinical-logic';

interface SymptomAssessmentStepProps {
  symptoms: ShinglesSymptoms;
  onChange: (symptoms: ShinglesSymptoms) => void;
  /** Patient age, used for the treatment window criteria (aged 50 or over; age 70 or over). */
  age?: number | null;
}

export const SymptomAssessmentStep: React.FC<SymptomAssessmentStepProps> = ({
  symptoms,
  onChange,
  age = null,
}) => {
  const hoursSinceOnset = calculateHoursSinceOnset(symptoms.rashOnsetDate, symptoms.rashOnsetTime);
  const withinWindow = isWithinTreatmentWindow(hoursSinceOnset);
  const withinSevenDays = isWithinSevenDays(hoursSinceOnset);
  const treatmentWindow = getTreatmentWindow(symptoms, age);

  const handleChange = <K extends keyof ShinglesSymptoms>(field: K, value: ShinglesSymptoms[K]) => {
    onChange({ ...symptoms, [field]: value });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Rash Onset Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Rash Onset</h3>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Date of rash onset"
                type="date"
                value={symptoms.rashOnsetDate}
                onChange={(v) => {
                  const newSymptoms = { ...symptoms, rashOnsetDate: v };
                  newSymptoms.hoursSinceOnset = calculateHoursSinceOnset(v, symptoms.rashOnsetTime);
                  onChange(newSymptoms);
                }}
                required
              />
              <TextInput
                label="Approximate time of onset (optional)"
                type="time"
                value={symptoms.rashOnsetTime}
                onChange={(v) => {
                  const newSymptoms = { ...symptoms, rashOnsetTime: v };
                  newSymptoms.hoursSinceOnset = calculateHoursSinceOnset(symptoms.rashOnsetDate, v);
                  onChange(newSymptoms);
                }}
              />
            </div>
            <p className="text-xs text-blue-800">
              The 72 hour and 7 day windows run from rash onset. With a time the interval is exact; without one it is counted in whole days from the onset date (onset up to 3 days ago counts as within 72 hours, up to 7 days ago as within 7 days).
            </p>

            {hoursSinceOnset !== null && (
              <div className={`p-3 rounded ${
                withinWindow
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : withinSevenDays
                  ? 'bg-amber-100 border border-amber-300 text-amber-900'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                <p className="font-semibold">
                  {hoursSinceOnset} hours since rash onset
                </p>
                {withinWindow && (
                  <p className="text-sm mt-1">
                    Within 72 hours. Supply requires at least one of: aged 50 or over; non-truncal involvement of the limbs or perineum (sacral dermatomes count as truncal); moderate or severe pain (4 or more on the 0 to 10 scale); or moderate or severe rash with confluent lesions.
                  </p>
                )}
                {!withinWindow && withinSevenDays && (
                  <p className="text-sm mt-1">
                    Between 72 hours and 7 days. Supply requires at least one of: continued formation of new vesicles; severe pain (7 or more on the 0 to 10 scale); age 70 or over; or a high risk of severe shingles (for example severe atopic eczema).
                  </p>
                )}
                {!withinSevenDays && (
                  <p className="text-sm mt-1">
                    Rash onset more than 7 days ago: excluded. Refer for a prescriber decision.
                  </p>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <Checkbox
                label="New vesicles are still forming"
                checked={symptoms.newVesiclesForming}
                onChange={(v) => handleChange('newVesiclesForming', v)}
                description="7 day window criterion."
              />
              <Checkbox
                label="High risk of severe shingles (for example severe atopic eczema)"
                checked={symptoms.highRiskSevereShingles}
                onChange={(v) => handleChange('highRiskSevereShingles', v)}
                description="7 day window criterion."
              />
            </div>

            {hoursSinceOnset !== null && (
              <p className="text-xs text-gray-700">
                Treatment window for the record: {describeTreatmentWindow(treatmentWindow)}.
              </p>
            )}
          </div>
        </div>

        {/* Rash Characteristics */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Rash Characteristics</h3>

          <div className="space-y-4">
            <SelectInput
              label="Stage of rash"
              value={symptoms.rashStage}
              onChange={(v) => handleChange('rashStage', v as ShinglesSymptoms['rashStage'])}
              options={[
                { value: '', label: 'Select rash stage...' },
                { value: 'prodromal', label: 'Prodromal (pain/burning before rash)' },
                { value: 'vesicular', label: 'Vesicular (clear fluid-filled blisters)' },
                { value: 'pustular', label: 'Pustular (cloudy/pus-filled blisters)' },
                { value: 'crusting', label: 'Crusting (scabs forming)' },
              ]}
              required
            />

            <SelectInput
              label="Dermatome (location). Head or neck involvement is a referral, not a supply"
              value={symptoms.dermatome}
              onChange={(v) => handleChange('dermatome', v as ShinglesSymptoms['dermatome'])}
              options={[
                { value: '', label: 'Select dermatome...' },
                { value: 'thoracic', label: 'Thoracic (chest / trunk), most common' },
                { value: 'lumbar', label: 'Lumbar (lower back / abdomen)' },
                { value: 'sacral', label: 'Sacral (buttocks), counts as truncal' },
                { value: 'upper-limb', label: 'Upper limb (arm or hand), non-truncal' },
                { value: 'lower-limb', label: 'Lower limb (leg or foot), non-truncal' },
                { value: 'perineum', label: 'Perineum or genitals, non-truncal' },
                { value: 'cervical', label: 'REFER: Cervical (neck, scalp, behind the ear)' },
                { value: 'trigeminal-V1', label: 'REFER SAME DAY: Trigeminal V1 (forehead, eye, nose tip)' },
                { value: 'trigeminal-V2', label: 'REFER: Trigeminal V2 (upper cheek / upper lip)' },
                { value: 'trigeminal-V3', label: 'REFER: Trigeminal V3 (lower cheek / lower jaw)' },
              ]}
              required
            />

            <SelectInput
              label="Rash severity"
              value={symptoms.rashSeverity}
              onChange={(v) => handleChange('rashSeverity', v as ShinglesSymptoms['rashSeverity'])}
              options={[
                { value: '', label: 'Select rash severity...' },
                { value: 'mild', label: 'Mild (scattered lesions)' },
                { value: 'moderate', label: 'Moderate (confluent lesions)' },
                { value: 'severe', label: 'Severe (extensive confluent lesions)' },
              ]}
              required
            />

            <TextArea
              label="Rash description (appearance, extent, grouped/unilateral)"
              value={symptoms.rashDescription}
              onChange={(v) => handleChange('rashDescription', v)}
              placeholder="Describe the rash appearance, distribution, and confirm unilateral involvement..."
              required
              rows={4}
            />

            <SelectInput
              label="Is the rash a unilateral, dermatomal, painful vesicular rash that does not cross the midline?"
              value={symptoms.unilateral}
              onChange={(v) => handleChange('unilateral', v as ShinglesSymptoms['unilateral'])}
              options={[
                { value: '', label: 'Select...' },
                { value: 'yes', label: 'Yes: unilateral, dermatomal, does not cross the midline (inclusion criterion met)' },
                { value: 'no', label: 'No: disseminated, widespread or crossing the midline (refer, do not supply)' },
              ]}
              required
            />
          </div>
        </div>

        {/* Red flags requiring urgent referral rather than supply */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Red flags requiring urgent referral rather than supply</h3>
          <div className="space-y-3">
            <Checkbox
              label="Any visual symptom, eye pain, unexplained red eye, or Hutchinson's sign (rash on the tip, side or root of the nose)"
              checked={symptoms.eyeSymptoms}
              onChange={(v) => handleChange('eyeSymptoms', v)}
              description="Ophthalmic involvement: refer the same day for ophthalmology assessment."
            />
            <Checkbox
              label="Rash in or around the ear, hearing loss, vertigo, altered taste, or unilateral facial weakness"
              checked={symptoms.earOrFacialSymptoms}
              onChange={(v) => handleChange('earOrFacialSymptoms', v)}
              description="Ramsay Hunt syndrome or facial nerve involvement: refer urgently."
            />
            <Checkbox
              label="Neck stiffness, photophobia, mottled skin"
              checked={symptoms.meningitisSigns}
              onChange={(v) => handleChange('meningitisSigns', v)}
              description="Signs of meningitis: refer to A&E."
            />
            <Checkbox
              label="Disorientation, confusion, change in behaviour"
              checked={symptoms.encephalitisSigns}
              onChange={(v) => handleChange('encephalitisSigns', v)}
              description="Signs of encephalitis: refer to A&E."
            />
            <Checkbox
              label="Muscle weakness, loss of bladder or bowel control"
              checked={symptoms.myelitisSigns}
              onChange={(v) => handleChange('myelitisSigns', v)}
              description="Signs of myelitis: refer to A&E."
            />
            <Checkbox
              label="Any sign of sepsis or serious systemic infection"
              checked={symptoms.sepsisSigns}
              onChange={(v) => handleChange('sepsisSigns', v)}
              description="Call 999."
            />
            <Checkbox
              label="Systemic illness not meeting the threshold for sepsis"
              checked={symptoms.systemicallyUnwell}
              onChange={(v) => handleChange('systemicallyUnwell', v)}
              description="Refer to a prescriber the same day."
            />
            <Checkbox
              label="Pain not controlled by over-the-counter analgesia"
              checked={symptoms.painUncontrolledByOtc}
              onChange={(v) => handleChange('painUncontrolledByOtc', v)}
              description="Refer to a prescriber the same day."
            />
          </div>
          <div className="mt-4 pt-3 border-t border-red-200">
            <Checkbox
              label="Ophthalmic involvement specifically excluded: no V1 rash, no eye symptoms, no Hutchinson's sign"
              checked={symptoms.ophthalmicExcluded}
              onChange={(v) => handleChange('ophthalmicExcluded', v)}
              description="The PGD requires the record to show that red flags were assessed and found absent, and that ophthalmic involvement was specifically excluded."
              required
            />
          </div>
        </div>

        {/* Pain Assessment */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-3">Pain Assessment</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain score (0 to 10 scale) *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={symptoms.painLevel ?? 5}
                  onChange={(e) => handleChange('painLevel', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className={`text-2xl font-bold ${
                  symptoms.painLevel && symptoms.painLevel >= 8
                    ? 'text-red-600'
                    : symptoms.painLevel && symptoms.painLevel >= 5
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {symptoms.painLevel ?? '?'}/10
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                0 no pain; 1 to 3 mild; 4 to 6 moderate; 7 to 10 severe. Moderate or severe pain (4 or more) is a 72 hour window criterion; severe pain (7 or more) is a 7 day window criterion. Record the score on a validated 0 to 10 scale.
              </p>
              {symptoms.painLevel && symptoms.painLevel >= 7 && (
                <p className="text-sm text-red-600 mt-2">
                  Severe pain noted. Refer urgently to a prescriber if not controlled by over-the-counter analgesia.
                </p>
              )}
            </div>

            <SelectInput
              label="Type of pain"
              value={symptoms.painType}
              onChange={(v) => handleChange('painType', v as ShinglesSymptoms['painType'])}
              options={[
                { value: '', label: 'Select pain type...' },
                { value: 'burning', label: 'Burning' },
                { value: 'stabbing', label: 'Stabbing/sharp' },
                { value: 'aching', label: 'Aching' },
                { value: 'itching', label: 'Itching' },
              ]}
              required
            />
          </div>
        </div>

      </div>
    </>
  );
};
