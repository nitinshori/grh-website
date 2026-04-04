'use client';

import { useState } from 'react';
import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { calculateAge, initialSummary } from '../shared/types';
import { ImpetigoData, ImpetigoLesionAssessment, ImpetigoMedicalHistory, ImpetigoTreatmentSelection, ImpetigoCounselling } from './impetigo-types';
import { LesionAssessmentStep } from './LesionAssessmentStep';
import { MedicalHistoryStep } from './MedicalHistoryStep';
import { ContraindicationsStep } from './ContraindicationsStep';
import { TreatmentSelectionStep } from './TreatmentSelectionStep';
import { CounsellingStep } from './CounsellingStep';
import { SummaryStep } from './SummaryStep';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { AlertBanner } from '../shared/components/AlertBanner';
import {
  calculateAgeFromDOB,
  evaluateReferralCriteria,
  generateClinicalAlerts,
  determineTreatmentRecommendation,
  assessPatient,
} from './impetigo-clinical-logic';

const STEP_LABELS = [
  'Patient Details',
  'Consent & ID',
  'Lesion Assessment',
  'Medical History',
  'Contraindications',
  'Treatment',
  'Counselling',
  'Summary',
] as const;

const INITIAL_LESION_ASSESSMENT: ImpetigoLesionAssessment = {
  lesionType: '',
  extent: '',
  affectedAreas: [],
  nearEyes: false,
  numberOfLesions: '',
  crusting: false,
  spreading: false,
  duration: '',
  additionalNotes: '',
};

const INITIAL_MEDICAL_HISTORY: ImpetigoMedicalHistory = {
  immunosuppressed: false,
  diabetes: false,
  eczema: false,
  recurrentImpetigo: false,
  mrsaSuspected: false,
  penicillinAllergy: false,
  recentAntibioticUse: false,
  recentAntibioticDetails: '',
  currentMedications: '',
  allergies: '',
};

const INITIAL_TREATMENT_SELECTION: ImpetigoTreatmentSelection = {
  treatment: '',
  dose: '',
  frequency: '',
  duration: '',
  quantity: 0,
  pharmacistOverride: false,
  overrideReason: '',
};

const INITIAL_COUNSELLING: ImpetigoCounselling = {
  hygieneAdvice: false,
  handwashing: false,
  schoolExclusion: false,
  avoidTouching: false,
  completeCourse: false,
  applicationAdvice: false,
  returnIfWorsening: false,
  contagionPeriod: false,
};

const INITIAL_PATIENT_DETAILS: BasePatientDetails = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  age: null,
  gpName: '',
  gpPractice: '',
  nhsNumber: '',
  address: '',
  phone: '',
  email: '',
};

const INITIAL_CONSENT: BaseConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
};

