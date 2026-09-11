'use client';

import { ImpetigoLesionAssessment } from './impetigo-types';
import { SelectInput, Checkbox, TextArea, TextInput } from '../shared/components/FormInputs';

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

  const localisedNonBullous =
    lesionAssessment.lesionType === 'non-bullous' &&
    lesionAssessment.extent === 'localised' &&
    !lesionAssessment.topicalFailed &&
    !lesionAssessment.brokenSkin;

  return (
    <div className="space-y-6">
      {/* Refer first: systemically unwell or cellulitis (Appendix 1, step 1) */}
      <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded space-y-3">
        <p className="text-sm font-medium text-red-900">Refer, do not supply, where any of the following applies</p>
        <Checkbox
          label="Systemically unwell: fever, malaise, lymphadenopathy, or the patient appearing unwell (refer the same day)"
          checked={lesionAssessment.systemicallyUnwell}
          onChange={(checked) => handleChange('systemicallyUnwell', checked)}
        />
        <Checkbox
          label="Signs of a more serious condition, in particular cellulitis: spreading redness, warmth, swelling, or pain beyond the lesions (refer to hospital)"
          checked={lesionAssessment.cellulitisSigns}
          onChange={(checked) => handleChange('cellulitisSigns', checked)}
        />
        <Checkbox
          label="Diagnostic uncertainty, or a presentation that could be herpes simplex, eczema herpeticum, or a fungal infection"
          checked={lesionAssessment.diagnosticUncertainty}
          onChange={(checked) => handleChange('diagnosticUncertainty', checked)}
        />
        <Checkbox
          label="Around the eye, or involving the eyelid margin"
          checked={lesionAssessment.nearEyes}
          onChange={(checked) => handleChange('nearEyes', checked)}
          description="A topical product cannot be used safely and an ophthalmic opinion may be needed. Refer."
        />
      </div>

      {/* Lesion Type */}
      <div>
        <SelectInput
          label="Type of impetigo"
          value={lesionAssessment.lesionType}
          onChange={(value) => handleChange('lesionType', value)}
          options={[
            { value: '', label: 'Select lesion type...' },
            { value: 'non-bullous', label: 'Non-bullous (thin-walled vesicles or pustules that rupture, golden-brown crust)' },
            { value: 'bullous', label: 'Bullous (fluid-filled vesicles and blisters, often over 1cm, thin flat yellow-brown crust)' },
          ]}
          required
        />
        <p className="text-xs text-gray-600 mt-1">
          Bullous impetigo always needs the oral route. Bullous impetigo in a baby is referred.
        </p>
      </div>

      {/* Extent */}
      <div>
        <SelectInput
          label="Extent"
          value={lesionAssessment.extent}
          onChange={(value) => handleChange('extent', value)}
          options={[
            { value: '', label: 'Select extent...' },
            { value: 'localised', label: 'Localised: typically fewer than 5 lesions, or confined to an area under about 5cm' },
            { value: 'widespread', label: 'Widespread: more than about 5 lesions, or covering more than about 5cm' },
          ]}
          required
        />
        <p className="text-xs text-gray-600 mt-1">
          Which arm applies turns on this. Localised non-bullous: topical. Widespread or bullous: oral. Record the number and size of lesions that led to the conclusion.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <SelectInput
          label="Number of lesions"
          value={lesionAssessment.numberOfLesions}
          onChange={(value) => handleChange('numberOfLesions', value)}
          options={[
            { value: '', label: 'Select number...' },
            { value: '1-2', label: '1 to 2 lesions' },
            { value: '3-5', label: '3 to 5 lesions' },
            { value: '>5', label: 'More than 5 lesions (widespread)' },
          ]}
          required
        />
        <TextInput
          label="Size of the affected area (cm)"
          value={lesionAssessment.lesionSizeCm}
          onChange={(value) => handleChange('lesionSizeCm', value)}
          placeholder="e.g. 3 x 2"
          required
        />
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

      {/* Route modifiers */}
      <div className="space-y-3">
        <Checkbox
          label="Honey-coloured crusting present"
          checked={lesionAssessment.crusting}
          onChange={(checked) => handleChange('crusting', checked)}
          description="Classic sign of non-bullous impetigo"
        />
        <Checkbox
          label="Lesions spreading or new lesions appearing"
          checked={lesionAssessment.spreading}
          onChange={(checked) => handleChange('spreading', checked)}
          description="Reconsider whether the impetigo is still localised. Redness, warmth or pain spreading beyond the lesions is cellulitis: refer."
        />
        <Checkbox
          label="Extensively broken, deeply eroded or ulcerated skin"
          checked={lesionAssessment.brokenSkin}
          onChange={(checked) => handleChange('brokenSkin', checked)}
          description="The topical arm needs intact or only minimally broken skin. Extensively broken skin needs an oral arm or assessment."
        />
        <Checkbox
          label="Topical treatment has failed after 48 hours (hydrogen peroxide or a topical antibiotic)"
          checked={lesionAssessment.topicalFailed}
          onChange={(checked) => handleChange('topicalFailed', checked)}
          description="Treatment failure means an oral antibiotic or a swab, not a longer topical course. Do not combine a topical and an oral antibiotic."
        />
      </div>

      {localisedNonBullous && (
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
          <SelectInput
            label="Hydrogen peroxide 1% cream (NICE initial option for localised non-bullous impetigo; a P sale, not a PGD supply)"
            value={lesionAssessment.hydrogenPeroxide}
            onChange={(value) => handleChange('hydrogenPeroxide', value)}
            options={[
              { value: '', label: 'Select...' },
              { value: 'offered-p-sale', label: 'Offered as a P sale first (record that you did); fusidic acid not supplied' },
              { value: 'unsuitable', label: 'Unsuitable (for example around the eyes): fusidic acid 2% cream under this PGD' },
              { value: 'ineffective', label: 'Already tried and ineffective: fusidic acid 2% cream under this PGD' },
            ]}
            required
          />
          <p className="text-xs text-blue-900 mt-1">
            Offer hydrogen peroxide 1% as a P sale first where it is appropriate, and record that you did. Fusidic acid is reserved for where it is unsuitable or ineffective.
          </p>
        </div>
      )}

      {/* Duration */}
      <div>
        <SelectInput
          label="Duration of lesions"
          value={lesionAssessment.duration}
          onChange={(value) => handleChange('duration', value)}
          options={[
            { value: '', label: 'Select duration...' },
            { value: '<48hrs', label: 'Less than 48 hours' },
            { value: '2-7 days', label: '2 to 7 days' },
            { value: '>7 days', label: 'More than 7 days' },
          ]}
          required
        />
      </div>

      {/* Additional Notes */}
      <div>
        <TextArea
          label="Additional Clinical Notes"
          value={lesionAssessment.additionalNotes}
          onChange={(value) => handleChange('additionalNotes', value)}
          placeholder="E.g., recent trauma, previous topical treatment used, findings behind the localised or widespread conclusion..."
          rows={3}
        />
      </div>
    </div>
  );
}
