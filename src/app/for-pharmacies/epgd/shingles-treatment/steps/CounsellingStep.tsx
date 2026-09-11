'use client';

import React from 'react';
import { Checkbox } from '../../shared/components/FormInputs';
import { ShinglesCounselling } from '../shingles-types';
import { validateCounsellingStep } from '../shingles-clinical-logic';

interface CounsellingStepProps {
  counselling: ShinglesCounselling;
  onChange: (counselling: ShinglesCounselling) => void;
}

export const CounsellingStep: React.FC<CounsellingStepProps> = ({
  counselling,
  onChange,
}) => {

  const handleChange = (field: keyof ShinglesCounselling, value: boolean) => {
    onChange({ ...counselling, [field]: value });
  };

  const allConfirmed = validateCounsellingStep(counselling) === null;

  return (
    <>
      <div className="space-y-6">
        {/* Medicine Counselling */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Antiviral Medicine Counselling</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-blue-500 p-3 rounded">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Complete the full course</h4>
              <p className="text-sm text-gray-700 mb-3">
                The patient must complete the course even if symptoms improve. Antivirals reduce the severity and duration of the episode but do not cure it instantly, and some pain may persist.
              </p>
              <Checkbox
                label="Counselled patient on completing the full course"
                checked={counselling.completeCourse}
                onChange={(v) => handleChange('completeCourse', v)}
              />
            </div>

            <div className="bg-white border-l-4 border-blue-500 p-3 rounded">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Patient information leaflet and dosing schedule</h4>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Give the patient the manufacturer&apos;s patient information leaflet</li>
                <li>Explain the dosing schedule clearly; for aciclovir, five doses a day is demanding and the course will not work well if doses are missed</li>
                <li>Antivirals reduce the severity and duration of the episode but do not cure it instantly</li>
                <li>Return any unused medicine to a pharmacy for disposal</li>
              </ul>
              <Checkbox
                label="Leaflet given, dosing schedule explained, and return of unused medicine advised"
                checked={counselling.leafletAndDosing}
                onChange={(v) => handleChange('leafletAndDosing', v)}
              />
            </div>

            <div className="bg-white border-l-4 border-blue-500 p-3 rounded">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Fluid intake</h4>
              <p className="text-sm text-gray-700 mb-3">
                Maintain a good fluid intake throughout the course, particularly if elderly. Counsel firmly where the patient takes other nephrotoxic medicines.
              </p>
              <Checkbox
                label="Counselled on maintaining a good fluid intake throughout the course"
                checked={counselling.hydration}
                onChange={(v) => handleChange('hydration', v)}
              />
            </div>
          </div>
        </div>

        {/* Pain Management */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-3">Pain</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-orange-500 p-3 rounded">
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>For mild pain, paracetamol alone or with codeine, or an NSAID such as ibuprofen, subject to the usual contraindications</li>
                <li>Refer urgently to a prescriber if pain is not controlled by over-the-counter analgesia</li>
              </ul>
              <Checkbox
                label="Counselled on pain management (paracetamol with or without codeine, or an NSAID) and when to seek help"
                checked={counselling.painManagement}
                onChange={(v) => handleChange('painManagement', v)}
              />
            </div>
          </div>
        </div>

        {/* Rash Care */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Infection control: practical advice</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-green-500 p-3 rounded">
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Cover weeping lesions that are not under clothing</li>
                <li>Keep the rash clean and dry</li>
                <li>Wear loose clothing</li>
                <li>Wash hands often; do not share towels or clothes</li>
                <li>Avoid topical creams and adhesive dressings</li>
                <li>Work, school and childcare need only be avoided while the rash is weeping and cannot be covered</li>
              </ul>
              <Checkbox
                label="Counselled on rash care (cover weeping lesions, keep clean and dry, loose clothing, hand washing, no topical creams or adhesive dressings)"
                checked={counselling.rashCare}
                onChange={(v) => handleChange('rashCare', v)}
              />
            </div>
          </div>
        </div>

        {/* Contagiousness */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Infection control: infectious period</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-red-500 p-3 rounded">
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>The patient can transmit chickenpox, not shingles, to someone who has never had chickenpox or the varicella vaccine</li>
                <li>Transmission is by direct contact with vesicle fluid</li>
                <li>They remain infectious until all the vesicles have crusted over, usually 5 to 7 days after the rash appears</li>
              </ul>
              <Checkbox
                label="Counselled on the infectious period (until all vesicles have crusted, usually 5 to 7 days) and how the virus spreads"
                checked={counselling.contagiousPeriod}
                onChange={(v) => handleChange('contagiousPeriod', v)}
              />
            </div>
          </div>
        </div>

        {/* At-risk contacts */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="font-semibold text-pink-900 mb-3">Infection control: people to avoid</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-pink-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Advise the patient specifically to avoid, until the rash has crusted over:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Pregnant women who have not had chickenpox</li>
                <li>Babies under one month old</li>
                <li>Anyone who is immunosuppressed</li>
              </ul>
              <Checkbox
                label="Counselled to avoid pregnant women who have not had chickenpox, babies under one month, and immunosuppressed people"
                checked={counselling.pregnancyExposure}
                onChange={(v) => handleChange('pregnancyExposure', v)}
              />
            </div>
          </div>
        </div>

        {/* Postherpetic Neuralgia Risk */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Post-herpetic neuralgia</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Pain persisting after the rash heals, more common with increasing age</li>
                <li>It is managed with neuropathic pain treatments that require a prescription, so the patient should see their GP if pain persists</li>
              </ul>
              <Checkbox
                label="Explained post-herpetic neuralgia and to see the GP if pain persists after the rash heals"
                checked={counselling.PHNRisk}
                onChange={(v) => handleChange('PHNRisk', v)}
              />
            </div>
          </div>
        </div>

        {/* Safety netting */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Safety netting</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">Seek medical advice:</p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>If the shingles has not resolved within 4 weeks</li>
                <li>If symptoms worsen significantly at any point, or do not improve after finishing the course</li>
                <li>If new vesicles are still appearing after 7 days of treatment</li>
                <li>For any new eye symptom, however minor</li>
                <li>If pain is not controlled</li>
                <li><strong>Call 999 or go to A&amp;E</strong> for signs of sepsis, confusion, neck stiffness, weakness, or loss of bladder or bowel control</li>
              </ul>
              <Checkbox
                label="Safety netting advice given (4 weeks, worsening, new vesicles after 7 days, eye symptoms, uncontrolled pain, 999 signs)"
                checked={counselling.returnIfWorsening}
                onChange={(v) => handleChange('returnIfWorsening', v)}
              />
            </div>
          </div>
        </div>

        {/* Vaccination Advice */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="font-semibold text-cyan-900 mb-3">Shingles vaccine</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-cyan-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Once recovered, discuss the shingles vaccine with the GP practice. This is separate from treatment and is covered by a different PGD. The shingles vaccine is not a treatment for shingles or post-herpetic neuralgia.
              </p>
              <Checkbox
                label="Advised to discuss the shingles vaccine with the GP practice once recovered"
                checked={counselling.vaccinationAdvice}
                onChange={(v) => handleChange('vaccinationAdvice', v)}
              />
            </div>
          </div>
        </div>

        {/* Completion Status */}
        <div className={`border-2 rounded-lg p-4 ${
          allConfirmed
            ? 'bg-green-50 border-green-300'
            : 'bg-yellow-50 border-yellow-300'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            allConfirmed
              ? 'text-green-900'
              : 'text-yellow-900'
          }`}>
            {allConfirmed ? 'Counselling complete' : 'Counselling in progress'}
          </h3>
          <p className={`text-sm ${
            allConfirmed
              ? 'text-green-800'
              : 'text-yellow-800'
          }`}>
            {allConfirmed
              ? 'All counselling items confirmed and recorded. Ready to proceed to summary.'
              : 'Please confirm all counselling items before proceeding.'}
          </p>
        </div>
      </div>
    </>
  );
};
