'use client';

import { ImpetigoCounselling } from './impetigo-types';
import { Checkbox } from '../shared/components/FormInputs';

interface CounsellingStepProps {
  counselling: ImpetigoCounselling;
  onChange: (counselling: ImpetigoCounselling) => void;
}

export function CounsellingStep({ counselling, onChange }: CounsellingStepProps) {
  const handleChange = (field: keyof ImpetigoCounselling, value: unknown) => {
    onChange({
      ...counselling,
      [field]: value,
    });
  };

  const counsellingItems: Array<{ field: keyof ImpetigoCounselling; label: string; advice: string }> = [
    {
      field: 'hygieneAdvice',
      label: 'Hygiene Advice - Do not share towels or flannels',
      advice: 'Explain the importance of not sharing personal items to prevent spread to other family members',
    },
    {
      field: 'handwashing',
      label: 'Hand Washing - Frequent hand washing with soap and water',
      advice: 'Emphasise thorough hand washing for 20 seconds, especially after contact with lesions',
    },
    {
      field: 'schoolExclusion',
      label: 'School/Work Exclusion - Do not attend until 48 hours post-treatment or lesions crusted over',
      advice: 'Patient should avoid close contact with others for 48 hours from starting treatment, or until lesions are crusted',
    },
    {
      field: 'avoidTouching',
      label: 'Avoid Touching/Scratching - Do not pick, scratch or squeeze lesions',
      advice: 'Touching lesions can spread infection and increase risk of scarring. Trim nails short if needed',
    },
    {
      field: 'completeCourse',
      label: 'Complete Course - Finish full course of antibiotics even if improving',
      advice: 'Particularly important for oral antibiotics. Incomplete courses risk relapse and antibiotic resistance',
    },
    {
      field: 'applicationAdvice',
      label: 'Application Technique - For topical treatments, apply thinly to affected area after gentle cleaning',
      advice: 'Wash area gently with soap and water, pat dry, then apply cream thinly. Use clean hands or applicator',
    },
    {
      field: 'returnIfWorsening',
      label: 'Return If Worsening - Seek advice if spreading, not improving in 48hrs, or systemic symptoms develop',
      advice: 'Red flags: spreading rapidly despite treatment, fever, malaise, signs of cellulitis or abscess formation',
    },
    {
      field: 'contagionPeriod',
      label: 'Contagion Period - Infection is contagious until 48 hours after starting effective treatment',
      advice: 'Advise patient this is a contagious infection. They can return to school/work after 48 hours of treatment or once lesions crusted',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <p className="text-sm text-blue-900">
          Review each counselling point with the patient. Mark each item as discussed.
        </p>
      </div>

      <div className="space-y-4">
        {counsellingItems.map((item) => (
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
