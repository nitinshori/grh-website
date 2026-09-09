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
  CholeraPatientDetails,
  CholeraConsent,
  CholeraMedicalHistory,
  CholeraSummary,
} from './cholera-types';
import {
  initialCholeraPatientDetails,
  initialCholeraConsent,
  initialCholeraMedicalHistory,
  initialCholeraSummary,
} from './cholera-types';
import {
  getCholeraClinicalAlerts,
  shouldBlockConsultation,
  getAdministrationGuidance,
  getCholeraDoseRecommendation,
} from './cholera-clinical-logic';
import {
  validateCholeraPatientStep,
  validateCholeraStep,
  validateCholeraConsentStep,
  validateCholeraAdministrationStep,
  validateCholeraSummaryStep,
} from './cholera-validation';
import { calculateAge } from '../shared/types';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import CholeraSummaryReport from './components/CholeraSummaryReport';

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

export function CholeraClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<CholeraPatientDetails>(
    initialCholeraPatientDetails
  );
  const [consent, setConsent] = useState<CholeraConsent>(initialCholeraConsent);

  const [travelAssessment, setTravelAssessment] = useState({
    travelDestinationConfirmed: false,
    travelReasonConfirmed: false,
    timingConfirmed: false,
  });

  const [medicalHistory, setMedicalHistory] = useState<CholeraMedicalHistory>(
    initialCholeraMedicalHistory
  );

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });

  const [summary, setSummary] = useState<CholeraSummary>(initialCholeraSummary());

  const [postVaccineAdvice, setPostVaccineAdvice] = useState({
    patientAdvised: false,
    counselledReactions: false,
    counselledValidity: false,
    counselledCertificate: false,
  });

  const [showSummaryReport, setShowSummaryReport] = useState(false);

  const formState = useMemo(() => ({
    currentStep, patientDetails, consent, travelAssessment, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice,
  }), [currentStep, patientDetails, consent, travelAssessment, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice]);

  const { clearSaved } = useFormPersistence(
    'epgd-cholera',
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

  const handlePatientDetailsChange = useCallback(
    (field: keyof CholeraPatientDetails, value: any) => {
      // Functional update — GP-practice autofill sets several fields in one
      // tick; a closure spread would drop all but the last.
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

  const clinicalAlerts = useMemo(
    () => getCholeraClinicalAlerts(patientDetails, medicalHistory),
    [patientDetails, medicalHistory]
  );
  const isBlocked = useMemo(() => shouldBlockConsultation(clinicalAlerts), [clinicalAlerts]);

  const patientValidationError = useMemo(() => validateCholeraPatientStep(patientDetails), [patientDetails]);
  const consentValidationError = useMemo(() => validateCholeraConsentStep(consent), [consent]);
  const administrationValidationError = useMemo(() => validateCholeraAdministrationStep(summary), [summary]);
  const summaryValidationError = useMemo(() => validateCholeraSummaryStep(summary), [summary]);
  const travelValidationError = useMemo(
    () => validateCholeraStep(patientDetails, travelAssessment),
    [patientDetails, travelAssessment]
  );

  const canProceedByStep = [
    patientValidationError === null,
    consentValidationError === null,
    travelValidationError === null,
    true,
    contraIndicationsReviewed.confirmedNoAbsoluteContraindications,
    administrationValidationError === null,
    postVaccineAdvice.patientAdvised,
    summaryValidationError === null,
  ];

  const handleNext = () => {
    if (canProceedByStep[currentStep]) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

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
      outcome: clinicalAlerts.some((a) => a.severity === 'stop') ? 'not_supplied' : 'completed',
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
    setPatientDetails(initialCholeraPatientDetails);
    setConsent(initialCholeraConsent);
    setMedicalHistory(initialCholeraMedicalHistory);
    setSummary(initialCholeraSummary());
    setShowSummaryReport(false);
  }, []);

  if (showSummaryReport) {
    return (
      <CholeraSummaryReport
        patientDetails={patientDetails}
        consent={consent}
        summary={summary}
        medicalHistory={medicalHistory}
        clinicalAlerts={clinicalAlerts}
        postVaccineAdvice={postVaccineAdvice}
        onBack={() => setShowSummaryReport(false)}
      />
    );
  }

  return (
    <>
      {/* DRAFT notice — remove once clinically signed off */}
      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Draft ePGD — not for clinical use yet.</strong> Content (schedules,
        contraindications, counselling) is for review and sign-off by the named clinician.
      </div>

      <div className="mb-3 flex justify-end">
        <SaveDraftButton
          pgdSlug="cholera"
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
            if (completedSteps.has(step) || step <= currentStep) setCurrentStep(step);
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
          canProceed={canProceedByStep[0]}
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
          canProceed={canProceedByStep[1]}
          validationError={consentValidationError}
        >
          <ConsentStep
            consent={consent}
            onChange={(field, value) => setConsent({ ...consent, [field]: value })}
          />
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="Patient understands the vaccine is taken orally (dissolved in water)"
              checked={consent.understandsOralAdministration}
              onChange={(v) => setConsent({ ...consent, understandsOralAdministration: v })}
              description="No food or drink for 1 hour before and after each dose"
            />
            <Checkbox
              label="Patient understands the dose schedule (2–3 doses, 1–6 weeks apart)"
              checked={consent.understandsCourseSchedule}
              onChange={(v) => setConsent({ ...consent, understandsCourseSchedule: v })}
              description="Adults/≥6y: 2 doses. Children 2–5y: 3 doses."
            />
            <Checkbox
              label="Patient understands the course should be completed ≥1 week before travel"
              checked={consent.understandsTimingBeforeTravel}
              onChange={(v) => setConsent({ ...consent, understandsTimingBeforeTravel: v })}
              description="Protection is not immediate — plan ahead of departure"
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 2: Travel Assessment */}
      {currentStep === 2 && (
        <StepWrapper
          title={STEP_LABELS[2]}
          description="Confirm destination, reason, and departure timing"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[2]}
          validationError={travelValidationError}
        >
          <div className="space-y-4">
            <TextInput
              label="Travel destination"
              value={patientDetails.travelDestination}
              onChange={(v) => handlePatientDetailsChange('travelDestination', v)}
              required
              placeholder="e.g., India, Sub-Saharan Africa, disaster-relief zone"
            />

            <SelectInput
              label="Reason for vaccination"
              value={patientDetails.travelReason}
              onChange={(v) =>
                handlePatientDetailsChange('travelReason', v as CholeraPatientDetails['travelReason'])
              }
              options={[
                { value: 'endemic-travel', label: 'Travel to a cholera-endemic area' },
                { value: 'aid-relief', label: 'Aid / disaster-relief work' },
                { value: 'outbreak-response', label: 'Outbreak-response / high-risk exposure' },
                { value: 'other', label: 'Other' },
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
              label="Travel destination confirmed"
              checked={travelAssessment.travelDestinationConfirmed}
              onChange={(v) => setTravelAssessment({ ...travelAssessment, travelDestinationConfirmed: v })}
              description="Confirm destination/exposure warrants cholera vaccination"
            />
            <Checkbox
              label="Reason for vaccination confirmed"
              checked={travelAssessment.travelReasonConfirmed}
              onChange={(v) => setTravelAssessment({ ...travelAssessment, travelReasonConfirmed: v })}
            />
            <Checkbox
              label="Departure timing allows the course to be completed ≥1 week before travel"
              checked={travelAssessment.timingConfirmed}
              onChange={(v) => setTravelAssessment({ ...travelAssessment, timingConfirmed: v })}
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
          canProceed={canProceedByStep[3]}
          validationError={null}
        >
          <div className="space-y-4">
            <Checkbox
              label="Anaphylaxis to a previous dose of oral cholera vaccine"
              checked={medicalHistory.anaphylaxisPreviousDose}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, anaphylaxisPreviousDose: v })}
              description="Absolute contraindication — do not proceed"
            />
            <Checkbox
              label="Known hypersensitivity to formaldehyde or any vaccine excipient"
              checked={medicalHistory.hypersensitivityComponent}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, hypersensitivityComponent: v })}
              description="Absolute contraindication for Dukoral — do not proceed"
            />
            <Checkbox
              label="Acute gastrointestinal illness (vomiting / diarrhoea)"
              checked={medicalHistory.acuteGastroIllness}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, acuteGastroIllness: v })}
              description="Defer until recovered — oral absorption may be impaired"
            />
            <Checkbox
              label="Acute febrile illness"
              checked={medicalHistory.acuteFebrileIllness}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, acuteFebrileIllness: v })}
              description="Defer vaccination until the patient has recovered"
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
          canProceed={canProceedByStep[4]}
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
                  Absolute contraindication identified. Consultation cannot proceed. Refer the patient to their GP.
                </p>
              </div>
            )}
            {clinicalAlerts.length === 0 && !isBlocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm font-semibold">
                  No clinical alerts identified. Patient is suitable for oral cholera vaccination.
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
                onChange={(v) => setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: v })}
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
          canProceed={canProceedByStep[5]}
          validationError={administrationValidationError}
        >
          <div className="space-y-4">
            {patientDetails.age !== null && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                <strong>Recommended schedule:</strong> {getCholeraDoseRecommendation(patientDetails)}
              </div>
            )}

            <SelectInput
              label="Vaccine"
              value={summary.vaccineType}
              onChange={(v) => setSummary({ ...summary, vaccineType: v as CholeraSummary['vaccineType'] })}
              options={[
                { value: 'dukoral', label: 'Dukoral (oral, inactivated)' },
                { value: 'vaxchora', label: 'Vaxchora (oral, live attenuated)' },
              ]}
              required
            />

            {summary.vaccineType && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900">
                  {getAdministrationGuidance(summary.vaccineType).vaccineName} — {getAdministrationGuidance(summary.vaccineType).route}
                </p>
                <p className="text-blue-800 text-xs mt-2">
                  {getAdministrationGuidance(summary.vaccineType).guidance}
                </p>
              </div>
            )}

            <SelectInput
              label="Dose number"
              value={summary.doseNumber}
              onChange={(v) => setSummary({ ...summary, doseNumber: v as CholeraSummary['doseNumber'] })}
              options={[
                { value: '1', label: 'Dose 1' },
                { value: '2', label: 'Dose 2' },
                { value: '3', label: 'Dose 3 (children 2–5y only)' },
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
          canProceed={canProceedByStep[6]}
          validationError={!postVaccineAdvice.patientAdvised ? 'Patient must be advised' : null}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Common reactions to advise the patient about:</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Mild gastrointestinal upset — abdominal pain, cramps, nausea</li>
                <li>Diarrhoea</li>
                <li>Headache</li>
                <li>Occasional low-grade fever</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Important information to share:</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Complete the full course (2–3 doses) at least 1 week before travel</li>
                <li>No food or drink for 1 hour before and after each dose</li>
                <li>Vaccine reduces but does not eliminate risk — maintain food/water hygiene</li>
                <li>Dukoral also gives limited short-term protection against ETEC travellers&rsquo; diarrhoea</li>
                <li>Seek medical advice if a severe reaction develops</li>
              </ul>
            </div>

            <Checkbox
              label="Patient has been advised of common reactions"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })}
            />
            <Checkbox
              label="Patient understands they must complete the full course before travel"
              checked={postVaccineAdvice.counselledValidity}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledValidity: v })}
            />
            <Checkbox
              label="Patient advised to report serious adverse events (GP / NHS 111)"
              checked={postVaccineAdvice.counselledCertificate}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledCertificate: v })}
            />
            <Checkbox
              label="All counselling completed and documented"
              checked={postVaccineAdvice.patientAdvised}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, patientAdvised: v })}
              description="Confirm the pharmacist has completed the patient consultation"
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
          canProceed={canProceedByStep[7]}
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

export default CholeraClient;
