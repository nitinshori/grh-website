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
} from './pneumococcal-types';
import {
  getPneumococcalClinicalAlerts,
  getPneumococcalDoseSchedule,
  shouldBlockConsultation,
  determinePneumococcalRiskLevel,
} from './pneumococcal-clinical-logic';
import {
  validatePneumococcalPatientStep,
  validatePneumococcalConsentStep,
  validatePneumococcalRiskAssessmentStep,
  validatePneumococcalAdministrationStep,
  validatePneumococcalSummaryStep,
  ppv23FollowsPcv13,
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
  });

  const [medicalHistory, setMedicalHistory] = useState({
    anaphylaxisToVaccine: false,
    anaphylaxisToVaccineComponent: false,
    diphtheriaToxoidHypersensitivity: false,
    severeFebrilleIllness: false,
    bleedingDisorder: false,
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
    (field: keyof PneumococcalPatientDetails, value: any) => {
      // Functional update — GP-practice autofill sets several fields in one
      // tick; a closure spread would drop all but the last. See meningitis fix.
      setPatientDetails((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === 'dateOfBirth') {
          updated.age = calculateAge(value);
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
      previousPCV13: riskAssessment.previousPCV13,
      previousPCV13Date: riskAssessment.previousPCV13Date,
      previousPCV20: riskAssessment.previousPCV20,
      previousPCV20Date: riskAssessment.previousPCV20Date,
      previousPPV23: riskAssessment.previousPPV23,
      previousPPV23Date: riskAssessment.previousPPV23Date,
    }),
    [medicalHistory, riskAssessment]
  );

  const clinicalAlerts = useMemo(() => {
    return getPneumococcalClinicalAlerts(patientDetails, historyInput);
  }, [patientDetails, historyInput]);

  const isBlocked = useMemo(() => {
    return shouldBlockConsultation(clinicalAlerts);
  }, [clinicalAlerts]);

  // Determine recommended dose
  const doseSchedule = useMemo(() => {
    return getPneumococcalDoseSchedule(patientDetails, {
      previousPCV13: riskAssessment.previousPCV13,
      previousPCV20: riskAssessment.previousPCV20,
      previousPPV23: riskAssessment.previousPPV23,
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
    ? 'Record that the 15 minute seated observation period was completed'
    : !postVaccineAdvice.counselledReactions
    ? 'Confirm the patient was informed of possible side effects and when to seek help'
    : !postVaccineAdvice.followUpAdviceGiven
      ? 'Confirm the follow-up advice was given'
      : !postVaccineAdvice.pilSupplied
        ? 'Confirm the patient information leaflet was supplied'
        : !postVaccineAdvice.patientAdvised
          ? 'Patient must be advised'
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
    const productLabel = summary.vaccineType === 'pcv13' ? 'Prevenar 13 (PCV13)' : summary.vaccineType === 'ppv23' ? 'Pneumovax 23 (PPV23)' : '';
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
    });
    setMedicalHistory({
      anaphylaxisToVaccine: false,
      anaphylaxisToVaccineComponent: false,
      diphtheriaToxoidHypersensitivity: false,
      severeFebrilleIllness: false,
      bleedingDisorder: false,
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
                { value: 'ckd', label: 'Chronic kidney disease' },
                { value: 'chronic-disease', label: 'Chronic respiratory, heart, liver or neurological disease, or diabetes' },
                { value: 'immunosuppressed', label: 'Immunosuppressed' },
                { value: 'cochlear', label: 'Cochlear implant' },
                { value: 'csf-leak', label: 'Cerebrospinal fluid leak' },
                { value: 'age-65-plus', label: 'Adult aged 65 years and over' },
                { value: 'other-national-guidance', label: 'Other group eligible under national guidance (specify)' },
              ]}
              required
            />

            {patientDetails.riskCategory === 'chronic-disease' && (
              <TextInput
                label="Specify chronic disease type"
                value={patientDetails.chronicDiseaseType || ''}
                onChange={(v) =>
                  handlePatientDetailsChange('chronicDiseaseType', v)
                }
                required
                placeholder="e.g., COPD, asthma, heart disease, diabetes, cirrhosis"
              />
            )}

            {patientDetails.riskCategory === 'other-national-guidance' && (
              <TextInput
                label="Green Book chapter 25 group that applies"
                value={patientDetails.otherEligibilityReason || ''}
                onChange={(v) =>
                  handlePatientDetailsChange('otherEligibilityReason', v)
                }
                required
                placeholder="e.g., occupational exposure to metal fumes (welders); people experiencing homelessness (JCVI June 2024)"
              />
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
              description="Single 0.5 mL dose of each vaccine. Where both are indicated, Pneumovax 23 follows Prevenar 13 by at least 8 weeks. PPV23 revaccination every 5 years only for asplenia, splenic dysfunction or chronic kidney disease."
            />
            <Checkbox
              label="Patient is aware of possible side effects"
              checked={consent.understandsSideEffects}
              onChange={(v) => setConsent({ ...consent, understandsSideEffects: v })}
              description="Injection site soreness, mild fever, fatigue"
            />
          </div>
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
                  description="If yes, enter date below"
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
                  label="Previous PCV20 (Prevenar 20) dose given"
                  checked={riskAssessment.previousPCV20}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, previousPCV20: v })
                  }
                  description="Counts as a conjugate vaccine and, under the PGD, against PPV23 revaccination. If yes, enter date below"
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
                  label="Previous PPV23 (Pneumovax 23) dose given"
                  checked={riskAssessment.previousPPV23}
                  onChange={(v) =>
                    setRiskAssessment({ ...riskAssessment, previousPPV23: v })
                  }
                  description="If yes, enter date below"
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
              label="Known hypersensitivity to Pneumovax 23, Prevenar 13 or any of their components"
              checked={medicalHistory.anaphylaxisToVaccineComponent}
              onChange={(v) =>
                setMedicalHistory({
                  ...medicalHistory,
                  anaphylaxisToVaccineComponent: v,
                })
              }
              description="Excluded under the PGD: do not proceed"
            />

            <Checkbox
              label="Hypersensitivity to diphtheria toxoid (CRM197 carrier protein)"
              checked={medicalHistory.diphtheriaToxoidHypersensitivity}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, diphtheriaToxoidHypersensitivity: v })
              }
              description="Prevenar 13 exclusion. Pneumovax 23 may still be given where indicated."
            />

            <Checkbox
              label="Acute illness with fever"
              checked={medicalHistory.severeFebrilleIllness}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeFebrilleIllness: v })
              }
              description="Postpone vaccination until recovered"
            />

            <Checkbox
              label="Bleeding disorder"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })
              }
              description="Caution: use with caution in individuals with bleeding disorders"
            />
          </div>
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
            !contraIndicationsReviewed.confirmedNoAbsoluteContraindications
              ? 'You must confirm review before proceeding'
              : null
          }
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            {isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-red-700 text-sm font-semibold">
                  Absolute contraindication identified. Consultation cannot proceed. Patient
                  should be referred to their GP. Document the advice given and the decision reached.
                </p>
                <TextArea
                  label="Advice given and decision reached (saved with the exclusion record)"
                  value={contraIndicationsReviewed.exclusionAdvice ?? ''}
                  onChange={(v) => setContraIndicationsReviewed({ ...contraIndicationsReviewed, exclusionAdvice: v })}
                  placeholder="e.g., Febrile illness today: advised to return once recovered."
                  rows={3}
                />
                <p className="text-xs text-red-700">Then use "Save as not supplied" below to record the consultation.</p>
              </div>
            )}

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
              onChange={(v) =>
                setSummary({
                  ...summary,
                  vaccineType: v as 'pcv13' | 'ppv23' | '',
                })
              }
              options={[
                { value: 'pcv13', label: 'Prevenar 13 (PCV13), 0.5 mL intramuscular' },
                { value: 'ppv23', label: 'Pneumovax 23 (PPV23), 0.5 mL intramuscular or subcutaneous' },
              ]}
              required
            />

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              <p className="font-semibold">Dose: single 0.5 mL dose.</p>
              <p className="text-xs mt-1">
                {summary.vaccineType === 'pcv13'
                  ? 'Prevenar 13: intramuscular injection, for individuals aged 2 years and over who have not previously received a pneumococcal conjugate vaccine. Where PPV23 is also indicated, give it at least 8 weeks after the conjugate vaccine.'
                  : 'Pneumovax 23: intramuscular or subcutaneous injection. Revaccination every 5 years ONLY for asplenia, splenic dysfunction or chronic kidney disease; not recommended for any other group, and never within 3 years of a previous dose.'}
              </p>
            </div>

            <SelectInput
              label="Dose number in sequence"
              value={summary.doseNumber}
              onChange={(v) => setSummary({ ...summary, doseNumber: v as '1' | '2' | '' })}
              options={[
                { value: '1', label: 'Dose 1 (first pneumococcal vaccine)' },
                { value: '2', label: 'Dose 2 (PPV23 at least 8 weeks after the conjugate vaccine, or 5-yearly PPV23 revaccination)' },
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
              options={[
                { value: 'left-deltoid', label: 'Left deltoid, intramuscular' },
                { value: 'right-deltoid', label: 'Right deltoid, intramuscular' },
                { value: 'left-arm-sc', label: 'Left upper arm, subcutaneous (Pneumovax 23 only)' },
                { value: 'right-arm-sc', label: 'Right upper arm, subcutaneous (Pneumovax 23 only)' },
              ]}
              required
            />

            {ppv23FollowsPcv13(summary, patientDetails, historyInput) && (
              <TextInput
                label="Pneumovax 23 due (at least 8 weeks after this dose; book it at this appointment)"
                type="date"
                value={summary.counselledNextDue ?? ''}
                onChange={(v) => setSummary({ ...summary, counselledNextDue: v })}
                required
              />
            )}

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
          </div>
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
              <p className="text-sm font-semibold text-blue-900">Possible side effects to advise the patient about (PGD v006):</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Injection site pain, redness or swelling</li>
                <li>Fever, fatigue, headache</li>
                <li>Prevenar 13 in children: irritability, drowsiness, loss of appetite</li>
                <li>Rare: allergic or hypersensitivity reactions</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Important information to share:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Most reactions are mild and resolve within 24-48 hours</li>
                <li>Where both vaccines are indicated, Pneumovax 23 follows Prevenar 13 by at least 8 weeks</li>
                <li>PPV23 revaccination every 5 years only for asplenia, splenic dysfunction or chronic kidney disease; not recommended for any other group</li>
                <li>Paracetamol or ibuprofen can be taken for fever or myalgia</li>
                <li>Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell</li>
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
              label="Follow-up advice given: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell"
              checked={postVaccineAdvice.followUpAdviceGiven}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, followUpAdviceGiven: v })
              }
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
              label="Patient understands whether a second vaccine or revaccination is due"
              checked={postVaccineAdvice.counselledBothVaccines}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledBothVaccines: v })
              }
              description="Pneumovax 23 at least 8 weeks after Prevenar 13 where both are indicated; 5-yearly PPV23 only for asplenia, splenic dysfunction or chronic kidney disease"
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
              embedded
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default PneumococcalClient;
