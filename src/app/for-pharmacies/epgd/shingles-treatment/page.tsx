'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PgdPageActions } from "@/components/PgdPageActions";
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
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
  calculateAge,
} from '../shared/types';
import type { ClinicalAlert } from '../shared/types';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
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
  validateSymptomStep,
  validateMedicalHistoryStep,
  validateMedicineSelectionStep,
  validateCounsellingStep,
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

const STEP_DESCRIPTIONS = [
  'Collect patient information (adults aged 18 years and over)',
  'Obtain informed consent and verify identity',
  "Assess the patient's current symptoms and rash characteristics",
  "Review patient's medical conditions and relevant history",
  'Review all medications the patient is currently taking',
  'Review clinical alerts and contraindications',
  'Select the antiviral and confirm the PGD regimen',
  'Confirm patient counselling on antiviral use, infection control and safety netting, and record that it was given',
  'Review the consultation record, complete the declaration and save',
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

  // Pharmacist details for the record (name of healthcare practitioner).
  // Prefilled from the profile, editable and required: a failed profile
  // fetch used to print a blank declaration and fail the save (adversarial review).
  const pharmacistProfile = usePharmacistProfile();
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistGPhC, setPharmacistGPhC] = useState('');
  useEffect(() => {
    if (!pharmacistProfile) return;
    if (pharmacistName || pharmacistGPhC) return;
    setPharmacistName(pharmacistProfile.name ?? '');
    setPharmacistGPhC(pharmacistProfile.gphcNumber ?? '');
  }, [pharmacistProfile, pharmacistName, pharmacistGPhC]);

  // Declaration tick on the summary step
  const [agreed, setAgreed] = useState(false);

  // Derived state
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);

  // Generate alerts whenever symptoms, medical history or age change
  useEffect(() => {
    const newAlerts = generateClinicalAlerts(symptoms, medicalHistory, patientDetails.age);
    setAlerts(newAlerts);
  }, [symptoms, medicalHistory, patientDetails.age]);

  const blockingAlerts = alerts.filter((a) => a.severity === 'stop');
  const isBlocked = blockingAlerts.length > 0;

  // One validation message per step, enforced by the single StepWrapper on
  // Next and on Save & Print. A stop anywhere blocks every step's Next.
  const validationErrorForStep = (step: number): string | null => {
    switch (step) {
      case 0: {
        // PGD: adults aged 18 years and over. A blank date of birth never passes the age gate.
        const base = validatePatientStep(patientDetails, { minAge: 18 });
        if (base) return base;
        if (patientDetails.age === null) return 'Unable to calculate age from the date of birth';
        return null;
      }
      case 1:
        return validateConsentStep(consent);
      case 2:
        return validateSymptomStep(symptoms);
      case 3:
        return validateMedicalHistoryStep(medicalHistory);
      case 4:
        return !medicalHistory.currentMedications.trim()
          ? 'Record the current medications (or "none") before continuing'
          : null;
      case 5:
        return isBlocked ? 'Patient has blocking contraindications: cannot proceed with PGD supply' : null;
      case 6:
        return validateMedicineSelectionStep(medicineSelection, medicalHistory);
      case 7:
        return validateCounsellingStep(counselling);
      case 8:
        if (!pharmacistName.trim()) return 'Pharmacist name is required';
        if (!pharmacistGPhC.trim()) return 'GPhC registration number is required';
        if (!agreed) return 'Confirm the PGD supply declaration before saving';
        return null;
      default:
        return null;
    }
  };
  const validationError = validationErrorForStep(currentStep);
  const canProceed = !isBlocked && validationError === null;

  const handleNext = () => {
    if (isBlocked || validationError !== null) return;
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
    // Backwards only. Going forward always means pressing Next, where the gates are.
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // When a stop appears, forget every step after the one being edited.
  useEffect(() => {
    if (!isBlocked) return;
    setCompletedSteps((prev) => {
      const next = new Set<number>();
      prev.forEach((s) => {
        if (s < currentStep) next.add(s);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [isBlocked, currentStep]);

  // Field-level update handlers for PatientDetailsStep and ConsentStep
  const updatePatientField = (field: keyof typeof patientDetails, value: any) => {
    setPatientDetails((prev) => {
      const next = { ...prev, [field]: value };
      // Age gates the PGD (18 and over) and the treatment window criteria.
      if (field === 'dateOfBirth') {
        next.age = calculateAge(typeof value === 'string' ? value : '');
      }
      return next;
    });
  };

  const updateConsentField = (field: keyof typeof consent, value: any) => {
    setConsent((prev) => ({ ...prev, [field]: value }));
  };

  // Build summary object
  const summary: ShinglesSummary = {
    ...initialSummary(),
    pharmacistName,
    pharmacistGPhC,
    pharmacyName: pharmacistProfile?.pharmacyName ?? '',
    pharmacyAddress: pharmacistProfile?.pharmacyAddress ?? '',
    patientDetails,
    consent,
    symptoms,
    medicalHistory,
    medicineSelection,
    counselling,
  };

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
      medicine:
        !isBlocked && medicineSelection.medicine
          ? {
              name: medicineSelection.medicine,
              dose: `${medicineSelection.dose} ${medicineSelection.frequency}`.trim(),
              duration: medicineSelection.duration,
              quantity: medicineSelection.quantity?.toString(),
            }
          : undefined,
      summary: {
        pharmacistName: summary.pharmacistName || pharmacistProfile?.name || '',
        pharmacistGPhC: summary.pharmacistGPhC || pharmacistProfile?.gphcNumber || '',
        pharmacyName: summary.pharmacyName,
        pharmacyAddress: summary.pharmacyAddress,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
      },
      consent: { notifyGp: consent.notifyGp },
    };
  }, [patientDetails, consent, symptoms, medicalHistory, medicineSelection, counselling, alerts, isBlocked, summary, pharmacistProfile]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialPatientDetails as ShinglesPatientDetails);
    setConsent(initialConsent as ShinglesConsent);
    setSymptoms(initialShinglesSymptoms());
    setMedicalHistory(initialShinglesMedicalHistory());
    setMedicineSelection(initialShinglesMedicineSelection());
    setCounselling(initialShinglesCounselling());
    setAgreed(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shingles Acute Treatment ePGD</h1>
          <p className="text-gray-600 mt-2">
            Aciclovir, valaciclovir or famciclovir for adults aged 18 and over. Shingles (Herpes Zoster) Treatment PGD, version 007, issued 11 September 2026.
          </p>
        </div>

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

        {/* Steps: one StepWrapper for the whole flow, so stops, the not-supplied
            save and analytics are handled once rather than per step. */}
        <StepWrapper
          title={STEP_LABELS[currentStep]}
          description={STEP_DESCRIPTIONS[currentStep]}
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceed}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          {currentStep === 0 && (
            <PatientDetailsStep
              patient={patientDetails}
              onChange={updatePatientField}
              requireAdult
            />
          )}

          {currentStep === 1 && (
            <ConsentStep
              consent={consent}
              onChange={updateConsentField}
            />
          )}

          {currentStep === 2 && (
            <SymptomAssessmentStep
              symptoms={symptoms}
              onChange={setSymptoms}
              age={patientDetails.age}
            />
          )}

          {currentStep === 3 && (
            <MedicalHistoryStep
              medicalHistory={medicalHistory}
              onChange={setMedicalHistory}
            />
          )}

          {currentStep === 4 && (
            <CurrentMedicationsStep
              medications={medicalHistory.currentMedications}
              onChange={(meds) =>
                setMedicalHistory({ ...medicalHistory, currentMedications: meds })
              }
            />
          )}

          {currentStep === 5 && (
            <ContraindicationsStep
              alerts={alerts}
              isBlocked={isBlocked}
            />
          )}

          {currentStep === 6 && (
            <MedicineSelectionStep
              medicine={medicineSelection}
              symptoms={symptoms}
              medicalHistory={medicalHistory}
              onChange={setMedicineSelection}
            />
          )}

          {currentStep === 7 && (
            <CounsellingStep
              counselling={counselling}
              onChange={setCounselling}
            />
          )}

          {currentStep === 8 && (
            <SummaryStep
              summary={summary}
              alerts={alerts}
              agreed={agreed}
              onAgreedChange={setAgreed}
              onPharmacistNameChange={setPharmacistName}
              onPharmacistGPhCChange={setPharmacistGPhC}
            />
          )}
        </StepWrapper>

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
