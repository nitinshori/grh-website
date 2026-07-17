'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PgdPageActions } from "@/components/PgdPageActions";
import { ProgressBar } from '../shared/components/ProgressBar';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import Link from 'next/link';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { SymptomAssessmentStep } from './steps/SymptomAssessmentStep';
import { MedicalHistoryStep } from './steps/MedicalHistoryStep';
import { CurrentMedicationsStep } from './steps/CurrentMedicationsStep';
import { ContraindicationsStep } from './steps/ContraindicationsStep';
import { MedicineSelectionStep } from './steps/MedicineSelectionStep';
import { CounsellingStep } from './steps/CounsellingStep';
import { SummaryStep } from './steps/SummaryStep';
import {
  initialPatientDetails,
  initialConsent,
  initialSummary,
  validatePatientStep,
  validateConsentStep,
} from '../shared/types';
import {
  initialShinglesSymptoms,
  initialShinglesMedicalHistory,
  initialShinglesMedicineSelection,
  initialShinglesCounselling,
  ShinglesPatientDetails,
  ShinglesConsent,
  ShinglesSummary,
} from './shingles-types';
import {
  generateClinicalAlerts,
  canProceedToMedicineSelection,
} from './shingles-clinical-logic';

const STEP_LABELS = [
  'Patient Details',
  'Consent & ID',
  'Symptoms',
  'Medical History',
  'Medications',
  'Contraindications',
  'Medicine Selection',
  'Counselling',
  'Summary & Print',
] as const;

