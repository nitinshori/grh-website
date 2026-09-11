'use client';

import { ImpetigoCounselling, ImpetigoTreatmentSelection } from './impetigo-types';
import { Checkbox } from '../shared/components/FormInputs';

interface CounsellingStepProps {
  counselling: ImpetigoCounselling;
  treatment: ImpetigoTreatmentSelection['treatment'];
  onChange: (counselling: ImpetigoCounselling) => void;
}

export function drugSpecificAdviceLabel(treatment: ImpetigoTreatmentSelection['treatment']): string {
  switch (treatment) {
    case 'fusidic-acid':
      return 'Fusidic acid: apply a thin layer three times a day for 5 days, washing hands before and after. Do not use it for longer than the course, and do not keep the tube for next time. Return any unused cream to a pharmacy.';
    case 'hydrogen-peroxide':
      return 'Hydrogen peroxide 1%: apply two or three times a day for 5 days. Come back if there is no improvement after 48 hours.';
    case 'flucloxacillin':
      return 'Flucloxacillin: four times a day, on an empty stomach, an hour before food or two hours after. Finish the course even if the skin looks better. Come back for yellowing of the skin or eyes, dark urine or pale stools, even weeks after finishing. Seek advice for severe or bloody diarrhoea.';
    case 'clarithromycin':
      return 'Clarithromycin: twice a day for 5 days; finish the course. A metallic or bitter taste is common and settles when you stop. Come back for severe or bloody diarrhoea, a rash that blisters or peels, or yellowing of the skin or eyes.';
    case 'erythromycin':
      return 'Erythromycin: four times a day for 5 days; finish the course. Come back for severe or bloody diarrhoea, a rash that blisters or peels, or yellowing of the skin or eyes.';
    default:
      return 'Medicine-specific advice from the PGD counselling row given for the product supplied.';
  }
}

export function CounsellingStep({ counselling, treatment, onChange }: CounsellingStepProps) {
  const handleChange = (field: keyof ImpetigoCounselling, value: unknown) => {
    onChange({
      ...counselling,
      [field]: value,
    });
  };

  const isTopical = treatment === 'fusidic-acid' || treatment === 'hydrogen-peroxide';

  const counsellingItems: Array<{ field: keyof ImpetigoCounselling; label: string; advice: string }> = [
    {
      field: 'hygieneAdvice',
      label: 'Hygiene advice: do not share towels, flannels or bedding until the lesions have crusted over or healed',
      advice: 'Impetigo is contagious. Give the hygiene advice in writing.',
    },
    {
      field: 'handwashing',
      label: 'Wash hands after touching the lesions and after applying any cream',
      advice: 'Emphasise thorough hand washing, especially after contact with lesions',
    },
    {
      field: 'schoolExclusion',
      label: 'Stay away from school or nursery until the lesions are crusted and dry, or for 48 hours after starting an antibiotic',
      advice: 'Treatment limits spread and hastens recovery',
    },
    {
      field: 'avoidTouching',
      label: 'Keep the lesions covered where practical, discourage picking or scratching, and keep fingernails short',
      advice: 'Touching lesions spreads infection to other areas of the body and to other people',
    },
    {
      field: 'noCombination',
      label: 'Told that topical and oral treatment are not combined',
      advice: 'NICE is explicit on this and it is a common error. Record that the patient was told.',
    },
    {
      field: 'drugSpecificAdvice',
      label: drugSpecificAdviceLabel(treatment),
      advice: 'From the counselling row of the arm supplied.',
    },
    {
      field: 'completeCourse',
      label: 'Complete the course, even if improving',
      advice: 'Incomplete courses risk relapse and antibiotic resistance. One course per episode.',
    },
    {
      field: 'applicationAdvice',
      label: 'Application technique for topical treatment: cover the lesion and about 1cm of surrounding skin; avoid contact with the eyes (rinse with water if it occurs); do not apply to large areas',
      advice: 'Wash the area gently, pat dry, then apply thinly with clean hands',
    },
    {
      field: 'returnIfWorsening',
      label: isTopical
        ? 'Come back if there is no improvement after 48 hours, if the lesions spread, or if you feel unwell'
        : 'Come back if there is no improvement after 48 to 72 hours, if the lesions spread, or if you or your child becomes unwell',
      advice: 'Seek medical help if symptoms worsen rapidly or significantly at any time, or have not improved after completing a course. Treatment failure needs a swab, not a second course.',
    },
    {
      field: 'contagionPeriod',
      label: 'Infection is contagious until the lesions have crusted and dried, or 48 hours after starting an antibiotic',
      advice: 'Advise the patient, and parents or carers, that this is a contagious infection',
    },
  ];

  const shownItems = isTopical
    ? counsellingItems
    : counsellingItems.filter((i) => i.field !== 'applicationAdvice');

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <p className="text-sm text-blue-900">
          Review each counselling point with the patient. Mark each item as discussed. Supply the patient information leaflet and the hygiene advice in writing.
        </p>
      </div>

      <div className="space-y-4">
        {shownItems.map((item) => (
          <div key={item.field} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
            <Checkbox
              label={item.label}
              checked={counselling[item.field]}
              onChange={(checked) => handleChange(item.field, checked)}
            />
            <p className="text-sm text-gray-600 mt-2 ml-6">{item.advice}</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded p-4 mt-8">
        <h3 className="font-semibold text-green-900 mb-2">Counselling Summary</h3>
        <div className="text-sm text-green-800 space-y-1">
          {Object.entries(counselling).map(([key, value]) => {
            if (value === true) {
              const item = counsellingItems.find((c) => c.field === (key as keyof ImpetigoCounselling));
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{item?.label || key}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
        {Object.values(counselling).filter((v) => v === true).length === 0 && (
          <p className="text-sm text-green-700">No items marked as discussed yet</p>
        )}
      </div>
    </div>
  );
}
