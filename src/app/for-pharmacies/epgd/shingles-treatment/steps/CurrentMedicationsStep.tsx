'use client';

import React from 'react';
import { TextArea } from '../../shared/components/FormInputs';
import { StepWrapper } from '../../shared/components/StepWrapper';

interface CurrentMedicationsStepProps {
  medications: string;
  onChange: (medications: string) => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export const CurrentMedicationsStep: React.FC<CurrentMedicationsStepProps> = ({
  medications,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
}) => {
  const validationError = !medications.trim() ? 'Current medications information is required' : null;

  return (
    <StepWrapper
      title="Current Medications"
      description="Review all medications patient is currently taking"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!validationError}
      validationError={validationError}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Medication Review</h3>

          <TextArea
            label="List all current medications (prescription, OTC, herbal, vitamins)"
            value={medications}
            onChange={(v) => onChange(v)}
            placeholder={`e.g.,
- Metformin 500mg BD for diabetes
- Lisinopril 10mg OD for hypertension
- Paracetamol 500mg for occasional pain
- Multivitamin daily
- St John's Wort herbal supplement`}
            required
            rows={8}
          />

          <div className="mt-4 text-sm text-blue-700 space-y-2">
            <p><strong>Key drug interactions to consider:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Anticonvulsants (phenytoin, carbamazepine) - may increase antiviral metabolism</li>
              <li>Nephrotoxic drugs (NSAIDs, ACE inhibitors) - monitor renal function with antivirals</li>
              <li>Probenecid - increases aciclovir levels (risk of toxicity)</li>
              <li>Theophylline - aciclovir may reduce clearance</li>
              <li>High-dose NSAIDs - increased risk of renal impairment</li>
            </ul>
          </div>

          <div className="mt-4 text-sm text-gray-700 space-y-2">
            <p><strong>Pain management options (may already be taking):</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Paracetamol - safe first-line option</li>
              <li>Ibuprofen/naproxen - check renal function and GI history</li>
              <li>Codeine-based preparations - may cause constipation</li>
              <li>Topical lidocaine - can be used alongside oral antivirals</li>
              <li>Gabapentin (pregabalin) - for neuropathic pain, may require GP referral</li>
            </ul>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};
