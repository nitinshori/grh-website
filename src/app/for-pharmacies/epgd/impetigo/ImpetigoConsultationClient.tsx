'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { calculateAge, initialSummary } from '../shared/types';
import {
  ImpetigoData,
  ImpetigoLesionAssessment,
  ImpetigoMedicalHistory,
  ImpetigoTreatmentSelection,
  ImpetigoCounselling,
  ImpetigoConsentDetails,
  IMPETIGO_PGD_VERSION,
} from './impetigo-types';
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
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { SelectInput, TextInput, TextArea } from '../shared/components/FormInputs';
import {
  calculateAgeMonths,
  assessPatient,
  needsOralRoute,
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
  lesionSizeCm: '',
  crusting: false,
  spreading: false,
  duration: '',
  brokenSkin: false,
  topicalFailed: false,
  systemicallyUnwell: false,
  cellulitisSigns: false,
  diagnosticUncertainty: false,
  hydrogenPeroxide: '',
  additionalNotes: '',
};

const INITIAL_MEDICAL_HISTORY: ImpetigoMedicalHistory = {
  immunosuppressed: false,
  diabetes: false,
  eczema: false,
  recurrentImpetigo: false,
  mrsaSuspected: false,
  penicillinAllergy: false,
  penicillinAllergyHistory: '',
  cephalosporinAllergyHighRisk: false,
  flucloxCholestasisHistory: false,
  fusidicAcidAllergy: false,
  macrolideAllergy: false,
  severeHepaticImpairment: false,
  severeRenalImpairment: false,
  antibioticAlreadyThisEpisode: false,
  flucloxSuspensionRefused: false,
  pregnant: false,
  pregnancyEstablishedHow: '',
  breastfeeding: false,
  breastfeedingDiscussed: false,
  weightKg: '',
  cannotBeWeighed: false,
  takesSimvastatinOrLovastatin: false,
  takesColchicine: false,
  takesErgotAlkaloid: false,
  takesTicagrelor: false,
  takesClariSpcContraindicated: false,
  qtProlongationHistory: false,
  qtMedicinesOrElectrolytes: false,
  takesOtherStatinOrWarfarin: false,
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
  extensionReason: '',
  severeDoseReason: '',
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
  noCombination: false,
  drugSpecificAdvice: false,
};

const INITIAL_CONSENT_DETAILS: ImpetigoConsentDetails = {
  basis: '',
  personName: '',
  relationship: '',
  gillickBasis: '',
};

const INITIAL_PATIENT_DETAILS: BasePatientDetails = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  age: null,
  gpName: '',
  gpPractice: '',
gpAddress: '',
gpPhone: '',
gpEmail: '',
gpOdsCode: '',
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

function initialData(): ImpetigoData {
  return {
    patientDetails: INITIAL_PATIENT_DETAILS,
    consent: INITIAL_CONSENT,
    consentDetails: INITIAL_CONSENT_DETAILS,
    lesionAssessment: INITIAL_LESION_ASSESSMENT,
    medicalHistory: INITIAL_MEDICAL_HISTORY,
    treatmentSelection: INITIAL_TREATMENT_SELECTION,
    counselling: INITIAL_COUNSELLING,
    summary: initialSummary(),
  };
}

