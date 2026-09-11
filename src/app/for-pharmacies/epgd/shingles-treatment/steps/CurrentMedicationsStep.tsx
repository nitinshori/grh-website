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
            <p><strong>Medicines that matter under this PGD (tick the matching boxes on the Medical History step):</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>EXCLUSION: ciclosporin, tacrolimus, mycophenolate, aminophylline or theophylline. Refer to a prescriber</li>
              <li>EXCLUSION: current long-term prophylactic antiviral of the same class</li>
              <li>Caution: nephrotoxic medicines (ACE inhibitors, ARBs, diuretics, NSAIDs, metformin, aminoglycosides, methotrexate). Counsel firmly on fluid intake</li>
              <li>Caution: tenofovir. Advise the patient to contact its prescriber about additional renal monitoring</li>
              <li>Caution: probenecid or cimetidine reduce renal clearance of aciclovir and valaciclovir</li>
              <li>Caution: raloxifene reduces the activation of famciclovir</li>
            </ul>
          </div>

          <div className="mt-4 text-sm text-gray-700 space-y-2">
            <p><strong>Pain management (may already be taking):</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Paracetamol alone or with codeine</li>
              <li>An NSAID such as ibuprofen, subject to the usual contraindications (renal function, GI history)</li>
              <li>Pain not controlled by over-the-counter analgesia: refer to a prescriber the same day</li>
            </ul>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};
