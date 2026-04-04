'use client';

import React from 'react';
import { TextInput, NumberInput, SelectInput, TextArea } from '../../shared/components/FormInputs';
import { StepWrapper } from '../../shared/components/StepWrapper';
import { ShinglesSymptoms } from '../shingles-types';
import { calculateHoursSinceOnset, isWithinTreatmentWindow } from '../shingles-clinical-logic';
import { validateSymptomStep } from '../shingles-clinical-logic';

interface SymptomAssessmentStepProps {
  symptoms: ShinglesSymptoms;
  onChange: (symptoms: ShinglesSymptoms) => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export const SymptomAssessmentStep: React.FC<SymptomAssessmentStepProps> = ({
  symptoms,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
}) => {
  const validationError = validateSymptomStep(symptoms);
  const hoursSinceOnset = calculateHoursSinceOnset(symptoms.rashOnsetDate);
  const withinWindow = isWithinTreatmentWindow(hoursSinceOnset);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const newSymptoms = { ...symptoms, rashOnsetDate: newDate };
    const newHours = calculateHoursSinceOnset(newDate);
    newSymptoms.hoursSinceOnset = newHours;
    onChange(newSymptoms);
  };

  const handleChange = (field: keyof ShinglesSymptoms, value: any) => {
    onChange({ ...symptoms, [field]: value });
  };

  return (
    <StepWrapper
      title="Symptom Assessment & Rash Assessment"
      description="Assess the patient's current symptoms and rash characteristics"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!validationError}
      validationError={validationError}
    >
      <div className="space-y-6">
        {/* Rash Onset Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Rash Onset</h3>

          <div className="space-y-4">
            <TextInput
              label="Date of rash onset"
              type="date"
              value={symptoms.rashOnsetDate}
              onChange={(v) => {
                const newSymptoms = { ...symptoms, rashOnsetDate: v };
                const newHours = calculateHoursSinceOnset(v);
                newSymptoms.hoursSinceOnset = newHours;
                onChange(newSymptoms);
              }}
              required
            />

            {hoursSinceOnset !== null && (
              <div className={`p-3 rounded ${
                withinWindow
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                <p className="font-semibold">
                  {hoursSinceOnset} hours since rash onset
                </p>
                {!withinWindow && (
                  <p className="text-sm mt-1">
                    ⚠️ Outside the 72-hour treatment window. Antivirals may be less effective.
                  </p>
                )}
                {withinWindow && hoursSinceOnset > 48 && (
                  <p className="text-sm mt-1">
                    ⚠️ Approaching edge of treatment window (48-72 hours). Antivirals effectiveness decreasing.
                  </p>
                )}
              </div>
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
              onChange={(v) => handleChange('rashStage', v)}
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
              label="Dermatome (location) - CRITICAL for V1 screening"
              value={symptoms.dermatome}
              onChange={(v) => handleChange('dermatome', v)}
              options={[
                { value: 'thoracic', label: 'Thoracic (chest/trunk) - most common' },
                { value: 'lumbar', label: 'Lumbar (lower back/abdomen)' },
                { value: 'sacral', label: 'Sacral (lower buttocks/genitals)' },
                { value: 'cervical', label: 'Cervical (neck/upper back)' },
                { value: 'trigeminal-V1', label: '⚠️ URGENT: Trigeminal V1 (forehead, eye, nose tip)' },
                { value: 'trigeminal-V2', label: 'Trigeminal V2 (upper cheek/upper lip)' },
                { value: 'trigeminal-V3', label: 'Trigeminal V3 (lower cheek/lower jaw)' },
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
          </div>
        </div>

        {/* Pain Assessment */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-3">Pain Assessment</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain Level (1-10 scale) *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={symptoms.painLevel || 5}
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
                  {symptoms.painLevel || '?'}/10
                </span>
              </div>
              {symptoms.painLevel && symptoms.painLevel >= 8 && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Severe pain noted - consider pain management referral
                </p>
              )}
            </div>

            <SelectInput
              label="Type of pain"
              value={symptoms.painType}
              onChange={(v) => handleChange('painType', v)}
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

        {/* Unilateral Confirmation */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ✓ Shingles is always unilateral (one side of body)
          </p>
          <p className="text-xs text-gray-600 mt-2">
            If rash crosses the midline or involves multiple non-contiguous dermatomes, refer to GP immediately.
          </p>
        </div>
      </div>
    </StepWrapper>
  );
};
