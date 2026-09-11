'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import type { BasePatientDetails, BaseConsent } from '../shared/types';
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
import { ImpetigoSummaryReport } from './ImpetigoSummaryReport';
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
  sizeIsWidespread,
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
  penicillinAllergy: '',
  penicillinAllergyHistory: '',
  cephalosporinAllergyHighRisk: false,
  flucloxCholestasisHistory: false,
  fusidicAcidAllergy: false,
  fusidicAcidResistanceSuspected: false,
  macrolideAllergy: false,
  severeHepaticImpairment: false,
  severeRenalImpairment: false,
  antibioticAlreadyThisEpisode: false,
  flucloxSuspensionRefused: false,
  pregnant: false,
  pregnancyEstablishedHow: '',
  breastfeeding: false,
  breastfeedingDiscussed: '',
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
  formulation: '',
  doseValue: '',
  dose: '',
  frequency: '',
  duration: '',
  extensionReason: '',
  severeDoseReason: '',
  quantity: 0,
  quantityUnit: '',
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
    patientDetails: { ...INITIAL_PATIENT_DETAILS },
    consent: { ...INITIAL_CONSENT },
    consentDetails: { ...INITIAL_CONSENT_DETAILS },
    lesionAssessment: { ...INITIAL_LESION_ASSESSMENT, affectedAreas: [] },
    medicalHistory: { ...INITIAL_MEDICAL_HISTORY },
    treatmentSelection: { ...INITIAL_TREATMENT_SELECTION },
    counselling: { ...INITIAL_COUNSELLING },
    summary: { ...initialSummary(), referralAdvice: '', adverseDrugReactions: '' },
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

  // Patient age is written into patientDetails.age on every DOB change (see
  // the patient step onChange), so the record and the summary carry it.
  const patientAge = data.patientDetails.age;
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
      return "Patient is under 16: select who consented under 'Consent obtained from' (a person with parental responsibility, or the young person assessed as Gillick competent)";
    if (c.basis === 'parental-responsibility' && (!c.personName.trim() || !c.relationship.trim()))
      return "Complete 'Name of the person with parental responsibility' and 'Relationship to the patient'";
    if (c.basis === 'gillick-competent' && !c.gillickBasis.trim())
      return "Complete 'Basis of the Gillick assessment'";
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
    if (!la.lesionType) return "Select the 'Type of impetigo'";
    if (!la.extent) return "Select the 'Extent'";
    if (!la.numberOfLesions) return "Select the 'Number of lesions'";
    if (!la.lesionSizeCm.trim()) return "Complete 'Size of the affected area (cm)' (the number and size of lesions must be recorded)";
    if (la.extent === 'localised' && la.numberOfLesions === '>5')
      return "More than 5 lesions is widespread by the document definition: change 'Extent' to widespread";
    if (la.extent === 'localised' && sizeIsWidespread(la))
      return "An affected area over about 5 cm is widespread by the document definition: change 'Extent' to widespread (oral route)";
    if (la.affectedAreas.length === 0) return "Tick at least one box under 'Affected Areas'";
    if (!la.duration) return "Select the 'Duration of lesions'";
    if (
      la.lesionType === 'non-bullous' &&
      la.extent === 'localised' &&
      !la.topicalFailed &&
      !la.brokenSkin &&
      !la.hydrogenPeroxide
    )
      return "Answer 'Hydrogen peroxide 1% cream': offered as a P sale first, unsuitable, or already tried and ineffective";
    return '';
  };

  const isLesionAssessmentValid = (): boolean => lesionError() === '';

  const medicalHistoryError = (): string => {
    const mh = data.medicalHistory;
    if (mh.recentAntibioticUse && !mh.recentAntibioticDetails.trim()) return "Complete 'Details of recent antibiotics'";
    if (oralRoute && mh.penicillinAllergy === '')
      return "Answer 'Penicillin-allergic (true allergy or documented intolerance)': Yes or No. The oral arm turns on it";
    if (mh.penicillinAllergy === 'yes' && !mh.penicillinAllergyHistory.trim())
      return "Complete 'Penicillin allergy history, in the patient's own terms'";
    if (mh.pregnant && !mh.pregnancyEstablishedHow.trim()) return "Complete 'How pregnancy status was established'";
    if (clinicalAssessment.route === 'macrolide' && mh.breastfeeding && mh.breastfeedingDiscussed === '')
      return "Answer 'Macrolide in breastfeeding: has the choice been discussed with the patient and recorded in the notes?': Yes or No";
    if (isChild && oralRoute && clinicalAssessment.route === 'macrolide' && !mh.cannotBeWeighed) {
      const w = parseFloat(mh.weightKg);
      if (isNaN(w) || w <= 0) return "Complete 'Weight in kilograms, measured today' (the macrolide dose is by weight), or tick 'The child cannot be weighed today'";
    }
    return '';
  };

  const isMedicalHistoryValid = (): boolean => medicalHistoryError() === '';

  const isContraindicationsValid = (): boolean => {
    return !shouldRefer;
  };

  const treatmentError = (): string => {
    const t = data.treatmentSelection;
    if (!t.treatment) return "Select the 'Selected treatment'";
    if (!t.formulation) return "Select the 'Formulation'";
    if (!t.doseValue) return "Select the 'Dose' from the document's regimens for this arm, age and weight";
    if (t.treatment === 'clarithromycin' && t.doseValue === 'clari-500' && !t.severeDoseReason.trim())
      return "Clarithromycin 500mg twice a day is for severe infection only: complete 'Clarithromycin 500mg twice a day: reason'";
    if (!t.duration) return "Select the 'Duration'";
    if (t.duration === '7 days' && !t.extensionReason.trim()) return "A 7 day course is clinical judgement only: complete 'Reason for extending to 7 days'";
    if (t.quantity <= 0) return 'Quantity could not be computed: check the dose and duration';
    return '';
  };

  const isTreatmentSelectionValid = (): boolean => treatmentError() === '';

  const counsellingError = (): string => {
    const c = data.counselling;
    const t = data.treatmentSelection.treatment;
    if (!c.hygieneAdvice) return "Tick 'Hygiene advice: do not share towels, flannels or bedding' once given";
    if (!c.handwashing) return "Tick 'Wash hands after touching the lesions' once given";
    if (!c.schoolExclusion) return "Tick 'Stay away from school or nursery' once given";
    if (!c.avoidTouching) return "Tick 'Keep the lesions covered where practical' once given";
    if (!c.contagionPeriod) return "Tick 'Infection is contagious until the lesions have crusted and dried' once given";
    if (!c.noCombination) return "Tick 'Told that topical and oral treatment are not combined' once given";
    if (!c.drugSpecificAdvice) return "Tick the medicine-specific advice item (the one starting with the name of the product supplied) once given";
    if (!c.completeCourse) return "Tick 'Complete the course, even if improving' once given";
    if ((t === 'fusidic-acid' || t === 'hydrogen-peroxide') && !c.applicationAdvice)
      return "Tick 'Application technique for topical treatment' once given";
    if (!c.returnIfWorsening) return "Tick 'Come back if there is no improvement' once given";
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

  // A stop anywhere disables Next on every step: the progress bar only goes
  // backwards, so this is the only forward path. The excluded patient is
  // saved from whichever step raised the stop with "Save as not supplied".
  const canProceedNow = canProceedToNextStep(currentStep) && !shouldRefer;

  const handleNext = () => {
    if (canProceedNow) {
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
      clinicalData: {
        ...data,
        alerts: clinicalAssessment.alerts,
        referralReasons,
        // A hydrogen peroxide P sale is not a PGD supply: flagged so the audit
        // does not count it as one.
        pSale: !shouldRefer && data.treatmentSelection.treatment === 'hydrogen-peroxide',
      } as unknown as Record<string, unknown>,
      outcome: shouldRefer
        ? 'referred'
        : data.treatmentSelection.treatment === 'hydrogen-peroxide'
          ? 'not_supplied'
          : 'completed',
      medicine:
        !shouldRefer && data.treatmentSelection.treatment && data.treatmentSelection.treatment !== 'hydrogen-peroxide'
          ? {
              name: data.treatmentSelection.treatment,
              dose: `${data.treatmentSelection.dose}; ${data.treatmentSelection.frequency}`,
              duration: data.treatmentSelection.duration,
              quantity: `${data.treatmentSelection.quantity} ${data.treatmentSelection.quantityUnit}`.trim(),
            }
          : undefined,
      summary: {
        pharmacistName: data.summary.pharmacistName || __pharmProfile?.name || '',
        pharmacistGPhC: data.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || '',
        pharmacyName: data.summary.pharmacyName || __pharmProfile?.pharmacyName || '',
        pharmacyAddress: data.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || '',
        consultationDate: data.summary.consultationDate,
        consultationTime: data.summary.consultationTime,
        clinicalNotes: [
          shouldRefer && data.summary.referralAdvice ? `Advice given on referral: ${data.summary.referralAdvice}` : '',
          shouldRefer && referralReasons.length ? `Referral criteria: ${referralReasons.join(' ')}` : '',
          data.summary.adverseDrugReactions ? `Adverse drug reactions: ${data.summary.adverseDrugReactions}` : '',
          data.summary.clinicalNotes,
        ]
          .filter(Boolean)
          .join('\n'),
      },
      consent: { notifyGp: data.consent.notifyGp },
    };
  }, [data, shouldRefer, clinicalAssessment.alerts, referralReasons, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setData(initialData());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 print:bg-white print:min-h-0">
      <div className="hidden print:block">
        <ImpetigoSummaryReport data={data} alerts={clinicalAssessment.alerts} referralReasons={referralReasons} stopped={shouldRefer} />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 print:hidden">
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
          {shouldRefer && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
              <p className="text-sm font-medium text-red-800">
                Not supplied under this PGD. Record where the patient was referred and the advice given (same-day for interacting medicines, as the document directs), then use &quot;Save as not supplied&quot;.
              </p>
              <ul className="text-xs text-red-800 list-disc list-inside">
                {referralReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <TextArea
                label="Advice given and referral arranged (PGD records requirement)"
                value={data.summary.referralAdvice}
                onChange={(v) => setData((prev) => ({ ...prev, summary: { ...prev.summary, referralAdvice: v } }))}
                placeholder="e.g. Same-day GP appointment arranged at 16:00; explained why no antibiotic could be supplied; hygiene advice given"
                rows={2}
                required
              />
            </div>
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
            canProceed={canProceedNow}
            validationError={getValidationError(currentStep) || (shouldRefer ? 'Patient meets referral criteria and cannot proceed in pharmacy' : '')}
            isBlocked={shouldRefer}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            {currentStep === 0 && (
              <PatientDetailsStep
                patient={data.patientDetails}
                onChange={(field, value) =>
                  setData((prev) => ({
                    ...prev,
                    patientDetails: {
                      ...prev.patientDetails,
                      [field]: value,
                      // Age gates every arm and the record must show it, so it
                      // is written on every DOB change.
                      ...(field === 'dateOfBirth' ? { age: calculateAge(typeof value === 'string' ? value : '') } : {}),
                    },
                  }))
                }
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
                macrolideRoute={clinicalAssessment.route === 'macrolide'}
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
                age={patientAge ?? 0}
                weightKg={data.medicalHistory.weightKg}
                hydrogenPeroxide={data.lesionAssessment.hydrogenPeroxide}
                onChange={(treatment) => setData((prev) => ({ ...prev, treatmentSelection: treatment }))}
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
