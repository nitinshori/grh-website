'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import type {
  RSVPatientDetails,
  RSVConsent,
  RSVSummary,
} from './rsv-types';
import {
  initialRSVPatientDetails,
  initialRSVConsent,
  initialRSVSummary,
} from './rsv-types';
import {
  getRSVClinicalAlerts,
  getRSVVaccineGuidance,
  shouldBlockConsultation,
  isCurrentRSVSeason,
  determineMaternalProtectionPeriod,
} from './rsv-clinical-logic';
import {
  validateRSVPatientStep,
  validateRSVConsentStep,
  validateRSVEligibilityAssessmentStep,
  validateRSVAdministrationStep,
  validateRSVSummaryStep,
} from './rsv-validation';
import { calculateAge } from '../shared/types';
import RSVSummaryReport from './components/RSVSummaryReport';

const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Eligibility Assessment',
  'Medical History',
  'Review Contraindications',
  'Vaccine Administration',
  'Post-Vaccine Advice',
  'Summary',
] as const;

export function RSVClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<RSVPatientDetails>(
    initialRSVPatientDetails
  );

  const [consent, setConsent] = useState<RSVConsent>(initialRSVConsent);

  const [eligibilityAssessment, setEligibilityAssessment] = useState({
    confirmEligible: false,
    riskFactorsReviewed: false,
  });

  const [medicalHistory, setMedicalHistory] = useState({
    anaphylaxisToVaccine: false,
    anaphylaxisToVaccineComponent: false,
    severeFebrilleIllness: false,
    immunosuppressed: false,
    bleedingDisorder: false,
  });

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });

  const [summary, setSummary] = useState<RSVSummary>(initialRSVSummary());

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
    counselledNoBooster: false,
    counselledSeason: false,
  });

  const [showSummaryReport, setShowSummaryReport] = useState(false);

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof RSVPatientDetails, value: any) => {
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
    return getRSVClinicalAlerts(patientDetails, medicalHistory);
  }, [patientDetails, medicalHistory]);

  const isBlocked = useMemo(() => {
    return shouldBlockConsultation(clinicalAlerts);
  }, [clinicalAlerts]);

  const rsvSeasonStatus = useMemo(() => {
    return isCurrentRSVSeason();
  }, []);

  // Validation
  const patientValidationError = useMemo(() => {
    return validateRSVPatientStep(patientDetails);
  }, [patientDetails]);

  const consentValidationError = useMemo(() => {
    return validateRSVConsentStep(consent);
  }, [consent]);

  const eligibilityValidationError = useMemo(() => {
    return validateRSVEligibilityAssessmentStep(eligibilityAssessment);
  }, [eligibilityAssessment]);

  const administrationValidationError = useMemo(() => {
    return validateRSVAdministrationStep(summary);
  }, [summary]);

  const summaryValidationError = useMemo(() => {
    return validateRSVSummaryStep(summary);
  }, [summary]);

  // Step can proceed checks
  const canProceedStep0 = patientValidationError === null;
  const canProceedStep1 = consentValidationError === null;
  const canProceedStep2 = eligibilityValidationError === null;
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
        eligibilityAssessment,
        medicalHistory,
        contraIndicationsReviewed,
        postVaccineAdvice,
        summary,
        clinicalAlerts,
      } as unknown as Record<string, unknown>,
      outcome: clinicalAlerts.some((a) => a.severity === 'stop') ? "not_supplied" : "completed",
      summary: {
        pharmacistName: summary.pharmacistName,
        pharmacistGPhC: summary.pharmacistGPhC,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
      },
    };
  }, [patientDetails, consent, eligibilityAssessment, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialRSVPatientDetails);
    setConsent(initialRSVConsent);
    setEligibilityAssessment({ confirmEligible: false, riskFactorsReviewed: false });
    setMedicalHistory({
      anaphylaxisToVaccine: false,
      anaphylaxisToVaccineComponent: false,
      severeFebrilleIllness: false,
      immunosuppressed: false,
      bleedingDisorder: false,
    });
    setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: false });
    setSummary(initialRSVSummary());
    setPostVaccineAdvice({
      patientAdvised: false,
      counselledReactions: false,
      counselledNoBooster: false,
      counselledSeason: false,
    });
    setShowSummaryReport(false);
  }, []);

  if (showSummaryReport) {
    return (
      <div>
        <RSVSummaryReport
          patientDetails={patientDetails}
          consent={consent}
          summary={summary}
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
          description="Collect patient information and confirm category (adult 60+ or pregnant woman)"
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
            genderOption={
              patientDetails.patientCategory === 'pregnant-woman'
                ? {
                    label: 'Patient is female (pregnant)',
                    description: 'Confirm patient is female for maternal RSV vaccination',
                    checked: patientDetails.femaleConfirmed || false,
                    onToggle: (v) => handlePatientDetailsChange('femaleConfirmed', v),
                  }
                : undefined
            }
          />
          <div className="mt-6 border-t pt-6 space-y-4">
            <SelectInput
              label="Patient category"
              value={patientDetails.patientCategory}
              onChange={(v) =>
                handlePatientDetailsChange(
                  'patientCategory',
                  v as RSVPatientDetails['patientCategory']
                )
              }
              options={[
                { value: 'adult-60-plus', label: 'Adult aged 60 years or older' },
                { value: 'pregnant-woman', label: 'Pregnant woman (32-36 weeks gestation)' },
              ]}
              required
            />

            {patientDetails.patientCategory === 'pregnant-woman' && (
              <NumberInput
                label="Gestational age (weeks)"
                value={patientDetails.pregnancyWeeks || null}
                onChange={(v) => handlePatientDetailsChange('pregnancyWeeks', v)}
                min={0}
                max={42}
                placeholder="e.g., 34"
                unit="weeks"
              />
            )}

            {patientDetails.patientCategory === 'adult-60-plus' && (
              <Checkbox
                label="Patient is at increased risk of severe RSV disease"
                checked={patientDetails.atIncreasedrisk}
                onChange={(v) => handlePatientDetailsChange('atIncreasedrisk', v)}
                description="e.g., chronic heart/lung disease, diabetes, immunosuppression"
              />
            )}

            {patientDetails.atIncreasedrisk && (
              <TextInput
                label="Risk factors (optional)"
                value={patientDetails.riskFactors || ''}
                onChange={(v) => handlePatientDetailsChange('riskFactors', v)}
                placeholder="Specify risk factors"
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
              label="Patient understands vaccine protects against severe RSV disease"
              checked={consent.understandsVaccineProtection}
              onChange={(v) => setConsent({ ...consent, understandsVaccineProtection: v })}
              description="Explain protection against respiratory syncytial virus infection"
            />
            <Checkbox
              label="Patient understands no booster is currently recommended"
              checked={consent.understandsNoBooster}
              onChange={(v) => setConsent({ ...consent, understandsNoBooster: v })}
              description="Single dose provides protection; booster schedule not yet established"
            />
            <Checkbox
              label="Patient is aware of possible adverse events"
              checked={consent.understandsAdverseEvents}
              onChange={(v) => setConsent({ ...consent, understandsAdverseEvents: v })}
              description="Injection site pain, fatigue, headache, myalgia, arthralgia"
            />
            {patientDetails.patientCategory === 'pregnant-woman' && (
              <Checkbox
                label="Patient understands vaccine protects newborn for ~6 months"
                checked={consent.understands6MonthsProtection || false}
                onChange={(v) => setConsent({ ...consent, understands6MonthsProtection: v })}
                description="Passive protection through maternal antibodies"
              />
            )}
          </div>
        </StepWrapper>
      )}

      {/* Step 2: Eligibility Assessment */}
      {currentStep === 2 && (
        <StepWrapper
          title={STEP_LABELS[2]}
          description="Confirm RSV vaccination eligibility and assess risk factors"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep2}
          validationError={eligibilityValidationError}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {patientDetails.patientCategory === 'adult-60-plus' && (
                <>
                  <p className="text-sm font-semibold text-blue-900">
                    Adult RSV Vaccination ({patientDetails.age} years old)
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Recommended for all adults 60+</li>
                    <li>
                      {patientDetails.atIncreasedrisk
                        ? 'At increased risk of severe RSV disease'
                        : 'Standard risk'}
                    </li>
                    <li>
                      {rsvSeasonStatus
                        ? 'Currently in RSV season (Sep-Jan)'
                        : 'Currently outside RSV season (Feb-Aug)'}
                    </li>
                  </ul>
                </>
              )}
              {patientDetails.patientCategory === 'pregnant-woman' && (
                <>
                  <p className="text-sm font-semibold text-blue-900">
                    Maternal RSV Vaccination ({patientDetails.pregnancyWeeks} weeks gestation)
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Approved for 32-36 weeks gestation</li>
                    <li>Use Abrysvo (Pfizer) only</li>
                    <li>Protects newborn for ~6 months through maternal antibodies</li>
                    <li>
                      {rsvSeasonStatus
                        ? 'Currently in RSV season (Sep-Jan)'
                        : 'Currently outside RSV season (Feb-Aug)'}
                    </li>
                  </ul>
                </>
              )}
            </div>

            <Checkbox
              label="Patient meets eligibility criteria for RSV vaccination"
              checked={eligibilityAssessment.confirmEligible}
              onChange={(v) =>
                setEligibilityAssessment({ ...eligibilityAssessment, confirmEligible: v })
              }
              description="Confirm patient is eligible based on age/pregnancy status and other factors"
            />

            <Checkbox
              label="Risk factors reviewed (if applicable)"
              checked={eligibilityAssessment.riskFactorsReviewed}
              onChange={(v) =>
                setEligibilityAssessment({ ...eligibilityAssessment, riskFactorsReviewed: v })
              }
              description="For adults 60+, assess any additional risk factors for severe RSV disease"
            />

            {rsvSeasonStatus && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  <strong>RSV season active (Sep-Jan):</strong> Timing is optimal for vaccination.
                </p>
              </div>
            )}

            {!rsvSeasonStatus && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Outside RSV season (Feb-Aug):</strong> Vaccination may be less timely but can still be given
                  for at-risk individuals.
                </p>
              </div>
            )}
          </div>
        </StepWrapper>
      )}

      {/* Step 3: Medical History */}
      {currentStep === 3 && (
        <StepWrapper
          title={STEP_LABELS[3]}
          description="Assess relevant medical history and risk factors"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep3}
          validationError={null}
        >
          <div className="space-y-4">
            <Checkbox
              label="Anaphylaxis to previous RSV vaccine"
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

            <Checkbox
              label="Patient is immunosuppressed"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, immunosuppressed: v })
              }
              description="Vaccine response may be reduced but can still be given"
            />

            <Checkbox
              label="Bleeding disorder or on anticoagulant therapy"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })
              }
              description="Requires subcutaneous injection instead of IM"
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
                  No clinical alerts identified. Patient is suitable for RSV vaccination.
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
                        : alert.severity === 'caution'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-orange-50 border border-orange-200'
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
                  vaccineType: v as 'abrysvo' | 'mresvia' | '',
                })
              }
              options={
                patientDetails.patientCategory === 'pregnant-woman'
                  ? [{ value: 'abrysvo', label: 'Abrysvo (Pfizer) — for maternal use' }]
                  : [
                      { value: 'abrysvo', label: 'Abrysvo (Pfizer)' },
                      { value: 'mresvia', label: 'mRESVIA (Moderna)' },
                    ]
              }
              required
            />

            {summary.vaccineType && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900">
                  {getRSVVaccineGuidance(summary.vaccineType, patientDetails.patientCategory).vaccineName}
                </p>
                <p className="text-blue-800 text-xs mt-2">
                  {getRSVVaccineGuidance(summary.vaccineType, patientDetails.patientCategory).guidance}
                </p>
              </div>
            )}

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
              <p className="text-sm font-semibold text-blue-900">Common side effects to advise patient about:</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Injection site pain, redness, or swelling</li>
                <li>Fatigue or general malaise</li>
                <li>Headache</li>
                <li>Myalgia (muscle aches)</li>
                <li>Arthralgia (joint aches)</li>
                <li>Mild fever</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Important information to share:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Most reactions are mild and resolve within 24-48 hours</li>
                <li>No booster is currently recommended</li>
                {patientDetails.patientCategory === 'pregnant-woman' && (
                  <>
                    <li>Vaccine protects newborn for approximately 6 months of life</li>
                    <li>Protection transferred via maternal antibodies (passive immunity)</li>
                    <li>Newborn should be monitored for RSV infection during season</li>
                  </>
                )}
                <li>Paracetamol or ibuprofen can be taken for fever or myalgia</li>
                <li>Seek GP advice if severe reaction develops</li>
              </ul>
            </div>

            <Checkbox
              label="Patient has been advised of common side effects"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })
              }
              description="Confirm patient is aware of expected reactions"
            />

            <Checkbox
              label="Patient understands no booster is currently recommended"
              checked={postVaccineAdvice.counselledNoBooster}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledNoBooster: v })
              }
              description="Single dose provides protection; booster schedule not yet established"
            />

            {patientDetails.patientCategory === 'adult-60-plus' && rsvSeasonStatus && (
              <Checkbox
                label="Patient understands timing importance (RSV season)"
                checked={postVaccineAdvice.counselledSeason}
                onChange={(v) =>
                  setPostVaccineAdvice({ ...postVaccineAdvice, counselledSeason: v })
                }
                description="Vaccination during RSV season (Sep-Jan) provides protection when risk is highest"
              />
            )}

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

export default RSVClient;
