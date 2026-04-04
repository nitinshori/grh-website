'use client';

import React from 'react';
import { Checkbox, SelectInput, TextArea } from '../../shared/components/FormInputs';
import { StepWrapper } from '../../shared/components/StepWrapper';
import { ShinglesMedicalHistory } from '../shingles-types';
import { validateMedicalHistoryStep } from '../shingles-clinical-logic';

interface MedicalHistoryStepProps {
  medicalHistory: ShinglesMedicalHistory;
  onChange: (history: ShinglesMedicalHistory) => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export const MedicalHistoryStep: React.FC<MedicalHistoryStepProps> = ({
  medicalHistory,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
}) => {
  const validationError = validateMedicalHistoryStep(medicalHistory);

  const handleChange = (field: keyof ShinglesMedicalHistory, value: any) => {
    onChange({ ...medicalHistory, [field]: value });
  };

  return (
    <StepWrapper
      title="Medical History"
      description="Review patient's medical conditions and relevant history"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!validationError}
      validationError={validationError}
    >
      <div className="space-y-6">
        {/* Immunosuppression - CRITICAL */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">⚠️ Immunosuppression Status (CRITICAL)</h3>

          <div className="space-y-3">
            <Checkbox
              label="Patient is immunosuppressed (including HIV, cancer, organ transplant, high-dose steroids)"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) => handleChange('immunosuppressed', v)}
            />

            {medicalHistory.immunosuppressed && (
              <TextArea
                label="Details of immunosuppression"
                value={medicalHistory.immunosuppressedDetails}
                onChange={(v) => handleChange('immunosuppressedDetails', v)}
                placeholder="e.g., on immunosuppressants for transplant, active leukaemia, CD4 <200..."
                required
                rows={3}
              />
            )}

            <Checkbox
              label="HIV positive (or unknown status)"
              checked={medicalHistory.hivPositive}
              onChange={(v) => handleChange('hivPositive', v)}
            />

            <Checkbox
              label="Active cancer (receiving treatment)"
              checked={medicalHistory.cancerActive}
              onChange={(v) => handleChange('cancerActive', v)}
            />

            <Checkbox
              label="Organ transplant recipient"
              checked={medicalHistory.organTransplant}
              onChange={(v) => handleChange('organTransplant', v)}
            />
          </div>
        </div>

        {/* Pregnancy & Lactation */}
        <div className="bg-pink-50 border border-pink-300 rounded-lg p-4">
          <h3 className="font-semibold text-pink-900 mb-3">Pregnancy & Lactation</h3>

          <div className="space-y-3">
            <Checkbox
              label="Patient is pregnant"
              checked={medicalHistory.pregnant}
              onChange={(v) => handleChange('pregnant', v)}
            />

            <Checkbox
              label="Patient is breastfeeding"
              checked={medicalHistory.breastfeeding}
              onChange={(v) => handleChange('breastfeeding', v)}
            />

            {medicalHistory.breastfeeding && (
              <p className="text-sm text-pink-700 bg-white p-2 rounded">
                ℹ️ Aciclovir is preferred for breastfeeding patients (minimal excretion); valaciclovir less preferred.
              </p>
            )}
          </div>
        </div>

        {/* Renal & Hepatic Function */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-3">Organ Function</h3>

          <div className="space-y-4">
            <div>
              <SelectInput
                label="Renal impairment"
                value={medicalHistory.renalImpairment}
                onChange={(v) => handleChange('renalImpairment', v)}
                options={[
                  { value: 'none', label: 'None / Normal' },
                  { value: 'moderate', label: 'Moderate (CrCl 30-59 mL/min)' },
                  { value: 'severe', label: 'Severe (CrCl <30 mL/min)' },
                ]}
              />
              {medicalHistory.renalImpairment !== 'none' && (
                <p className="text-sm text-yellow-700 mt-2 bg-white p-2 rounded">
                  ℹ️ Dose adjustment required - will be calculated in medicine selection
                </p>
              )}
            </div>

            <div>
              <SelectInput
                label="Hepatic impairment"
                value={medicalHistory.hepaticImpairment}
                onChange={(v) => handleChange('hepaticImpairment', v)}
                options={[
                  { value: 'none', label: 'None / Normal' },
                  { value: 'mild-moderate', label: 'Mild-moderate' },
                  { value: 'severe', label: 'Severe' },
                ]}
              />
              {medicalHistory.hepaticImpairment === 'severe' && (
                <p className="text-sm text-red-700 mt-2 bg-red-100 p-2 rounded">
                  ⚠️ Severe hepatic impairment - antivirals contraindicated. Refer to GP.
                </p>
              )}
              {medicalHistory.hepaticImpairment === 'mild-moderate' && (
                <p className="text-sm text-yellow-700 mt-2 bg-white p-2 rounded">
                  ℹ️ Monitor for side effects. Patient should avoid alcohol.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Shingles History */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Shingles History</h3>

          <div className="space-y-3">
            <Checkbox
              label="Previous episode of shingles"
              checked={medicalHistory.previousShingles}
              onChange={(v) => handleChange('previousShingles', v)}
            />

            {medicalHistory.previousShingles && (
              <p className="text-sm text-blue-700 bg-white p-2 rounded">
                ℹ️ Note: Recurrent shingles is possible. Vaccination (Shingrix) after recovery recommended.
              </p>
            )}
          </div>
        </div>

        {/* Current Medications & Allergies */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Medications & Allergies</h3>

          <div className="space-y-4">
            <TextArea
              label="Current medications (including herbal, OTC)"
              value={medicalHistory.currentMedications}
              onChange={(v) => handleChange('currentMedications', v)}
              placeholder="List all medications patient is currently taking..."
              rows={3}
            />

            <TextArea
              label="Known allergies (including drug allergies)"
              value={medicalHistory.allergies}
              onChange={(v) => handleChange('allergies', v)}
              placeholder="List any known allergies, especially to antivirals or NSAIDs..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};
