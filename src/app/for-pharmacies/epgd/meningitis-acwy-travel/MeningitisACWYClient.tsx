'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TextInput, Checkbox, SelectInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { SaveDraftButton } from '../shared/components/SaveDraftButton';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import type {
  MeningitisACWYPatientDetails,
  MeningitisACWYConsent,
  MeningitisACWYSummary,
  MeningitisACWYMedicalHistory,
  MeningitisACWYPostVaccineAdvice,
} from './meningitis-acwy-travel-types';
import {
  initialMeningitisACWYPatientDetails,
  initialMeningitisACWYConsent,
  initialMeningitisACWYSummary,
  initialMeningitisACWYMedicalHistory,
  initialMeningitisACWYPostVaccineAdvice,
} from './meningitis-acwy-travel-types';
import {
  getMeningitisACWYClinicalAlerts,
  shouldBlockConsultation,
  getAdministrationGuidance,
  getMeningitisACWYDoseRecommendation,
  calculateAgeInMonths,
  MENACWY_PGD_VERSION,
} from './meningitis-acwy-travel-clinical-logic';
import {
  validateMeningitisACWYPatientStep,
  validateMeningitisACWYTravelStep,
  validateMeningitisACWYConsentStep,
  validateMeningitisACWYAdministrationStep,
  validateMeningitisACWYPostVaccineStep,
  validateMeningitisACWYSummaryStep,
} from './meningitis-acwy-travel-validation';
import { calculateAge } from '../shared/types';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import MeningitisACWYSummaryReport from './components/MeningitisACWYSummaryReport';

const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Travel Assessment',
  'Medical History',
  'Review Contraindications',
  'Vaccine Administration',
  'Post-Vaccine Advice',
  'Summary',
] as const;

/**
 * Destinations offered in the dropdown. Saudi Arabia sits at the top
 * because it is where practically every MenACWY patient is going, and
 * selecting it sets the travel reason too. Anything else is typed in
 * under "Other".
 */
const DESTINATION_PRESETS: {
  value: string;
  reason?: 'hajj-umrah' | 'meningitis-belt' | 'university' | 'other';
}[] = [
  { value: 'Saudi Arabia (Hajj/Umrah pilgrimage)', reason: 'hajj-umrah' },
  { value: 'Saudi Arabia (other travel)' },
  { value: 'Sub-Saharan Africa (meningitis belt)', reason: 'meningitis-belt' },
  { value: 'UK university entrant', reason: 'university' },
];

