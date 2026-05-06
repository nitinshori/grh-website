'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
    previousPPV23: false,
    previousPPV23Date: '',
  });

  const [medicalHistory, setMedicalHistory] = useState({
    anaphylaxisToVaccine: false,
    anaphylaxisToVaccineComponent: false,
    severeFebrilleIllness: false,
  });

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });

  const [summary, setSummary] = useState<PneumococcalSummary>(initialPneumococcalSummary());

  const [postVaccineAdvice, setPostVaccineAdvice] = useState({
    patientAdvised: false,
    counselledReactions: false,
    counselledBothVaccines: false,
  });

  const [showSummaryReport, setShowSummaryReport] = useState(false);

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof PneumococcalPatientDetails, value: any) => {
      const updated = { ...patientDetails, [field]: value };
      if (field === 'dateOfBirth') {
        updated.age = calculateAge(value);
      }
      setPatientDetails(updated);
    },
    [patientDetails]
  );

  // Get clinical alerts
  const clinicalAlerts = useMemo(() => {
    return getPneumococcalClinicalAlerts(patientDetails, {
      anaphylaxisToVaccine: medicalHistory.anaphylaxisToVaccine,
      anaphylaxisToVaccineComponent: medicalHistory.anaphylaxisToVaccineComponent,
      severeFebrilleIllness: medicalHistory.severeFebrilleIllness,
      previousPCV13: riskAssessment.previousPCV13,
      previousPCV13Date: riskAssessment.previousPCV13Date,
      previousPPV23: riskAssessment.previousPPV23,
      previousPPV23Date: riskAssessment.previousPPV23Date,
    });
  }, [patientDetails, medicalHistory, riskAssessment]);

  const isBlocked = useMemo(() => {
    return shouldBlockConsultation(clinicalAlerts);
  }, [clinicalAlerts]);

  // Determine recommended dose
  const doseSchedule = useMemo(() => {
    return getPneumococcalDoseSchedule(patientDetails, {
      previousPCV13: riskAssessment.previousPCV13,
      previousPPV23: riskAssessment.previousPPV23,
    });
  }, [patientDetails, riskAssessment]);

  // Validation
  const patientValidationError = useMemo(() => {
    return validatePneumococcalPatientStep(patientDetails);
  }, [patientDetails]);

  const consentValidationError = useMemo(() => {
    return validatePneumococcalConsentStep(consent);
  }, [consent]);

  const riskValidationError = useMemo(() => {
    return validatePneumococcalRiskAssessmentStep(riskAssessment);
  }, [riskAssessment]);

  const administrationValidationError = useMemo(() => {
    return validatePneumococcalAdministrationStep(summary);
  }, [summary]);

  const summaryValidationError = useMemo(() => {
    return validatePneumococcalSummaryStep(summary);
  }, [summary]);

  // Step can proceed checks
  const canProceedStep0 = patientValidationError === null;
  const canProceedStep1 = consentValidationError === null;
  const canProceedStep2 = riskValidationError === null;
  const canProceedStep3 = true; // Medical history is always valid
  const canProceedStep4 = contraIndicationsReviewed.confirmedNoAbsoluteContraindications;
  const canProceedStep5 = administrationValidationError === null;
  const canProceedStep6 = postVaccineAdvice.patientAdvised;
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
        patient: patientDetails,
        consent,
        riskAssessment,
        medicalHistory,
        contraIndicationsReviewed,
        postVaccineAdvice,
        summary,
        clinicalAlerts,
      } as unknown as Record<string, unknown>,
      outcome: clinicalAlerts.some((a) => a.severity === 'block') ? "not_supplied" : "completed",
      summary: {
        pharmacistName: summary.pharmacistName,
        pharmacistGPhC: summary.pharmacistGPhC,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
      },
    };
  }, [patientDetails, consent, riskAssessment, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialPneumococcalPatientDetails);
    setConsent(initialPneumococcalConsent);
    setSummary(initialPneumococcalSummary());
    setShowSummaryReport(false);
  }, []);

  if (showSummaryReport) {
    return (
      <div>
        <PneumococcalSummaryReport
          patientDetails={patientDetails}
          consent={consent}
          summary={summary}
          riskAssessment={riskAssessment}
          medicalHistory={medicalHistory}
          clinicalAlerts={clinicalAlerts}
          postVaccineAdvice={postVaccineAdvice}
          onBack={() => setShowSummaryReport(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <ProgressBar
          stepLabels={STEP_LABELS}
          currentStep={currentStep}
          onStepClick={(step) => {
            if (completedSteps.has(step) || step <= currentStep) {
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
        >
          <PatientDetailsStep
            patient={patientDetails}
            onChange={handlePatientDetailsChange}
          />
          <div className="mt-6 border-t pt-6 space-y-4">
            <SelectInput
              label="At-risk category"
              value={patientDetails.riskCategory}
              onChange={(v) =>
                handlePatientDetailsChange(
                  'riskCategory',
                  v as PneumococcalPatientDetails['riskCategory']
                )
              }
              options={[
                { value: 'asplenia', label: 'Asplenia or splenic dysfunction' },
                { value: 'chronic-disease', label: 'Chronic disease (respiratory, cardiac, renal, liver, diabetes)' },
                { value: 'immunosuppressed', label: 'Immunosuppressed' },
                { value: 'cochlear', label: 'Cochlear implant' },
                { value: 'csf-leak', label: 'Cerebrospinal fluid leak' },
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
                placeholder="e.g., COPD, asthma, heart disease, CKD stage 3-5, diabetes, cirrhosis"
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
        >
          <ConsentStep
            consent={consent}
            onChange={(field, value) => setConsent({ ...consent, [field]: value })}
          />
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="Patient understands why pneumococcal vaccination is needed"
              checked={consent.understandsVaccineNeed}
              onChange={(v) => setConsent({ ...consent, understandsVaccineNeed: v })}
              description="Based on their at-risk category"
            />
            <Checkbox
              label="Patient understands the vaccination schedule"
              checked={consent.understandsSchedule}
              onChange={(v) => setConsent({ ...consent, understandsSchedule: v })}
              description="May require PCV13 first, then PPV23 after 8+ weeks, with boosters every 5 years for some groups"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
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
        >
          <div className="space-y-4">
            <Checkbox
              label="Anaphylaxis to previous pneumococcal vaccine"
              checked={medicalHistory.anaphylaxisToVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, anaphylaxisToVaccine: v })
              }
              description="Absolute contraindication — do not proceed"
            />

            <Checkbox
              label="Anaphylaxis to vaccine component"
              checked={medicalHistory.anaphylaxisToVaccineComponent}
              onChange={(v) =>
                setMedicalHistory({
                  ...medicalHistory,
                  anaphylaxisToVaccineComponent: v,
                })
              }
              description="Absolute contraindication — do not proceed"
            />

            <Checkbox
              label="Severe acute febrile illness"
              checked={medicalHistory.severeFebrilleIllness}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeFebrilleIllness: v })
              }
              description="Defer vaccination until patient has recovered"
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
        >
          <div className="space-y-4">
            {isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-semibold">
                  Absolute contraindication identified. Consultation cannot proceed. Patient
                  should be referred to their GP.
                </p>
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
                { value: 'pcv13', label: 'Prevenar 13 (PCV13)' },
                { value: 'ppv23', label: 'Pneumovax 23 (PPV23)' },
              ]}
              required
            />

            <SelectInput
              label="Dose number in series"
              value={summary.doseNumber}
              onChange={(v) => setSummary({ ...summary, doseNumber: v as '1' | '2' | '' })}
              options={[
                { value: '1', label: 'Dose 1 (first dose)' },
                { value: '2', label: 'Dose 2 (second dose, ≥8 weeks after first)' },
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>

            <SelectInput
              label="Administration site"
              value={summary.administrationSite}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  administrationSite: v as 'left-deltoid' | 'right-deltoid' | '',
                })
              }
              options={[
                { value: 'left-deltoid', label: 'Left deltoid (IM preferred)' },
                { value: 'right-deltoid', label: 'Right deltoid (IM preferred)' },
              ]}
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
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
          validationError={!postVaccineAdvice.patientAdvised ? 'Patient must be advised' : null}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Common reactions to advise patient about:</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Injection site soreness, redness, or swelling</li>
                <li>Mild fever</li>
                <li>Fatigue or general malaise</li>
                <li>Muscle aches</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Important information to share:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Most reactions are mild and resolve within 24-48 hours</li>
                <li>For high-risk groups: may need both PCV13 and PPV23 for full protection</li>
                <li>PPV23 booster required every 5 years for asplenia/splenic dysfunction</li>
                <li>Paracetamol or ibuprofen can be taken for fever or myalgia</li>
                <li>Seek GP advice if severe reaction develops</li>
                <li>Explain why vaccination is important for their specific risk group</li>
              </ul>
            </div>

            <Checkbox
              label="Patient has been advised of common reactions"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })
              }
              description="Confirm patient is aware of expected side effects"
            />

            <Checkbox
              label="Patient understands may need both PCV13 and PPV23"
              checked={postVaccineAdvice.counselledBothVaccines}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledBothVaccines: v })
              }
              description="Explain need for follow-up vaccination if two-dose schedule indicated"
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
          onNext={() => setShowSummaryReport(true)}
          onPrev={handlePrev}
          canProceed={canProceedStep7}
          validationError={summaryValidationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          <div className="space-y-4">
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
        </StepWrapper>
      )}
    </>
  );
}

export default PneumococcalClient;
