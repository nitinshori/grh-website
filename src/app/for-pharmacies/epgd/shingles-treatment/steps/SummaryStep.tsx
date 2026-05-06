'use client';

import React, { useState } from 'react';
import { Checkbox } from '../../shared/components/FormInputs';
import { StepWrapper } from '../../shared/components/StepWrapper';
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
import type { ConsultationRecordData } from '../../shared/hooks/useConsultationTracking';

interface SummaryStepProps {
  summary: ShinglesSummary;
  alerts: ClinicalAlert[];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  getConsultationData?: () => ConsultationRecordData | null;
  onNewConsultation?: () => void;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  summary,
  alerts,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  getConsultationData,
  onNewConsultation,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [printed, setPrinted] = useState(false);

  const age = calculateAge(summary.patientDetails.dateOfBirth);
  const counsellingItems: [string, boolean][] = [
    ['Complete full 7-day course', summary.counselling.completeCourse],
    ['Pain management options', summary.counselling.painManagement],
    ['Rash care measures', summary.counselling.rashCare],
    ['Contagious period (until crusted)', summary.counselling.contagiousPeriod],
    ['Pregnancy exposure risk', summary.counselling.pregnancyExposure],
    ['Postherpetic neuralgia risk', summary.counselling.PHNRisk],
    ['Red flags - return to GP', summary.counselling.returnIfWorsening],
    ['Shingrix vaccination advice', summary.counselling.vaccinationAdvice],
  ];

  const handlePrint = () => {
    window.print();
    setPrinted(true);
  };

  const validationError = !agreed ? 'You must confirm PGD provision before submitting' : null;

  return (
    <StepWrapper
      title="Summary & Print"
      description="Review consultation summary and print for patient records"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={agreed}
      validationError={validationError}
      getConsultationData={getConsultationData}
      onNewConsultation={onNewConsultation}
    >
      <div className="space-y-6">
        {/* Print Section */}
        <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-6 print:bg-white print:border-none print:p-0">
          {/* PRINTABLE REPORT */}
          <div className="bg-white p-8 print:p-0">
            {/* Header */}
            <div className="border-b-2 border-gray-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Shingles Acute Treatment ePGD</h1>
              <p className="text-gray-600">PGD Consultation Report</p>
              <p className="text-sm text-gray-500 mt-1">
                Date: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Patient Details */}
            <SectionHeader>Patient Details</SectionHeader>
            <div className="space-y-2 mb-6">
              <Row label="Age" value={`${age} years`} />
            </div>

            {/* Clinical Alerts Summary */}
            {alerts.length > 0 && (
              <>
                <SectionHeader>Clinical Alerts</SectionHeader>
                <AlertSummary alerts={alerts} />
              </>
            )}

            {/* Symptoms Summary */}
            <SectionHeader>Presenting Symptoms</SectionHeader>
            <div className="space-y-2 mb-6">
              <Row label="Rash Onset" value={summary.symptoms.rashOnsetDate} />
              <Row label="Hours Since Onset" value={`${summary.symptoms.hoursSinceOnset || 'N/A'} hours`} />
              <Row label="Rash Stage" value={summary.symptoms.rashStage} />
              <Row label="Dermatome Location" value={summary.symptoms.dermatome} />
              <Row label="Pain Level" value={`${summary.symptoms.painLevel}/10 (${summary.symptoms.painType})`} />
              <Row label="Unilateral" value={summary.symptoms.unilateral ? 'Yes' : 'No'} />
              <Row label="Rash Description" value={summary.symptoms.rashDescription} />
            </div>

            {/* Medical History Summary */}
            <SectionHeader>Medical History</SectionHeader>
            <div className="space-y-2 mb-6">
              <Row
                label="Immunosuppressed"
                value={summary.medicalHistory.immunosuppressed ? `Yes - ${summary.medicalHistory.immunosuppressedDetails}` : 'No'}
              />
              <Row label="Pregnant" value={summary.medicalHistory.pregnant ? 'Yes' : 'No'} />
              <Row label="Breastfeeding" value={summary.medicalHistory.breastfeeding ? 'Yes' : 'No'} />
              <Row label="Renal Impairment" value={summary.medicalHistory.renalImpairment} />
              <Row label="Hepatic Impairment" value={summary.medicalHistory.hepaticImpairment} />
              <Row label="HIV Positive" value={summary.medicalHistory.hivPositive ? 'Yes' : 'No'} />
              <Row label="Previous Shingles" value={summary.medicalHistory.previousShingles ? 'Yes' : 'No'} />
              <Row label="Active Cancer" value={summary.medicalHistory.cancerActive ? 'Yes' : 'No'} />
              <Row label="Organ Transplant" value={summary.medicalHistory.organTransplant ? 'Yes' : 'No'} />
              {summary.medicalHistory.currentMedications && (
                <Row label="Current Medications" value={summary.medicalHistory.currentMedications} />
              )}
              {summary.medicalHistory.allergies && (
                <Row label="Allergies" value={summary.medicalHistory.allergies} />
              )}
            </div>

            {/* Medicine Selection */}
            <SectionHeader>Prescribed Medicine</SectionHeader>
            <div className="space-y-2 mb-6">
              <Row label="Medicine" value={summary.medicineSelection.medicine} />
              <Row label="Dose" value={summary.medicineSelection.dose} />
              <Row label="Frequency" value={summary.medicineSelection.frequency} />
              <Row label="Duration" value={summary.medicineSelection.duration} />
              <Row label="Quantity" value={`${summary.medicineSelection.quantity} tablets`} />
              {summary.medicineSelection.pharmacistOverride && (
                <Row label="Pharmacist Override" value={summary.medicineSelection.overrideReason} />
              )}
            </div>

            {/* Counselling Summary */}
            <SectionHeader>Patient Counselling Provided</SectionHeader>
            <CounsellingGrid items={counsellingItems} />

            {/* Pharmacist Declaration */}
            <PharmacistDeclaration
              pgdName="Shingles Acute Treatment"
              pharmacistName={summary.pharmacistName}
              pharmacistGPhC={summary.pharmacistGPhC}
              pharmacyName={summary.pharmacyName || ''}
            />

            {/* Footer */}
            <ReportFooter pgdName="Shingles Acute Treatment" />
          </div>
        </div>

        {/* Print Button */}
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded"
          >
            🖨️ Print Report
          </button>
          {printed && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-300 rounded px-3 py-3 flex items-center">
              ✓ Report printed
            </div>
          )}
        </div>

        {/* Completion Checklist */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 print:hidden">
          <h3 className="font-semibold text-purple-900 mb-3">Completion Checklist</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={printed}
                onChange={(e) => setPrinted(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-gray-700">Report has been printed for patient records</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-gray-700">
                I confirm that the PGD medicine has been provided to the patient with appropriate counselling
              </span>
            </label>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
          <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>

          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Print this report for pharmacy records and patient information</li>
            <li>Dispense antiviral medicine with dosage label</li>
            <li>Provide counselling based on points covered in this consultation</li>
            <li>Consider providing written information leaflet on shingles management</li>
            <li>Document consultation in pharmacy record system (PMR)</li>
            <li>Advise patient to contact GP if any red flags develop</li>
            <li>Follow-up: Consider checking in with patient after 2-3 days if high-risk features</li>
          </ol>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-gray-600 text-center py-4 print:hidden">
          <p>This ePGD supports PGD-based supply of antivirals for acute shingles management in UK pharmacies.</p>
          <p className="mt-1">Always refer to the specific PGD protocol and current NICE/BNF guidance.</p>
        </div>
      </div>
    </StepWrapper>
  );
};
