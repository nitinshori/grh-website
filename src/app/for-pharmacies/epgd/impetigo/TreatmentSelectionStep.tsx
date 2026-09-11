'use client';

import { ImpetigoTreatmentSelection } from './impetigo-types';
import { TreatmentRecommendation, ImpetigoRoute } from './impetigo-clinical-logic';
import { SelectInput, TextInput, NumberInput, Checkbox, TextArea } from '../shared/components/FormInputs';

interface TreatmentSelectionStepProps {
  treatment: ImpetigoTreatmentSelection;
  recommendation: TreatmentRecommendation | null;
  route: ImpetigoRoute;
  pregnant: boolean;
  onChange: (treatment: ImpetigoTreatmentSelection) => void;
}

export function TreatmentSelectionStep({
  treatment,
  recommendation,
  route,
  pregnant,
  onChange,
}: TreatmentSelectionStepProps) {
  const handleChange = (field: keyof ImpetigoTreatmentSelection, value: unknown) => {
    onChange({
      ...treatment,
      [field]: value,
    });
  };

  // Only the arm the document sends this patient to is offered. Topical and
  // oral antibiotics are never combined.
  const treatmentOptions = [
    { value: '', label: 'Select treatment...' },
    ...(route === 'topical'
      ? [
          { value: 'hydrogen-peroxide', label: 'Hydrogen peroxide 1% cream (P sale first; NOT a PGD supply)' },
          { value: 'fusidic-acid', label: 'Fusidic acid 2% cream, three times a day for 5 days (localised non-bullous)' },
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
              <p className="text-green-700">
                {recommendation.quantity} {recommendation.quantityUnit || ''}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
        Do NOT combine a topical and an oral antibiotic. One course per episode; no repeat supply under this PGD.
      </div>

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
          placeholder={recommendation?.dose || 'E.g., 250 mg, apply a thin layer'}
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">Recommended: {recommendation.dose}</p>
        )}
      </div>

      {treatment.treatment === 'clarithromycin' && (
        <TextArea
          label="Clarithromycin 500mg twice a day (severe infection only): reason recorded"
          value={treatment.severeDoseReason}
          onChange={(value) => handleChange('severeDoseReason', value)}
          placeholder="Leave blank for the standard 250mg twice a day. If 500mg twice a day is used, record the reason here."
          rows={2}
        />
      )}

      {/* Frequency */}
      <div>
        <TextInput
          label="Frequency *"
          value={treatment.frequency}
          onChange={(value) => handleChange('frequency', value)}
          placeholder={recommendation?.frequency || 'E.g., Three times a day, Four times a day'}
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">Recommended: {recommendation.frequency}</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <SelectInput
          label="Duration *"
          value={treatment.duration}
          onChange={(value) => handleChange('duration', value)}
          options={[
            { value: '', label: 'Select duration...' },
            { value: '5 days', label: '5 days (standard course)' },
            { value: '7 days', label: '7 days (clinical judgement only, lesions severe or numerous; reason required)' },
          ]}
        />
        <p className="text-xs text-gray-600 mt-1">Courses are 5 days. Maximum 7 days, extended only on clinical judgement with the reason recorded.</p>
        {treatment.duration === '7 days' && (
          <div className="mt-3">
            <TextArea
              label="Reason for extending to 7 days *"
              value={treatment.extensionReason}
              onChange={(value) => handleChange('extensionReason', value)}
              placeholder="E.g., numerous lesions over both forearms"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Quantity */}
      <div>
        <NumberInput
          label="Quantity (number of units) *"
          value={treatment.quantity}
          onChange={(value) => handleChange('quantity', value)}
          min={0}
          placeholder="E.g., 1, 10, 20"
          unit={recommendation?.quantityUnit}
        />
        {recommendation && (
          <p className="text-xs text-gray-600 mt-1">
            Recommended: {recommendation.quantity} {recommendation.quantityUnit || ''}
          </p>
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
