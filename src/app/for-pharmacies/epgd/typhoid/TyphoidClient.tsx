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
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from './typhoid-types';
import {
  initialTyphoidPatientDetails,
  initialTyphoidConsent,
  initialTyphoidSummary,
} from './typhoid-types';
import {
  getTyphoidClinicalAlerts,
  shouldBlockConsultation,
  getAdministrationGuidance,
  daysUntilDeparture,
  yearsSincePreviousDose,
  nextBoosterDueDate,
  RENEWAL_WINDOW_YEARS,
  TYPHOID_PGD_VERSION,
} from './typhoid-clinical-logic';
import {
  validateTyphoidPatientStep,
  validateTyphoidStep,
  validateTyphoidConsentStep,
  validateTyphoidMedicalHistoryStep,
  validateTyphoidAdministrationStep,
  validateTyphoidPostVaccineStep,
  validateTyphoidSummaryStep,
  GILLICK_MIN_AGE,
} from './typhoid-validation';
import { calculateAge } from '../shared/types';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import TyphoidSummaryReport from './components/TyphoidSummaryReport';

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

export function TyphoidClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<TyphoidPatientDetails>(
    initialTyphoidPatientDetails
  );

  const [consent, setConsent] = useState<TyphoidConsent>(initialTyphoidConsent);

  const [travelAssessment, setTravelAssessment] = useState({
    travelDestinationConfirmed: false,
    travelReasonConfirmed: false,
    timingConfirmed: false,
    shortNoticeAdvised: false,
  });

  const [medicalHistory, setMedicalHistory] = useState({
    anaphylaxisToVaccine: false,
    anaphylaxisToVaccineComponent: false,
    severeFebrilleIllness: false,
    feverAfterTravel: false,
    pregnantOrBreastfeeding: false,
    pregnancyDecision: '',
    bleedingDisorder: false,
    immunosuppressed: false,
  });

  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });

  const [summary, setSummary] = useState<TyphoidSummary>(
    initialTyphoidSummary()
  );

  const [postVaccineAdvice, setPostVaccineAdvice] = useState({
    patientAdvised: false,
    counselledReactions: false,
    counselledValidity: false,
    counselledCertificate: false,
    counselledFoodWater: false,
    counselledFeverWarning: false,
    observationCompleted: false,
    adverseReaction: false,
    adverseReactionDetails: '',
  });

  // Recorded when an exclusion applies: the document requires the advice
  // given (food and water hygiene in every case) and the decision to be
  // documented, and a febrile returning traveller to be referred the same day.
  const [exclusionOutcome, setExclusionOutcome] = useState({
    adviceGiven: '',
    foodWaterAdviceGiven: false,
    referral: '' as '' | 'gp' | 'travel-clinic' | 'urgent-same-day' | 'declined',
  });

  // Persist form data to sessionStorage so it survives accidental navigation
  const formState = useMemo(() => ({
    currentStep, patientDetails, consent, travelAssessment, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice, exclusionOutcome,
  }), [currentStep, patientDetails, consent, travelAssessment, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice, exclusionOutcome]);

  const { clearSaved } = useFormPersistence(
    'epgd-typhoid',
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
      if (saved.exclusionOutcome) setExclusionOutcome(saved.exclusionOutcome);
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
        if (s.postVaccineAdvice) setPostVaccineAdvice({ ...postVaccineAdvice, ...s.postVaccineAdvice });
        if (s.exclusionOutcome) setExclusionOutcome(s.exclusionOutcome);
      })
      .catch(() => { /* draft missing or expired — ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate age when DOB changes
  const handlePatientDetailsChange = useCallback(
    (field: keyof TyphoidPatientDetails, value: any) => {
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
    return getTyphoidClinicalAlerts(patientDetails, medicalHistory);
  }, [patientDetails, medicalHistory]);

  const isBlocked = useMemo(() => {
    return shouldBlockConsultation(clinicalAlerts);
  }, [clinicalAlerts]);

  // Validation
  const patientValidationError = useMemo(() => {
    return validateTyphoidPatientStep(patientDetails);
  }, [patientDetails]);

  const consentValidationError = useMemo(() => {
    return validateTyphoidConsentStep(consent, patientDetails);
  }, [consent, patientDetails]);

  const administrationValidationError = useMemo(() => {
    return validateTyphoidAdministrationStep(summary);
  }, [summary]);

  const summaryValidationError = useMemo(() => {
    return validateTyphoidSummaryStep(summary);
  }, [summary]);

  const travelValidationError = useMemo(() => {
    return validateTyphoidStep(patientDetails, travelAssessment);
  }, [patientDetails, travelAssessment]);

  const medicalHistoryValidationError = useMemo(() => {
    return validateTyphoidMedicalHistoryStep(medicalHistory);
  }, [medicalHistory]);

  const postVaccineValidationError = useMemo(() => {
    return validateTyphoidPostVaccineStep(postVaccineAdvice);
  }, [postVaccineAdvice]);

  const daysToDeparture = useMemo(() => daysUntilDeparture(patientDetails.departureDate), [patientDetails.departureDate]);
  const isUnder16 = patientDetails.age !== null && patientDetails.age < 16;

  // Step can proceed checks
  // A stop anywhere disables Next on every step (and Save & Print on the
  // last). The progress bar is backwards-only, so there is no forward route
  // that skips these gates (adversarial review, 11 Sep 2026).
  const canProceedStep0 = patientValidationError === null && !isBlocked;
  const canProceedStep1 = consentValidationError === null && !isBlocked;
  const canProceedStep2 = travelValidationError === null && !isBlocked;
  const canProceedStep3 = medicalHistoryValidationError === null && !isBlocked;
  const canProceedStep4 = contraIndicationsReviewed.confirmedNoAbsoluteContraindications && !isBlocked;
  const canProceedStep5 = administrationValidationError === null && !isBlocked;
  const canProceedStep6 = postVaccineValidationError === null && !isBlocked;
  const canProceedStep7 = summaryValidationError === null && !isBlocked;
  const yearsSincePrevious = useMemo(() => yearsSincePreviousDose(patientDetails.previousDoseDate), [patientDetails.previousDoseDate]);
  const renewalWindow = yearsSincePrevious !== null && yearsSincePrevious >= RENEWAL_WINDOW_YEARS && yearsSincePrevious < 3;

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
    // The record is being written: forget the sessionStorage copy so that
    // reopening the tool in this tab does not resume a saved consultation and
    // write a duplicate (adversarial review, 11 Sep 2026).
    clearSaved();
    const vaccineName =
      summary.vaccineType === 'typhim-vi'
        ? 'Typhim Vi, typhoid Vi polysaccharide vaccine 25 micrograms in 0.5 mL'
        : summary.vaccineType === 'other-vi'
        ? `${summary.vaccineBrand || 'Vi polysaccharide typhoid vaccine'}, 25 micrograms in 0.5 mL`
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
        travelAssessment,
        medicalHistory,
        contraIndicationsReviewed,
        postVaccineAdvice,
        summary,
        clinicalAlerts,
        pgdVersion: TYPHOID_PGD_VERSION,
        dose: isBlocked ? null : '0.5 mL, 25 micrograms Vi polysaccharide, solution for injection in a pre-filled syringe',
        route: isBlocked ? null : 'Intramuscular',
        exclusion: isBlocked
          ? { reasons: clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message), ...exclusionOutcome }
          : null,
        adverseReaction: postVaccineAdvice.adverseReaction ? postVaccineAdvice.adverseReactionDetails : null,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked
        ? (exclusionOutcome.referral && exclusionOutcome.referral !== 'declined' ? 'referred' : 'not_supplied')
        : 'completed',
      ...(isBlocked || !vaccineName
        ? {}
        : { medicine: { name: vaccineName, dose: '0.5 mL intramuscular, single dose', duration: 'Single dose', quantity: 1 } }),
      summary: {
        pharmacistName: summary.pharmacistName,
        pharmacistGPhC: summary.pharmacistGPhC,
        pharmacyName: summary.pharmacyName,
        pharmacyAddress: summary.pharmacyAddress,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
        clinicalNotes: summary.clinicalNotes,
      },
      consent: { notifyGp: !!consent.notifyGp },
    };
  }, [patientDetails, consent, travelAssessment, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts, isBlocked, exclusionOutcome, clearSaved]);

  const handleNewConsultation = useCallback(() => {
    clearSaved();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails({ ...initialTyphoidPatientDetails });
    setConsent({ ...initialTyphoidConsent });
    setTravelAssessment({ travelDestinationConfirmed: false, travelReasonConfirmed: false, timingConfirmed: false, shortNoticeAdvised: false });
    setMedicalHistory({
      anaphylaxisToVaccine: false, anaphylaxisToVaccineComponent: false, severeFebrilleIllness: false,
      feverAfterTravel: false, pregnantOrBreastfeeding: false, pregnancyDecision: '', bleedingDisorder: false, immunosuppressed: false,
    });
    setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: false });
    setPostVaccineAdvice({
      patientAdvised: false, counselledReactions: false, counselledValidity: false, counselledCertificate: false,
      counselledFoodWater: false, counselledFeverWarning: false, observationCompleted: false,
      adverseReaction: false, adverseReactionDetails: '',
    });
    setExclusionOutcome({ adviceGiven: '', foodWaterAdviceGiven: false, referral: '' });
    setSummary(initialTyphoidSummary());
  }, [clearSaved]);

  // Passed to every StepWrapper so that a stop on any step offers "Save as
  // not supplied" and the record carries the exclusion outcome.
  const wrapperShared = { isBlocked, getConsultationData, onNewConsultation: handleNewConsultation };

  const exclusionOutcomeBlock = isBlocked ? (
    <div className="mb-6 space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">Exclusion: record the advice given and the decision</p>
      <p className="text-xs text-red-800">
        Explain why vaccination cannot be given and what the alternative is. In every case give food and water hygiene advice. Where there is fever after travel to a risk area, refer for urgent same-day assessment and say plainly that typhoid must be excluded. Then use &quot;Save as not supplied&quot; in the step footer.
      </p>
      <Checkbox
        label="Food and water hygiene advice given and the Get Real Health sheet supplied (required in every case)"
        checked={exclusionOutcome.foodWaterAdviceGiven}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, foodWaterAdviceGiven: v })}
      />
      <TextArea
        label="Advice given and decision reached"
        value={exclusionOutcome.adviceGiven}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, adviceGiven: v })}
        placeholder="e.g. Fever after travel to India: advised to attend urgent care today, typhoid to be excluded; food and water advice given"
        rows={3}
        required
      />
      <SelectInput
        label="Referral"
        value={exclusionOutcome.referral}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, referral: v as typeof exclusionOutcome.referral })}
        options={[
          { value: 'gp', label: 'Referred to GP' },
          { value: 'travel-clinic', label: 'Referred to a travel clinic' },
          { value: 'urgent-same-day', label: 'Urgent same-day assessment (fever after travel)' },
          { value: 'declined', label: 'Patient declined referral; advice given' },
        ]}
        required
      />
    </div>
  ) : null;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <SaveDraftButton
          pgdSlug="typhoid"
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
            if (step < currentStep) setCurrentStep(step);
          }}
          completedSteps={completedSteps}
          hasErrors={completedSteps.size > 0 && (patientValidationError !== null || consentValidationError !== null)}
        />
      </div>

      {(currentStep >= 2 || isBlocked) && clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}
      {exclusionOutcomeBlock}

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
          {...wrapperShared}
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
          {...wrapperShared}
        >
          <ConsentStep
            consent={consent}
            onChange={(field, value) => setConsent({ ...consent, [field]: value })}
          />
          <div className="mt-6 space-y-3 border-t pt-6">
            <SelectInput
              label="Consent given by"
              value={patientDetails.consentBasis}
              onChange={(v) => handlePatientDetailsChange('consentBasis', v as TyphoidPatientDetails['consentBasis'])}
              options={[
                ...(isUnder16 ? [] : [{ value: 'self', label: 'The patient (aged 16 and over)' }]),
                ...(isUnder16 ? [{ value: 'parental', label: 'A person with parental responsibility (patient under 16)' }] : []),
                ...(isUnder16 && patientDetails.age !== null && patientDetails.age >= GILLICK_MIN_AGE
                  ? [{ value: 'gillick', label: `The young person, assessed as Gillick competent (${GILLICK_MIN_AGE} to 15 years)` }]
                  : []),
              ]}
              required
            />
            {patientDetails.consentBasis === 'parental' && (
              <TextInput
                label="Name and relationship of the person with parental responsibility"
                value={patientDetails.consentDetail}
                onChange={(v) => handlePatientDetailsChange('consentDetail', v)}
                placeholder="e.g. Jane Smith, mother"
                required
              />
            )}
            {patientDetails.consentBasis === 'gillick' && (
              <TextInput
                label="Basis of the Gillick competence assessment"
                value={patientDetails.consentDetail}
                onChange={(v) => handlePatientDetailsChange('consentDetail', v)}
                placeholder="e.g. understands the purpose, benefits and risks and can retain and weigh the information"
                required
              />
            )}
            <Checkbox
              label="Patient understands a booster is needed every 3 years if travel to risk areas continues"
              checked={consent.understands5YearValidity}
              onChange={(v) => setConsent({ ...consent, understands5YearValidity: v })}
              description="Confirm patient is aware of duration of protection"
            />
            <Checkbox
              label="Patient understands the vaccine takes about 2 weeks to work and should be given at least 2 weeks before travel"
              checked={consent.understandsTimingRequirement}
              onChange={(v) => setConsent({ ...consent, understandsTimingRequirement: v })}
              description="Where travel is sooner, vaccination may still be given but protection may be incomplete"
            />
            <Checkbox
              label="Patient understands the vaccine is about 70 to 80% effective, does not protect against paratyphoid, and that food and water precautions remain the main protection"
              checked={consent.certificateRequirement}
              onChange={(v) => setConsent({ ...consent, certificateRequirement: v })}
              description="It reduces the risk; it does not remove it"
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
          {...wrapperShared}
        >
          <div className="space-y-4">
            <TextInput
              label="Travel destination"
              value={patientDetails.travelDestination}
              onChange={(v) => handlePatientDetailsChange('travelDestination', v)}
              required
              placeholder="e.g. India, Bangladesh, Peru"
            />

            <SelectInput
              label="Risk region"
              value={patientDetails.travelReason}
              onChange={(v) =>
                handlePatientDetailsChange('travelReason', v as TyphoidPatientDetails['travelReason'])
              }
              options={[
                { value: 'south-asia', label: 'South Asia (highest risk: India, Pakistan, Bangladesh, Nepal)' },
                { value: 'southeast-asia', label: 'Southeast Asia' },
                { value: 'africa', label: 'Africa' },
                { value: 'central-south-america', label: 'Central or South America' },
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

            <TextArea
              label="Itinerary"
              value={patientDetails.itinerary}
              onChange={(v) => handlePatientDetailsChange('itinerary', v)}
              placeholder="Areas visited, duration, style of travel (e.g. visiting friends and relatives, rural stay)"
              rows={2}
            />

            <TextInput
              label="Source consulted for the recommendation"
              value={patientDetails.recommendationSource}
              onChange={(v) => handlePatientDetailsChange('recommendationSource', v)}
              required
              placeholder="e.g. TravelHealthPro country page, checked today"
            />

            <Checkbox
              label="Typhoid vaccination is recommended for this destination on current NaTHNaC / TravelHealthPro guidance"
              checked={travelAssessment.travelDestinationConfirmed}
              onChange={(v) =>
                setTravelAssessment({ ...travelAssessment, travelDestinationConfirmed: v })
              }
              description="Inclusion criterion: established from current guidance and recorded"
            />

            <Checkbox
              label="Risk region confirmed"
              checked={travelAssessment.travelReasonConfirmed}
              onChange={(v) =>
                setTravelAssessment({ ...travelAssessment, travelReasonConfirmed: v })
              }
              description="Confirm the risk region recorded above"
            />

            <Checkbox
              label="Departure timing confirmed"
              checked={travelAssessment.timingConfirmed}
              onChange={(v) => setTravelAssessment({ ...travelAssessment, timingConfirmed: v })}
              description="At least 2 weeks before departure so that protection can develop"
            />

            {daysToDeparture !== null && daysToDeparture < 14 && (
              <Checkbox
                label="Travel is sooner than 2 weeks: the traveller has been told protection may be incomplete, and this is recorded"
                checked={travelAssessment.shortNoticeAdvised}
                onChange={(v) => setTravelAssessment({ ...travelAssessment, shortNoticeAdvised: v })}
                description="Vaccination may still be given"
              />
            )}

            <div className="space-y-3 border-t pt-4">
              <Checkbox
                label="Previous typhoid Vi vaccine dose"
                checked={patientDetails.previousTyphoidDose}
                onChange={(v) => handlePatientDetailsChange('previousTyphoidDose', v)}
                description="A dose within the last 3 years excludes, unless the traveller is returning to a risk area and the previous dose is due for renewal"
              />
              {patientDetails.previousTyphoidDose && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Date of previous dose <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={patientDetails.previousDoseDate || ''}
                      onChange={(e) => handlePatientDetailsChange('previousDoseDate', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                    />
                  </div>
                  {renewalWindow && (
                    <TextInput
                      label="Previous dose is within 6 months of its 3 year renewal date: record that the traveller is returning to a risk area and why the dose is due for renewal"
                      value={patientDetails.previousDoseRenewalReason}
                      onChange={(v) => handlePatientDetailsChange('previousDoseRenewalReason', v)}
                      placeholder="e.g. returning to rural Bangladesh for 3 months, previous dose 2 years 8 months ago, renewal due before return"
                    />
                  )}
                  {yearsSincePrevious !== null && yearsSincePrevious >= 0 && yearsSincePrevious < RENEWAL_WINDOW_YEARS && (
                    <p className="text-xs text-red-700">Previous dose {yearsSincePrevious.toFixed(1)} years ago: not yet due for renewal, so the document&apos;s exception does not apply. Excluded.</p>
                  )}
                </>
              )}
            </div>
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
          validationError={medicalHistoryValidationError}
          {...wrapperShared}
        >
          <div className="space-y-4">
            <Checkbox
              label="Confirmed anaphylactic reaction to a previous dose of typhoid vaccine"
              checked={medicalHistory.anaphylaxisToVaccine}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, anaphylaxisToVaccine: v })
              }
              description="Exclusion: refer, do not vaccinate"
            />

            <Checkbox
              label="Confirmed anaphylactic reaction to any component of the product held"
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
              label="Acute severe febrile illness"
              checked={medicalHistory.severeFebrilleIllness}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, severeFebrilleIllness: v })
              }
              description="Postpone until recovered. A minor illness without fever is not a reason to defer"
            />

            <Checkbox
              label="Any fever following recent travel to a typhoid risk area"
              checked={medicalHistory.feverAfterTravel}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, feverAfterTravel: v })
              }
              description="Exclusion: a febrile returning traveller needs urgent same-day assessment, not vaccination. Typhoid is notifiable"
            />

            <Checkbox
              label="Pregnant or breastfeeding"
              checked={medicalHistory.pregnantOrBreastfeeding}
              onChange={(v) =>
                setMedicalHistory({ ...medicalHistory, pregnantOrBreastfeeding: v })
              }
              description="Caution: inactivated polysaccharide vaccine, may be given where the risk of typhoid is significant and travel is unavoidable. Discuss and record the decision"
            />
            {medicalHistory.pregnantOrBreastfeeding && (
              <TextInput
                label="Pregnancy or breastfeeding: decision recorded"
                value={medicalHistory.pregnancyDecision}
                onChange={(v) => setMedicalHistory({ ...medicalHistory, pregnancyDecision: v })}
                required
                placeholder="e.g. 20 weeks pregnant, unavoidable travel to rural Pakistan, risk discussed, patient wishes to proceed"
              />
            )}

            <Checkbox
              label="Bleeding disorder or on anticoagulant therapy"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })}
              description="Use a fine needle (23 gauge or finer) and firm pressure without rubbing for at least 2 minutes"
            />

            <Checkbox
              label="Patient is immunosuppressed"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressed: v })}
              description="May be given; response may be reduced. Advise that food and water hygiene matters more, not less"
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
            isBlocked
              ? 'Exclusion criteria met: record the advice given and save as not supplied'
              : !contraIndicationsReviewed.confirmedNoAbsoluteContraindications
              ? 'You must confirm review before proceeding'
              : null
          }
          {...wrapperShared}
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
                  No clinical alerts identified. Patient is suitable for Typhoid vaccination.
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
          {...wrapperShared}
        >
          <div className="space-y-4">
            <Checkbox
              label="Adrenaline (epinephrine) 1 in 1,000 injection is immediately available, with a written anaphylaxis protocol (Resuscitation Council UK) and a telephone"
              checked={summary.adrenalineAvailable}
              onChange={(v) => setSummary({ ...summary, adrenalineAvailable: v })}
              description="Required before any vaccine is administered under this PGD. Vaccinate seated and observe for 15 minutes"
            />

            <SelectInput
              label="Vaccine"
              value={summary.vaccineType}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  vaccineType: v as TyphoidSummary['vaccineType'],
                  nextBoosterDue: summary.nextBoosterDue || nextBoosterDueDate(),
                })
              }
              options={[
                { value: 'typhim-vi', label: 'Typhim Vi (Sanofi), Vi polysaccharide 25 micrograms in 0.5 mL, pre-filled syringe' },
                { value: 'other-vi', label: 'Equivalent Vi polysaccharide typhoid vaccine, 25 micrograms in 0.5 mL (record brand)' },
              ]}
              required
            />

            {summary.vaccineType === 'other-vi' && (
              <TextInput
                label="Brand of vaccine given"
                value={summary.vaccineBrand}
                onChange={(v) => setSummary({ ...summary, vaccineBrand: v })}
                required
                placeholder="Name and brand as on the pack"
              />
            )}

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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Next booster due (3 years) <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={summary.nextBoosterDue}
                onChange={(e) => setSummary({ ...summary, nextBoosterDue: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled as 3 years from today when the vaccine is selected; record the date the next booster is due.</p>
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
          {...wrapperShared}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Common reactions to advise patient about:</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Very common: injection site pain, redness and swelling</li>
                <li>Common: malaise, headache, myalgia, mild fever</li>
                <li>Uncommon: nausea, abdominal pain</li>
                <li>Rare: urticaria, Guillain-Barre syndrome, anaphylaxis</li>
                <li>A sore arm, mild fever and feeling off for a day or two afterwards is common and settles by itself</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Counselling (every point, every time):</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>This vaccine is about 70 to 80% effective. It reduces your risk; it does not remove it.</li>
                <li>Food and water care is your main protection. Boil it, cook it, peel it, or leave it. Avoid ice, salads washed in local water, unpasteurised dairy and food from street stalls that is not cooked in front of you.</li>
                <li>It does not protect against paratyphoid, which causes a very similar illness.</li>
                <li>It takes about 2 weeks to work, so it is worth having in good time before you go.</li>
                <li>If you develop a fever, headache and feel increasingly unwell during or after your trip, see a doctor and tell them where you have been. Typhoid can present weeks after you return.</li>
                <li>If you travel to risk areas regularly, you need a booster every 3 years.</li>
                <li>Supply the patient information leaflet and the Get Real Health food and water hygiene sheet.</li>
              </ul>
            </div>

            <Checkbox
              label="Observed for 15 minutes after vaccination, seated, and the observation period completed"
              checked={postVaccineAdvice.observationCompleted}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, observationCompleted: v })
              }
              description="Record that the observation period was completed"
            />

            <Checkbox
              label="Food and water hygiene advice given and the Get Real Health food and water hygiene sheet supplied"
              checked={postVaccineAdvice.counselledFoodWater}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledFoodWater: v })
              }
              description="Not optional: the main protection regardless of vaccination. Vaccine about 70 to 80% effective; no protection against paratyphoid"
            />

            <Checkbox
              label="Post-travel fever warning given: any fever during or after travel needs medical assessment with the travel history disclosed"
              checked={postVaccineAdvice.counselledFeverWarning}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledFeverWarning: v })
              }
              description="Typhoid can present one to three weeks after return"
            />

            <Checkbox
              label="Patient has been advised of common reactions and the patient information leaflet supplied"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })
              }
              description="Confirm patient is aware of expected side effects"
            />

            <Checkbox
              label="Patient understands a booster is needed every 3 years if travel to risk areas continues"
              checked={postVaccineAdvice.counselledValidity}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledValidity: v })
              }
              description="No routine follow-up; return in 3 years for a booster"
            />

            <Checkbox
              label="Patient advised to seek medical attention for a serious adverse reaction and how to report via Yellow Card"
              checked={postVaccineAdvice.counselledCertificate}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, counselledCertificate: v })
              }
              description="Suspected adverse reactions: yellowcard.mhra.gov.uk; inform the GP"
            />

            <Checkbox
              label="Adverse reaction observed during or after vaccination"
              checked={postVaccineAdvice.adverseReaction}
              onChange={(v) =>
                setPostVaccineAdvice({ ...postVaccineAdvice, adverseReaction: v, ...(v ? {} : { adverseReactionDetails: '' }) })
              }
              description="The record must carry details of any adverse drug reaction and the action taken"
            />
            {postVaccineAdvice.adverseReaction && (
              <TextArea
                label="Adverse reaction and action taken (report via Yellow Card and inform the GP)"
                value={postVaccineAdvice.adverseReactionDetails}
                onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, adverseReactionDetails: v })}
                rows={2}
                required
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
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedStep7}
          validationError={summaryValidationError}
          {...wrapperShared}
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
            <p className="text-xs text-gray-500">Administered under {TYPHOID_PGD_VERSION}.</p>
          </div>
          {/* The printed record. Save & Print prints this page, so the report
              is the content of the last step, not a separate view reached
              through a Next button that the last step never shows. */}
          <div className="mt-6">
            <TyphoidSummaryReport
              patientDetails={patientDetails}
              consent={consent}
              summary={summary}
              medicalHistory={medicalHistory}
              clinicalAlerts={clinicalAlerts}
              postVaccineAdvice={postVaccineAdvice}
              isBlocked={isBlocked}
              exclusionOutcome={exclusionOutcome}
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default TyphoidClient;
