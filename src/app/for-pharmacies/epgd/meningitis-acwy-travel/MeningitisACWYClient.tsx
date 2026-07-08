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
} from './meningitis-acwy-travel-types';
import {
  initialMeningitisACWYPatientDetails,
  initialMeningitisACWYConsent,
  initialMeningitisACWYSummary,
} from './meningitis-acwy-travel-types';
import {
  getMeningitisACWYClinicalAlerts,
  shouldBlockConsultation,
  getAdministrationGuidance,
} from './meningitis-acwy-travel-clinical-logic';
import {
  validateMeningitisACWYPatientStep,
  validateMeningitisACWYTravelStep,
  validateMeningitisACWYConsentStep,
  validateMeningitisACWYAdministrationStep,
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

export function MeningitisACWYClient() {
  const [currentStep, setCurrentStep] = useState(0);
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

  const [medicalHistory, setMedicalHistory] = useState({
    anaphylaxisToVaccine: false,
    anaphylaxisToVaccineComponent: false,
    severeFebrilleIllness: false,
    bleedingDisorder: false,
    immunosuppressed: false,
  });

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });

  const [summary, setSummary] = useState<MeningitisACWYSummary>(
    initialMeningitisACWYSummary()
  );

  const [postVaccineAdvice, setPostVaccineAdvice] = useState({
    patientAdvised: false,
    counselledReactions: false,
    counselledValidity: false,
    counselledCertificate: false,
  });

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
      setMedicalHistory(saved.medicalHistory);
      setContraIndicationsReviewed(saved.contraIndicationsReviewed);
      setSummary(saved.summary);
      setPostVaccineAdvice(saved.postVaccineAdvice);
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
        if (s.medicalHistory) setMedicalHistory(s.medicalHistory);
        if (s.contraIndicationsReviewed) setContraIndicationsReviewed(s.contraIndicationsReviewed);
        if (s.summary) setSummary(s.summary);
        if (s.postVaccineAdvice) setPostVaccineAdvice(s.postVaccineAdvice);
      })
      .catch(() => { /* draft missing or expired — ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof MeningitisACWYPatientDetails, value: any) => {
      setPatientDetails((prev) => {
        // Functional update: GP-practice autofill fires several field updates
        // in the same tick; a closure-captured spread made each call overwrite
        // the previous one (only the last field survived).
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
    return validateMeningitisACWYConsentStep(consent);
  }, [consent]);

  const administrationValidationError = useMemo(() => {
    return validateMeningitisACWYAdministrationStep(summary);
  }, [summary]);

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
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="Patient understands vaccine is valid for 5 years"
              checked={consent.understands5YearValidity}
              onChange={(v) => setConsent({ ...consent, understands5YearValidity: v })}
              description="Confirm patient is aware of duration of protection"
            />
            <Checkbox
              label="Patient understands timing requirement (≥10 days before travel)"
              checked={consent.understandsTimingRequirement}
              onChange={(v) => setConsent({ ...consent, understandsTimingRequirement: v })}
              description="For high-risk destinations, vaccination must be given at least 10 days before departure"
            />
            <Checkbox
              label="Patient aware certificate may be required for travel"
              checked={consent.certificateRequirement}
              onChange={(v) => setConsent({ ...consent, certificateRequirement: v })}
              description="Particularly important for Hajj/Umrah pilgrims — Saudi Arabia requires proof of vaccination"
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
            <TextInput
              label="Travel destination"
              value={patientDetails.travelDestination}
              onChange={(v) => handlePatientDetailsChange('travelDestination', v)}
              required
              placeholder="e.g., Saudi Arabia, Senegal, Sub-Saharan Africa"
            />

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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>

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
              description="Confirm departure date allows at least 10 days for vaccine to take effect"
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
              label="Anaphylaxis to previous MenACWY dose"
              checked={medicalHistory.anaphylaxisToVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, anaphylaxisToVaccine: v })
              }
              description="Absolute contraindication — do not proceed"
            />

            <Checkbox
              label="Anaphylaxis to vaccine component (polysorbate 80 or other)"
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
              label="Bleeding disorder or on anticoagulant therapy"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })}
              description="Requires subcutaneous injection instead of IM"
            />

            <Checkbox
              label="Patient is immunosuppressed"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressed: v })}
              description="Vaccine response may be reduced; discuss with patient"
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
                  Absolute contraindication identified. Consultation cannot proceed. Patient
                  should be referred to their GP.
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
                  vaccineType: v as 'nimenrix' | 'menveo' | '',
                })
              }
              options={[
                { value: 'nimenrix', label: 'Nimenrix (GSK)' },
                { value: 'menveo', label: 'Menveo (Sanofi)' },
              ]}
              required
            />

            {summary.vaccineType && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900">
                  {getAdministrationGuidance(summary.vaccineType).vaccineName}
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>

            <SelectInput
              label="Administration site"
              value={summary.administrationSite}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  administrationSite: v as
                    | 'left-deltoid'
                    | 'right-deltoid'
                    | '',
                })
              }
              options={[
                {
                  value: 'left-deltoid',
                  label: 'Left deltoid (preferred)',
                },
                {
                  value: 'right-deltoid',
                  label: 'Right deltoid',
                },
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
                <li>Injection site pain, redness, or swelling</li>
                <li>Headache</li>
                <li>Fatigue or malaise</li>
                <li>Myalgia (muscle aches)</li>
                <li>Mild fever</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Important information to share:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Most reactions are mild and resolve within 24-48 hours</li>
                <li>Vaccine is valid for 5 years</li>
                <li>Booster may be required after 5 years for high-risk groups</li>
                <li>For Saudi Arabia/Hajj: vaccination certificate is required for entry</li>
                <li>Paracetamol or ibuprofen can be taken for fever or myalgia</li>
                <li>Seek GP advice if severe reaction develops</li>
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
              label="Patient understands vaccine protection is valid for 5 years"
              checked={postVaccineAdvice.counselledValidity}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledValidity: v })
              }
              description="Discuss need for possible revaccination after 5 years"
            />

            <Checkbox
              label="Patient advised to report serious adverse events"
              checked={postVaccineAdvice.counselledCertificate}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledCertificate: v })
              }
              description="Patient should contact GP or NHS 111 if severe reactions develop"
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
                a patient can take away as proof of vaccination — most
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
                    sessionStorage.setItem(
                      "grh-menacwy-cert",
                      JSON.stringify(certPayload),
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