export function ImpetigoConsultationClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [data, setData] = useState<ImpetigoData>(initialData);

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (data.summary.pharmacistName || data.summary.pharmacistGPhC) return;
    setData((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        pharmacistName: __pharmProfile.name,
        pharmacistGPhC: __pharmProfile.gphcNumber,
        pharmacyName: __pharmProfile.pharmacyName,
        pharmacyAddress: __pharmProfile.pharmacyAddress,
      },
    }));
  }, [__pharmProfile, data.summary.pharmacistName, data.summary.pharmacistGPhC]);

  // Calculate patient age (years, and whole months for the 1-month and 3-month floors)
  const patientAge = data.patientDetails.age ?? (data.patientDetails.dateOfBirth ? calculateAge(data.patientDetails.dateOfBirth) : null);
  const patientAgeMonths = calculateAgeMonths(data.patientDetails.dateOfBirth);

  // Run clinical assessment
  const clinicalAssessment =
    patientAge !== null
      ? assessPatient(patientAge, data.lesionAssessment, data.medicalHistory, patientAgeMonths)
      : { route: 'incomplete' as const, referrals: [], alerts: [], treatmentRecommendation: null, cautions: [] };

  const referralReasons = clinicalAssessment.referrals.map((r) => r.reason);
  const shouldRefer = clinicalAssessment.referrals.some((r) => r.shouldRefer);
  const oralRoute = needsOralRoute(data.lesionAssessment);
  const isChild = patientAge !== null && patientAge < 18;
  const isUnder16 = patientAge !== null && patientAge < 16;

  // Validation functions
  const isPatientDetailsValid = (): boolean => {
    return (
      data.patientDetails.firstName.trim() !== '' &&
      data.patientDetails.lastName.trim() !== '' &&
      data.patientDetails.dateOfBirth !== '' &&
      patientAge !== null &&
      patientAge >= 0
    );
  };

  const consentDetailsError = (): string => {
    const c = data.consentDetails;
    if (!isUnder16) return '';
    if (!c.basis || c.basis === 'patient')
      return 'Patient is under 16: record consent from a person with parental responsibility, or the young person assessed as Gillick competent';
    if (c.basis === 'parental-responsibility' && (!c.personName.trim() || !c.relationship.trim()))
      return 'Record the name and relationship of the person with parental responsibility';
    if (c.basis === 'gillick-competent' && !c.gillickBasis.trim())
      return 'Record the basis of the Gillick assessment';
    return '';
  };

  const isConsentValid = (): boolean => {
    return (
      data.consent.informedConsentGiven &&
      data.consent.idVerified &&
      data.consent.patientAwarePrivateService &&
      consentDetailsError() === ''
    );
  };

  const lesionError = (): string => {
    const la = data.lesionAssessment;
    if (!la.lesionType) return 'Lesion type is required';
    if (!la.extent) return 'Extent is required';
    if (!la.numberOfLesions) return 'Number of lesions is required';
    if (!la.lesionSizeCm.trim()) return 'Record the size of the affected area (the number and size of lesions must be recorded)';
    if (la.extent === 'localised' && la.numberOfLesions === '>5')
      return 'More than 5 lesions is widespread by the document definition; change the extent';
    if (la.affectedAreas.length === 0) return 'At least one affected area required';
    if (!la.duration) return 'Duration is required';
    if (
      la.lesionType === 'non-bullous' &&
      la.extent === 'localised' &&
      !la.topicalFailed &&
      !la.brokenSkin &&
      !la.hydrogenPeroxide
    )
      return 'Record whether hydrogen peroxide 1% was offered as a P sale first, or why it is unsuitable or ineffective';
    return '';
  };

  const isLesionAssessmentValid = (): boolean => lesionError() === '';

  const medicalHistoryError = (): string => {
    const mh = data.medicalHistory;
    if (mh.recentAntibioticUse && !mh.recentAntibioticDetails.trim()) return 'Details of recent antibiotics are required';
    if (mh.penicillinAllergy && !mh.penicillinAllergyHistory.trim())
      return 'Record the penicillin allergy history in the patient\'s own terms';
    if (mh.pregnant && !mh.pregnancyEstablishedHow.trim()) return 'Record how pregnancy status was established';
    if (isChild && oralRoute && clinicalAssessment.route === 'macrolide' && !mh.cannotBeWeighed) {
      const w = parseFloat(mh.weightKg);
      if (isNaN(w) || w <= 0) return 'Weigh the child today and record the weight in kilograms (macrolide dose is by weight)';
    }
    return '';
  };

  const isMedicalHistoryValid = (): boolean => medicalHistoryError() === '';

  const isContraindicationsValid = (): boolean => {
    return !shouldRefer;
  };

  const treatmentError = (): string => {
    const t = data.treatmentSelection;
    if (!t.treatment) return 'Treatment selection is required';
    if (!t.dose.trim()) return 'Dose is required';
    if (!t.frequency.trim()) return 'Frequency is required';
    if (!t.duration) return 'Duration is required';
    if (t.duration === '7 days' && !t.extensionReason.trim()) return 'A 7 day course is clinical judgement only: record the reason';
    if (t.quantity <= 0) return 'Quantity must be greater than 0';
    if (t.pharmacistOverride && !t.overrideReason.trim()) return 'Override reason is required';
    return '';
  };

  const isTreatmentSelectionValid = (): boolean => treatmentError() === '';

  const counsellingError = (): string => {
    const c = data.counselling;
    const t = data.treatmentSelection.treatment;
    if (!c.hygieneAdvice || !c.handwashing || !c.schoolExclusion || !c.avoidTouching || !c.contagionPeriod)
      return 'Give the full hygiene advice (towels and bedding, hand washing, school or nursery, covering and nails, contagion) and mark each item';
    if (!c.noCombination) return 'Confirm the patient was told topical and oral treatment are not combined';
    if (!c.drugSpecificAdvice) return 'Confirm the medicine-specific advice for the product supplied';
    if (!c.completeCourse) return 'Confirm the patient was told to complete the course';
    if ((t === 'fusidic-acid' || t === 'hydrogen-peroxide') && !c.applicationAdvice)
      return 'Confirm the application advice for the topical treatment';
    if (!c.returnIfWorsening) return 'Confirm the follow-up advice';
    return '';
  };

  const isCounsellingValid = (): boolean => counsellingError() === '';

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
        return '';
      case 1:
        if (!data.consent.informedConsentGiven) return 'Informed consent is required';
        if (!data.consent.idVerified) return 'ID must be verified';
        if (!data.consent.patientAwarePrivateService) return 'Patient must be aware of private service';
        return consentDetailsError();
      case 2:
        return lesionError();
      case 3:
        return medicalHistoryError();
      case 4:
        if (shouldRefer) return 'Patient meets referral criteria and cannot proceed in pharmacy';
        return '';
      case 5:
        return treatmentError();
      case 6:
        return counsellingError();
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

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: data.patientDetails.firstName,
        lastName: data.patientDetails.lastName,
        dateOfBirth: data.patientDetails.dateOfBirth,
        nhsNumber: data.patientDetails.nhsNumber,
        phone: data.patientDetails.phone,
        email: data.patientDetails.email,
        address: data.patientDetails.address,
        gpName: data.patientDetails.gpName,
        gpPractice: data.patientDetails.gpPractice,
      },
      clinicalData: data as unknown as Record<string, unknown>,
      outcome: shouldRefer ? "not_supplied" : "completed",
      summary: {
        pharmacistName: data.summary.pharmacistName,
        pharmacistGPhC: data.summary.pharmacistGPhC,
        consultationDate: data.summary.consultationDate,
        consultationTime: data.summary.consultationTime,
      },
    };
  }, [data, shouldRefer]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setData(initialData());
  }, []);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to start a new consultation?')) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setData(initialData());
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
            <p className="text-gray-600">{IMPETIGO_PGD_VERSION}</p>
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
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            {currentStep === 0 && (
              <PatientDetailsStep
                patient={data.patientDetails}
                onChange={(field, value) => setData({
                  ...data,
                  patientDetails: { ...data.patientDetails, [field]: value }
                })}
                requireAdult={false}
          />
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <ConsentStep
                  consent={data.consent}
                  onChange={(field, value) => setData({
                    ...data,
                    consent: { ...data.consent, [field]: value }
                  })}
                />
                {isUnder16 && (
                  <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded space-y-3">
                    <p className="text-sm font-medium text-gray-900">Patient under 16: who gave consent</p>
                    <SelectInput
                      label="Consent obtained from"
                      value={data.consentDetails.basis}
                      onChange={(v) =>
                        setData({
                          ...data,
                          consentDetails: { ...data.consentDetails, basis: v as ImpetigoConsentDetails['basis'] },
                        })
                      }
                      options={[
                        { value: '', label: 'Select...' },
                        { value: 'parental-responsibility', label: 'A person with parental responsibility' },
                        { value: 'gillick-competent', label: 'The young person, assessed as Gillick competent' },
                      ]}
                      required
                    />
                    {data.consentDetails.basis === 'parental-responsibility' && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <TextInput
                          label="Name of the person with parental responsibility"
                          value={data.consentDetails.personName}
                          onChange={(v) => setData({ ...data, consentDetails: { ...data.consentDetails, personName: v } })}
                          required
                        />
                        <TextInput
                          label="Relationship to the patient"
                          value={data.consentDetails.relationship}
                          onChange={(v) => setData({ ...data, consentDetails: { ...data.consentDetails, relationship: v } })}
                          placeholder="e.g. mother"
                          required
                        />
                      </div>
                    )}
                    {data.consentDetails.basis === 'gillick-competent' && (
                      <TextArea
                        label="Basis of the Gillick assessment"
                        value={data.consentDetails.gillickBasis}
                        onChange={(v) => setData({ ...data, consentDetails: { ...data.consentDetails, gillickBasis: v } })}
                        rows={2}
                        required
                      />
                    )}
                  </div>
                )}
              </div>
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
                age={patientAge}
                oralRoute={oralRoute}
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
                route={clinicalAssessment.route}
                pregnant={data.medicalHistory.pregnant}
                onChange={(treatment) => setData({ ...data, treatmentSelection: treatment })}
              />
            )}

            {currentStep === 6 && !shouldRefer && (
              <CounsellingStep
                counselling={data.counselling}
                treatment={data.treatmentSelection.treatment}
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
    2: 'Assess lesions: localised or widespread, bullous or non-bullous, and the shared exclusions',
    3: 'Review relevant medical history, penicillin allergy history, weight and current medications',
    4: 'Identify any contraindications or cautions to treatment',
    5: 'Select and confirm the arm the document sends this patient to',
    6: 'Provide patient counselling, the hygiene advice and safety information',
    7: 'Review and document the consultation summary',
  };
  return descriptions[step] || '';
}
