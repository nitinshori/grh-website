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
  RSVMedicalHistory,
  RSVPostVaccineAdvice,
} from './rsv-types';
import {
  initialRSVPatientDetails,
  initialRSVConsent,
  initialRSVMedicalHistory,
  initialRSVSummary,
  initialRSVPostVaccineAdvice,
} from './rsv-types';
import {
  getRSVClinicalAlerts,
  getRSVVaccineGuidance,
  shouldBlockConsultation,
  isCurrentRSVSeason,
} from './rsv-clinical-logic';
import {
  validateRSVPatientStep,
  validateRSVConsentStep,
  validateRSVEligibilityAssessmentStep,
  validateRSVAdministrationStep,
  validateRSVPostVaccineStep,
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

const STEP_DESCRIPTIONS = [
  'Collect patient information and confirm category (adult 60+ or pregnant woman)',
  'Obtain informed consent and ID verification',
  'Confirm RSV vaccination eligibility and assess risk factors',
  'Assess relevant medical history and risk factors',
  'Review clinical alerts and confirm no absolute contraindications',
  'Record vaccine details and administration information',
  'Provide patient counselling, complete the observation period and record any adverse reaction',
  'Complete the practitioner declaration and check the consultation record before saving',
] as const;

export function RSVClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<RSVPatientDetails>(
    initialRSVPatientDetails
  );

  const [consent, setConsent] = useState<RSVConsent>(initialRSVConsent);

  const [eligibilityAssessment, setEligibilityAssessment] = useState<{
    confirmEligible: boolean;
    riskFactorsReviewed: boolean;
    nhsStatus: '' | 'not-eligible' | 'eligible-prefers-private';
  }>({
    confirmEligible: false,
    riskFactorsReviewed: false,
    nhsStatus: '',
  });

  const [medicalHistory, setMedicalHistory] = useState<RSVMedicalHistory>(initialRSVMedicalHistory);

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

  const [postVaccineAdvice, setPostVaccineAdvice] = useState<RSVPostVaccineAdvice>(
    initialRSVPostVaccineAdvice()
  );

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof RSVPatientDetails, value: any) => {
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
    return validateRSVConsentStep(consent, patientDetails.age);
  }, [consent, patientDetails.age]);

  const eligibilityValidationError = useMemo(() => {
    return validateRSVEligibilityAssessmentStep(eligibilityAssessment);
  }, [eligibilityAssessment]);

  const administrationValidationError = useMemo(() => {
    return validateRSVAdministrationStep(summary, patientDetails, medicalHistory);
  }, [summary, patientDetails, medicalHistory]);

  const summaryValidationError = useMemo(() => {
    return validateRSVSummaryStep(summary);
  }, [summary]);

  const postVaccineValidationError = useMemo(() => {
    return validateRSVPostVaccineStep(postVaccineAdvice);
  }, [postVaccineAdvice]);

  // One validation message per step. A stop alert anywhere blocks every
  // step's Next and the final Save & Print: the progress bar only moves
  // backwards, so this is the only forward gate (adversarial review, 11 Sep 2026).
  const validationErrorByStep: (string | null)[] = [
    patientValidationError,
    consentValidationError,
    eligibilityValidationError,
    null,
    !contraIndicationsReviewed.confirmedNoAbsoluteContraindications
      ? 'You must confirm review before proceeding'
      : null,
    administrationValidationError,
    postVaccineValidationError,
    summaryValidationError,
  ];
  const validationError = validationErrorByStep[currentStep] ?? null;
  const canProceed = !isBlocked && validationError === null;

  const handleNext = () => {
    if (isBlocked || validationError !== null) return;
    if (currentStep >= STEP_LABELS.length - 1) return;
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    setCurrentStep(currentStep + 1);
  };

  // When a stop appears, the steps after the one being edited are no longer
  // trustworthy: forget them so the pharmacist walks forward through Next.
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

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const hasStop = clinicalAlerts.some((a) => a.severity === 'stop');
    const vaccineName =
      summary.vaccineType === 'abrysvo'
        ? 'Abrysvo'
        : summary.vaccineType === 'arexvy'
          ? 'Arexvy'
          : '';
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
      outcome: hasStop ? 'not_supplied' : 'completed',
      medicine:
        !hasStop && vaccineName
          ? {
              name: vaccineName,
              dose: '0.5 mL intramuscular',
              quantity: '1 dose',
            }
          : undefined,
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
  }, [patientDetails, consent, eligibilityAssessment, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialRSVPatientDetails);
    setConsent(initialRSVConsent);
    setEligibilityAssessment({ confirmEligible: false, riskFactorsReviewed: false, nhsStatus: '' });
    setMedicalHistory(initialRSVMedicalHistory);
    setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: false });
    setSummary(initialRSVSummary());
    setPostVaccineAdvice(initialRSVPostVaccineAdvice());
  }, []);

  return (
    <>
      <div className="mb-6">
        <ProgressBar
          stepLabels={STEP_LABELS}
          currentStep={currentStep}
          onStepClick={(step) => {
            // Backwards only (the shared ProgressBar also refuses forward clicks).
            if (step < currentStep) {
              setCurrentStep(step);
            }
          }}
          completedSteps={completedSteps}
          hasErrors={patientValidationError !== null || consentValidationError !== null}
        />
      </div>

      {clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}

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

      {/* Step 0: Patient Details */}
      {currentStep === 0 && (
        <>
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
            requireAdult={false}
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
                { value: 'pregnant-woman', label: 'Pregnant woman (28 to 36 weeks of gestation, Abrysvo only)' },
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
                placeholder="e.g., 30"
                unit="weeks (PGD inclusion 28 to 36; after 36 refer to the maternity service)"
                required
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
        </>
      )}

      {/* Step 1: Consent */}
      {currentStep === 1 && (
        <>
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
                  setConsent({ ...consent, consentBasis: v as RSVConsent['consentBasis'] })
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
              label="Patient understands vaccine protects against severe RSV disease"
              checked={consent.understandsVaccineProtection}
              onChange={(v) => setConsent({ ...consent, understandsVaccineProtection: v })}
              description="Explain protection against lower respiratory tract disease caused by RSV. No vaccination is 100% effective."
            />
            <Checkbox
              label="Patient understands this is a one-time vaccination"
              checked={consent.understandsNoBooster}
              onChange={(v) => setConsent({ ...consent, understandsNoBooster: v })}
              description="Single 0.5 mL dose; one-time vaccination per current guidance"
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
        </>
      )}

      {/* Step 2: Eligibility Assessment */}
      {currentStep === 2 && (
        <>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {patientDetails.patientCategory === 'adult-60-plus' && (
                <>
                  <p className="text-sm font-semibold text-blue-900">
                    Adult RSV Vaccination ({patientDetails.age} years old)
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>PGD inclusion: adults aged 60 years and over (Abrysvo or Arexvy)</li>
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
                    <li>PGD inclusion: 28 to 36 weeks of gestation, in every pregnancy, all year round</li>
                    <li>Use Abrysvo only; Arexvy must not be given in pregnancy</li>
                    <li>Protects the infant for the first months of life via placental antibody transfer</li>
                    <li>After 36 weeks refer to the maternity service (vaccination up to delivery is still recommended)</li>
                  </ul>
                </>
              )}
            </div>

            <SelectInput
              label="NHS eligibility (PGD inclusion)"
              value={eligibilityAssessment.nhsStatus}
              onChange={(v) =>
                setEligibilityAssessment({
                  ...eligibilityAssessment,
                  nhsStatus: v as '' | 'not-eligible' | 'eligible-prefers-private',
                })
              }
              options={[
                { value: 'not-eligible', label: 'Requires immunisation but does not qualify for a free NHS vaccination' },
                { value: 'eligible-prefers-private', label: 'Qualifies for a free NHS vaccination but prefers to have the vaccine privately' },
              ]}
              required
            />

            <Checkbox
              label="Patient meets eligibility criteria for RSV vaccination"
              checked={eligibilityAssessment.confirmEligible}
              onChange={(v) =>
                setEligibilityAssessment({ ...eligibilityAssessment, confirmEligible: v })
              }
              description="Confirm patient is eligible based on age or gestation and other factors"
            />

            <Checkbox
              label="Risk factors reviewed (if applicable)"
              checked={eligibilityAssessment.riskFactorsReviewed}
              onChange={(v) =>
                setEligibilityAssessment({ ...eligibilityAssessment, riskFactorsReviewed: v })
              }
              description="For adults 60+, assess any additional risk factors for severe RSV disease"
            />

            {patientDetails.patientCategory === 'adult-60-plus' && rsvSeasonStatus && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  <strong>RSV season active (Sep-Jan):</strong> Timing is optimal for vaccination.
                </p>
              </div>
            )}

            {patientDetails.patientCategory === 'adult-60-plus' && !rsvSeasonStatus && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Outside RSV season (Feb-Aug):</strong> Timing note only; the PGD permits vaccination of adults 60 and over all year.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Step 3: Medical History */}
      {currentStep === 3 && (
        <>
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Exclusion criteria (PGD v006)</p>

            <Checkbox
              label="Already received a complete dose of an RSV vaccine"
              checked={medicalHistory.previousRSVVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, previousRSVVaccine: v })
              }
              description="Excluded: one-time vaccination per current guidance"
            />

            <Checkbox
              label="Severe allergic reaction to a previous RSV vaccine"
              checked={medicalHistory.anaphylaxisToVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, anaphylaxisToVaccine: v })
              }
              description="Excluded: do not proceed"
            />

            <Checkbox
              label="Previous severe allergic reaction to any component of the RSV vaccine"
              checked={medicalHistory.anaphylaxisToVaccineComponent}
              onChange={(v) =>
                setMedicalHistory({
                  ...medicalHistory,
                  anaphylaxisToVaccineComponent: v,
                })
              }
              description="Excluded: do not proceed"
            />

            <Checkbox
              label="Acute febrile illness"
              checked={medicalHistory.severeFebrilleIllness}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeFebrilleIllness: v })
              }
              description="Postpone vaccination until recovered. Minor illness without fever is not a contraindication."
            />

            {patientDetails.patientCategory === 'adult-60-plus' && (
              <Checkbox
                label="Pregnant or breastfeeding"
                checked={medicalHistory.pregnantOrBreastfeeding}
                onChange={(v) =>
                  setMedicalHistory({ ...medicalHistory, pregnantOrBreastfeeding: v })
                }
                description="Arexvy must not be given to those who are pregnant or breastfeeding; Abrysvo only"
              />
            )}

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">Cautions (PGD v006)</p>

            <Checkbox
              label="Patient is immunocompromised"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, immunosuppressed: v })
              }
              description="Advise that they may have a reduced response to the vaccine; it can still be given"
            />

            <Checkbox
              label="Coagulation disorder (including anticoagulant therapy)"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })
              }
              description="Increased bleeding risk after IM injection: fine needle (23 or 25 gauge), firm pressure without rubbing for at least 2 minutes, warn about haematoma. Do NOT give subcutaneously."
            />

            {patientDetails.patientCategory === 'adult-60-plus' && (
              <Checkbox
                label="Influenza vaccine given at this appointment or on the same day"
                checked={medicalHistory.fluVaccineSameDay}
                onChange={(v) =>
                  setMedicalHistory({ ...medicalHistory, fluVaccineSameDay: v })
                }
                description="Abrysvo is not routinely scheduled on the same day as influenza vaccine in older adults (reduced response to both). Give together only if the patient is unlikely to return or immediate protection is necessary. Arexvy may be co-administered at a different site."
              />
            )}
          </div>
        </>
      )}

      {/* Step 4: Review Contraindications */}
      {currentStep === 4 && (
        <>
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
        </>
      )}

      {/* Step 5: Vaccine Administration */}
      {currentStep === 5 && (
        <>
          <div className="space-y-4">
            <SelectInput
              label="Vaccine type"
              value={summary.vaccineType}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  vaccineType: v as 'abrysvo' | 'arexvy' | '',
                })
              }
              options={
                patientDetails.patientCategory === 'pregnant-woman'
                  ? [{ value: 'abrysvo', label: 'Abrysvo (Pfizer), 0.5 mL IM: maternal use' }]
                  : medicalHistory.pregnantOrBreastfeeding
                    ? [{ value: 'abrysvo', label: 'Abrysvo (Pfizer), 0.5 mL IM (Arexvy excluded: pregnant or breastfeeding)' }]
                    : [
                        { value: 'abrysvo', label: 'Abrysvo (Pfizer), 0.5 mL IM' },
                        { value: 'arexvy', label: 'Arexvy (GSK), 0.5 mL IM: 60 years and over only' },
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
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
                { value: 'left-deltoid', label: 'Left deltoid, intramuscular' },
                { value: 'right-deltoid', label: 'Right deltoid, intramuscular' },
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* Step 6: Post-Vaccine Advice */}
      {currentStep === 6 && (
        <>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Possible side effects to advise the patient about (PGD v006):</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Pain at the injection site</li>
                <li>Fatigue, headache</li>
                <li>Muscle ache (myalgia), joint ache (arthralgia, Arexvy)</li>
                <li>Fever (Abrysvo)</li>
                <li>Rare: hypersensitivity or allergic reactions</li>
                <li>Guillain-Barre syndrome has been reported rarely; seek urgent medical attention for new weakness, numbness or tingling</li>
                <li>Fainting can occur following, or even before, any vaccination</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Follow-up advice (PGD v006):</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell</li>
                <li>No vaccination is 100% effective</li>
                <li>The inactivated vaccine cannot cause RSV infection</li>
                <li>The vaccine will not protect against influenza, COVID-19 or other respiratory viruses in circulation, especially during the winter season</li>
                <li>Immunosuppressed individuals may not have a full immune response to the vaccine</li>
                <li>One-time vaccination per current guidance</li>
                {patientDetails.patientCategory === 'pregnant-woman' && (
                  <>
                    <li>Protects the infant for the first months of life via maternal antibodies</li>
                    <li>Babies born to women who have had Abrysvo can be safely breastfed</li>
                  </>
                )}
              </ul>
            </div>

            <Checkbox
              label="Patient advised on possible side effects and when to seek medical attention"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })
              }
              description="Required by the PGD cautions row"
              required
            />

            <Checkbox
              label="Follow-up advice given as listed above"
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
              label="Patient understands this is a one-time vaccination"
              checked={postVaccineAdvice.counselledNoBooster}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledNoBooster: v })
              }
              description="One-time vaccination per current guidance"
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

            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Observation and adverse reactions (PGD v006)</p>
              <Checkbox
                label="Patient observed for 15 minutes after vaccination and the observation period has been completed"
                checked={postVaccineAdvice.observedFifteenMinutes}
                onChange={(v) =>
                  setPostVaccineAdvice({ ...postVaccineAdvice, observedFifteenMinutes: v })
                }
                description="PGD cautions row: observe for 15 minutes post-vaccination. Tick only once the period has actually been completed."
                required
              />
              <TextArea
                label="Adverse reaction observed (leave blank if none)"
                value={postVaccineAdvice.adverseReaction}
                onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, adverseReaction: v })}
                placeholder="Describe any adverse reaction, including the time it started"
                rows={2}
              />
              {postVaccineAdvice.adverseReaction.trim() && (
                <>
                  <TextArea
                    label="Action taken"
                    value={postVaccineAdvice.adverseReactionAction}
                    onChange={(v) =>
                      setPostVaccineAdvice({ ...postVaccineAdvice, adverseReactionAction: v })
                    }
                    placeholder="Treatment given, referral made, GP informed"
                    rows={2}
                    required
                  />
                  <Checkbox
                    label="Reported to the MHRA Yellow Card scheme (https://yellowcard.mhra.gov.uk) and the GP informed as appropriate"
                    checked={postVaccineAdvice.yellowCardSubmitted}
                    onChange={(v) =>
                      setPostVaccineAdvice({ ...postVaccineAdvice, yellowCardSubmitted: v })
                    }
                    description="PGD Yellow Card reporting row: report suspected adverse effects via yellowcard.mhra.gov.uk"
                  />
                </>
              )}
              <p className="text-xs text-gray-600">
                Report any suspected adverse reaction via the Yellow Card scheme: https://yellowcard.mhra.gov.uk
              </p>
            </div>

            <Checkbox
              label="All counselling completed and documented"
              checked={postVaccineAdvice.patientAdvised}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, patientAdvised: v })
              }
              description="Confirm pharmacist has completed patient consultation"
            />
          </div>
        </>
      )}

      {/* Step 7: Summary */}
      {currentStep === 7 && (
        <>
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

          {/* The printed consultation record. Save & Print prints this page,
              so the record must be on it (adversarial review, 11 Sep 2026). */}
          <div className="mt-6">
            <RSVSummaryReport
              patientDetails={patientDetails}
              consent={consent}
              summary={summary}
              medicalHistory={medicalHistory}
              clinicalAlerts={clinicalAlerts}
              postVaccineAdvice={postVaccineAdvice}
              nhsStatus={eligibilityAssessment.nhsStatus}
            />
          </div>
        </>
      )}
      </StepWrapper>
    </>
  );
}

export default RSVClient;
