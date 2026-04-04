'use client';

import React, { useState, useEffect } from 'react';
import { SelectInput, Checkbox, TextArea } from '../../shared/components/FormInputs';
import { StepWrapper } from '../../shared/components/StepWrapper';
import { ShinglesMedicineSelection, ShinglesSymptoms, ShinglesMedicalHistory } from '../shingles-types';
import { getRecommendedDose, validateMedicineSelectionStep } from '../shingles-clinical-logic';

interface MedicineSelectionStepProps {
  medicine: ShinglesMedicineSelection;
  symptoms: ShinglesSymptoms;
  medicalHistory: ShinglesMedicalHistory;
  onChange: (medicine: ShinglesMedicineSelection) => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export const MedicineSelectionStep: React.FC<MedicineSelectionStepProps> = ({
  medicine,
  symptoms,
  medicalHistory,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
}) => {
  const [recommendedDose, setRecommendedDose] = useState<any>(null);
  const validationError = validateMedicineSelectionStep(medicine);

  useEffect(() => {
    if (medicine.medicine) {
      const dose = getRecommendedDose(
        medicine.medicine,
        medicalHistory.renalImpairment
      );
      setRecommendedDose(dose);
    }
  }, [medicine.medicine, medicalHistory.renalImpairment]);

  const handleChange = (field: keyof ShinglesMedicineSelection, value: any) => {
    onChange({ ...medicine, [field]: value });
  };

  const applyRecommendedDose = () => {
    if (recommendedDose) {
      onChange({
        ...medicine,
        dose: recommendedDose.dose,
        frequency: recommendedDose.frequency,
        duration: recommendedDose.duration,
        quantity: recommendedDose.quantity,
      });
    }
  };

  // Calculate hours since onset for warning
  const hoursSinceOnset = symptoms.hoursSinceOnset;
  const showApproachingWindowWarning =
    hoursSinceOnset !== null && hoursSinceOnset > 48 && hoursSinceOnset <= 72;

  return (
    <StepWrapper
      title="Medicine Selection"
      description="Select and confirm antiviral medicine and dose"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!validationError}
      validationError={validationError}
    >
      <div className="space-y-6">
        {/* Treatment Window Warning */}
        {showApproachingWindowWarning && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">⏰ Treatment Window Alert</h3>
            <p className="text-amber-800">
              Rash onset was {hoursSinceOnset} hours ago. Approaching edge of 72-hour treatment window.
              Antivirals may be less effective. Reinforce importance of early treatment.
            </p>
          </div>
        )}

        {/* Medicine Selection */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Select Medicine</h3>

          <SelectInput
            label="Antiviral medicine"
            value={medicine.medicine}
            onChange={(v) => handleChange('medicine', v)}
            options={[
              { value: '', label: 'Select medicine...' },
              { value: 'valaciclovir', label: 'Valaciclovir (first-line - better absorption)' },
              { value: 'aciclovir', label: 'Aciclovir (if valaciclovir unsuitable)' },
            ]}
            required
          />

          {medicine.medicine && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
              <p className="text-sm text-gray-700">
                {medicine.medicine === 'valaciclovir'
                  ? 'Valaciclovir: Pro-drug of aciclovir, better oral bioavailability, requires less frequent dosing, preferred for most patients.'
                  : 'Aciclovir: If valaciclovir unsuitable (renal impairment, high dose intolerance), more frequent dosing required.'}
              </p>
            </div>
          )}
        </div>

        {/* Renal Adjustment Notification */}
        {medicalHistory.renalImpairment !== 'none' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="font-semibold text-yellow-900">
              ℹ️ Renal impairment detected ({medicalHistory.renalImpairment})
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              Dose recommendations below have been adjusted for renal function.
            </p>
          </div>
        )}

        {/* Dose Information */}
        {recommendedDose && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">Recommended Dose</h3>

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

              <p className="text-sm text-purple-700 bg-white p-2 rounded">
                {recommendedDose.notes}
              </p>

              <button
                onClick={applyRecommendedDose}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
              >
                Apply Recommended Dose
              </button>
            </div>
          </div>
        )}

        {/* Manual Dose Entry */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Dose Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dose per administration *</label>
              <input
                type="text"
                value={medicine.dose}
                onChange={(e) => handleChange('dose', e.target.value)}
                placeholder="e.g., 1g, 800mg, 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
              <input
                type="text"
                value={medicine.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                placeholder="e.g., three times daily, twice daily, five times daily"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                <input
                  type="text"
                  value={medicine.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="e.g., 7 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total quantity (tablets) *</label>
                <input
                  type="number"
                  value={medicine.quantity || ''}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 21"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacist Override */}
        <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-3">Pharmacist Override (if applicable)</h3>

          <div className="space-y-3">
            <Checkbox
              label="I am deviating from recommended dose and wish to apply a pharmacist override"
              checked={medicine.pharmacistOverride}
              onChange={(v) => handleChange('pharmacistOverride', v)}
            />

            {medicine.pharmacistOverride && (
              <TextArea
                label="Reason for override *"
                value={medicine.overrideReason}
                onChange={(v) => handleChange('overrideReason', v)}
                placeholder="Provide clinical justification for deviation from recommended dose..."
                required
                rows={3}
              />
            )}
          </div>
        </div>

        {/* Counselling Reminders */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Key Counselling Points</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Complete full 7-day course even if symptoms improve</li>
            <li>Take with food or water if GI upset occurs</li>
            <li>Ensure adequate hydration (especially with aciclovir)</li>
            <li>Time-critical: Most effective if started within 72 hours of rash onset</li>
            <li>Do not exceed recommended dose - risk of renal/neurological toxicity</li>
            <li>Report any neurological symptoms (confusion, hallucinations, tremor)</li>
          </ul>
        </div>
      </div>
    </StepWrapper>
  );
};
