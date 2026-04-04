'use client';

import { ImpetigoTreatmentSelection } from './impetigo-types';
import { TreatmentRecommendation } from './impetigo-clinical-logic';
import { SelectInput, TextInput, NumberInput, Checkbox, TextArea } from '../shared/components/FormInputs';

interface TreatmentSelectionStepProps {
  treatment: ImpetigoTreatmentSelection;
  recommendation: TreatmentRecommendation | null;
  onChange: (treatment: ImpetigoTreatmentSelection) => void;
}

export function TreatmentSelectionStep({
  treatment,
  recommendation,
  onChange,
}: TreatmentSelectionStepProps) {
  const handleChange = (field: keyof ImpetigoTreatmentSelection, value: unknown) => {
    onChange({
      ...treatment,
      [field]: value,
    });
  };

  const treatmentOptions = [
    { value: '', label: 'Select treatment...' },
    { value: 'fusidic-acid', label: 'Fusidic Acid 2% Cream (Localised non-bullous)' },
    { value: 'hydrogen-peroxide', label: 'Hydrogen Peroxide 1% Cream (Alternative topical)' },
    { value: 'flucloxacillin', label: 'Flucloxacillin Capsules (Widespread non-bullous)' },
    { value: 'clarithromycin', label: 'Clarithromycin Tablets (Penicillin-allergic)' },
  ];

  return (
    <div className="space-y-6">
      {recommendation && (
        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Recommended Treatment</h3>
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
              <p className="text-green-700">{recommendation.quantity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Selection */}
      <div>
        <SelectInput
          label="Selected Treatment *"
          value={treatment.treatment}
          onChange={(value) => handleChange('treatment', value)}
          options={treatmentOptions}
        />
      </div>

      {/* Dose */}
      <div>
        <TextInput
          label="Dose *"
          value={treatment.dose}
          onChange={(value) => handleChange('dose', value)}
          placeholder={recommendation?.dose || 'E.g., 250 mg, 2g, Apply a small amount'}
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">Recommended: {recommendation.dose}</p>
        )}
      </div>

      {/* Frequency */}
      <div>
        <TextInput
          label="Frequency *"
          value={treatment.frequency}
          onChange={(value) => handleChange('frequency', value)}
          placeholder={recommendation?.frequency || 'E.g., Once daily, Three times daily (TDS), Four times daily (QDS)'}
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">Recommended: {recommendation.frequency}</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <TextInput
          label="Duration *"
          value={treatment.duration}
          onChange={(value) => handleChange('duration', value)}
          placeholder={recommendation?.duration || 'E.g., 5 days, 7 days'}
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">Recommended: {recommendation.duration}</p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <NumberInput
          label="Quantity (number of units) *"
          value={treatment.quantity}
          onChange={(value) => handleChange('quantity', value)}
          min={0}
          placeholder="E.g., 1, 28, 56"
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">Recommended: {recommendation.quantity}</p>
        )}
      </div>

      {/* Pharmacist Override */}
      <div className="border-t border-gray-200 pt-6">
        <Checkbox
          label="Pharmacist Override (if deviating from recommendation)"
          checked={treatment.pharmacistOverride}
          onChange={(checked) => handleChange('pharmacistOverride', checked)}
          description="Check if making a clinical decision to deviate from the standard recommendation"
        />
        {treatment.pharmacistOverride && (
          <div className="mt-3">
            <TextArea
              label="Reason for Override *"
              value={treatment.overrideReason}
              onChange={(value) => handleChange('overrideReason', value)}
              placeholder="E.g., Patient preference, stock availability, previous good response to alternative agent..."
              rows={3}
            />
            <p className="text-xs text-amber-600 mt-1">
              Document the clinical rationale for deviating from standard recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
