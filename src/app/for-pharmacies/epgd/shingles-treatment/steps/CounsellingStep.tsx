'use client';

import React from 'react';
import { Checkbox } from '../../shared/components/FormInputs';
import { StepWrapper } from '../../shared/components/StepWrapper';
import { ShinglesCounselling } from '../shingles-types';
import { validateCounsellingStep } from '../shingles-clinical-logic';

interface CounsellingStepProps {
  counselling: ShinglesCounselling;
  onChange: (counselling: ShinglesCounselling) => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export const CounsellingStep: React.FC<CounsellingStepProps> = ({
  counselling,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
}) => {
  const validationError = validateCounsellingStep(counselling);

  const handleChange = (field: keyof ShinglesCounselling, value: boolean) => {
    onChange({ ...counselling, [field]: value });
  };

  const allConfirmed =
    counselling.completeCourse &&
    counselling.painManagement &&
    counselling.rashCare &&
    counselling.contagiousPeriod &&
    counselling.pregnancyExposure &&
    counselling.PHNRisk &&
    counselling.returnIfWorsening &&
    counselling.vaccinationAdvice;

  return (
    <StepWrapper
      title="Counselling"
      description="Confirm patient counselling on antiviral use and self-care"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!validationError}
      validationError={validationError}
    >
      <div className="space-y-6">
        {/* Medicine Counselling */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Antiviral Medicine Counselling</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-blue-500 p-3 rounded">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Complete the Full Course</h4>
              <p className="text-sm text-gray-700 mb-3">
                Patient must complete all tablets even if symptoms improve before finishing the course.
                Stopping early increases risk of prolonged pain and complications.
              </p>
              <Checkbox
                label="Counselled patient on completing full 7-day course"
                checked={counselling.completeCourse}
                onChange={(v) => handleChange('completeCourse', v)}
              />
            </div>

            <div className="bg-white border-l-4 border-blue-500 p-3 rounded">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Administration Instructions</h4>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Take with food or water if GI upset occurs</li>
                <li>Maintain adequate hydration (drink plenty of water)</li>
                <li>Do not exceed recommended dose</li>
                <li>Take at regular intervals throughout the day</li>
              </ul>
              <p className="text-sm text-gray-700 italic">
                (This is implicit in dispensing printed counselling/labels)
              </p>
            </div>
          </div>
        </div>

        {/* Pain Management */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-3">Pain Management Counselling</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-orange-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Patient should be advised on safe analgesia options alongside antiviral therapy:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li><strong>Paracetamol</strong> - up to 1g four times daily (4g max per day)</li>
                <li><strong>Ibuprofen</strong> - up to 400mg three times daily with food (check renal function)</li>
                <li><strong>Cool compresses</strong> - apply to rash to reduce pain and itching</li>
                <li><strong>Topical lidocaine</strong> - may be applied to affected area if needed</li>
              </ul>
              <Checkbox
                label="Counselled on pain management (paracetamol, ibuprofen, cool compresses)"
                checked={counselling.painManagement}
                onChange={(v) => handleChange('painManagement', v)}
              />
            </div>
          </div>
        </div>

        {/* Rash Care */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Rash Care Counselling</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-green-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Patient should be advised on self-care to prevent infection and reduce symptoms:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Keep rash clean and dry</li>
                <li>Wear loose cotton clothing to avoid irritation</li>
                <li>Do not scratch or pick at lesions (infection risk)</li>
                <li>Use non-adherent dressings if needed</li>
                <li>Calamine lotion or zinc oxide may soothe itching</li>
                <li>Avoid perfumed products on the rash area</li>
              </ul>
              <Checkbox
                label="Counselled on rash care (keep clean, loose clothing, calamine)"
                checked={counselling.rashCare}
                onChange={(v) => handleChange('rashCare', v)}
              />
            </div>
          </div>
        </div>

        {/* Contagiousness */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Contagiousness Period Counselling</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Patient is contagious (but only to those who have not had chickenpox):
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Infectious until all vesicles are completely crusted over (usually 7-10 days)</li>
                <li>Avoid contact with pregnant women who haven't had chickenpox (risk of chickenpox)</li>
                <li>Avoid contact with newborn babies and immunosuppressed individuals</li>
                <li>Avoid healthcare settings if possible until covered</li>
                <li>Antiviral therapy shortens contagious period</li>
              </ul>
              <Checkbox
                label="Counselled on contagious period (until crusted, avoid pregnant women/immunosuppressed/newborns)"
                checked={counselling.contagiousPeriod}
                onChange={(v) => handleChange('contagiousPeriod', v)}
              />
            </div>
          </div>
        </div>

        {/* Pregnancy Exposure Risk */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="font-semibold text-pink-900 mb-3">Pregnancy Exposure Risk Counselling</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-pink-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Shingles virus can cause chickenpox in exposed unvaccinated pregnant women:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Avoid close contact with pregnant women who have NOT had chickenpox</li>
                <li>Pregnant women exposed to shingles (unvaccinated) need urgent GP assessment</li>
                <li>Varicella-zoster immunoglobulin may be offered to exposed pregnant women</li>
                <li>Patient should not use shingles rash as excuse to avoid hygiene measures</li>
              </ul>
              <Checkbox
                label="Counselled on pregnancy exposure risk"
                checked={counselling.pregnancyExposure}
                onChange={(v) => handleChange('pregnancyExposure', v)}
              />
            </div>
          </div>
        </div>

        {/* Postherpetic Neuralgia Risk */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Postherpetic Neuralgia (PHN) Risk</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Postherpetic neuralgia (persistent pain after rash resolves) is a common complication:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li>Risk increases significantly with age (&gt;50 years)</li>
                <li>Early antiviral treatment (within 72 hours) reduces PHN risk</li>
                <li>Severe acute pain correlates with PHN risk</li>
                <li>PHN pain can persist for weeks to months after rash heals</li>
                <li>If PHN develops, GP should consider gabapentin, pregabalin, or topical lidocaine patches</li>
              </ul>
              <Checkbox
                label="Counselled on PHN risk and importance of early treatment"
                checked={counselling.PHNRisk}
                onChange={(v) => handleChange('PHNRisk', v)}
              />
            </div>
          </div>
        </div>

        {/* Red Flags - Return to GP */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Red Flags - Return to GP Immediately</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Patient should return to GP immediately if any of the following develop:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li><strong>Eye symptoms</strong> - pain, redness, vision changes (possible ocular zoster)</li>
                <li><strong>Facial weakness/drooping</strong> - possible Ramsay Hunt syndrome</li>
                <li><strong>Hearing loss or ear pain</strong> - possible Ramsay Hunt syndrome</li>
                <li><strong>Spreading rash</strong> - crosses midline or new areas (possible dissemination)</li>
                <li><strong>Fever</strong> - especially if high or persistent</li>
                <li><strong>Severe headache</strong> - rule out CNS involvement</li>
                <li><strong>Confusion or altered mental state</strong> - possible encephalitis</li>
                <li><strong>Inability to urinate</strong> - possible urinary retention (sacral involvement)</li>
                <li><strong>Worsening pain despite treatment</strong></li>
              </ul>
              <Checkbox
                label="Counselled on red flags requiring urgent GP review"
                checked={counselling.returnIfWorsening}
                onChange={(v) => handleChange('returnIfWorsening', v)}
              />
            </div>
          </div>
        </div>

        {/* Vaccination Advice */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="font-semibold text-cyan-900 mb-3">Post-Recovery Vaccination Advice</h3>

          <div className="space-y-4">
            <div className="bg-white border-l-4 border-cyan-500 p-3 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Vaccination after recovery from shingles is important:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mb-3 space-y-1">
                <li><strong>Shingrix</strong> (recombinant zoster vaccine) is now recommended for all adults aged 50+</li>
                <li>Two doses given 2-6 months apart</li>
                <li>Should be offered after rash has completely healed</li>
                <li>Efficacy &gt;90% for preventing recurrent shingles and PHN</li>
                <li>Patient should discuss with GP about Shingrix vaccination</li>
              </ul>
              <Checkbox
                label="Counselled on Shingrix vaccination after recovery"
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
            {allConfirmed ? '✓ Counselling Complete' : '⏳ Counselling In Progress'}
          </h3>
          <p className={`text-sm ${
            allConfirmed
              ? 'text-green-800'
              : 'text-yellow-800'
          }`}>
            {allConfirmed
              ? 'All counselling items confirmed. Ready to proceed to summary.'
              : 'Please confirm all counselling items before proceeding.'}
          </p>
        </div>
      </div>
    </StepWrapper>
  );
};
