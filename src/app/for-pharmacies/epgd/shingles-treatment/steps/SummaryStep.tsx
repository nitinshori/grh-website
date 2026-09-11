'use client';

import React from 'react';
import { Checkbox, TextInput } from '../../shared/components/FormInputs';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';
import { ShinglesSummary } from '../shingles-types';
import { ClinicalAlert } from '../../shared/types';
import { calculateAge } from '../../shared/types';
import { getTreatmentWindow, describeTreatmentWindow } from '../shingles-clinical-logic';

const PGD_VERSION_LINE = 'Shingles (Herpes Zoster) Treatment PGD, version 005, issued 11 September 2026';

interface SummaryStepProps {
  summary: ShinglesSummary;
  alerts: ClinicalAlert[];
  /** Pharmacist declaration tick, held by the page so the single StepWrapper can gate Save & Print on it. */
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  onPharmacistNameChange: (v: string) => void;
  onPharmacistGPhCChange: (v: string) => void;
}

/**
 * Summary step content. The page renders this inside the single StepWrapper,
 * whose Save & Print button saves the record and prints this page; the step
 * no longer has its own print button or its own StepWrapper.
 */
export const SummaryStep: React.FC<SummaryStepProps> = ({
  summary,
  alerts,
  agreed,
  onAgreedChange,
  onPharmacistNameChange,
  onPharmacistGPhCChange,
}) => {
  const age = calculateAge(summary.patientDetails.dateOfBirth);
  const treatmentWindow = getTreatmentWindow(summary.symptoms, age);
  const hasStop = alerts.some((a) => a.severity === 'stop');
  const redFlagsAbsent =
    !summary.symptoms.eyeSymptoms &&
    !summary.symptoms.earOrFacialSymptoms &&
    !summary.symptoms.meningitisSigns &&
    !summary.symptoms.encephalitisSigns &&
    !summary.symptoms.myelitisSigns &&
    !summary.symptoms.sepsisSigns &&
    !summary.symptoms.systemicallyUnwell &&
    !summary.symptoms.painUncontrolledByOtc &&
    summary.symptoms.unilateral === 'yes';
  const counsellingItems: [string, boolean][] = [
    ['Complete the full course', summary.counselling.completeCourse],
    ['Leaflet given, dosing explained, return unused medicine', summary.counselling.leafletAndDosing],
    ['Maintain a good fluid intake', summary.counselling.hydration],
    ['Pain management and when to seek help', summary.counselling.painManagement],
    ['Rash care and infection control practical advice', summary.counselling.rashCare],
    ['Infectious until crusted (5 to 7 days)', summary.counselling.contagiousPeriod],
    ['Avoid non-immune pregnant women, babies under 1 month, immunosuppressed', summary.counselling.pregnancyExposure],
    ['Post-herpetic neuralgia explained', summary.counselling.PHNRisk],
    ['Safety netting including 999 signs', summary.counselling.returnIfWorsening],
    ['Discuss shingles vaccine with GP once recovered', summary.counselling.vaccinationAdvice],
  ];

  return (
    <div className="space-y-6">
      {/* Practitioner details: editable, prefilled from the profile (PGD records row: name of healthcare practitioner) */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 print:hidden">
        <h3 className="font-semibold text-gray-900 mb-3">Practitioner details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput
            label="Pharmacist name"
            value={summary.pharmacistName}
            onChange={onPharmacistNameChange}
            placeholder="Full name"
            required
          />
          <TextInput
            label="GPhC registration number"
            value={summary.pharmacistGPhC}
            onChange={onPharmacistGPhCChange}
            placeholder="e.g. 2123456"
            required
          />
        </div>
      </div>

      {/* PRINTABLE REPORT */}
      <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-6 print:bg-white print:border-none print:p-0">
        <div className="bg-white p-8 print:p-0">
          <div className="border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Shingles Acute Treatment ePGD</h1>
            <p className="text-gray-600">PGD Consultation Report</p>
            <p className="text-sm text-gray-500 mt-1">
              Date: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {hasStop ? 'Consultation under the' : 'Supplied under the'} {PGD_VERSION_LINE}.
            </p>
          </div>

          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-2 mb-6">
            <Row label="Name" value={`${summary.patientDetails.firstName} ${summary.patientDetails.lastName}`} />
            <Row label="Date of birth" value={summary.patientDetails.dateOfBirth} />
            <Row label="Age" value={age !== null ? `${age} years` : 'Not recorded'} />
            <Row label="Address" value={summary.patientDetails.address || 'Not provided'} />
            <Row label="GP practice" value={summary.patientDetails.gpPractice || 'Not provided'} />
            <Row label="Informed consent" value={summary.consent.informedConsentGiven ? 'Obtained' : 'Not recorded'} />
          </div>

          {alerts.length > 0 && (
            <>
              <SectionHeader>Clinical Alerts</SectionHeader>
              <AlertSummary alerts={alerts} />
            </>
          )}

          <SectionHeader>Presenting Symptoms</SectionHeader>
          <div className="space-y-2 mb-6">
            <Row
              label="Rash onset"
              value={`${summary.symptoms.rashOnsetDate}${summary.symptoms.rashOnsetTime ? ` at approximately ${summary.symptoms.rashOnsetTime}` : ' (time not recorded; counted in whole days)'}`}
            />
            <Row label="Hours since onset" value={summary.symptoms.hoursSinceOnset !== null ? `${summary.symptoms.hoursSinceOnset} hours` : 'N/A'} />
            <Row label="Treatment window" value={describeTreatmentWindow(treatmentWindow)} />
            <Row label="Rash stage" value={summary.symptoms.rashStage} />
            <Row label="Rash severity" value={summary.symptoms.rashSeverity || 'Not recorded'} />
            <Row label="New vesicles forming" value={summary.symptoms.newVesiclesForming ? 'Yes' : 'No'} />
            <Row label="Dermatome location" value={summary.symptoms.dermatome || 'Not recorded'} />
            <Row label="Pain score" value={`${summary.symptoms.painLevel}/10 (${summary.symptoms.painType})`} />
            <Row
              label="Unilateral, dermatomal, not crossing midline"
              value={summary.symptoms.unilateral === 'yes' ? 'Confirmed' : summary.symptoms.unilateral === 'no' ? 'NO: not dermatomal, refer' : 'NOT ANSWERED'}
            />
            <Row label="Red flags assessed and found absent" value={redFlagsAbsent ? 'Yes' : 'NO: red flag present, refer'} />
            <Row label="Ophthalmic involvement specifically excluded" value={summary.symptoms.ophthalmicExcluded ? 'Yes' : 'NOT RECORDED'} />
            <Row label="Rash description" value={summary.symptoms.rashDescription} />
          </div>

          <SectionHeader>Medical History</SectionHeader>
          <div className="space-y-2 mb-6">
            <Row
              label="Immunosuppressed"
              value={
                summary.medicalHistory.immunosuppressed
                  ? `Yes (${summary.medicalHistory.immunosuppressionSeverity || 'unclassified'}): ${summary.medicalHistory.immunosuppressedDetails}`
                  : 'No'
              }
            />
            <Row label="Pregnant (known or suspected)" value={summary.medicalHistory.pregnant ? 'Yes' : 'No'} />
            <Row
              label="Breastfeeding"
              value={
                summary.medicalHistory.breastfeeding
                  ? summary.medicalHistory.breastLesions
                    ? 'Yes, with lesions on the breast (excluded)'
                    : 'Yes, no lesions on the breast (caution)'
                  : 'No'
              }
            />
            <Row
              label="Renal function"
              value={
                summary.medicalHistory.renalImpairment === 'none'
                  ? 'eGFR 60 or above'
                  : summary.medicalHistory.renalImpairment === 'moderate'
                  ? 'eGFR 30 to 59'
                  : summary.medicalHistory.renalImpairment === 'severe'
                  ? 'eGFR below 30'
                  : 'Not established'
              }
            />
            <Row label="How renal function was established" value={summary.medicalHistory.renalFunctionSource || 'Not recorded'} />
            <Row label="Hepatic impairment" value={summary.medicalHistory.hepaticImpairment} />
            <Row label="HIV positive" value={summary.medicalHistory.hivPositive ? 'Yes' : 'No'} />
            <Row label="Previous shingles" value={summary.medicalHistory.previousShingles ? 'Yes' : 'No'} />
            <Row label="Active cancer" value={summary.medicalHistory.cancerActive ? 'Yes' : 'No'} />
            <Row label="Organ transplant" value={summary.medicalHistory.organTransplant ? 'Yes' : 'No'} />
            {summary.medicalHistory.currentMedications && (
              <Row label="Current medications" value={summary.medicalHistory.currentMedications} />
            )}
            {summary.medicalHistory.allergies && (
              <Row label="Allergies" value={summary.medicalHistory.allergies} />
            )}
          </div>

          {hasStop ? (
            <>
              <SectionHeader>Outcome</SectionHeader>
              <div className="space-y-2 mb-6">
                <Row label="Medicine" value="NOT SUPPLIED: exclusion criteria or red flags present (see clinical alerts above)" />
                <Row
                  label="Advice given"
                  value={summary.clinicalNotes || 'Referred as directed by the alerts above; advised on alternative options and how to access them; GP informed or referred as appropriate'}
                />
              </div>
            </>
          ) : (
            <>
              <SectionHeader>Medicine supplied under PGD</SectionHeader>
              <div className="space-y-2 mb-6">
                <Row label="Medicine" value={summary.medicineSelection.medicine} />
                <Row label="Brand / manufacturer" value={summary.medicineSelection.brand || 'Not recorded'} />
                <Row label="Batch number" value={summary.medicineSelection.batchNumber || 'Not recorded'} />
                <Row label="Dose" value={summary.medicineSelection.dose} />
                <Row label="Frequency" value={summary.medicineSelection.frequency} />
                <Row label="Duration" value={summary.medicineSelection.duration} />
                <Row label="Quantity" value={`${summary.medicineSelection.quantity} tablets`} />
                <Row label="Route" value="Oral" />
              </div>
            </>
          )}

          <SectionHeader>Patient Counselling Provided</SectionHeader>
          <CounsellingGrid items={counsellingItems} />

          {hasStop ? (
            <>
              <SectionHeader>Practitioner Declaration</SectionHeader>
              <p className="text-xs text-gray-600 mb-4">
                I confirm that this consultation was conducted in accordance with the Shingles (Herpes Zoster)
                Treatment Patient Group Direction, that an exclusion criterion or red flag applied, that no
                medicine was supplied, and that the patient was advised and referred as recorded above.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
                  <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                  <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                  <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                  <div className="border-b border-gray-300 min-h-[2rem]" />
                </div>
              </div>
            </>
          ) : (
            <PharmacistDeclaration
              pgdName="Shingles Acute Treatment"
              pharmacistName={summary.pharmacistName}
              pharmacistGPhC={summary.pharmacistGPhC}
              pharmacyName={summary.pharmacyName || ''}
            />
          )}

          <ReportFooter pgdName="Shingles Acute Treatment" />
        </div>
      </div>

      {/* Declaration tick, gates Save & Print */}
      {!hasStop && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 print:hidden">
          <Checkbox
            label="I confirm that the PGD medicine has been supplied to the patient at the PGD regimen above, with the counselling and safety netting recorded"
            checked={agreed}
            onChange={onAgreedChange}
            required
          />
        </div>
      )}

      {/* Safety netting and patient information, from the PGD */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
        <h3 className="font-semibold text-blue-900 mb-3">Safety netting and patient information (PGD v005)</h3>
        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
          <li>Give the patient the manufacturer&apos;s patient information leaflet.</li>
          <li>Explain the dosing schedule clearly and, for aciclovir, that five doses a day is demanding and the course will not work well if doses are missed.</li>
          <li>Seek medical advice if the shingles has not resolved within 4 weeks.</li>
          <li>Seek advice if symptoms worsen significantly at any point, or do not improve after finishing the course.</li>
          <li>Seek advice if new vesicles are still appearing after 7 days of treatment.</li>
          <li>Seek advice for any new eye symptom, however minor.</li>
          <li>Seek advice if pain is not controlled.</li>
          <li>Call 999 or go to A&amp;E for signs of sepsis, confusion, neck stiffness, weakness or loss of bladder or bowel control.</li>
          <li>Maintain a good fluid intake throughout the course, particularly if elderly.</li>
          <li>Once recovered, discuss the shingles vaccine with the GP practice.</li>
          <li>Document the consultation in the pharmacy record system (PMR).</li>
        </ul>
      </div>

      <div className="text-xs text-gray-600 text-center py-4 print:hidden">
        <p>Press Save &amp; Print Record to save the consultation and print this report. The record is saved when that button is pressed, not before.</p>
      </div>
    </div>
  );
};