export default function ShinglesTreatmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Patient & Consent
  const [patientDetails, setPatientDetails] = useState<ShinglesPatientDetails>(
    initialPatientDetails as ShinglesPatientDetails
  );
  const [consent, setConsent] = useState<ShinglesConsent>(
    initialConsent as ShinglesConsent
  );

  // Shingles-specific data
  const [symptoms, setSymptoms] = useState(initialShinglesSymptoms());
  const [medicalHistory, setMedicalHistory] = useState(initialShinglesMedicalHistory());
  const [medicineSelection, setMedicineSelection] = useState(initialShinglesMedicineSelection());
  const [counselling, setCounselling] = useState(initialShinglesCounselling());

  // Derived state
  const [alerts, setAlerts] = useState<any[]>([]);

  // Generate alerts whenever symptoms or medical history change
  useEffect(() => {
    const newAlerts = generateClinicalAlerts(symptoms, medicalHistory);
    setAlerts(newAlerts);
  }, [symptoms, medicalHistory]);

  const canProceedFromCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Patient Details
        return !validatePatientStep(patientDetails);
      case 1: // Consent
        return !validateConsentStep(consent);
      case 2: // Symptoms
        return symptoms.rashOnsetDate !== '';
      case 3: // Medical History
        return true; // Optional step
      case 4: // Medications
        return true; // Optional step
      case 5: // Contraindications
        return canProceedToMedicineSelection(alerts);
      case 6: // Medicine Selection
        return medicineSelection.medicine !== '';
      case 7: // Counselling
        return counselling.completeCourse &&
               counselling.painManagement &&
               counselling.rashCare &&
               counselling.contagiousPeriod &&
               counselling.pregnancyExposure &&
               counselling.PHNRisk &&
               counselling.returnIfWorsening &&
               counselling.vaccinationAdvice;
      case 8: // Summary
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);

    if (currentStep < STEP_LABELS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow clicking on completed steps or current step
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Field-level update handlers for PatientDetailsStep and ConsentStep
  const updatePatientField = (field: keyof typeof patientDetails, value: any) => {
    setPatientDetails((prev) => ({ ...prev, [field]: value }));
  };

  const updateConsentField = (field: keyof typeof consent, value: any) => {
    setConsent((prev) => ({ ...prev, [field]: value }));
  };

  // Build summary object
  const summary: ShinglesSummary = {
    ...initialSummary(),
    patientDetails,
    consent,
    symptoms,
    medicalHistory,
    medicineSelection,
    counselling,
  };

  const blockingAlerts = alerts.filter((a) => a.blocking);
  const isBlocked = blockingAlerts.length > 0;

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: patientDetails.firstName,
        lastName: patientDetails.lastName,
        dateOfBirth: patientDetails.dateOfBirth,
        nhsNumber: patientDetails.nhsNumber,
        phone: patientDetails.phone,
        email: patientDetails.email,
        address: patientDetails.address,
        gpName: patientDetails.gpName,
        gpPractice: patientDetails.gpPractice,
      },
      clinicalData: {
        patientDetails,
        consent,
        symptoms,
        medicalHistory,
        medicineSelection,
        counselling,
        alerts,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked ? 'not_supplied' : 'completed',
      medicine: {
        name: medicineSelection.medicine,
        dose: medicineSelection.dose,
        duration: medicineSelection.duration,
        quantity: medicineSelection.quantity?.toString(),
      },
      summary: {
        pharmacistName: summary.pharmacistName,
        pharmacistGPhC: summary.pharmacistGPhC,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
      },
    };
  }, [patientDetails, consent, symptoms, medicalHistory, medicineSelection, counselling, alerts, isBlocked, summary]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialPatientDetails as ShinglesPatientDetails);
    setConsent(initialConsent as ShinglesConsent);
    setSymptoms(initialShinglesSymptoms());
    setMedicalHistory(initialShinglesMedicalHistory());
    setMedicineSelection(initialShinglesMedicineSelection());
    setCounselling(initialShinglesCounselling());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shingles Acute Treatment ePGD</h1>
          <p className="text-gray-600 mt-2">UK Pharmacy PGD Consultation</p>
        </div>

        {currentStep === 0 && (
          <div className="mb-4 print:hidden">
            <Link
              href="/for-pharmacies/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
            hasErrors={isBlocked && currentStep >= 5}
          />
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <AlertBanner alerts={alerts} />
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 0 && (
            <>
              <PatientDetailsStep
                patient={patientDetails}
                onChange={updatePatientField}
              />
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceedFromCurrentStep()}
                  className="px-6 py-2 bg-[color:var(--tenant-primary)]/100 text-white rounded-lg font-medium hover:bg-[color:var(--tenant-primary)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <ConsentStep
                consent={consent}
                onChange={updateConsentField}
              />
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentStep <= 0}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceedFromCurrentStep()}
                  className="px-6 py-2 bg-[color:var(--tenant-primary)]/100 text-white rounded-lg font-medium hover:bg-[color:var(--tenant-primary)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <SymptomAssessmentStep
              symptoms={symptoms}
              onChange={setSymptoms}
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 3 && (
            <MedicalHistoryStep
              medicalHistory={medicalHistory}
              onChange={setMedicalHistory}
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 4 && (
            <CurrentMedicationsStep
              medications={medicalHistory.currentMedications}
              onChange={(meds) =>
                setMedicalHistory({ ...medicalHistory, currentMedications: meds })
              }
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 5 && (
            <ContraindicationsStep
              alerts={alerts}
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
              isBlocked={isBlocked}
            />
          )}

          {currentStep === 6 && (
            <MedicineSelectionStep
              medicine={medicineSelection}
              symptoms={symptoms}
              medicalHistory={medicalHistory}
              onChange={setMedicineSelection}
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 7 && (
            <CounsellingStep
              counselling={counselling}
              onChange={setCounselling}
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 8 && (
            <SummaryStep
              summary={summary}
              alerts={alerts}
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              onNext={handleNext}
              onPrev={handlePrev}
              getConsultationData={getConsultationData}
              onNewConsultation={handleNewConsultation}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            This ePGD supports PGD-based supply of antivirals for acute shingles management.
          </p>
          <p className="mt-2">
            Always refer to the specific PGD protocol and current NICE/BNF guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