export function ImpetigoConsultationClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [data, setData] = useState<ImpetigoData>({
    patientDetails: INITIAL_PATIENT_DETAILS,
    consent: INITIAL_CONSENT,
    lesionAssessment: INITIAL_LESION_ASSESSMENT,
    medicalHistory: INITIAL_MEDICAL_HISTORY,
    treatmentSelection: INITIAL_TREATMENT_SELECTION,
    counselling: INITIAL_COUNSELLING,
    summary: initialSummary(),
  });

  // Calculate patient age
  const patientAge = data.patientDetails.age || (data.patientDetails.dateOfBirth ? calculateAge(data.patientDetails.dateOfBirth) : null);

  // Run clinical assessment
  const clinicalAssessment =
    patientAge !== null
      ? assessPatient(patientAge, data.lesionAssessment, data.medicalHistory)
      : { referrals: [], alerts: [], treatmentRecommendation: null, cautions: [] };

  const referralReasons = clinicalAssessment.referrals.map((r) => r.reason);
  const shouldRefer = clinicalAssessment.referrals.some((r) => r.shouldRefer);

  // Validation functions
  const isPatientDetailsValid = (): boolean => {
    return (
      data.patientDetails.firstName.trim() !== '' &&
      data.patientDetails.lastName.trim() !== '' &&
      data.patientDetails.dateOfBirth !== '' &&
      patientAge !== null &&
      patientAge >= 1
    );
  };

  const isConsentValid = (): boolean => {
    return (
      data.consent.informedConsentGiven &&
      data.consent.idVerified &&
      data.consent.patientAwarePrivateService
    );
  };

  const isLesionAssessmentValid = (): boolean => {
    return (
      data.lesionAssessment.lesionType !== '' &&
      data.lesionAssessment.extent !== '' &&
      data.lesionAssessment.affectedAreas.length > 0 &&
      data.lesionAssessment.numberOfLesions !== '' &&
      data.lesionAssessment.duration !== ''
    );
  };

  const isMedicalHistoryValid = (): boolean => {
    if (data.medicalHistory.recentAntibioticUse && !data.medicalHistory.recentAntibioticDetails.trim()) {
      return false;
    }
    return true;
  };

  const isContraindicationsValid = (): boolean => {
    return !shouldRefer;
  };

  const isTreatmentSelectionValid = (): boolean => {
    return (
      data.treatmentSelection.treatment !== '' &&
      data.treatmentSelection.dose.trim() !== '' &&
      data.treatmentSelection.frequency.trim() !== '' &&
      data.treatmentSelection.duration.trim() !== '' &&
      data.treatmentSelection.quantity > 0 &&
      (!data.treatmentSelection.pharmacistOverride || data.treatmentSelection.overrideReason.trim() !== '')
    );
  };

  const isCounsellingValid = (): boolean => {
    return Object.values(data.counselling).some((v) => v === true);
  };

  const isSummaryValid = (): boolean => {
    return (
      data.summary.pharmacistName.trim() !== '' &&
      data.summary.pharmacistGPhC.trim() !== '' &&
      data.summary.consultationDate !== '' &&
      data.summary.consultationTime !== ''
    );
  };

  const getValidationError = (step: number): string => {
    switch (step) {
      case 0:
        if (!data.patientDetails.firstName.trim()) return 'Patient first name is required';
        if (!data.patientDetails.lastName.trim()) return 'Patient last name is required';
        if (!data.patientDetails.dateOfBirth) return 'Date of birth is required';
        if (patientAge !== null && patientAge < 1) return 'Patient must be age 1 or older';
        return '';
      case 1:
        if (!data.consent.informedConsentGiven) return 'Informed consent is required';
        if (!data.consent.idVerified) return 'ID must be verified';
        if (!data.consent.patientAwarePrivateService) return 'Patient must be aware of private service';
        return '';
      case 2:
        if (!data.lesionAssessment.lesionType) return 'Lesion type is required';
        if (!data.lesionAssessment.extent) return 'Extent is required';
        if (data.lesionAssessment.affectedAreas.length === 0) return 'At least one affected area required';
        if (!data.lesionAssessment.numberOfLesions) return 'Number of lesions is required';
        if (!data.lesionAssessment.duration) return 'Duration is required';
        return '';
      case 3:
        return '';
      case 4:
        if (shouldRefer) return 'Patient meets referral criteria and cannot proceed in pharmacy';
        return '';
      case 5:
        if (!data.treatmentSelection.treatment) return 'Treatment selection is required';
        if (!data.treatmentSelection.dose.trim()) return 'Dose is required';
        if (!data.treatmentSelection.frequency.trim()) return 'Frequency is required';
        if (!data.treatmentSelection.duration.trim()) return 'Duration is required';
        if (data.treatmentSelection.quantity <= 0) return 'Quantity must be greater than 0';
        if (data.treatmentSelection.pharmacistOverride && !data.treatmentSelection.overrideReason.trim())
          return 'Override reason is required';
        return '';
      case 6:
        if (!Object.values(data.counselling).some((v) => v === true))
          return 'At least one counselling point must be marked';
        return '';
      case 7:
        if (!data.summary.pharmacistName.trim()) return 'Pharmacist name is required';
        if (!data.summary.pharmacistGPhC.trim()) return 'GPhC registration is required';
        if (!data.summary.consultationDate) return 'Consultation date is required';
        if (!data.summary.consultationTime) return 'Consultation time is required';
        return '';
      default:
        return '';
    }
  };

  const canProceedToNextStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return isPatientDetailsValid();
      case 1:
        return isConsentValid();
      case 2:
        return isLesionAssessmentValid();
      case 3:
        return isMedicalHistoryValid();
      case 4:
        return isContraindicationsValid();
      case 5:
        return isTreatmentSelectionValid();
      case 6:
        return isCounsellingValid();
      case 7:
        return isSummaryValid();
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep(currentStep)) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      if (currentStep < STEP_LABELS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || completedSteps.has(step)) {
      setCurrentStep(step);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to start a new consultation?')) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setData({
        patientDetails: INITIAL_PATIENT_DETAILS,
        consent: INITIAL_CONSENT,
        lesionAssessment: INITIAL_LESION_ASSESSMENT,
        medicalHistory: INITIAL_MEDICAL_HISTORY,
        treatmentSelection: INITIAL_TREATMENT_SELECTION,
        counselling: INITIAL_COUNSELLING,
        summary: initialSummary(),
      });
    }
  };

  const isBlockedByReferral = shouldRefer && currentStep > 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Impetigo ePGD</h1>
            <p className="text-gray-600">UK Pharmacy PGD Consultation</p>
          </div>

          {/* Critical Alerts */}
          {clinicalAssessment.alerts.length > 0 && (
            <AlertBanner alerts={clinicalAssessment.alerts} />
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white rounded-lg shadow p-4">
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
            hasErrors={getValidationError(currentStep) !== ''}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <StepWrapper
            title={STEP_LABELS[currentStep]}
            description={getStepDescription(currentStep)}
            currentStep={currentStep}
            totalSteps={STEP_LABELS.length}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceedToNextStep(currentStep)}
            validationError={getValidationError(currentStep)}
            isBlocked={isBlockedByReferral}
          >
            {currentStep === 0 && (
              <PatientDetailsStep
                patient={data.patientDetails}
                onChange={(field, value) => setData({
                  ...data,
                  patientDetails: { ...data.patientDetails, [field]: value }
                })}
              />
            )}

            {currentStep === 1 && (
              <ConsentStep
                consent={data.consent}
                onChange={(field, value) => setData({
                  ...data,
                  consent: { ...data.consent, [field]: value }
                })}
              />
            )}

            {currentStep === 2 && (
              <LesionAssessmentStep
                lesionAssessment={data.lesionAssessment}
                onChange={(lesionAssessment) => setData({ ...data, lesionAssessment })}
              />
            )}

            {currentStep === 3 && (
              <MedicalHistoryStep
                medicalHistory={data.medicalHistory}
                onChange={(medicalHistory) => setData({ ...data, medicalHistory })}
              />
            )}

            {currentStep === 4 && (
              <ContraindicationsStep
                alerts={clinicalAssessment.alerts}
                referralReasons={referralReasons}
              />
            )}

            {currentStep === 5 && !shouldRefer && (
              <TreatmentSelectionStep
                treatment={data.treatmentSelection}
                recommendation={clinicalAssessment.treatmentRecommendation}
                onChange={(treatment) => setData({ ...data, treatmentSelection: treatment })}
              />
            )}

            {currentStep === 6 && !shouldRefer && (
              <CounsellingStep
                counselling={data.counselling}
                onChange={(counselling) => setData({ ...data, counselling })}
              />
            )}

            {currentStep === 7 && !shouldRefer && (
              <SummaryStep
                data={data}
                summary={data.summary}
                onSummaryChange={(summary) => setData({ ...data, summary })}
                alerts={clinicalAssessment.alerts}
              />
            )}
          </StepWrapper>
        </div>

        {/* Action Buttons */}
        {currentStep === STEP_LABELS.length - 1 && !shouldRefer && (
          <div className="mt-8 flex gap-4 justify-end">
            <button
              onClick={handleReset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              New Consultation
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Print Report
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            This ePGD is designed to support pharmacists operating under a Patient Group Direction (PGD) for impetigo
            treatment.
          </p>
          <p className="mt-2">
            For questions or to report issues, please contact your pharmacy superintendent or PGD lead.
          </p>
        </div>
      </div>
    </div>
  );
}

function getStepDescription(step: number): string {
  const descriptions: Record<number, string> = {
    0: 'Collect basic patient information and demographics',
    1: 'Verify patient consent and identity',
    2: 'Assess lesions - type, extent, location, and characteristics',
    3: 'Review relevant medical history and current medications',
    4: 'Identify any contraindications or cautions to treatment',
    5: 'Select and confirm appropriate treatment regimen',
    6: 'Provide patient counselling and safety information',
    7: 'Review and document the consultation summary',
  };
  return descriptions[step] || '';
}
