'use client';

import React from 'react';
import { Checkbox, SelectInput, TextArea, TextInput } from '../../shared/components/FormInputs';
import { ShinglesMedicalHistory } from '../shingles-types';

interface MedicalHistoryStepProps {
  medicalHistory: ShinglesMedicalHistory;
  onChange: (history: ShinglesMedicalHistory) => void;
}

export const MedicalHistoryStep: React.FC<MedicalHistoryStepProps> = ({
  medicalHistory,
  onChange,
}) => {

  const handleChange = <K extends keyof ShinglesMedicalHistory>(
    field: K,
    value: ShinglesMedicalHistory[K]
  ) => {
    onChange({ ...medicalHistory, [field]: value });
  };

  const needsSeverity = medicalHistory.immunosuppressed || medicalHistory.hivPositive;

  return (
    <>
      <div className="space-y-6">
        {/* Immunosuppression - CRITICAL */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-1">Immunosuppression status (Green Book chapter 28a)</h3>
          <p className="text-xs text-red-800 mb-3">
            Severe immunosuppression is excluded (refer for intravenous aciclovir or specialist advice).
            Non-severe (mild or moderate) immunosuppression may be treated with valaciclovir or famciclovir, not aciclovir.
          </p>

          <div className="space-y-3">
            <Checkbox
              label="Patient is immunosuppressed (immunosuppressive medicines, high-dose steroids, biologics, immunodeficiency)"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) => handleChange('immunosuppressed', v)}
            />

            {medicalHistory.immunosuppressed && (
              <TextArea
                label="Details of immunosuppression"
                value={medicalHistory.immunosuppressedDetails}
                onChange={(v) => handleChange('immunosuppressedDetails', v)}
                placeholder="e.g. methotrexate 15 mg weekly for rheumatoid arthritis; prednisolone 10 mg daily..."
                required
                rows={3}
              />
            )}

            <Checkbox
              label="HIV positive"
              checked={medicalHistory.hivPositive}
              onChange={(v) => handleChange('hivPositive', v)}
              description="Severe if CD4 count below 200; otherwise classify as non-severe."
            />

            {needsSeverity && (
              <SelectInput
                label="Severity of immunosuppression (Green Book chapter 28a)"
                value={medicalHistory.immunosuppressionSeverity}
                onChange={(v) =>
                  handleChange(
                    'immunosuppressionSeverity',
                    v as ShinglesMedicalHistory['immunosuppressionSeverity']
                  )
                }
                options={[
                  { value: 'non-severe', label: 'Non-severe (mild or moderate): valaciclovir or famciclovir only' },
                  { value: 'severe', label: 'Severe as defined in Green Book chapter 28a: EXCLUDED, refer' },
                ]}
                required
              />
            )}

            <Checkbox
              label="Active cancer: chemotherapy, radiotherapy or immunotherapy now or within the last 6 months, or leukaemia or lymphoma"
              checked={medicalHistory.cancerActive}
              onChange={(v) => handleChange('cancerActive', v)}
              description="Severe immunosuppression: excluded."
            />

            <Checkbox
              label="Solid organ transplant on immunosuppressive therapy, or bone marrow / stem cell transplant"
              checked={medicalHistory.organTransplant}
              onChange={(v) => handleChange('organTransplant', v)}
              description="Severe immunosuppression: excluded."
            />
          </div>
        </div>

        {/* Pregnancy & Lactation */}
        <div className="bg-pink-50 border border-pink-300 rounded-lg p-4">
          <h3 className="font-semibold text-pink-900 mb-3">Pregnancy and breastfeeding</h3>

          <div className="space-y-3">
            <Checkbox
              label="Pregnancy, known or suspected"
              checked={medicalHistory.pregnant}
              onChange={(v) => handleChange('pregnant', v)}
              description="Excluded: refer to a prescriber."
            />

            <Checkbox
              label="Patient is breastfeeding"
              checked={medicalHistory.breastfeeding}
              onChange={(v) => handleChange('breastfeeding', v)}
              description="Excluded: refer to a prescriber. NICE CKS advises specialist advice before antiviral treatment in a breastfeeding woman."
            />
          </div>
        </div>

        {/* Renal & Hepatic Function */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-1">Renal and hepatic function</h3>
          <p className="text-xs text-yellow-900 mb-3">
            The PGD does not operate a renal dosing ladder. Aciclovir: not below eGFR 30. Valaciclovir and famciclovir: not below eGFR 60. Below the threshold, refer. Where renal function is unknown and the patient is elderly (65 or over) or has risk factors, refer rather than assume.
          </p>

          <div className="space-y-4">
            <div>
              <SelectInput
                label="Renal function (eGFR, mL/min/1.73m2)"
                value={medicalHistory.renalImpairment}
                onChange={(v) => handleChange('renalImpairment', v as ShinglesMedicalHistory['renalImpairment'])}
                options={[
                  { value: 'unknown', label: 'Not known / not established' },
                  { value: 'none', label: 'eGFR 60 or above' },
                  { value: 'moderate', label: 'eGFR 30 to 59 (aciclovir only)' },
                  { value: 'severe', label: 'eGFR below 30 (EXCLUDED, refer)' },
                ]}
                required
              />
            </div>

            <TextInput
              label="How renal function was established"
              value={medicalHistory.renalFunctionSource}
              onChange={(v) => handleChange('renalFunctionSource', v)}
              placeholder="e.g. eGFR 78 on 3 Aug 2026 from GP summary record; patient report; not available"
              required
            />

            <div>
              <SelectInput
                label="Hepatic impairment"
                value={medicalHistory.hepaticImpairment}
                onChange={(v) => handleChange('hepaticImpairment', v as ShinglesMedicalHistory['hepaticImpairment'])}
                options={[
                  { value: 'none', label: 'None / normal' },
                  { value: 'mild-moderate', label: 'Mild to moderate (caution)' },
                  { value: 'severe', label: 'Severe (EXCLUDED, refer)' },
                ]}
                required
              />
              {medicalHistory.hepaticImpairment === 'severe' && (
                <p className="text-sm text-red-700 mt-2 bg-red-100 p-2 rounded">
                  Severe hepatic impairment: refer to a prescriber.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Exclusion criteria (any of these: refer, do not supply)</h3>
          <div className="space-y-3">
            <Checkbox
              label="Known hypersensitivity to aciclovir or valaciclovir (cross-reactive)"
              checked={medicalHistory.allergyAciclovirValaciclovir}
              onChange={(v) => handleChange('allergyAciclovirValaciclovir', v)}
            />
            <Checkbox
              label="Known hypersensitivity to famciclovir or penciclovir (cross-reactive)"
              checked={medicalHistory.allergyFamciclovirPenciclovir}
              onChange={(v) => handleChange('allergyFamciclovirPenciclovir', v)}
            />
            <Checkbox
              label="Any previous DRESS reaction to valaciclovir or famciclovir"
              checked={medicalHistory.previousDress}
              onChange={(v) => handleChange('previousDress', v)}
              description="These must never be restarted."
            />
            <Checkbox
              label="Taking ciclosporin, tacrolimus, mycophenolate, aminophylline or theophylline"
              checked={medicalHistory.excludedInteractingMedicines}
              onChange={(v) => handleChange('excludedInteractingMedicines', v)}
              description="Refer to a prescriber."
            />
            <Checkbox
              label="Unable to swallow or absorb oral medication"
              checked={medicalHistory.unableToSwallowOrAbsorb}
              onChange={(v) => handleChange('unableToSwallowOrAbsorb', v)}
            />
            <Checkbox
              label="Current long-term prophylactic treatment with the same class of antiviral"
              checked={medicalHistory.onAntiviralProphylaxis}
              onChange={(v) => handleChange('onAntiviralProphylaxis', v)}
            />
            <Checkbox
              label="Any underlying neurological condition"
              checked={medicalHistory.neurologicalCondition}
              onChange={(v) => handleChange('neurologicalCondition', v)}
            />
            <Checkbox
              label="Unable to maintain adequate fluid intake, or at risk of dehydration"
              checked={medicalHistory.dehydrationRisk}
              onChange={(v) => handleChange('dehydrationRisk', v)}
            />
            <Checkbox
              label="Failure to respond to antiviral treatment already given for this episode"
              checked={medicalHistory.failedAntiviralThisEpisode}
              onChange={(v) => handleChange('failedAntiviralThisEpisode', v)}
            />
          </div>
        </div>

        {/* Cautions */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-3">Cautions (supply may proceed with the stated advice)</h3>
          <div className="space-y-3">
            <Checkbox
              label="Other nephrotoxic medicines: ACE inhibitor, angiotensin receptor blocker, diuretic, NSAID, metformin, aminoglycoside or methotrexate"
              checked={medicalHistory.nephrotoxicMedicines}
              onChange={(v) => handleChange('nephrotoxicMedicines', v)}
              description="Counsel firmly on maintaining fluid intake."
            />
            <Checkbox
              label="Tenofovir"
              checked={medicalHistory.tenofovir}
              onChange={(v) => handleChange('tenofovir', v)}
              description="Advise the patient to contact the prescriber of their tenofovir about additional renal monitoring."
            />
            <Checkbox
              label="Probenecid or cimetidine"
              checked={medicalHistory.probenecidOrCimetidine}
              onChange={(v) => handleChange('probenecidOrCimetidine', v)}
              description="Reduce renal clearance of aciclovir and valaciclovir; matters more where renal function is already reduced."
            />
            <Checkbox
              label="Raloxifene"
              checked={medicalHistory.raloxifene}
              onChange={(v) => handleChange('raloxifene', v)}
              description="Reduces conversion of famciclovir to its active form. Monitor the clinical response if famciclovir is chosen."
            />
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
                NICE CKS: refer or seek specialist advice if a person thought to be immunocompetent has had two episodes of shingles, or if shingles recurs in an immunocompromised person.
              </p>
            )}
          </div>
        </div>

        {/* Current Medications & Allergies */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Allergies</h3>

          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Current medications are listed on the next step (Medications), where the full list is required.
            </p>

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
    </>
  );
};
