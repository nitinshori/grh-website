'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { TextInput, Checkbox, SelectInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import type {
  PneumococcalPatientDetails,
  PneumococcalConsent,
  PneumococcalSummary,
} from './pneumococcal-types';
import {
  initialPneumococcalPatientDetails,
  initialPneumococcalConsent,
  initialPneumococcalSummary,
  CKD_CRITERION_LABELS,
  OTHER_ELIGIBILITY_LABELS,
} from './pneumococcal-types';
import {
  getPneumococcalClinicalAlerts,
  getPneumococcalDoseSchedule,
  getPneumococcalProductAvailability,
  shouldBlockConsultation,
  determinePneumococcalRiskLevel,
} from './pneumococcal-clinical-logic';
import {
  validatePneumococcalPatientStep,
  validatePneumococcalConsentStep,
  validatePneumococcalRiskAssessmentStep,
  validatePneumococcalAdministrationStep,
  validatePneumococcalSummaryStep,
} from './pneumococcal-validation';
import { calculateAge } from '../shared/types';
import PneumococcalSummaryReport from './components/PneumococcalSummaryReport';

const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Risk Assessment',
  'Medical History',
  'Review Contraindications',
  'Vaccine Administration',
  'Post-Vaccine Advice',
  'Summary',
] as const;

