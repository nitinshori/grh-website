'use client';

import { ImpetigoLesionAssessment } from './impetigo-types';
import { SelectInput, Checkbox, TextArea, NumberInput } from '../shared/components/FormInputs';

interface LesionAssessmentStepProps {
  lesionAssessment: ImpetigoLesionAssessment;
  onChange: (assessment: ImpetigoLesionAssessment) => void;
}

export function LesionAssessmentStep({ lesionAssessment, onChange }: LesionAssessmentStepProps) {
  const handleChange = (field: keyof ImpetigoLesionAssessment, value: unknown) => {
    onChange({
      ...lesionAssessment,
      [field]: value,
    });
  };

  const handleAffectedAreasChange = (area: string, checked: boolean) => {
    const updated = checked
      ? [...lesionAssessment.affectedAreas, area]
      : lesionAssessment.affectedAreas.filter((a) => a !== area);
    handleChange('affectedAreas', updated);
  };

  const affectedAreaOptions = [
    'Face/lips',
    'Neck',
    'Arms/hands',
    'Legs',
    'Buttocks/genital',
    'Scalp',
    'Other body areas',
  ];

  return (
    <div className="space-y-6">
      {/* Lesion Type */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Type of Impetigo <span className="text-red-500">*</span>
        </label>
        <div className="w-full">
          <SelectInput
            label="Type of Impetigo"
            value={lesionAssessment.lesionType}
            onChange={(value) => handleChange('lesionType', value)}
            options={[
              { value: '', label: 'Select lesion type...' },
              { value: 'non-bullous', label: 'Non-bullous (70-80% of cases, crusted)' },
              { value: 'bullous', label: 'Bullous (fluid-filled blisters)' },
            ]}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Non-bullous: Most common, presents with honey-coloured crusts. Bullous: Larger fluid-filled blisters.
        </p>
      </div>

      {/* Extent */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Extent of Infection <span className="text-red-500">*</span>
        </label>
        <div className="w-full">
          <SelectInput
            label="Extent of Infection"
            value={lesionAssessment.extent}
            onChange={(value) => handleChange('extent', value)}
            options={[
              { value: '', label: 'Select extent...' },
              { value: 'localised', label: 'Localised (<5cm area, few lesions)' },
              { value: 'widespread', label: 'Widespread (multiple areas or >5cm)' },
            ]}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Localised: Topical treatment usually sufficient. Widespread: Oral antibiotics recommended.
        </p>
      </div>

      {/* Number of Lesions */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Number of Lesions <span className="text-red-500">*</span>
        </label>
        <div className="w-full">
          <SelectInput
            label="Number of Lesions"
            value={lesionAssessment.numberOfLesions}
            onChange={(value) => handleChange('numberOfLesions', value)}
            options={[
              { value: '', label: 'Select number...' },
              { value: '1-2', label: '1-2 lesions' },
              { value: '3-5', label: '3-5 lesions' },
              { value: '>5', label: 'More than 5 lesions' },
            ]}
          />
        </div>
      </div>

      {/* Affected Areas */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Affected Areas <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {affectedAreaOptions.map((area) => (
            <Checkbox
              key={area}
              label={area}
              checked={lesionAssessment.affectedAreas.includes(area)}
              onChange={(checked) => handleAffectedAreasChange(area, checked)}
            />
          ))}
        </div>
      </div>

      {/* Near Eyes */}
      <div>
        <Checkbox
          label="Lesions near or around the eyes"
          checked={lesionAssessment.nearEyes}
          onChange={(checked) => handleChange('nearEyes', checked)}
          description="This may require referral to GP due to ocular involvement risk"
        />
      </div>

      {/* Crusting */}
      <div>
        <Checkbox
          label="Honey-coloured crusting present"
          checked={lesionAssessment.crusting}
          onChange={(checked) => handleChange('crusting', checked)}
          description="Classic sign of non-bullous impetigo"
        />
      </div>

      {/* Spreading */}
      <div>
        <Checkbox
          label="Lesions spreading or new lesions appearing"
          checked={lesionAssessment.spreading}
          onChange={(checked) => handleChange('spreading', checked)}
          description="Indicates active infection; closely monitor treatment response"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Duration of Lesions <span className="text-red-500">*</span>
        </label>
        <div className="w-full">
          <SelectInput
            label="Duration of Lesions"
            value={lesionAssessment.duration}
            onChange={(value) => handleChange('duration', value)}
            options={[
              { value: '', label: 'Select duration...' },
              { value: '<48hrs', label: 'Less than 48 hours' },
              { value: '2-7 days', label: '2-7 days' },
              { value: '>7 days', label: 'More than 7 days' },
            ]}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">Helps assess disease stage and treatment urgency.</p>
      </div>

      {/* Additional Notes */}
      <div>
        <TextArea
          label="Additional Clinical Notes"
          value={lesionAssessment.additionalNotes}
          onChange={(value) => handleChange('additionalNotes', value)}
          placeholder="E.g., patient reports fever, recent trauma, associated lymphadenopathy..."
          rows={3}
        />
      </div>
    </div>
  );
}