export function MeningitisACWYClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [destinationIsOther, setDestinationIsOther] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<MeningitisACWYPatientDetails>(
    initialMeningitisACWYPatientDetails
  );

  const [consent, setConsent] = useState<MeningitisACWYConsent>(initialMeningitisACWYConsent);

  const [travelAssessment, setTravelAssessment] = useState({
    travelDestinationConfirmed: false,
    travelReasonConfirmed: false,
    timingConfirmed: false,
  });

  const [medicalHistory, setMedicalHistory] = useState<MeningitisACWYMedicalHistory>(
    initialMeningitisACWYMedicalHistory
  );

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });

  const [summary, setSummary] = useState<MeningitisACWYSummary>(
    initialMeningitisACWYSummary()
  );

  const [postVaccineAdvice, setPostVaccineAdvice] = useState<MeningitisACWYPostVaccineAdvice>(
    initialMeningitisACWYPostVaccineAdvice
  );

  const [showSummaryReport, setShowSummaryReport] = useState(false);

  // Persist form data to sessionStorage so it survives accidental navigation
  const formState = useMemo(() => ({
    currentStep, patientDetails, consent, travelAssessment, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice,
  }), [currentStep, patientDetails, consent, travelAssessment, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice]);

  const { clearSaved } = useFormPersistence(
    'epgd-meningitis-acwy',
    formState,
    useCallback((saved: typeof formState) => {
      setCurrentStep(saved.currentStep);
      setPatientDetails(saved.patientDetails);
      setConsent(saved.consent);
      setTravelAssessment(saved.travelAssessment);
      setMedicalHistory({ ...initialMeningitisACWYMedicalHistory, ...saved.medicalHistory });
      setContraIndicationsReviewed(saved.contraIndicationsReviewed);
      setSummary(saved.summary);
      setPostVaccineAdvice({ ...initialMeningitisACWYPostVaccineAdvice, ...saved.postVaccineAdvice });
    }, [])
  );

  // Auto-fill pharmacist details from logged-in user profile.
  // Refires whenever the pharmacist fields are empty (e.g. after a "New
  // Consultation" reset), so subsequent patients also get the autofill.
  const profile = usePharmacistProfile();
  useEffect(() => {
    if (!profile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    setSummary((prev) => ({
      ...prev,
      pharmacistName: profile.name,
      pharmacistGPhC: profile.gphcNumber,
      pharmacyName: profile.pharmacyName,
      pharmacyAddress: profile.pharmacyAddress,
    }));
  }, [profile, summary.pharmacistName, summary.pharmacistGPhC]);

  // Resume from a saved draft when the URL contains ?draftId=...
  // Hydrates every state slice from the draft once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('draftId');
    if (!id) return;
    fetch(`/api/consultation-drafts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { draftState?: typeof formState } | null) => {
        if (!data?.draftState) return;
        const s = data.draftState;
        if (s.currentStep !== undefined) setCurrentStep(s.currentStep);
        if (s.patientDetails) setPatientDetails(s.patientDetails);
        if (s.consent) setConsent(s.consent);
        if (s.travelAssessment) setTravelAssessment(s.travelAssessment);
        if (s.medicalHistory) setMedicalHistory({ ...initialMeningitisACWYMedicalHistory, ...s.medicalHistory });
        if (s.contraIndicationsReviewed) setContraIndicationsReviewed(s.contraIndicationsReviewed);
        if (s.summary) setSummary(s.summary);
        if (s.postVaccineAdvice) setPostVaccineAdvice({ ...initialMeningitisACWYPostVaccineAdvice, ...s.postVaccineAdvice });
      })
      .catch(() => { /* draft missing or expired: ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof MeningitisACWYPatientDetails, value: any) => {
      // Functional update: GP-practice autofill fires several field updates in
      // the same tick. Spreading a closure-captured `patientDetails` made each
      // call overwrite the previous (only the last survived), so surgery
      // details didn't populate. Using the updater form keeps every field.
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
    return getMeningitisACWYClinicalAlerts(patientDetails, medicalHistory);
  }, [patientDetails, medicalHistory]);

  const isBlocked = useMemo(() => {
    return shouldBlockConsultation(clinicalAlerts);
  }, [clinicalAlerts]);

  // Validation
  const patientValidationError = useMemo(() => {
    return validateMeningitisACWYPatientStep(patientDetails);
  }, [patientDetails]);

  const consentValidationError = useMemo(() => {
    return validateMeningitisACWYConsentStep(consent, patientDetails.age);
  }, [consent, patientDetails.age]);

  const administrationValidationError = useMemo(() => {
    return validateMeningitisACWYAdministrationStep(summary, patientDetails, medicalHistory);
  }, [summary, patientDetails, medicalHistory]);

  const postVaccineValidationError = useMemo(() => {
    return validateMeningitisACWYPostVaccineStep(postVaccineAdvice);
  }, [postVaccineAdvice]);

  const underSixteen = patientDetails.age !== null && patientDetails.age < 16;
  const ageMonths = calculateAgeInMonths(patientDetails.dateOfBirth);
  const courseInvolved =
    summary.doseNumber === '1st' ||
    (ageMonths !== null && ageMonths < 12 && (summary.doseNumber === 'single' || summary.doseNumber === '2nd'));

  const summaryValidationError = useMemo(() => {
    return validateMeningitisACWYSummaryStep(summary);
  }, [summary]);

  const travelValidationError = useMemo(() => {
    return validateMeningitisACWYTravelStep(patientDetails, travelAssessment);
  }, [patientDetails, travelAssessment]);

  // Step can proceed checks
  const canProceedStep0 = patientValidationError === null;
  const canProceedStep1 = consentValidationError === null;
  const canProceedStep2 = travelValidationError === null;
  const canProceedStep3 = true; // Medical history is always valid
  const canProceedStep4 = contraIndicationsReviewed.confirmedNoAbsoluteContraindications;
  const canProceedStep5 = administrationValidationError === null;
  const canProceedStep6 = postVaccineValidationError === null;
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
        travelAssessment,
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
  }, [patientDetails, consent, travelAssessment, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts]);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails(initialMeningitisACWYPatientDetails);
    setConsent(initialMeningitisACWYConsent);
    setTravelAssessment({ travelDestinationConfirmed: false, travelReasonConfirmed: false, timingConfirmed: false });
    setMedicalHistory(initialMeningitisACWYMedicalHistory);
    setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: false });
    setPostVaccineAdvice(initialMeningitisACWYPostVaccineAdvice);
    setSummary(initialMeningitisACWYSummary());
    setShowSummaryReport(false);
  }, []);

  if (showSummaryReport) {
    return (
      <div>
        <MeningitisACWYSummaryReport
          patientDetails={patientDetails}
          consent={consent}
          summary={summary}
          medicalHistory={medicalHistory}
          clinicalAlerts={clinicalAlerts}
          postVaccineAdvice={postVaccineAdvice}
          pgdVersion={MENACWY_PGD_VERSION}
          onBack={() => setShowSummaryReport(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <SaveDraftButton
          pgdSlug="meningitis-acwy-travel"
          patientFirstName={patientDetails.firstName}
          patientLastName={patientDetails.lastName}
          patientDob={patientDetails.dateOfBirth}
          getDraftState={() => formState}
        />
      </div>

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
          hasErrors={completedSteps.size > 0 && (patientValidationError !== null || consentValidationError !== null)}
        />
      </div>

      {currentStep >= 2 && clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}

      {/* Step 0: Patient Details */}
      {currentStep === 0 && (
        <StepWrapper
          title={STEP_LABELS[0]}
          description="Collect patient information and calculate age"
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
            requireAdult={false}
          />
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
          {underSixteen && (
            <div className="mt-6 space-y-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900">Under 16: consent basis (PGD inclusion criterion)</p>
              <p className="text-xs text-amber-900">Under 16 with no person with parental responsibility available to consent, and not assessed as Gillick competent, is an exclusion. A parent accompanying a child does not automatically hold parental responsibility. Ask.</p>
              <SelectInput
                label="Consent given by"
                value={consent.consentBasis}
                onChange={(v) => setConsent({ ...consent, consentBasis: v as MeningitisACWYConsent['consentBasis'] })}
                options={[
                  { value: 'parental', label: 'A person with parental responsibility' },
                  { value: 'gillick', label: 'The young person, assessed as Gillick competent' },
                ]}
                required
              />
              <TextInput
                label={consent.consentBasis === 'gillick' ? 'Basis of the Gillick competence assessment' : 'Name and relationship of the person with parental responsibility'}
                value={consent.consentGiverDetails}
                onChange={(v) => setConsent({ ...consent, consentGiverDetails: v })}
                placeholder={consent.consentBasis === 'gillick' ? 'Why the young person was judged competent' : 'e.g. Fatima Khan, mother'}
                required
              />
            </div>
          )}
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="Patient understands a conjugate vaccine certificate is accepted for 5 years"
              checked={consent.understands5YearValidity}
              onChange={(v) => setConsent({ ...consent, understands5YearValidity: v })}
              description="Saudi Arabia accepts a conjugate vaccine given within the last 5 years (a polysaccharide vaccine within 3 years). Routine boosters are not recommended for most travellers."
            />
            <Checkbox
              label="Patient understands timing requirement (at least 10 days before arrival in Saudi Arabia)"
              checked={consent.understandsTimingRequirement}
              onChange={(v) => setConsent({ ...consent, understandsTimingRequirement: v })}
              description="For Hajj or Umrah the dose must be given at least 10 days before arrival. Book accordingly."
            />
            <Checkbox
              label="Patient aware certificate may be required for travel"
              checked={consent.certificateRequirement}
              onChange={(v) => setConsent({ ...consent, certificateRequirement: v })}
              description="Proof of MenACWY vaccination is a visa entry requirement for Hajj, and for Umrah at any time of year. The certificate must state the vaccine was a conjugate vaccine."
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 2: Travel Assessment */}
      {currentStep === 2 && (
        <StepWrapper
          title={STEP_LABELS[2]}
          description="Confirm travel destination, reason, and departure timing"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep2}
          validationError={travelValidationError}
        >
          <div className="space-y-4">
            {/* Almost every MenACWY patient is travelling to Saudi Arabia for
                Hajj or Umrah, often as a family group booked one after another
                (Moin, Aug 2026: "it makes it a little bit difficult to have to
                type in Saudi Arabia manually each time"). Pick from the list;
                Other reveals a free-text field for everything else. */}
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Travel destination <span className="text-red-400">*</span>
              </label>
              <select
                value={
                  DESTINATION_PRESETS.some((d) => d.value === patientDetails.travelDestination)
                    ? patientDetails.travelDestination
                    : patientDetails.travelDestination
                    ? 'other'
                    : ''
                }
                onChange={(ev) => {
                  const v = ev.target.value;
                  if (v === 'other') {
                    handlePatientDetailsChange('travelDestination', '');
                    setDestinationIsOther(true);
                    return;
                  }
                  setDestinationIsOther(false);
                  handlePatientDetailsChange('travelDestination', v);
                  const preset = DESTINATION_PRESETS.find((d) => d.value === v);
                  if (preset?.reason) handlePatientDetailsChange('travelReason', preset.reason);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              >
                <option value="">Select destination</option>
                {DESTINATION_PRESETS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.value}
                  </option>
                ))}
                <option value="other">Other (type it in)</option>
              </select>
            </div>

            {(destinationIsOther ||
              (!!patientDetails.travelDestination &&
                !DESTINATION_PRESETS.some((d) => d.value === patientDetails.travelDestination))) && (
              <TextInput
                label="Destination"
                value={patientDetails.travelDestination}
                onChange={(v) => handlePatientDetailsChange('travelDestination', v)}
                required
                placeholder="e.g. Senegal, Sub-Saharan Africa"
              />
            )}

            <div>
              <TextInput
                label="Passport number"
                value={patientDetails.passportNumber}
                onChange={(v) => handlePatientDetailsChange('passportNumber', v)}
                placeholder="e.g., 123456789"
              />
              <p className="mt-1 text-xs text-gray-500">
                Capture for the vaccination certificate. Needed for Saudi entry (Hajj/Umrah).
                Stored in the consultation record so you can reissue the certificate if the patient loses theirs.
              </p>
            </div>

            <SelectInput
              label="Reason for travel"
              value={patientDetails.travelReason}
              onChange={(v) =>
                handlePatientDetailsChange('travelReason', v as MeningitisACWYPatientDetails['travelReason'])
              }
              options={[
                { value: 'hajj-umrah', label: 'Hajj/Umrah pilgrimage (MANDATORY)' },
                {
                  value: 'meningitis-belt',
                  label: 'Sub-Saharan meningitis belt',
                },
                { value: 'university', label: 'University attendance' },
                { value: 'other', label: 'Other travel' },
              ]}
              required
            />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Departure date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={patientDetails.departureDate}
                onChange={(e) => handlePatientDetailsChange('departureDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              />
            </div>

            <Checkbox
              label="Previous MenACWY dose received"
              checked={patientDetails.previousMenACWYDose}
              onChange={(v) => {
                handlePatientDetailsChange('previousMenACWYDose', v);
                if (!v) {
                  handlePatientDetailsChange('previousDoseDate', '');
                  handlePatientDetailsChange('repeatDoseReason', '');
                }
              }}
              description="Routine boosters are not recommended for most travellers. A repeat dose is authorised under this PGD only where the previous dose was more than 5 years ago and a valid certificate is required for travel to Saudi Arabia. A previous MenC dose does not shorten or alter the schedule."
            />
            {patientDetails.previousMenACWYDose && (
              <>
                <TextInput
                  label="Date of previous dose"
                  type="date"
                  value={patientDetails.previousDoseDate ?? ''}
                  onChange={(v) => handlePatientDetailsChange('previousDoseDate', v)}
                  required
                />
                <TextInput
                  label="Reason for the repeat dose (recorded where a repeat is given for certificate purposes)"
                  value={patientDetails.repeatDoseReason}
                  onChange={(v) => handlePatientDetailsChange('repeatDoseReason', v)}
                  placeholder="e.g. previous dose 2019, valid certificate required for Hajj 2027"
                />
              </>
            )}

            <Checkbox
              label="Travel destination confirmed"
              checked={travelAssessment.travelDestinationConfirmed}
              onChange={(v) =>
                setTravelAssessment({ ...travelAssessment, travelDestinationConfirmed: v })
              }
              description="Confirm destination is appropriate for MenACWY vaccination"
            />

            <Checkbox
              label="Travel reason confirmed"
              checked={travelAssessment.travelReasonConfirmed}
              onChange={(v) =>
                setTravelAssessment({ ...travelAssessment, travelReasonConfirmed: v })
              }
              description="Confirm the stated reason for travel"
            />

            <Checkbox
              label="Departure timing confirmed"
              checked={travelAssessment.timingConfirmed}
              onChange={(v) => setTravelAssessment({ ...travelAssessment, timingConfirmed: v })}
              description="For Hajj or Umrah the dose must be given at least 10 days before arrival in Saudi Arabia"
            />
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
              label="Confirmed anaphylactic reaction to a previous dose of the same vaccine"
              checked={medicalHistory.anaphylaxisToVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, anaphylaxisToVaccine: v })
              }
              description="Exclusion: refer, do not vaccinate"
            />

            <Checkbox
              label="Confirmed anaphylactic reaction to any excipient or manufacturing residue of the vaccine"
              checked={medicalHistory.anaphylaxisToVaccineComponent}
              onChange={(v) =>
                setMedicalHistory({
                  ...medicalHistory,
                  anaphylaxisToVaccineComponent: v,
                })
              }
              description="Exclusion: refer, do not vaccinate"
            />

            <Checkbox
              label="Hypersensitivity to diphtheria toxoid or CRM197"
              checked={medicalHistory.diphtheriaToxoidHypersensitivity}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, diphtheriaToxoidHypersensitivity: v })
              }
              description="Excludes Menveo specifically (CRM197 is its conjugate carrier). Nimenrix and MenQuadfi are conjugated to tetanus toxoid and may be used."
            />

            <Checkbox
              label="Acute severe febrile illness"
              checked={medicalHistory.severeFebrilleIllness}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeFebrilleIllness: v })
              }
              description="Exclusion: postpone until recovered. A minor illness without fever is not a reason to defer."
            />

            <Checkbox
              label="Outbreak or contact management"
              checked={medicalHistory.outbreakOrContact}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, outbreakOrContact: v })}
              description="Exclusion: directed by the local UKHSA Health Protection Team and outside a private travel PGD. Refer."
            />

            <Checkbox
              label="Pregnant"
              checked={medicalHistory.pregnant}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, pregnant: v })}
              description="Caution: meningococcal vaccines may be given in pregnancy when clinically indicated; no evidence of harm from inadvertent vaccination."
            />

            <Checkbox
              label="Bleeding disorder or on anticoagulant therapy"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })}
              description="Caution: use a fine needle (23 gauge or finer) and apply firm pressure without rubbing for at least 2 minutes. Intramuscular route still applies."
            />

            <Checkbox
              label="Immunosuppressed, including HIV regardless of CD4 count"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressed: v })}
              description="Caution: vaccinate in accordance with the routine schedule, but the individual may not make a full antibody response"
            />

            <Checkbox
              label="Asplenia, complement deficiency, or due to start a complement inhibitor such as eculizumab"
              checked={medicalHistory.nhsEligibleRiskGroup}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, nhsEligibleRiskGroup: v })}
              description="Caution: may be eligible for NHS-funded vaccination. Check before charging privately."
            />

            <TextInput
              label="Known allergies (if any)"
              value={patientDetails.knownAllergies}
              onChange={(v) => handlePatientDetailsChange('knownAllergies', v)}
              placeholder="Enter any known allergies relevant to vaccination"
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
                  Exclusion identified. Refer, do not vaccinate. Explain why vaccination cannot be given today and what the alternative is. Where it is acute febrile illness, arrange to vaccinate after recovery and, if travel is imminent, say plainly that protection may not be achieved in time. Where outbreak or contact management is involved, refer to the GP or the UKHSA Health Protection Team. Document the advice and the decision.
                </p>
              </div>
            )}

            {clinicalAlerts.length === 0 && !isBlocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm font-semibold">
                  No clinical alerts identified. Patient is suitable for MenACWY vaccination.
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
                  vaccineType: v as 'nimenrix' | 'menquadfi' | 'menveo' | '',
                })
              }
              options={[
                { value: 'nimenrix', label: 'Nimenrix (Pfizer), licensed from 6 weeks' },
                { value: 'menquadfi', label: 'MenQuadfi (Sanofi), licensed from 12 months' },
                { value: 'menveo', label: 'Menveo (GSK), licensed from 2 years' },
              ]}
              required
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900">Schedule for this patient's age</p>
              <p className="text-blue-800 text-xs mt-1">{getMeningitisACWYDoseRecommendation(patientDetails)}</p>
              <p className="text-blue-800 text-xs mt-1">Choose the product first, then follow that product's schedule. Do not mix schedules between products. Where a course has been started with one product, complete it with the same product wherever possible. 0.5 mL intramuscular whichever product is used.</p>
            </div>

            {summary.vaccineType && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900">
                  {getAdministrationGuidance(summary.vaccineType).vaccineName}
                </p>
                <p className="text-blue-800 text-xs mt-1">
                  Route: {getAdministrationGuidance(summary.vaccineType).route}. Site: {getAdministrationGuidance(summary.vaccineType).site}.
                </p>
                <p className="text-blue-800 text-xs mt-2">
                  {getAdministrationGuidance(summary.vaccineType).guidance}
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
                  administrationSite: v as MeningitisACWYSummary['administrationSite'],
                })
              }
              options={[
                {
                  value: 'left-deltoid',
                  label: 'Left deltoid (from 1 year of age and in adults)',
                },
                {
                  value: 'right-deltoid',
                  label: 'Right deltoid (from 1 year of age and in adults)',
                },
                {
                  value: 'left-thigh',
                  label: 'Left anterolateral thigh (infants under 1 year)',
                },
                {
                  value: 'right-thigh',
                  label: 'Right anterolateral thigh (infants under 1 year)',
                },
              ]}
              required
            />

            <SelectInput
              label="Dose number"
              value={summary.doseNumber}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  doseNumber: v as MeningitisACWYSummary['doseNumber'],
                })
              }
              options={[
                { value: 'single', label: 'Single dose (from 12 months; or 6 to 11 months Nimenrix with booster at 12 months)' },
                { value: '1st', label: '1st dose of two (Nimenrix, 6 weeks to under 6 months)' },
                { value: '2nd', label: '2nd dose of two (Nimenrix, 6 weeks to under 6 months)' },
                { value: 'booster-12-months', label: 'Booster at 12 months of age (Nimenrix infant course)' },
                { value: 'repeat-certificate', label: 'Repeat for certificate (previous dose more than 5 years ago)' },
              ]}
              required
            />

            {courseInvolved && (
              <TextInput
                label="Date the next dose is due (book it at this appointment)"
                type="date"
                value={summary.nextDueDate}
                onChange={(v) => setSummary({ ...summary, nextDueDate: v })}
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
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Adverse effects to advise the patient about:</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Very common: injection site pain, redness and swelling; irritability, drowsiness and loss of appetite in infants; headache and fatigue in older children and adults</li>
                <li>Common: fever, nausea, malaise</li>
                <li>Uncommon: rash, injection site induration lasting more than 3 days</li>
                <li>Rare: anaphylaxis</li>
                <li>Some soreness, redness and mild fever are common in the first day or two and settle without treatment</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Counselling (PGD):</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>For Hajj or Umrah the dose must be given at least 10 days before arrival in Saudi Arabia</li>
                <li>Check your certificate before you travel. It must state that the vaccine was a CONJUGATE vaccine; if the type is not stated the Saudi authorities treat it as valid for 3 years only</li>
                <li>This vaccine protects against groups A, C, W and Y. It does not protect against group B meningococcal disease, which is a separate vaccine</li>
                <li>Know the signs of meningitis and septicaemia and seek help immediately whatever your vaccination status: fever, severe headache, neck stiffness, dislike of bright light, a rash that does not fade under pressure, cold hands and feet, drowsiness or confusion</li>
                <li>Where a further dose is due, it has been booked. A single dose in an infant course is not a complete course</li>
                <li>For a routine query about the vaccine or the certificate, contact the pharmacy</li>
              </ul>
            </div>

            <Checkbox
              label="Patient information leaflet for the product given supplied"
              checked={postVaccineAdvice.leafletGiven}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, leafletGiven: v })}
              description="Where a certificate is required, supply it before the patient leaves and check the details are correct"
            />

            <Checkbox
              label="Patient has been advised of common reactions"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })
              }
              description="Confirm patient is aware of expected side effects"
            />

            <Checkbox
              label="Patient understands a conjugate vaccine certificate is accepted for 5 years"
              checked={postVaccineAdvice.counselledValidity}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledValidity: v })
              }
              description="Routine boosters are not recommended for most travellers; a repeat is authorised only where the previous dose was more than 5 years ago and a valid certificate is required"
            />

            <Checkbox
              label="Certificate counselling: given at least 10 days before arrival; certificate states CONJUGATE vaccine"
              checked={postVaccineAdvice.counselledConjugateCertificate}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledConjugateCertificate: v })
              }
              description="If the type is not stated, the certificate is treated as valid for 3 years only, whatever was actually given. Saudi entry requirements are reviewed annually; check TravelHealthPro."
            />

            <Checkbox
              label="Patient told this vaccine does not protect against group B meningococcal disease"
              checked={postVaccineAdvice.counselledNotMenB}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledNotMenB: v })
              }
            />

            <Checkbox
              label="Signs of meningitis and septicaemia counselled; seek help immediately whatever the vaccination status"
              checked={postVaccineAdvice.counselledMeningitisSigns}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledMeningitisSigns: v })
              }
            />

            {courseInvolved && (
              <Checkbox
                label="Next dose of the course booked at this appointment"
                checked={postVaccineAdvice.nextDoseBooked}
                onChange={(v) =>
                  setPostVaccineAdvice({ ...postVaccineAdvice, nextDoseBooked: v })
                }
                description="A single dose in an infant course is not a complete course"
              />
            )}

            <Checkbox
              label="Patient advised to report serious adverse events"
              checked={postVaccineAdvice.counselledCertificate}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledCertificate: v })
              }
              description="Patient should contact GP or NHS 111 if severe reactions develop. Suspected adverse reactions are reported via the Yellow Card scheme and the GP informed."
            />

            <Checkbox
              label="15 minute observation period completed, patient vaccinated seated"
              checked={postVaccineAdvice.observationCompleted}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, observationCompleted: v })
              }
              description="Observe every patient for 15 minutes after vaccination. Syncope can occur before or after vaccination, particularly in adolescents."
              required
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
          onNext={() => { clearSaved(); setShowSummaryReport(true); }}
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

            {/* Vaccination certificate generation. Built in response to
                Moin (June 2026) asking for an ACWY certificate option that
                a patient can take away as proof of vaccination, most
                relevant for Hajj/Umrah visa requirements and university
                enrolment evidence. Opens a printable certificate page in a
                new tab; user can print to paper or save as PDF from the
                browser print dialog. Data carried via sessionStorage to
                avoid PHI in the URL. */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-navy-900 mb-1">
                Vaccination certificate
              </h3>
              <p className="text-xs text-gray-700 mb-3">
                Print a certificate for the patient confirming the vaccine
                administered, batch, date, and pharmacist. Suitable for
                Hajj/Umrah visa documentation, university enrolment, or
                employer travel records.
              </p>
              <button
                type="button"
                disabled={
                  !summary.vaccineType ||
                  !summary.batchNumber ||
                  !summary.pharmacistName
                }
                onClick={() => {
                  try {
                    const certPayload = {
                      patientFirstName: patientDetails.firstName,
                      patientLastName: patientDetails.lastName,
                      patientDob: patientDetails.dateOfBirth,
                      patientNhsNumber: patientDetails.nhsNumber,
                      vaccineType: summary.vaccineType,
                      batchNumber: summary.batchNumber,
                      expiryDate: summary.expiryDate,
                      administrationSite: summary.administrationSite,
                      travelReason: patientDetails.travelReason,
                      consultationDate: summary.consultationDate,
                      pharmacistName: summary.pharmacistName,
                      pharmacistGPhC: summary.pharmacistGPhC,
                      pharmacyName: summary.pharmacyName,
                      pharmacyAddress: summary.pharmacyAddress,
                    };
                    // localStorage, not sessionStorage: the certificate opens
                    // in a new tab with `noopener`, which severs the browsing
                    // context: sessionStorage is NOT copied across, so the
                    // certificate page came up empty ("no certificate is
                    // produced", Nitin/Moin, 17 Jul 2026). localStorage is
                    // shared across same-origin tabs; the certificate page
                    // deletes the key immediately after reading and ignores
                    // stale payloads, so PHI doesn't linger.
                    localStorage.setItem(
                      "grh-menacwy-cert",
                      JSON.stringify({ ts: Date.now(), data: certPayload }),
                    );
                    window.open(
                      "/for-pharmacies/epgd/certificate/menacwy",
                      "_blank",
                      "noopener,noreferrer",
                    );
                  } catch (err) {
                    console.error("Certificate open failed:", err);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generate vaccination certificate
              </button>
              <p className="text-[10px] text-gray-500 mt-2">
                Opens in a new tab. Requires vaccine, batch, and pharmacist
                name to be filled in.
              </p>
            </div>
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default MeningitisACWYClient;