export function PneumococcalClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<PneumococcalPatientDetails>(
    initialPneumococcalPatientDetails
  );

  const [consent, setConsent] = useState<PneumococcalConsent>(initialPneumococcalConsent);

  const [riskAssessment, setRiskAssessment] = useState({
    confirmedRiskCategory: false,
    reviewedVaccineHistory: false,
    previousPCV13: false,
    previousPCV13Date: '',
    previousPCV20: false,
    previousPCV20Date: '',
    previousPPV23: false,
    previousPPV23Date: '',
    /** Vaxneuvance (PCV15) or Capvaxive (PCV21) at 2 years or older: excludes both products. */
    previousOtherPCV: false,
    previousOtherPCVDate: '',
    /** Prevenar 20 under 2 years on the risk-group schedule: refer to the GP (Green Book Table 3). */
    pcv20Under2RiskSchedule: false,
  });

  const [medicalHistory, setMedicalHistory] = useState({
    anaphylaxisToVaccine: false,
    anaphylaxisToVaccineComponent: false,
    diphtheriaToxoidHypersensitivity: false,
    severeFebrilleIllness: false,
    bleedingDisorder: false,
    severeImmunocompromise: false,
    currentOrRecentChemoRadiotherapy: false,
    pregnant: false,
    /** The only product this patient can have under the PGD is not held today: stop, save as not supplied. */
    requiredProductNotHeld: false,
    /** Patient declined after the discussion: stop, record the decision. */
    patientDeclined: false,
  });

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
    /** Advice given and decision reached where the patient is excluded (PGD records row). */
    exclusionAdvice: '',
  });

  const [summary, setSummary] = useState<PneumococcalSummary>(initialPneumococcalSummary());

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- profile arrives asynchronously from the shared hook; same pattern as every other ePGD tool
    setSummary((prev) => ({
      ...prev,
      pharmacistName: __pharmProfile.name,
      pharmacistGPhC: __pharmProfile.gphcNumber,
      pharmacyName: __pharmProfile.pharmacyName,
      pharmacyAddress: __pharmProfile.pharmacyAddress,
    }));
  }, [__pharmProfile, summary.pharmacistName, summary.pharmacistGPhC]);

  const [postVaccineAdvice, setPostVaccineAdvice] = useState({
    patientAdvised: false,
    counselledReactions: false,
    counselledBothVaccines: false,
    pilSupplied: false,
    followUpAdviceGiven: false,
    /** Observed for 15 minutes, seated, and the observation period completed (both arms of the PGD). */
    observationCompleted: false,
  });

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof PneumococcalPatientDetails, value: PneumococcalPatientDetails[keyof PneumococcalPatientDetails]) => {
      // Functional update: GP-practice autofill sets several fields in one
      // tick; a closure spread would drop all but the last. See meningitis fix.
      setPatientDetails((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === 'dateOfBirth') {
          updated.age = calculateAge(String(value ?? ''));
        }
        return updated;
      });
    },
    []
  );

  // Get clinical alerts
  const historyInput = useMemo(
    () => ({
      anaphylaxisToVaccine: medicalHistory.anaphylaxisToVaccine,
      anaphylaxisToVaccineComponent: medicalHistory.anaphylaxisToVaccineComponent,
      diphtheriaToxoidHypersensitivity: medicalHistory.diphtheriaToxoidHypersensitivity,
      severeFebrilleIllness: medicalHistory.severeFebrilleIllness,
      bleedingDisorder: medicalHistory.bleedingDisorder,
      severeImmunocompromise: medicalHistory.severeImmunocompromise,
      currentOrRecentChemoRadiotherapy: medicalHistory.currentOrRecentChemoRadiotherapy,
      pregnant: medicalHistory.pregnant,
      requiredProductNotHeld: medicalHistory.requiredProductNotHeld,
      patientDeclined: medicalHistory.patientDeclined,
      previousPCV13: riskAssessment.previousPCV13,
      previousPCV13Date: riskAssessment.previousPCV13Date,
      previousPCV20: riskAssessment.previousPCV20,
      previousPCV20Date: riskAssessment.previousPCV20Date,
      previousPPV23: riskAssessment.previousPPV23,
      previousPPV23Date: riskAssessment.previousPPV23Date,
      previousOtherPCV: riskAssessment.previousOtherPCV,
      previousOtherPCVDate: riskAssessment.previousOtherPCVDate,
      pcv20Under2RiskSchedule: riskAssessment.pcv20Under2RiskSchedule,
    }),
    [medicalHistory, riskAssessment]
  );

  const clinicalAlerts = useMemo(() => {
    return getPneumococcalClinicalAlerts(patientDetails, historyInput);
  }, [patientDetails, historyInput]);

  const isBlocked = useMemo(() => {
    return shouldBlockConsultation(clinicalAlerts);
  }, [clinicalAlerts]);

  // Which products the PGD allows for this patient today. The vaccine
  // dropdown hides a product that cannot be given and says why; the
  // administration validation keeps the same rule as a backstop.
  const productAvailability = useMemo(() => {
    return getPneumococcalProductAvailability(patientDetails, historyInput);
  }, [patientDetails, historyInput]);

  // Determine recommended dose
  const doseSchedule = useMemo(() => {
    return getPneumococcalDoseSchedule(patientDetails, {
      previousPCV13: riskAssessment.previousPCV13,
      previousPCV20: riskAssessment.previousPCV20,
      previousPPV23: riskAssessment.previousPPV23,
      previousOtherPCV: riskAssessment.previousOtherPCV,
      pcv20Under2RiskSchedule: riskAssessment.pcv20Under2RiskSchedule,
    });
  }, [patientDetails, riskAssessment]);

  // Validation
  const patientValidationError = useMemo(() => {
    return validatePneumococcalPatientStep(patientDetails);
  }, [patientDetails]);

  const consentValidationError = useMemo(() => {
    return validatePneumococcalConsentStep(consent, patientDetails.age);
  }, [consent, patientDetails.age]);

  const riskValidationError = useMemo(() => {
    return validatePneumococcalRiskAssessmentStep(riskAssessment);
  }, [riskAssessment]);

  const administrationValidationError = useMemo(() => {
    return validatePneumococcalAdministrationStep(summary, patientDetails, historyInput);
  }, [summary, patientDetails, historyInput]);

  const summaryValidationError = useMemo(() => {
    return validatePneumococcalSummaryStep(summary);
  }, [summary]);

  // Step can proceed checks
  const canProceedStep0 = patientValidationError === null;
  const canProceedStep1 = consentValidationError === null;
  const canProceedStep2 = riskValidationError === null;
  const canProceedStep3 = true; // Medical history is always valid
  const canProceedStep4 = contraIndicationsReviewed.confirmedNoAbsoluteContraindications && !isBlocked;
  const canProceedStep5 = administrationValidationError === null;
  const canProceedStep6 =
    postVaccineAdvice.observationCompleted &&
    postVaccineAdvice.patientAdvised &&
    postVaccineAdvice.counselledReactions &&
    postVaccineAdvice.pilSupplied &&
    postVaccineAdvice.followUpAdviceGiven;
  const postVaccineValidationError = !postVaccineAdvice.observationCompleted
    ? 'Tick "Observed for 15 minutes after vaccination" once the observation period has been completed'
    : !postVaccineAdvice.counselledReactions
    ? 'Tick "Patient informed of possible side effects and when to seek help"'
    : !postVaccineAdvice.followUpAdviceGiven
      ? 'Tick "Follow-up advice given"'
      : !postVaccineAdvice.pilSupplied
        ? 'Tick "Patient information leaflet (PIL) supplied"'
        : !postVaccineAdvice.patientAdvised
          ? 'Tick "All counselling completed and documented"'
          : null;
  const canProceedStep7 = summaryValidationError === null;

  const canProceedByStep = [
    canProceedStep0,
    canProceedStep1,
    canProceedStep2,
    canProceedStep3,
    canProceedStep4,
    canProceedStep5,
    canProceedStep6,
    canProceedStep7,
  ];

  const handleNext = () => {
    if (canProceedByStep[currentStep]) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step, including before a product has been
  // chosen, so that an excluded patient can be saved as "not supplied".
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const stopped = clinicalAlerts.some((a) => a.severity === 'stop');
    const productLabel = summary.vaccineType === 'pcv20' ? 'Prevenar 20 (PCV20)' : summary.vaccineType === 'ppv23' ? 'Pneumovax 23 (PPV23)' : '';
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
        gpAddress: patientDetails.gpAddress,
        gpPhone: patientDetails.gpPhone,
        gpEmail: patientDetails.gpEmail,
        gpOdsCode: patientDetails.gpOdsCode,
      },
      medicine:
        !stopped && productLabel
          ? {
              name: productLabel,
              dose: `0.5 mL ${summary.administrationSite.endsWith('-sc') ? 'subcutaneous' : 'intramuscular'}, dose ${summary.doseNumber || '1'}`,
              duration: 'Single dose this attendance',
              quantity: 1,
            }
          : undefined,
      clinicalData: {
        patient: patientDetails,
        consent,
        riskAssessment,
        medicalHistory,
        contraIndicationsReviewed,
        postVaccineAdvice,
        summary,
        clinicalAlerts,
      } as unknown as Record<string, unknown>,
      outcome: stopped ? "not_supplied" : "completed",
      summary: {
        pharmacistName: summary.pharmacistName || __pharmProfile?.name || '',
        pharmacistGPhC: summary.pharmacistGPhC || __pharmProfile?.gphcNumber || '',
        pharmacyName: summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
        clinicalNotes: summary.clinicalNotes,
      },
      consent: { notifyGp: consent.notifyGp },
    };
  }, [patientDetails, consent, riskAssessment, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialPneumococcalPatientDetails);
    setConsent(initialPneumococcalConsent);
    setRiskAssessment({
      confirmedRiskCategory: false,
      reviewedVaccineHistory: false,
      previousPCV13: false,
      previousPCV13Date: '',
      previousPCV20: false,
      previousPCV20Date: '',
      previousPPV23: false,
      previousPPV23Date: '',
      previousOtherPCV: false,
      previousOtherPCVDate: '',
      pcv20Under2RiskSchedule: false,
    });
    setMedicalHistory({
      anaphylaxisToVaccine: false,
      anaphylaxisToVaccineComponent: false,
      diphtheriaToxoidHypersensitivity: false,
      severeFebrilleIllness: false,
      bleedingDisorder: false,
      severeImmunocompromise: false,
      currentOrRecentChemoRadiotherapy: false,
      pregnant: false,
      requiredProductNotHeld: false,
      patientDeclined: false,
    });
    setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: false, exclusionAdvice: '' });
    setPostVaccineAdvice({
      patientAdvised: false,
      counselledReactions: false,
      counselledBothVaccines: false,
      pilSupplied: false,
      followUpAdviceGiven: false,
      observationCompleted: false,
    });
    setSummary(initialPneumococcalSummary());
  }, []);

  // The PGD requires the advice given to an excluded patient to be recorded.
  // A stop raised on an earlier step disables Next, so the advice box that
  // lived only on the Review Contraindications step could never be reached
  // for those patients (walkthrough review, 11 Sep 2026).
  const exclusionNotes = isBlocked ? (
    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
      <p className="text-red-700 text-sm font-semibold">
        Excluded: the patient cannot be vaccinated under this PGD. Refer to the GP as appropriate and document the advice given and the decision reached.
      </p>
      <TextArea
        label="Advice given and decision reached (saved with the exclusion record)"
        value={contraIndicationsReviewed.exclusionAdvice ?? ''}
        onChange={(v) => setContraIndicationsReviewed({ ...contraIndicationsReviewed, exclusionAdvice: v })}
        placeholder="e.g., Febrile illness today: advised to return once recovered."
        rows={3}
      />
      <p className="text-xs text-red-700">Then use &quot;Save as not supplied&quot; below to record the consultation.</p>
    </div>
  ) : null;

  // Two ways a visit can end without a supply that are not clinical
  // exclusions. Each raises a stop so that "Save as not supplied" appears
  // and the advice given is recorded. Shown on the Medical History and the
  // Vaccine Administration steps (same state), because stock is usually
  // checked and a patient usually declines once the product is in view.
  const noSupplyControls = (
    <div className="border-t pt-4 mt-4 space-y-3">
      <h4 className="font-medium text-sm text-navy-900">No supply today</h4>
      <Checkbox
        label="The only product this patient can have under the PGD is not held today"
        checked={medicalHistory.requiredProductNotHeld}
        onChange={(v) =>
          setMedicalHistory({ ...medicalHistory, requiredProductNotHeld: v })
        }
        description="For example Pneumovax 23 for a later 5-yearly cycle after Prevenar 20, or Pneumovax 23 where Prevenar 20 is excluded. Advise how the vaccine can be accessed through the GP, or book the patient to return when stock is held, and record the advice."
      />
      <Checkbox
        label="Patient declined vaccination"
        checked={medicalHistory.patientDeclined}
        onChange={(v) => setMedicalHistory({ ...medicalHistory, patientDeclined: v })}
        description="Record the advice given and the decision reached; inform the GP as appropriate."
      />
    </div>
  );

  return (
    <>
      <div className="mb-6">
        <ProgressBar
          stepLabels={STEP_LABELS}
          currentStep={currentStep}
          onStepClick={(step) => {
            // Backwards only. Going forward always means pressing Next, where
            // the stops are enforced.
            if (step < currentStep) {
              setCurrentStep(step);
            }
          }}
          completedSteps={completedSteps}
          hasErrors={patientValidationError !== null || consentValidationError !== null}
        />
      </div>

      {clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}

      {/* Step 0: Patient Details */}
      {currentStep === 0 && (
        <StepWrapper
          title={STEP_LABELS[0]}
          description="Collect patient information and confirm at-risk status"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep0}
          validationError={patientValidationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <PatientDetailsStep
            patient={patientDetails}
            onChange={handlePatientDetailsChange}
            requireAdult={false}
          />
          <div className="mt-6 border-t pt-6 space-y-4">
            <SelectInput
              label="Eligibility group under national guidance (Green Book chapter 25)"
              value={patientDetails.riskCategory}
              onChange={(v) =>
                handlePatientDetailsChange(
                  'riskCategory',
                  v as PneumococcalPatientDetails['riskCategory']
                )
              }
              options={[
                { value: 'asplenia', label: 'Asplenia or splenic dysfunction (including sickle cell disease)' },
                { value: 'ckd', label: 'Chronic kidney disease: nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant' },
                { value: 'chronic-disease', label: 'Chronic respiratory, heart, liver or neurological disease, or diabetes requiring insulin or anti-diabetic medication (not diet controlled only)' },
                { value: 'immunosuppressed', label: 'Immunosuppressed' },
                { value: 'cochlear', label: 'Cochlear implant' },
                { value: 'csf-leak', label: 'Cerebrospinal fluid leak' },
                { value: 'age-65-plus', label: 'Adult aged 65 years and over' },
                { value: 'other-national-guidance', label: 'Other group eligible under national guidance (metal fumes or homelessness)' },
                { value: 'not-eligible', label: 'Not in an eligible group (for example a healthy adult under 65 asking privately)' },
              ]}
              required
            />

            {patientDetails.riskCategory === 'ckd' && (
              <>
                <SelectInput
                  label="Green Book criterion that applies (chronic kidney disease)"
                  value={patientDetails.ckdCriterion || ''}
                  onChange={(v) =>
                    handlePatientDetailsChange(
                      'ckdCriterion',
                      v as PneumococcalPatientDetails['ckdCriterion']
                    )
                  }
                  options={(Object.keys(CKD_CRITERION_LABELS) as Array<keyof typeof CKD_CRITERION_LABELS>).map((k) => ({
                    value: k,
                    label: CKD_CRITERION_LABELS[k],
                  }))}
                  required
                />
                <p className="text-xs text-gray-600">
                  The chronic kidney disease group is nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant (Green Book Table 2). It is one of the three groups revaccinated every 5 years. Stage 3 CKD or milder is not in this group: select the eligibility group that applies, or refer.
                </p>
              </>
            )}

            {patientDetails.riskCategory === 'chronic-disease' && (
              <TextInput
                label="Specify chronic disease type"
                value={patientDetails.chronicDiseaseType || ''}
                onChange={(v) =>
                  handlePatientDetailsChange('chronicDiseaseType', v)
                }
                required
                placeholder="e.g., COPD, asthma, heart disease, cirrhosis, or diabetes requiring insulin or anti-diabetic medication (not diet controlled only)"
              />
            )}

            {patientDetails.riskCategory === 'other-national-guidance' && (
              <SelectInput
                label="Green Book chapter 25 group that applies"
                value={patientDetails.otherEligibilityReason || ''}
                onChange={(v) =>
                  handlePatientDetailsChange(
                    'otherEligibilityReason',
                    v as PneumococcalPatientDetails['otherEligibilityReason']
                  )
                }
                options={(Object.keys(OTHER_ELIGIBILITY_LABELS) as Array<keyof typeof OTHER_ELIGIBILITY_LABELS>).map((k) => ({
                  value: k,
                  label: OTHER_ELIGIBILITY_LABELS[k],
                }))}
                required
              />
            )}

            {patientDetails.riskCategory === 'not-eligible' && (
              <p className="text-xs text-gray-600">
                Not authorised under this PGD, whatever the product licence says. Explain, record the advice given below, and refer to the GP if there is a clinical question.
              </p>
            )}

            {patientDetails.riskCategory === 'immunosuppressed' && (
              <TextInput
                label="Reason for immunosuppression"
                value={patientDetails.immunosuppressedReason || ''}
                onChange={(v) =>
                  handlePatientDetailsChange('immunosuppressedReason', v)
                }
                required
                placeholder="e.g., HIV/AIDS, chemotherapy, transplant, biologic therapy"
              />
            )}

            <TextInput
              label="Known allergies (if any)"
              value={patientDetails.knownAllergies}
              onChange={(v) => handlePatientDetailsChange('knownAllergies', v)}
              placeholder="Enter any known allergies"
            />
          </div>
          {exclusionNotes}
        </StepWrapper>
      )}

      {/* Step 1: Consent */}
      {currentStep === 1 && (
        <StepWrapper
          title={STEP_LABELS[1]}
          description="Obtain informed consent and ID verification"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep1}
          validationError={consentValidationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <ConsentStep
            consent={consent}
            onChange={(field, value) => setConsent({ ...consent, [field]: value })}
          />

          {patientDetails.age !== null && patientDetails.age < 16 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-blue-900">
                Patient is under 16: record the basis of consent
              </p>
              <p className="text-xs text-blue-900">
                Valid consent must come from a person with parental responsibility, or from the young person where you assess them as Gillick competent. A parent accompanying a child does not automatically hold parental responsibility: ask.
              </p>
              <SelectInput
                label="Consent given by"
                value={consent.consentBasis}
                onChange={(v) =>
                  setConsent({ ...consent, consentBasis: v as PneumococcalConsent['consentBasis'] })
                }
                options={[
                  { value: 'parental', label: 'A person with parental responsibility' },
                  { value: 'gillick', label: 'The young person, assessed as Gillick competent' },
                ]}
                required
              />
              {consent.consentBasis === 'parental' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput
                    label="Name of person with parental responsibility"
                    value={consent.parentName}
                    onChange={(v) => setConsent({ ...consent, parentName: v })}
                    placeholder="Full name"
                    required
                  />
                  <TextInput
                    label="Relationship to the patient"
                    value={consent.parentRelationship}
                    onChange={(v) => setConsent({ ...consent, parentRelationship: v })}
                    placeholder="Mother, father, guardian"
                    required
                  />
                </div>
              )}
              {consent.consentBasis === 'gillick' && (
                <TextArea
                  label="Basis of the Gillick competence assessment"
                  value={consent.gillickBasis}
                  onChange={(v) => setConsent({ ...consent, gillickBasis: v })}
                  placeholder="What the young person understood about the vaccine, its benefits and risks, and the decision being made."
                  rows={3}
                  required
                />
              )}
            </div>
          )}

          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="Patient understands why pneumococcal vaccination is needed"
              checked={consent.understandsVaccineNeed}
              onChange={(v) => setConsent({ ...consent, understandsVaccineNeed: v })}
              description="Based on their eligibility group"
            />
            <Checkbox
              label="Patient understands the vaccination schedule"
              checked={consent.understandsSchedule}
              onChange={(v) => setConsent({ ...consent, understandsSchedule: v })}
              description="Single 0.5 mL dose of Prevenar 20 (one lifetime dose) or Pneumovax 23. Revaccination every 5 years only for asplenia, splenic dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant): Prevenar 20 once if never given, otherwise Pneumovax 23. No other group is revaccinated."
            />
            <Checkbox
              label="Patient is aware of possible side effects"
              checked={consent.understandsSideEffects}
              onChange={(v) => setConsent({ ...consent, understandsSideEffects: v })}
              description="Injection site soreness, mild fever, fatigue"
            />
          </div>
          {exclusionNotes}
        </StepWrapper>
      )}

      {/* Step 2: Risk Assessment */}
      {currentStep === 2 && (
        <StepWrapper
          title={STEP_LABELS[2]}
          description="Confirm at-risk category and review previous vaccine doses"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep2}
          validationError={riskValidationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Risk Category:</p>
              <p className="text-sm text-blue-800 mt-1">
                {determinePneumococcalRiskLevel(patientDetails.riskCategory).level}
              </p>
              {patientDetails.chronicDiseaseType && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Type:</strong> {patientDetails.chronicDiseaseType}
                </p>
              )}
              {patientDetails.immunosuppressedReason && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Reason:</strong> {patientDetails.immunosuppressedReason}
                </p>
              )}
            </div>

            <Checkbox
              label="Risk category confirmed as documented"
              checked={riskAssessment.confirmedRiskCategory}
              onChange={(v) =>
                setRiskAssessment({ ...riskAssessment, confirmedRiskCategory: v })
              }
              description="Confirm patient meets at-risk criteria for pneumococcal vaccination"
            />

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm text-navy-900 mb-3">Previous Pneumococcal Vaccines</h4>

              <div className="space-y-3">
                <Checkbox
                  label="Previous PCV13 (Prevenar 13) dose given"
                  checked={riskAssessment.previousPCV13}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, previousPCV13: v })
                  }
                  description="Vaccine history only: Prevenar 13 is not given under this PGD. A previous course at any age (including the infant schedule) does not exclude, provided at least 8 weeks have elapsed. If yes, enter the date of the most recent dose below"
                />

                {riskAssessment.previousPCV13 && (
                  <div className="pl-6">
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Date of PCV13 dose <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={riskAssessment.previousPCV13Date}
                      onChange={(e) =>
                        setRiskAssessment({ ...riskAssessment, previousPCV13Date: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                    />
                  </div>
                )}

                <Checkbox
                  label="Previous PCV20 (Prevenar 20) dose given at 2 years of age or older"
                  checked={riskAssessment.previousPCV20}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, previousPCV20: v })
                  }
                  description="A dose given at 2 years or older. Prevenar 20 is a single lifetime dose and is never repeated under this PGD; it also starts the 5-year count for Pneumovax 23 revaccination. Infant doses under 2 years are recorded with the checkbox below, not here. If yes, enter date below"
                />

                {riskAssessment.previousPCV20 && (
                  <div className="pl-6">
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Date of PCV20 dose <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={riskAssessment.previousPCV20Date}
                      onChange={(e) =>
                        setRiskAssessment({ ...riskAssessment, previousPCV20Date: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                    />
                  </div>
                )}

                <Checkbox
                  label="Prevenar 20 given under 2 years on the risk-group schedule"
                  checked={riskAssessment.pcv20Under2RiskSchedule}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, pcv20Under2RiskSchedule: v })
                  }
                  description="A child who had Prevenar 20 as an infant on the under-2 risk-group schedule is referred to the GP to complete Green Book Table 3; the remaining doses are not given under this PGD."
                />

                <Checkbox
                  label="Previous PPV23 (Pneumovax 23) dose given"
                  checked={riskAssessment.previousPPV23}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, previousPPV23: v })
                  }
                  description="Any previous PPV23 excludes both products, except the 5-yearly revaccination of asplenia, splenic dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant): that dose is Prevenar 20 where it has never been given, otherwise Pneumovax 23. If yes, enter date below"
                />

                {riskAssessment.previousPPV23 && (
                  <div className="pl-6">
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Date of PPV23 dose <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={riskAssessment.previousPPV23Date}
                      onChange={(e) =>
                        setRiskAssessment({ ...riskAssessment, previousPPV23Date: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                    />
                  </div>
                )}

                <Checkbox
                  label="Other pneumococcal vaccine (Vaxneuvance PCV15 or Capvaxive PCV21) at 2 years or older"
                  checked={riskAssessment.previousOtherPCV}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, previousOtherPCV: v })
                  }
                  description="Excludes both Prevenar 20 and Pneumovax 23 whatever the interval: treated as a completed course, and the 5-yearly revaccination rule does not apply to it. Also counts as a conjugate vaccine for the 8-week interval. If yes, enter date below"
                />

                {riskAssessment.previousOtherPCV && (
                  <div className="pl-6">
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Date of Vaxneuvance or Capvaxive dose <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={riskAssessment.previousOtherPCVDate}
                      onChange={(e) =>
                        setRiskAssessment({ ...riskAssessment, previousOtherPCVDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            <Checkbox
              label="Vaccine history reviewed"
              checked={riskAssessment.reviewedVaccineHistory}
              onChange={(v) =>
                setRiskAssessment({ ...riskAssessment, reviewedVaccineHistory: v })
              }
              description="Confirm previous vaccine doses have been reviewed"
            />

            {doseSchedule && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold text-amber-900">Recommended Schedule:</p>
                <p className="text-sm text-amber-800 mt-2">
                  <strong>Vaccine:</strong> {doseSchedule.recommendedVaccine}
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  <strong>Sequence:</strong> {doseSchedule.doseSequence}
                </p>
                <p className="text-sm text-amber-800 mt-2">{doseSchedule.guidance}</p>
              </div>
            )}
          </div>
          {exclusionNotes}
        </StepWrapper>
      )}

      {/* Step 3: Medical History */}
      {currentStep === 3 && (
        <StepWrapper
          title={STEP_LABELS[3]}
          description="Assess relevant medical history and contraindications"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep3}
          validationError={null}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            <Checkbox
              label="Severe allergic reaction to a previous pneumococcal vaccine"
              checked={medicalHistory.anaphylaxisToVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, anaphylaxisToVaccine: v })
              }
              description="Excluded under the PGD: do not proceed"
            />

            <Checkbox
              label="Known hypersensitivity to Pneumovax 23, Prevenar 20 or any of their components"
              checked={medicalHistory.anaphylaxisToVaccineComponent}
              onChange={(v) =>
                setMedicalHistory({
                  ...medicalHistory,
                  anaphylaxisToVaccineComponent: v,
                })
              }
              description="Excluded under the PGD: do not proceed. Prevenar 20 excipients: sodium chloride, succinic acid, polysorbate 80, aluminium phosphate."
            />

            <Checkbox
              label="Hypersensitivity to diphtheria toxoid (CRM197 carrier protein)"
              checked={medicalHistory.diphtheriaToxoidHypersensitivity}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, diphtheriaToxoidHypersensitivity: v })
              }
              description="Prevenar 20 exclusion. Pneumovax 23 may still be given where indicated."
            />

            <Checkbox
              label="Acute illness with fever"
              checked={medicalHistory.severeFebrilleIllness}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeFebrilleIllness: v })
              }
              description="Postpone vaccination until recovered. A minor illness without fever or systemic upset is not a reason to postpone."
            />

            <Checkbox
              label="Severe immunocompromise: bone marrow transplant, acute or chronic leukaemia, multiple myeloma, or a genetic immune disorder (IRAK-4, NEMO)"
              checked={medicalHistory.severeImmunocompromise}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeImmunocompromise: v })
              }
              description="Excluded under both arms: the Green Book multi-dose sequence needs specialist input. Refer. Other immunosuppression (HIV, systemic steroids, completed chemotherapy) is not an exclusion."
            />

            <Checkbox
              label="Currently receiving chemotherapy or radiotherapy, or within 3 months of completing it (6 months after chemotherapy for leukaemia)"
              checked={medicalHistory.currentOrRecentChemoRadiotherapy}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, currentOrRecentChemoRadiotherapy: v })
              }
              description="Not given under this PGD: refer to the treating team, which decides the timing (long-term maintenance treatment is not an indefinite deferral). Leave unticked where treatment is planned and has not started: give at least 2 weeks before it does."
            />

            <Checkbox
              label="Pregnant"
              checked={medicalHistory.pregnant}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, pregnant: v })
              }
              description="Caution, not an exclusion, in both arms (Prevenar 20 and Pneumovax 23). Inactivated vaccine; the SmPC has no data in pregnancy. Tell her that, record it, and give the vaccine. Breastfeeding is not a reason to withhold."
            />

            <Checkbox
              label="Bleeding disorder, thrombocytopenia or anticoagulation"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })
              }
              description="Caution: intramuscular with a 23G or finer needle and firm pressure for at least 2 minutes. Where the haematology team advises against intramuscular injection, Pneumovax 23 subcutaneously or refer; Prevenar 20 is intramuscular only."
            />

            {noSupplyControls}
          </div>
          {exclusionNotes}
        </StepWrapper>
      )}

      {/* Step 4: Review Contraindications */}
      {currentStep === 4 && (
        <StepWrapper
          title={STEP_LABELS[4]}
          description="Review clinical alerts and confirm no absolute contraindications"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep4}
          validationError={
            isBlocked
              ? 'Excluded: the patient cannot be vaccinated under this PGD. Record the advice given, then use "Save as not supplied".'
              : !contraIndicationsReviewed.confirmedNoAbsoluteContraindications
                ? 'Tick "I confirm no absolute contraindications are present and vaccination can proceed"'
                : null
          }
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            {exclusionNotes}

            {clinicalAlerts.length === 0 && !isBlocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm font-semibold">
                  No clinical alerts identified. Patient is suitable for pneumococcal vaccination.
                </p>
              </div>
            )}

            {clinicalAlerts.length > 0 && (
              <div className="space-y-2">
                {clinicalAlerts.map((alert) => (
                  <div
                    key={alert.code}
                    className={`p-3 rounded-lg text-sm ${
                      alert.severity === 'stop'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <p className="font-semibold">{alert.message}</p>
                    <p className="text-xs mt-1 opacity-80">{alert.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {!isBlocked && (
              <Checkbox
                label="I confirm no absolute contraindications are present and vaccination can proceed"
                checked={contraIndicationsReviewed.confirmedNoAbsoluteContraindications}
                onChange={(v) =>
                  setContraIndicationsReviewed({
                    ...contraIndicationsReviewed,
                    confirmedNoAbsoluteContraindications: v,
                  })
                }
                description="Pharmacist declaration"
              />
            )}
          </div>
        </StepWrapper>
      )}

      {/* Step 5: Vaccine Administration */}
      {currentStep === 5 && (
        <StepWrapper
          title={STEP_LABELS[5]}
          description="Record vaccine details and administration information"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep5}
          validationError={administrationValidationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            <SelectInput
              label="Vaccine type"
              value={summary.vaccineType}
              onChange={(v) => {
                const vaccineType = v as PneumococcalSummary['vaccineType'];
                // Prevenar 20 is intramuscular only: drop a subcutaneous site
                // chosen before the product was changed.
                const administrationSite =
                  vaccineType === 'pcv20' && summary.administrationSite.endsWith('-sc')
                    ? ''
                    : summary.administrationSite;
                setSummary({ ...summary, vaccineType, administrationSite });
              }}
              options={[
                ...(productAvailability.pcv20Possible
                  ? [{ value: 'pcv20', label: 'Prevenar 20 (PCV20), 0.5 mL intramuscular (given in preference where held; once only)' }]
                  : []),
                ...(productAvailability.ppv23Possible
                  ? [{ value: 'ppv23', label: 'Pneumovax 23 (PPV23), 0.5 mL intramuscular or subcutaneous (where Prevenar 20 is not held, the SC route is needed, or later 5-yearly cycles after Prevenar 20)' }]
                  : []),
              ]}
              required
            />
            {!productAvailability.pcv20Possible && (
              <p className="text-xs text-red-700">
                Prevenar 20 cannot be selected: {productAvailability.pcv20Reason}.
              </p>
            )}
            {!productAvailability.ppv23Possible && (
              <p className="text-xs text-red-700">
                Pneumovax 23 cannot be selected: {productAvailability.ppv23Reason}.
              </p>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              <p className="font-semibold">Dose: single 0.5 mL dose.</p>
              <p className="text-xs mt-1">
                Product precedence: where Prevenar 20 is held it is given in preference. Pneumovax 23 is given where Prevenar 20 is not held, where the subcutaneous route is needed, or for later 5-yearly revaccination cycles once Prevenar 20 has been given once.
              </p>
              <p className="text-xs mt-1">
                {summary.vaccineType === 'pcv20'
                  ? 'Prevenar 20: intramuscular injection only, into the deltoid. Shake vigorously to a homogeneous white suspension; do not use if it cannot be resuspended or shows particles or discolouration. A single lifetime dose under this PGD, at least 8 weeks after any previous pneumococcal conjugate vaccine; never repeated. For asplenia, splenic dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant) it may be the 5-yearly revaccination dose where it has never been given; later cycles are Pneumovax 23.'
                  : 'Pneumovax 23: intramuscular or subcutaneous injection. Single dose; revaccination every 5 years ONLY for asplenia, splenic dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant), counted from the last PPV23 or PCV20 dose; not recommended for any other group. At least 8 weeks after any pneumococcal conjugate vaccine.'}
              </p>
              <p className="text-xs mt-2">
                <strong>Co-administration:</strong> may be given at the same time as any other vaccine (including influenza, COVID-19, shingles and RSV) at a separate site, preferably a different limb, or at least 2.5 cm apart; record the site of each vaccine. The Prevenar 20 SmPC notes that with adjuvanted influenza vaccine a gap of about 4 weeks may be considered in those at the highest risk of life-threatening pneumococcal disease; this is not a requirement and must not delay either vaccine.
              </p>
            </div>

            <SelectInput
              label="Dose number in sequence"
              value={summary.doseNumber}
              onChange={(v) => setSummary({ ...summary, doseNumber: v as '1' | '2' | '' })}
              options={[
                { value: '1', label: 'First pneumococcal dose under this PGD (Prevenar 20 or Pneumovax 23)' },
                { value: '2', label: '5-yearly revaccination (asplenia, splenic dysfunction or chronic kidney disease only): Prevenar 20 if never given, otherwise Pneumovax 23' },
              ]}
              required
            />

            <TextInput
              label="Batch number"
              value={summary.batchNumber}
              onChange={(v) => setSummary({ ...summary, batchNumber: v })}
              required
              placeholder="e.g., ABC123456"
            />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Expiry date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={summary.expiryDate}
                onChange={(e) => setSummary({ ...summary, expiryDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              />
            </div>

            <SelectInput
              label="Administration site"
              value={summary.administrationSite}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  administrationSite: v as PneumococcalSummary['administrationSite'],
                })
              }
              options={
                summary.vaccineType === 'pcv20'
                  ? [
                      { value: 'left-deltoid', label: 'Left deltoid, intramuscular' },
                      { value: 'right-deltoid', label: 'Right deltoid, intramuscular' },
                    ]
                  : [
                      { value: 'left-deltoid', label: 'Left deltoid, intramuscular' },
                      { value: 'right-deltoid', label: 'Right deltoid, intramuscular' },
                      { value: 'left-arm-sc', label: 'Left upper arm, subcutaneous (Pneumovax 23 only)' },
                      { value: 'right-arm-sc', label: 'Right upper arm, subcutaneous (Pneumovax 23 only)' },
                    ]
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Time of administration <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={summary.administrationTime}
                onChange={(e) => setSummary({ ...summary, administrationTime: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              />
            </div>

            {noSupplyControls}
          </div>
          {exclusionNotes}
        </StepWrapper>
      )}

      {/* Step 6: Post-Vaccine Advice */}
      {currentStep === 6 && (
        <StepWrapper
          title={STEP_LABELS[6]}
          description="Provide patient counselling and safety information"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep6}
          validationError={postVaccineValidationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Possible side effects to advise the patient about (PGD v008):</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Injection site pain, redness or swelling</li>
                <li>Fever, fatigue, headache; Prevenar 20 in adults also muscle pain and joint pain</li>
                <li>Prevenar 20 in children aged 2 to 4: irritability, drowsiness, decreased appetite, fever</li>
                <li>Uncommon with Prevenar 20: hypersensitivity including facial swelling, urticaria, chills, nausea, vomiting, diarrhoea</li>
                <li>Rare: allergic or hypersensitivity reactions including anaphylaxis</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Important information to share:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Most reactions are mild and resolve within 24-48 hours</li>
                <li>This is a single dose: adults at 65 and most risk groups need no further pneumococcal vaccine</li>
                <li>Asplenia, splenic dysfunction and chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant) have a repeat dose every 5 years, given with Pneumovax 23 (Prevenar 20 is given once only) or through the GP</li>
                <li>Paracetamol or ibuprofen can be taken for fever or myalgia</li>
                <li>Seek medical advice for a severe or persistent injection site reaction, a fever that does not settle within 48 hours, or any sign of an allergic reaction</li>
                <li>Call 999 for difficulty breathing, swelling of the face or throat, or collapse</li>
                <li>Explain why vaccination is important for their specific risk group</li>
              </ul>
            </div>

            <Checkbox
              label="Observed for 15 minutes after vaccination, seated, and the observation period completed"
              checked={postVaccineAdvice.observationCompleted}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, observationCompleted: v })
              }
              description="Required by both arms of the PGD. Tick only once the period has actually been completed."
              required
            />

            <Checkbox
              label="Patient informed of possible side effects and when to seek help"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })
              }
              description="Required by the PGD cautions row"
              required
            />

            <Checkbox
              label="Follow-up advice given"
              checked={postVaccineAdvice.followUpAdviceGiven}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, followUpAdviceGiven: v })
              }
              description="Seek medical advice for a severe or persistent injection site reaction, a fever that does not settle within 48 hours, or any sign of an allergic reaction; call 999 for difficulty breathing, swelling of the face or throat, or collapse. Adults at 65 and most risk groups need no further pneumococcal vaccine; asplenia, splenic dysfunction and chronic kidney disease have a repeat dose every 5 years with Pneumovax 23 (Prevenar 20 once only) or through the GP."
              required
            />

            <Checkbox
              label="Patient information leaflet (PIL) supplied"
              checked={postVaccineAdvice.pilSupplied}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, pilSupplied: v })
              }
              required
            />

            <Checkbox
              label="Patient understands whether revaccination is due"
              checked={postVaccineAdvice.counselledBothVaccines}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledBothVaccines: v })
              }
              description="Single dose for adults at 65 and most risk groups. Asplenia, splenic dysfunction and chronic kidney disease repeat every 5 years with Pneumovax 23 (Prevenar 20 once only) or via the GP."
            />

            <Checkbox
              label="All counselling completed and documented"
              checked={postVaccineAdvice.patientAdvised}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, patientAdvised: v })
              }
              description="Confirm pharmacist has completed patient consultation"
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 7: Summary */}
      {currentStep === 7 && (
        <StepWrapper
          title={STEP_LABELS[7]}
          description="Complete pharmacist declaration and generate consultation record"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={() => {}}
          onPrev={handlePrev}
          canProceed={canProceedStep7}
          validationError={summaryValidationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          <div className="space-y-4 print:hidden">
            <TextInput
              label="Pharmacist name"
              value={summary.pharmacistName}
              onChange={(v) => setSummary({ ...summary, pharmacistName: v })}
              required
              placeholder="Full name"
            />

            <TextInput
              label="GPhC registration number"
              value={summary.pharmacistGPhC}
              onChange={(v) => setSummary({ ...summary, pharmacistGPhC: v })}
              required
              placeholder="e.g., 123456"
            />

            <TextInput
              label="Pharmacy name"
              value={summary.pharmacyName}
              onChange={(v) => setSummary({ ...summary, pharmacyName: v })}
              placeholder="Pharmacy name"
            />

            <TextInput
              label="Pharmacy address"
              value={summary.pharmacyAddress}
              onChange={(v) => setSummary({ ...summary, pharmacyAddress: v })}
              placeholder="Full address"
            />

            <TextArea
              label="Clinical notes (optional)"
              value={summary.clinicalNotes}
              onChange={(v) => setSummary({ ...summary, clinicalNotes: v })}
              placeholder="Any additional clinical notes or recommendations"
              rows={4}
            />
          </div>

          {/* The printed record. StepWrapper's Save & Print prints this page,
              so the report has to be on it: before this it lived behind an
              onNext that the last step never calls, and what came out of the
              printer was the declaration form with no patient on it. */}
          <div className="mt-6">
            <PneumococcalSummaryReport
              patientDetails={patientDetails}
              consent={consent}
              summary={summary}
              riskAssessment={riskAssessment}
              medicalHistory={medicalHistory}
              clinicalAlerts={clinicalAlerts}
              postVaccineAdvice={postVaccineAdvice}
              exclusionAdvice={contraIndicationsReviewed.exclusionAdvice}
              embedded
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default PneumococcalClient;
