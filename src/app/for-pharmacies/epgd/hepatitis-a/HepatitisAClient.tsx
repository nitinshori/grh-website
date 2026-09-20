'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { TextInput, Checkbox, SelectInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { SaveDraftButton } from '../shared/components/SaveDraftButton';
import { useConsultationTracking } from '../shared/hooks/useConsultationTracking';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { clearVaccineSafety } from '../shared/components/VaccineSafetyChecks';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import type {
  HepatitisAPatientDetails,
  HepatitisAConsent,
  HepatitisAIndication,
  HepatitisACourse,
  HepatitisAMedicalHistory,
  HepatitisASummary,
  HepatitisAPostVaccineAdvice,
  HepatitisAExclusionOutcome,
  HepatitisAProduct,
  FirstDoseProduct,
  AdministrationSite,
  AdministrationRoute,
  ExclusionReferral,
} from './hepatitis-a-types';
import {
  initialHepatitisAPatientDetails,
  initialHepatitisAConsent,
  initialHepatitisAIndication,
  initialHepatitisACourse,
  initialHepatitisAMedicalHistory,
  initialHepatitisAPostVaccineAdvice,
  initialHepatitisAExclusionOutcome,
  initialHepatitisASummary,
  PRODUCTS,
  FIRST_DOSE_PRODUCT_LABEL,
  DOSE_NUMBER_LABEL,
  SITE_LABEL,
  REFERRAL_OUTCOMES,
  HEPATITIS_A_PGD_VERSION,
} from './hepatitis-a-types';
import {
  getHepatitisAClinicalAlerts,
  shouldBlockConsultation,
  getAdministrationGuidance,
  daysUntil,
  monthsSinceFirstDose,
  secondDoseWindow,
  productsForAge,
  ageBandFor,
  doseNumberFor,
  assessSecondDoseTiming,
  bleedingCautionApplies,
} from './hepatitis-a-clinical-logic';
import {
  validateHepatitisAPatientStep,
  validateHepatitisAConsentStep,
  validateHepatitisAIndicationStep,
  validateHepatitisAMedicalHistoryStep,
  validateHepatitisAAdministrationStep,
  validateHepatitisAPostVaccineStep,
  validateHepatitisASummaryStep,
  validateHepatitisAExclusionOutcome,
  GILLICK_MIN_AGE,
} from './hepatitis-a-validation';
import { calculateAge } from '../shared/types';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import HepatitisASummaryReport from './components/HepatitisASummaryReport';

const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Indication and Course',
  'Medical History',
  'Review Contraindications',
  'Vaccine Administration',
  'Post-Vaccine Advice',
  'Summary',
] as const;

const DATE_INPUT_CLASS =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent';

export function HepatitisAClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patientDetails, setPatientDetails] = useState<HepatitisAPatientDetails>(initialHepatitisAPatientDetails);
  const [consent, setConsent] = useState<HepatitisAConsent>(initialHepatitisAConsent);
  const [indication, setIndication] = useState<HepatitisAIndication>(initialHepatitisAIndication);
  const [course, setCourse] = useState<HepatitisACourse>(initialHepatitisACourse);
  const [medicalHistory, setMedicalHistory] = useState<HepatitisAMedicalHistory>(initialHepatitisAMedicalHistory);
  const [contraIndicationsReviewed, setContraIndicationsReviewed] = useState({
    confirmedNoAbsoluteContraindications: false,
  });
  const [summary, setSummary] = useState<HepatitisASummary>(initialHepatitisASummary());
  const [postVaccineAdvice, setPostVaccineAdvice] = useState<HepatitisAPostVaccineAdvice>(initialHepatitisAPostVaccineAdvice);

  // Recorded when an exclusion applies: the document requires the reason,
  // the advice given (food and water hygiene in every case) and the decision
  // to be documented, and a post-exposure situation referred the same day.
  const [exclusionOutcome, setExclusionOutcome] = useState<HepatitisAExclusionOutcome>(initialHepatitisAExclusionOutcome);

  // Persist form data to sessionStorage so it survives accidental navigation
  const formState = useMemo(() => ({
    currentStep, patientDetails, consent, indication, course, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice, exclusionOutcome,
  }), [currentStep, patientDetails, consent, indication, course, medicalHistory,
    contraIndicationsReviewed, summary, postVaccineAdvice, exclusionOutcome]);

  const { clearSaved } = useFormPersistence(
    'epgd-hepatitis-a',
    formState,
    useCallback((saved: typeof formState) => {
      setCurrentStep(saved.currentStep);
      setPatientDetails(saved.patientDetails);
      setConsent(saved.consent);
      setIndication(saved.indication);
      setCourse(saved.course);
      setMedicalHistory(saved.medicalHistory);
      setContraIndicationsReviewed(saved.contraIndicationsReviewed);
      setSummary(saved.summary);
      setPostVaccineAdvice(saved.postVaccineAdvice);
      if (saved.exclusionOutcome) setExclusionOutcome(saved.exclusionOutcome);
    }, [])
  );

  // Auto-fill pharmacist details from the logged-in user profile. Refires
  // whenever the pharmacist fields are empty (after a "New Consultation"
  // reset), so subsequent patients also get the autofill.
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
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('draftId');
    if (!id) return;
    fetch(`/api/consultation-drafts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { draftState?: Partial<typeof formState> } | null) => {
        if (!data?.draftState) return;
        const s = data.draftState;
        if (s.currentStep !== undefined) setCurrentStep(s.currentStep);
        if (s.patientDetails) setPatientDetails(s.patientDetails);
        if (s.consent) setConsent({ ...initialHepatitisAConsent, ...s.consent });
        if (s.indication) setIndication(s.indication);
        if (s.course) setCourse(s.course);
        if (s.medicalHistory) setMedicalHistory(s.medicalHistory);
        if (s.contraIndicationsReviewed) setContraIndicationsReviewed(s.contraIndicationsReviewed);
        if (s.summary) setSummary(s.summary);
        if (s.postVaccineAdvice) setPostVaccineAdvice({ ...initialHepatitisAPostVaccineAdvice, ...s.postVaccineAdvice });
        if (s.exclusionOutcome) setExclusionOutcome(s.exclusionOutcome);
      })
      .catch(() => { /* draft missing or expired: ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Age is computed from the date of birth; it is never typed.
  const handlePatientDetailsChange = useCallback(
    (field: keyof HepatitisAPatientDetails, value: any) => {
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
    () => getHepatitisAClinicalAlerts(patientDetails, consent, indication, course, medicalHistory, summary),
    [patientDetails, consent, indication, course, medicalHistory, summary]
  );
  const isBlocked = useMemo(() => shouldBlockConsultation(clinicalAlerts), [clinicalAlerts]);

  // The same tracking entry StepWrapper uses (the store is keyed by slug), so
  // that a stop on any step can save the record with the right outcome and
  // start the next patient from here, without going back to the summary step.
  const { saveRecord, reset: resetTracking } = useConsultationTracking('hepatitis-a', currentStep);
  const [stopSaveStatus, setStopSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [stopSaveAttempted, setStopSaveAttempted] = useState(false);

  // Validation
  const patientValidationError = useMemo(() => validateHepatitisAPatientStep(patientDetails), [patientDetails]);
  const consentValidationError = useMemo(() => validateHepatitisAConsentStep(consent, patientDetails), [consent, patientDetails]);
  const indicationValidationError = useMemo(() => validateHepatitisAIndicationStep(indication, course), [indication, course]);
  const medicalHistoryValidationError = useMemo(() => validateHepatitisAMedicalHistoryStep(medicalHistory), [medicalHistory]);
  const administrationValidationError = useMemo(
    () => validateHepatitisAAdministrationStep(summary, patientDetails, indication, course, medicalHistory),
    [summary, patientDetails, indication, course, medicalHistory]
  );
  const postVaccineValidationError = useMemo(
    () => validateHepatitisAPostVaccineStep(postVaccineAdvice, indication, course),
    [postVaccineAdvice, indication, course]
  );
  const summaryValidationError = useMemo(() => validateHepatitisASummaryStep(summary), [summary]);

  const daysToDeparture = useMemo(() => daysUntil(indication.departureDate), [indication.departureDate]);
  const isUnder16 = patientDetails.age !== null && patientDetails.age < 16;
  const ageBand = ageBandFor(patientDetails.age);
  const productOptions = useMemo(() => productsForAge(patientDetails.age), [patientDetails.age]);
  const doseNumber = doseNumberFor(course);
  const monthsSinceFirst = useMemo(
    () => (course.firstDoseDateKnown === 'known' ? monthsSinceFirstDose(course.firstDoseDate) : null),
    [course.firstDoseDateKnown, course.firstDoseDate]
  );
  const secondDoseTiming = useMemo(
    () => assessSecondDoseTiming(course.firstDoseProduct, course.firstDoseDate, summary.product),
    [course.firstDoseProduct, course.firstDoseDate, summary.product]
  );
  const dueWindow = useMemo(() => secondDoseWindow(), []);
  const bleedingCaution = bleedingCautionApplies(indication, medicalHistory);
  const travelIndication = indication.indicationType === 'travel' || indication.indicationType === 'both';
  const nonTravelIndication = indication.indicationType === 'non-travel' || indication.indicationType === 'both';

  // A stop anywhere disables Next on every step (and Save & Print on the
  // last). The progress bar is backwards-only, so there is no forward route
  // that skips these gates.
  const canProceedByStep = [
    patientValidationError === null && !isBlocked,
    consentValidationError === null && !isBlocked,
    indicationValidationError === null && !isBlocked,
    medicalHistoryValidationError === null && !isBlocked,
    contraIndicationsReviewed.confirmedNoAbsoluteContraindications && !isBlocked,
    administrationValidationError === null && !isBlocked,
    postVaccineValidationError === null && !isBlocked,
    summaryValidationError === null && !isBlocked,
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
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Consultation record (saved to the database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    // The record is being written: forget the sessionStorage copy so that
    // reopening the tool in this tab does not resume a saved consultation
    // and write a duplicate.
    clearSaved();
    const product = summary.product ? PRODUCTS[summary.product] : null;
    const dose = doseNumberFor(course);
    const timing =
      dose === 'second' && course.firstDoseDateKnown === 'known'
        ? assessSecondDoseTiming(course.firstDoseProduct, course.firstDoseDate, summary.product)
        : null;
    const stopReasons = clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message);
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
      clinicalData: {
        patient: patientDetails,
        consent,
        indication,
        course,
        medicalHistory,
        contraIndicationsReviewed,
        postVaccineAdvice,
        summary,
        clinicalAlerts,
        pgdVersion: HEPATITIS_A_PGD_VERSION,
        administeredUnderPgd: !isBlocked,
        doseNumber: dose ? DOSE_NUMBER_LABEL[dose] : null,
        firstDose:
          dose === 'second'
            ? {
                product:
                  course.firstDoseProduct === 'other'
                    ? course.firstDoseProductOther
                    : course.firstDoseProduct
                    ? FIRST_DOSE_PRODUCT_LABEL[course.firstDoseProduct]
                    : null,
                date: course.firstDoseDateKnown === 'known' ? course.firstDoseDate : null,
                dateNote: course.firstDoseDateKnown === 'not-known' ? course.firstDoseDateNote : null,
                monthsSinceFirstDose: timing?.months ?? null,
              }
            : null,
        secondDoseDue: !isBlocked && dose === 'first' ? summary.secondDoseDue : null,
        patientToldSecondDoseDate: postVaccineAdvice.toldSecondDoseDate,
        offLabelDecision:
          timing?.beyondWindow
            ? {
                recorded: course.offLabelDecisionRecorded,
                monthsSinceFirstDose: timing.months,
                licensedWindow: timing.windowLabel,
              }
            : null,
        dose: isBlocked || !product ? null : `${product.volume}, ${product.label}`,
        route: isBlocked ? null : summary.route,
        site: isBlocked || !summary.administrationSite ? null : SITE_LABEL[summary.administrationSite],
        foodWaterAdviceGiven: isBlocked ? exclusionOutcome.foodWaterAdviceGiven : postVaccineAdvice.counselledFoodWater,
        observationCompleted: postVaccineAdvice.observationCompleted,
        exclusion: isBlocked ? { reasons: stopReasons, ...exclusionOutcome } : null,
        adverseReaction: postVaccineAdvice.adverseReaction ? postVaccineAdvice.adverseReactionDetails : null,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked
        ? (REFERRAL_OUTCOMES.has(exclusionOutcome.referral) ? 'referred' : 'not_supplied')
        : 'completed',
      ...(isBlocked || !product
        ? {}
        : {
            medicine: {
              name: product.label,
              dose: product.volume,
              duration: dose ? DOSE_NUMBER_LABEL[dose] : 'Single dose',
              quantity: 1,
            },
          }),
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
  }, [patientDetails, consent, indication, course, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts, isBlocked, exclusionOutcome, clearSaved]);

  const handleNewConsultation = useCallback(() => {
    clearSaved();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatientDetails({ ...initialHepatitisAPatientDetails });
    setConsent({ ...initialHepatitisAConsent });
    setIndication({ ...initialHepatitisAIndication });
    setCourse({ ...initialHepatitisACourse });
    setMedicalHistory({ ...initialHepatitisAMedicalHistory });
    setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: false });
    setPostVaccineAdvice({ ...initialHepatitisAPostVaccineAdvice });
    setExclusionOutcome({ ...initialHepatitisAExclusionOutcome });
    setSummary(initialHepatitisASummary());
    setStopSaveStatus('idle');
    setStopSaveAttempted(false);
  }, [clearSaved]);

  // Passed to every StepWrapper so that a stop on any step offers "Save as
  // not supplied" and the record carries the exclusion outcome.
  const wrapperShared = { isBlocked, getConsultationData, onNewConsultation: handleNewConsultation };

  const exclusionOutcomeError = useMemo(() => validateHepatitisAExclusionOutcome(exclusionOutcome), [exclusionOutcome]);

  // Save the stopped consultation (outcome "referred" where the next action
  // is a referral, otherwise "not supplied") and start the next patient. The
  // shared "Save as not supplied" button in the step footer saves the same
  // record; if it has already been used, saveRecord returns at once and only
  // the reset runs, so nothing is written twice.
  const handleSaveStopAndNew = useCallback(async () => {
    setStopSaveAttempted(true);
    if (exclusionOutcomeError) return;
    setStopSaveStatus('saving');
    const data = getConsultationData();
    if (!data) {
      setStopSaveStatus('error');
      return;
    }
    (data.clinicalData as Record<string, unknown>).stoppedAtStep = currentStep;
    (data.clinicalData as Record<string, unknown>).stopReason = clinicalAlerts
      .filter((a) => a.severity === 'stop')
      .map((a) => a.message)
      .join('; ');
    const ok = await saveRecord(data);
    if (!ok) {
      setStopSaveStatus('error');
      return;
    }
    resetTracking();
    clearVaccineSafety('hepatitis-a');
    handleNewConsultation();
  }, [exclusionOutcomeError, getConsultationData, currentStep, clinicalAlerts, saveRecord, resetTracking, handleNewConsultation]);

  const isPostExposure = indication.postExposure === 'yes';
  const isHepAbRoute = indication.hepBDecision === 'use-combined-pgd';
  const isPostpone = medicalHistory.acuteSevereFebrileIllness;
  const isTooEarly = clinicalAlerts.some((a) => a.code === 'SECOND_DOSE_TOO_EARLY');
  const isDeclined = consent.patientDeclined;

  const exclusionOutcomeBlock = isBlocked ? (
    <div className="mb-6 space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        {isDeclined ? 'Patient declines: record the advice given and the decision' : 'Not vaccinated under this PGD: record the reason, the advice given and the decision'}
      </p>
      <p className="text-xs text-red-800">
        Discuss the reason with the patient and make sure they understand it. Give food and water hygiene advice for the destination regardless of whether vaccine is given. Refer to the GP, a travel clinic or the Health Protection Team as appropriate, and make the urgency explicit where it is a post-exposure situation. Where hepatitis B is also needed, offer the Hepatitis A and B (Travel) consultation instead of two separate ones. Then save the record below, or use &quot;Save as not supplied&quot; in the step footer.
      </p>
      {isPostExposure && (
        <p className="text-xs font-semibold text-red-900">
          Post-exposure: refer to the GP or the local Health Protection Team the same day.
        </p>
      )}
      {isHepAbRoute && (
        <p className="text-xs font-semibold text-red-900">
          Continue in the{' '}
          <Link href="/for-pharmacies/epgd/hep-ab-travel" className="underline">Hepatitis A and B (Travel) ePGD</Link>
          , which authorises Twinrix and Engerix B as well as the products here.
        </p>
      )}
      <Checkbox
        label="Food and water hygiene advice given for the destination (required in every case)"
        checked={exclusionOutcome.foodWaterAdviceGiven}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, foodWaterAdviceGiven: v })}
      />
      <TextArea
        label="Reason for exclusion discussed, advice given and decision reached"
        value={exclusionOutcome.adviceGiven}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, adviceGiven: v })}
        placeholder="e.g. Contact of a case at home: referred to the Health Protection Team today, urgency explained; food and water advice given"
        rows={3}
        required
      />
      <SelectInput
        label="Referral or next action"
        value={exclusionOutcome.referral}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, referral: v as ExclusionReferral })}
        options={[
          ...(isPostExposure
            ? [
                { value: 'hpt-same-day', label: 'Referred to the Health Protection Team the same day (post-exposure)' },
                { value: 'gp-same-day', label: 'Referred to the GP the same day (post-exposure)' },
              ]
            : []),
          { value: 'gp', label: 'Referred to GP' },
          { value: 'travel-clinic', label: 'Referred to a travel clinic' },
          ...(isHepAbRoute ? [{ value: 'hep-ab-pgd', label: 'Seen under the Hepatitis A and B (Travel) PGD instead' }] : []),
          ...(isPostpone ? [{ value: 'postpone', label: 'Postponed: return when recovered' }] : []),
          ...(isTooEarly ? [{ value: 'rebook', label: 'Rebooked: second dose within the 6 to 12 month window' }] : []),
          ...(isDeclined ? [{ value: 'declined-vaccination', label: 'Patient declined vaccination after counselling; advice given and the decision recorded' }] : []),
          { value: 'advice-only', label: 'No referral needed: advice given and the decision recorded' },
          { value: 'declined', label: 'Patient declined referral; advice given' },
        ]}
        required
      />
      {stopSaveAttempted && exclusionOutcomeError && (
        <p className="text-xs font-medium text-red-700">{exclusionOutcomeError}</p>
      )}
      {stopSaveStatus === 'error' && (
        <p className="text-xs font-medium text-red-700">Could not save the consultation record. Try again, or print this page as a backup.</p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSaveStopAndNew}
          disabled={stopSaveStatus === 'saving'}
          className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
        >
          {stopSaveStatus === 'saving' ? 'Saving...' : 'Save record and start a new consultation'}
        </button>
        <span className="text-xs text-red-800">
          Saved as {REFERRAL_OUTCOMES.has(exclusionOutcome.referral) ? '"referred"' : '"not supplied"'}, then the form is cleared for the next patient.
        </span>
      </div>
    </div>
  ) : null;

  // Offered on every step before the vaccine is drawn up. The document's
  // "Actions if the patient is excluded or declines" then apply.
  const declineBlock =
    currentStep >= 1 && currentStep <= 5 ? (
      <div className="mt-6 border-t pt-4 print:hidden">
        <Checkbox
          label="The patient (or the person consenting for a child) declines vaccination after counselling"
          checked={consent.patientDeclined}
          onChange={(v) => setConsent({ ...consent, patientDeclined: v })}
          description="The tool stops here. Record the reason discussed, the advice given (including food and water hygiene) and the decision reached, then save the record"
        />
      </div>
    ) : null;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <SaveDraftButton
          pgdSlug="hepatitis-a"
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
          hasErrors={isBlocked}
        />
      </div>

      {(currentStep >= 2 || isBlocked) && clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}
      {exclusionOutcomeBlock}

      {/* Step 0: Patient Details */}
      {currentStep === 0 && (
        <StepWrapper
          title={STEP_LABELS[0]}
          description="Collect patient information; age is calculated from the date of birth"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[0]}
          validationError={patientValidationError}
          {...wrapperShared}
        >
          <p className="mb-4 text-xs text-gray-600">
            Individuals aged 1 year and over. Adult products (Havrix Monodose, Avaxim) at 16 years and over; paediatric products (Havrix Junior Monodose, Avaxim Junior) from 1 year to 15 years inclusive. The record must carry the patient&apos;s name, address, date of birth and registered GP.
          </p>
          <PatientDetailsStep
            patient={patientDetails}
            onChange={handlePatientDetailsChange}
            requireAdult={false}
          />
          {ageBand && (
            <p className="mt-4 text-xs text-gray-600">
              Age {patientDetails.age}: {ageBand === 'adult' ? 'adult products (16 years and over)' : 'paediatric products (1 to 15 years inclusive)'}.
            </p>
          )}
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
          {...wrapperShared}
        >
          <div className="mb-6 space-y-3 border-b pb-6">
            <SelectInput
              label="Consent given by"
              value={patientDetails.consentBasis}
              onChange={(v) => handlePatientDetailsChange('consentBasis', v as HepatitisAPatientDetails['consentBasis'])}
              options={[
                ...(isUnder16 ? [] : [{ value: 'self', label: 'The patient (aged 16 and over)' }]),
                ...(isUnder16 ? [{ value: 'parental', label: 'A person with parental responsibility (patient under 16)' }] : []),
                ...(isUnder16 && patientDetails.age !== null && patientDetails.age >= GILLICK_MIN_AGE
                  ? [{ value: 'gillick', label: `The young person, assessed as Gillick competent (${GILLICK_MIN_AGE} to 15 years)` }]
                  : []),
                ...(isUnder16
                  ? [{ value: 'unobtainable', label: 'Valid consent cannot be obtained: no person with parental responsibility, and not Gillick competent (exclusion: the tool will stop)' }]
                  : []),
              ]}
              required
            />
            {isUnder16 && (
              <p className="text-xs text-amber-800">
                A parent accompanying a child does not automatically hold parental responsibility: ask. Where the young person consents, record the basis of the Gillick assessment.
              </p>
            )}
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
          </div>
          <ConsentStep
            consent={consent}
            onChange={(field, value) => setConsent({ ...consent, [field]: value })}
          />
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="The patient understands what this service costs"
              checked={consent.understandsCost}
              onChange={(v) => setConsent({ ...consent, understandsCost: v })}
              description="Supply and administration under this PGD is a private service"
              required
            />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 2: Indication and Course */}
      {currentStep === 2 && (
        <StepWrapper
          title={STEP_LABELS[2]}
          description="Establish the indication, rule out post-exposure use, and record the dose number and any previous dose"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[2]}
          validationError={indicationValidationError}
          {...wrapperShared}
        >
          <div className="space-y-4">
            <SelectInput
              label="Is this a post-exposure situation (contact of a case of hepatitis A, or exposure in an outbreak)?"
              value={indication.postExposure}
              onChange={(v) => setIndication({ ...indication, postExposure: v as HepatitisAIndication['postExposure'] })}
              options={[
                { value: 'no', label: 'No: pre-exposure vaccination' },
                { value: 'yes', label: 'Yes: post-exposure (outside this PGD: same-day referral to the GP or Health Protection Team)' },
              ]}
              required
            />
            <p className="text-xs text-gray-600">
              Post-exposure use is not covered by this PGD: it is a public health intervention with its own timing rules and, for some contacts, immunoglobulin. Refer to the GP or the local Health Protection Team the same day, whatever the travel or risk history.
            </p>

            <SelectInput
              label="Indication under this PGD"
              value={indication.indicationType}
              onChange={(v) => setIndication({ ...indication, indicationType: v as HepatitisAIndication['indicationType'] })}
              options={[
                { value: 'travel', label: 'Travel to an area of moderate or high hepatitis A endemicity' },
                { value: 'non-travel', label: 'Non-travel risk factor (lifestyle, medical condition or occupation)' },
                { value: 'both', label: 'Both travel and a non-travel risk factor' },
                { value: 'none', label: 'No indication (outside this PGD: the tool will stop)' },
              ]}
              required
            />

            {travelIndication && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Travel</p>
                <TextInput
                  label="Destination"
                  value={indication.travelDestination}
                  onChange={(v) => setIndication({ ...indication, travelDestination: v })}
                  required
                  placeholder="e.g. India, Egypt, Thailand, Morocco"
                />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Departure date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={indication.departureDate}
                    onChange={(e) => setIndication({ ...indication, departureDate: e.target.value })}
                    className={DATE_INPUT_CLASS}
                  />
                  {daysToDeparture !== null && (
                    <p className={`text-xs mt-1 ${daysToDeparture < 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                      {daysToDeparture < 0
                        ? `Departure date is ${-daysToDeparture} days in the past: check the date`
                        : `${daysToDeparture} days to departure`}
                    </p>
                  )}
                </div>
                <Checkbox
                  label="The destination is an area of moderate or high hepatitis A endemicity: in practice anywhere outside northern and western Europe, North America, Australia and New Zealand"
                  checked={indication.endemicityConfirmed}
                  onChange={(v) => setIndication({ ...indication, endemicityConfirmed: v })}
                  description="Immunisation is not generally needed for northern or western Europe including Spain, Portugal and Italy, North America, Australia or New Zealand. Check the destination on NaTHNaC TravelHealthPro where there is doubt"
                  required
                />
                {daysToDeparture !== null && daysToDeparture >= 0 && daysToDeparture < 14 && (
                  <Checkbox
                    label="Departing within 2 weeks: the dose is being given and the patient has been told full protection comes after about 2 weeks"
                    checked={indication.shortNoticeAdvised}
                    onChange={(v) => setIndication({ ...indication, shortNoticeAdvised: v })}
                    description="Give the dose: some protection develops before antibody is detectable and it can be given up to the day of travel"
                    required
                  />
                )}
              </div>
            )}

            {nonTravelIndication && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Non-travel risk factor (tick all that apply)</p>
                <Checkbox
                  label="Chronic liver disease, including chronic hepatitis B or C"
                  checked={indication.chronicLiverDisease}
                  onChange={(v) => setIndication({ ...indication, chronicLiverDisease: v })}
                />
                <Checkbox
                  label="Haemophilia, or receipt of plasma-derived clotting factors"
                  checked={indication.haemophiliaClottingFactors}
                  onChange={(v) => setIndication({ ...indication, haemophiliaClottingFactors: v })}
                  description="The Green Book advises the subcutaneous route for people with haemophilia receiving plasma-derived clotting factors"
                />
                <Checkbox
                  label="Injects drugs"
                  checked={indication.injectsDrugs}
                  onChange={(v) => setIndication({ ...indication, injectsDrugs: v })}
                />
                <Checkbox
                  label="Gay, bisexual or other man who has sex with men"
                  checked={indication.msm}
                  onChange={(v) => setIndication({ ...indication, msm: v })}
                />
                <Checkbox
                  label="Occupational risk: laboratory work with the virus, sewage work, or work with susceptible primates"
                  checked={indication.occupationalRisk}
                  onChange={(v) => setIndication({ ...indication, occupationalRisk: v, ...(v ? {} : { occupationalRiskDetail: '' }) })}
                  description="Routine immunisation is not indicated for most healthcare workers"
                />
                {indication.occupationalRisk && (
                  <TextInput
                    label="Occupational risk recorded"
                    value={indication.occupationalRiskDetail}
                    onChange={(v) => setIndication({ ...indication, occupationalRiskDetail: v })}
                    placeholder="e.g. sewage worker with repeated exposure to raw sewage"
                    required
                  />
                )}
              </div>
            )}

            <SelectInput
              label="Does the patient also need hepatitis B protection?"
              value={indication.hepBAlsoNeeded}
              onChange={(v) =>
                setIndication({
                  ...indication,
                  hepBAlsoNeeded: v as HepatitisAIndication['hepBAlsoNeeded'],
                  ...(v === 'yes' ? {} : { hepBDecision: '' as const }),
                })
              }
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
              required
            />
            {indication.hepBAlsoNeeded === 'yes' && (
              <div className="space-y-3 rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Hepatitis B is also needed</p>
                <p className="text-xs text-blue-900">
                  This PGD does not cover hepatitis B or the combined vaccines. The{' '}
                  <Link href="/for-pharmacies/epgd/hep-ab-travel" className="font-semibold underline">Hepatitis A and B (Travel) PGD</Link>{' '}
                  authorises Twinrix and Engerix B as well as the products here, so that one consultation covers both. Offer that consultation instead of two separate ones.
                </p>
                <SelectInput
                  label="Decision"
                  value={indication.hepBDecision}
                  onChange={(v) => setIndication({ ...indication, hepBDecision: v as HepatitisAIndication['hepBDecision'] })}
                  options={[
                    { value: 'use-combined-pgd', label: 'Use the Hepatitis A and B (Travel) PGD for this consultation (the tool will stop here)' },
                    { value: 'continue-hep-a-only', label: 'Continue with hepatitis A only under this PGD (decision recorded)' },
                  ]}
                  required
                />
              </div>
            )}

            <Checkbox
              label="The patient requires proof of immunity"
              checked={indication.proofOfImmunityRequired}
              onChange={(v) => setIndication({ ...indication, proofOfImmunityRequired: v })}
              description="Exclusion: serology to confirm immunity, before or after vaccination, is out of scope"
            />

            <div className="space-y-4 border-t pt-4">
              <SelectInput
                label="Previous hepatitis A vaccination"
                value={course.courseStatus}
                onChange={(v) =>
                  setCourse({
                    ...initialHepatitisACourse,
                    courseStatus: v as HepatitisACourse['courseStatus'],
                  })
                }
                options={[
                  { value: 'none', label: 'None: this is the first dose' },
                  { value: 'one-dose', label: 'One previous dose of an inactivated hepatitis A vaccine: this is the second dose' },
                  { value: 'completed', label: 'A completed two dose course (exclusion unless ongoing risk and 25 years have passed)' },
                ]}
                required
              />
              <p className="text-xs text-gray-600">
                Ask about any previous hepatitis A vaccine, including a combined hepatitis A and B or hepatitis A and typhoid vaccine, and record what the patient tells you.
              </p>

              {course.courseStatus === 'completed' && (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs text-amber-900">
                    Someone who completed a two dose course, at any time in the past, does not need a further dose under this PGD unless they are at ongoing risk and it has been 25 years. There is nothing to add.
                  </p>
                  <Checkbox
                    label="Exception applies: the patient is at ongoing risk and 25 years or more have passed since the course was completed"
                    checked={course.completedCourseOngoingRisk25Years}
                    onChange={(v) => setCourse({ ...course, completedCourseOngoingRisk25Years: v, ...(v ? {} : { completedCourseNote: '' }) })}
                  />
                  {course.completedCourseOngoingRisk25Years && (
                    <TextArea
                      label="What the patient told you: when the course was completed and the ongoing risk"
                      value={course.completedCourseNote}
                      onChange={(v) => setCourse({ ...course, completedCourseNote: v })}
                      placeholder="e.g. two doses in 1999 before working in Kenya; still travels to East Africa every year"
                      rows={2}
                      required
                    />
                  )}
                </div>
              )}

              {course.courseStatus === 'one-dose' && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">First dose</p>
                  <SelectInput
                    label="Product of the first dose"
                    value={course.firstDoseProduct}
                    onChange={(v) => setCourse({ ...course, firstDoseProduct: v as FirstDoseProduct, ...(v === 'other' ? {} : { firstDoseProductOther: '' }) })}
                    options={(Object.keys(FIRST_DOSE_PRODUCT_LABEL) as Exclude<FirstDoseProduct, ''>[]).map((p) => ({
                      value: p,
                      label: FIRST_DOSE_PRODUCT_LABEL[p],
                    }))}
                    required
                  />
                  {course.firstDoseProduct === 'other' && (
                    <TextInput
                      label="Brand of the first dose"
                      value={course.firstDoseProductOther}
                      onChange={(v) => setCourse({ ...course, firstDoseProductOther: v })}
                      placeholder="As recorded on the patient's vaccination record"
                      required
                    />
                  )}
                  <p className="text-xs text-gray-600">
                    A course started with one product should be completed with the same product where possible. Where it is not, the booster may be given with the other product. A patient who has turned 16 since the first dose has the second dose with the adult product for their age now.
                  </p>
                  <SelectInput
                    label="Is the date of the first dose known?"
                    value={course.firstDoseDateKnown}
                    onChange={(v) =>
                      setCourse({
                        ...course,
                        firstDoseDateKnown: v as HepatitisACourse['firstDoseDateKnown'],
                        firstDoseDate: '',
                        firstDoseDateNote: '',
                        firstDoseSixMonthsConfirmed: false,
                        offLabelDecisionRecorded: false,
                      })
                    }
                    options={[
                      { value: 'known', label: 'Yes: known, or reliably reported' },
                      { value: 'not-known', label: 'No: not known (record what the patient reports)' },
                    ]}
                    required
                  />
                  {course.firstDoseDateKnown === 'known' && (
                    <div>
                      <label className="block text-sm font-medium text-navy-900 mb-1">
                        Date of the first dose <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={course.firstDoseDate}
                        onChange={(e) => setCourse({ ...course, firstDoseDate: e.target.value, offLabelDecisionRecorded: false })}
                        className={DATE_INPUT_CLASS}
                      />
                      {monthsSinceFirst !== null && monthsSinceFirst >= 0 && (
                        <p className={`text-xs mt-1 ${monthsSinceFirst < 6 ? 'text-red-700' : monthsSinceFirst > 12 ? 'text-amber-700' : 'text-gray-500'}`}>
                          {monthsSinceFirst < 6
                            ? `${monthsSinceFirst} months since the first dose: too early, the second dose is 6 to 12 months after the first`
                            : monthsSinceFirst > 12
                            ? `${monthsSinceFirst} months since the first dose: a late second dose still counts, do not restart. The licensed window is checked against the product on the Vaccine Administration step`
                            : `${monthsSinceFirst} months since the first dose: within the 6 to 12 month window`}
                        </p>
                      )}
                    </div>
                  )}
                  {course.firstDoseDateKnown === 'not-known' && (
                    <>
                      <TextArea
                        label="What the patient reports about the first dose"
                        value={course.firstDoseDateNote}
                        onChange={(v) => setCourse({ ...course, firstDoseDateNote: v })}
                        placeholder="e.g. one dose at a travel clinic about 2 years ago before a trip to India, no record card"
                        rows={2}
                        required
                      />
                      <Checkbox
                        label="The first dose was 6 months or more ago, as reliably reported by the patient"
                        checked={course.firstDoseSixMonthsConfirmed}
                        onChange={(v) => setCourse({ ...course, firstDoseSixMonthsConfirmed: v })}
                        description="Inclusion criterion for a second dose. A late second dose still counts; do not restart"
                        required
                      />
                    </>
                  )}
                </div>
              )}

              {doseNumber && (
                <p className="text-xs font-semibold text-navy-900">Dose today: {DOSE_NUMBER_LABEL[doseNumber]}.</p>
              )}
            </div>
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 3: Medical History */}
      {currentStep === 3 && (
        <StepWrapper
          title={STEP_LABELS[3]}
          description="Exclusions and cautions from the PGD"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[3]}
          validationError={medicalHistoryValidationError}
          {...wrapperShared}
        >
          <div className="space-y-4">
            <p className="text-sm font-semibold text-navy-900">Exclusions</p>
            <Checkbox
              label="Confirmed anaphylactic reaction to a previous dose of any hepatitis A-containing vaccine, or to any component of the product to be used"
              checked={medicalHistory.anaphylaxisHepAVaccineOrComponent}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, anaphylaxisHepAVaccineOrComponent: v })}
              description="Exclusion: refer, do not vaccinate"
            />
            <Checkbox
              label="Neomycin hypersensitivity"
              checked={medicalHistory.neomycinHypersensitivity}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, neomycinHypersensitivity: v })}
              description="Exclusion: Havrix and Avaxim may contain trace neomycin, so a neomycin hypersensitivity excludes every product under this PGD"
            />
            <Checkbox
              label="Previous hypersensitivity reaction following a hepatitis A-containing vaccine"
              checked={medicalHistory.previousHypersensitivityReaction}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, previousHypersensitivityReaction: v })}
              description="Exclusion: refer, do not vaccinate"
            />
            <Checkbox
              label="Acute severe febrile illness"
              checked={medicalHistory.acuteSevereFebrileIllness}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, acuteSevereFebrileIllness: v })}
              description="Postpone until recovered. Minor illness without fever is not a reason to defer"
            />

            <p className="pt-2 text-sm font-semibold text-navy-900">Cautions (vaccinate, and record)</p>
            <Checkbox
              label="Pregnant"
              checked={medicalHistory.pregnant}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, pregnant: v })}
              description="May be given where clearly indicated; the vaccines are inactivated. Havrix is preferred. Avaxim only when clearly necessary after an assessment of risks and benefits, recorded on the administration step"
            />
            <Checkbox
              label="Breastfeeding"
              checked={medicalHistory.breastfeeding}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, breastfeeding: v, ...(v ? {} : { breastfeedingDecision: '' }) })}
              description="No contraindication: both Avaxim products may be used during breastfeeding and there is no established concern with Havrix. Record the decision"
            />
            {medicalHistory.breastfeeding && (
              <TextInput
                label="Breastfeeding: decision recorded"
                value={medicalHistory.breastfeedingDecision}
                onChange={(v) => setMedicalHistory({ ...medicalHistory, breastfeedingDecision: v })}
                placeholder="e.g. breastfeeding a 4 month old, no contraindication, patient wishes to proceed"
                required
              />
            )}
            <Checkbox
              label="Immunosuppression, including HIV"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressed: v, ...(v ? {} : { immunosuppressionCounselling: '' }) })}
              description="The response may be reduced and relates to CD4 count. Vaccination is still recommended. Serology to confirm a response is outside this PGD: counsel and refer rather than assuming protection"
            />
            {medicalHistory.immunosuppressed && (
              <TextInput
                label="Immunosuppression: counselling recorded"
                value={medicalHistory.immunosuppressionCounselling}
                onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressionCounselling: v })}
                placeholder="e.g. told the response may be lower; serology via the GP or HIV clinic if proof of response is needed"
                required
              />
            )}
            <Checkbox
              label="Bleeding disorder, thrombocytopenia or anticoagulation"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })}
              description="Intramuscular injection can usually still be given using a fine needle, 23 gauge or finer, with firm pressure without rubbing for at least 2 minutes. Deep subcutaneous injection is the fallback; the Green Book advises the subcutaneous route for haemophilia on plasma-derived clotting factors"
            />
            {indication.haemophiliaClottingFactors && !medicalHistory.bleedingDisorder && (
              <p className="text-xs text-amber-800">
                Haemophilia or plasma-derived clotting factors is recorded as the indication: the bleeding caution applies.
              </p>
            )}
            <Checkbox
              label="Phenylketonuria"
              checked={medicalHistory.phenylketonuria}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, phenylketonuria: v })}
              description="Havrix and Avaxim contain phenylalanine (10 micrograms per 0.5 mL dose of Avaxim); almost certainly immaterial, but advise the patient or carer to account for it in meal planning on the day"
            />
            <Checkbox
              label="Latex sensitivity"
              checked={medicalHistory.latexSensitivity}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, latexSensitivity: v })}
              description="The needle shield of the attached-needle presentation of adult Avaxim may contain natural rubber: check the presentation in hand. Avaxim Junior needle shield is polyisoprene. Havrix presentations are described as free of natural latex; check the current leaflet before reassuring"
            />
            <TextInput
              label="Known allergies (if any)"
              value={medicalHistory.knownAllergies}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, knownAllergies: v })}
              placeholder="Enter any known allergies relevant to vaccination"
            />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 4: Review Contraindications */}
      {currentStep === 4 && (
        <StepWrapper
          title={STEP_LABELS[4]}
          description="Review clinical alerts and confirm no exclusion criterion is present"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[4]}
          validationError={
            isBlocked
              ? 'Exclusion criteria met: record the advice given and save as not supplied'
              : !contraIndicationsReviewed.confirmedNoAbsoluteContraindications
              ? 'Tick "I confirm no exclusion criterion is present and vaccination can proceed"'
              : null
          }
          {...wrapperShared}
        >
          <div className="space-y-4">
            {isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-semibold">
                  Exclusion criterion identified. Vaccination cannot proceed under this PGD. Record the advice given and the referral above, then save as not supplied.
                </p>
              </div>
            )}

            {clinicalAlerts.length === 0 && !isBlocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm font-semibold">
                  No clinical alerts identified. Patient is suitable for hepatitis A vaccination.
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
                label="I confirm no exclusion criterion is present and vaccination can proceed"
                checked={contraIndicationsReviewed.confirmedNoAbsoluteContraindications}
                onChange={(v) => setContraIndicationsReviewed({ confirmedNoAbsoluteContraindications: v })}
                description="Pharmacist declaration"
                required
              />
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 5: Vaccine Administration */}
      {currentStep === 5 && (
        <StepWrapper
          title={STEP_LABELS[5]}
          description="Confirm the age and the product in hand, then record the dose given"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[5]}
          validationError={administrationValidationError}
          {...wrapperShared}
        >
          <div className="space-y-4">
            <Checkbox
              label="Adrenaline (epinephrine) 1 in 1,000 injection is immediately available, with a written anaphylaxis protocol (Resuscitation Council UK) and a telephone"
              checked={summary.adrenalineAvailable}
              onChange={(v) => setSummary({ ...summary, adrenalineAvailable: v })}
              description="Required before any vaccine is administered under this PGD. Vaccinate seated and observe for 15 minutes"
              required
            />

            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-900">Four products, two strengths. The dose volumes differ.</p>
              <p className="mt-1 text-xs text-amber-900">
                Havrix Monodose is 1.0 mL. Every other product here (Havrix Junior Monodose, Avaxim, Avaxim Junior) is 0.5 mL. Do not carry a volume across from one product to another. The paediatric products contain half the antigen of the adult ones and the packaging is similar: check the age against the product in hand before drawing up.
              </p>
              {ageBand && (
                <p className="mt-2 text-xs font-semibold text-amber-900">
                  This patient is {patientDetails.age}: {ageBand === 'adult' ? 'adult products only (Havrix Monodose 1.0 mL, or Avaxim 0.5 mL)' : 'paediatric products only (Havrix Junior Monodose 0.5 mL, or Avaxim Junior 0.5 mL)'}.
                </p>
              )}
            </div>

            <SelectInput
              label="Vaccine given"
              value={summary.product}
              onChange={(v) => {
                const product = v as HepatitisAProduct;
                setSummary({
                  ...summary,
                  product,
                  secondDoseDue: doseNumber === 'first' ? summary.secondDoseDue || dueWindow.earliest : '',
                  latexPresentationChecked: false,
                });
                setCourse((prev) => ({ ...prev, offLabelDecisionRecorded: false }));
              }}
              options={productOptions.map((p) => ({ value: p, label: `${PRODUCTS[p].label}: dose ${PRODUCTS[p].volume}` }))}
              required
            />
            <p className="text-xs text-gray-600">
              Havrix and Avaxim are both UK-licensed inactivated hepatitis A vaccines and either may be used. Use whichever the pharmacy holds; do not delay vaccination to obtain the other.
            </p>

            {summary.product && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900">
                  {getAdministrationGuidance(summary.product).vaccineName}
                </p>
                <p className="mt-1 text-sm font-bold text-blue-900">Dose volume: {getAdministrationGuidance(summary.product).volume}</p>
                <p className="text-blue-800 text-xs mt-2">{getAdministrationGuidance(summary.product).guidance}</p>
              </div>
            )}

            {medicalHistory.pregnant && (summary.product === 'avaxim' || summary.product === 'avaxim-junior') && (
              <TextArea
                label="Pregnancy with Avaxim: assessment of risks and benefits recorded (Havrix is preferred)"
                value={summary.pregnancyRiskBenefitNote}
                onChange={(v) => setSummary({ ...summary, pregnancyRiskBenefitNote: v })}
                placeholder="e.g. Havrix not held; unavoidable travel to rural India next week; inactivated vaccine, risk of hepatitis A outweighs theoretical risk; patient wishes to proceed"
                rows={2}
                required
              />
            )}

            {medicalHistory.latexSensitivity && summary.product === 'avaxim' && (
              <Checkbox
                label="Latex sensitivity: the Avaxim presentation in hand has been checked (the attached-needle needle shield may contain natural rubber)"
                checked={summary.latexPresentationChecked}
                onChange={(v) => setSummary({ ...summary, latexPresentationChecked: v })}
                required
              />
            )}

            {doseNumber === 'second' && course.firstDoseDateKnown === 'known' && secondDoseTiming.months !== null && (
              <div className={`rounded-lg border p-4 text-sm ${secondDoseTiming.beyondWindow ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="font-semibold text-navy-900">
                  Second dose timing: {secondDoseTiming.months} months since the first dose
                </p>
                <p className="mt-1 text-xs text-gray-700">
                  {secondDoseTiming.windowLabel
                    ? `Licensed window, ${secondDoseTiming.windowLabel}.`
                    : 'Select the vaccine given to check the licensed window.'}{' '}
                  {secondDoseTiming.months > 12
                    ? 'A late second dose still counts. Do not restart the course.'
                    : 'Within the 6 to 12 month window.'}
                </p>
                {secondDoseTiming.beyondWindow && (
                  <div className="mt-3">
                    <Checkbox
                      label="Informed off-label decision: the second dose is beyond the licensed window; this was explained to the patient and is recorded as an informed off-label decision rather than declining"
                      checked={course.offLabelDecisionRecorded}
                      onChange={(v) => setCourse({ ...course, offLabelDecisionRecorded: v })}
                      description="Beyond the licensed window a booster is generally still effective"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            <TextInput
              label="Batch number"
              value={summary.batchNumber}
              onChange={(v) => setSummary({ ...summary, batchNumber: v })}
              required
              placeholder="From the syringe label, e.g. AHAVB123AA"
            />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Expiry date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={summary.expiryDate}
                onChange={(e) => setSummary({ ...summary, expiryDate: e.target.value })}
                className={DATE_INPUT_CLASS}
              />
            </div>

            <SelectInput
              label="Route"
              value={summary.route}
              onChange={(v) => setSummary({ ...summary, route: v as AdministrationRoute, bleedingPrecautionsConfirmed: false })}
              options={[
                { value: 'intramuscular', label: 'Intramuscular' },
                ...(bleedingCaution ? [{ value: 'subcutaneous', label: 'Subcutaneous (bleeding disorder, or haemophilia on plasma-derived clotting factors)' }] : []),
              ]}
              required
            />
            <p className="text-xs text-gray-600">
              Never into the gluteal muscle, and never intravascularly or intradermally: the response is unreliable.
            </p>
            {bleedingCaution && summary.route === 'intramuscular' && (
              <Checkbox
                label="Fine needle, 23 gauge or finer, and firm pressure without rubbing for at least 2 minutes"
                checked={summary.bleedingPrecautionsConfirmed}
                onChange={(v) => setSummary({ ...summary, bleedingPrecautionsConfirmed: v })}
                description="Bleeding disorder, thrombocytopenia or anticoagulation with the intramuscular route"
                required
              />
            )}

            <SelectInput
              label="Administration site"
              value={summary.administrationSite}
              onChange={(v) => setSummary({ ...summary, administrationSite: v as AdministrationSite })}
              options={[
                { value: 'left-deltoid', label: 'Left deltoid (adults, adolescents and older children)' },
                { value: 'right-deltoid', label: 'Right deltoid' },
                { value: 'left-thigh', label: 'Left anterolateral thigh (young children)' },
                { value: 'right-thigh', label: 'Right anterolateral thigh (young children)' },
              ]}
              required
            />

            <Checkbox
              label="Another vaccine given at the same visit"
              checked={summary.coAdministered}
              onChange={(v) => setSummary({ ...summary, coAdministered: v, ...(v ? {} : { coAdministeredDetails: '' }) })}
              description="May be given at the same time as other inactivated or live travel vaccines, including typhoid and yellow fever, at a separate site with a separate syringe: a separate limb where possible, or sites at least 2.5 cm apart. Record the site of each. Do not mix in the same syringe"
            />
            {summary.coAdministered && (
              <TextInput
                label="Other vaccine given and its site"
                value={summary.coAdministeredDetails}
                onChange={(v) => setSummary({ ...summary, coAdministeredDetails: v })}
                placeholder="e.g. Typhim Vi, right deltoid"
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
                className={DATE_INPUT_CLASS}
              />
            </div>

            {doseNumber === 'first' && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Second dose due <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={summary.secondDoseDue}
                  min={dueWindow.earliest}
                  max={dueWindow.latest}
                  onChange={(e) => setSummary({ ...summary, secondDoseDue: e.target.value })}
                  className={DATE_INPUT_CLASS}
                />
                <p className="text-xs text-gray-500 mt-1">
                  6 to 12 months from today: {dueWindow.earliest} to {dueWindow.latest}. Pre-filled at 6 months when the vaccine is selected. Book the second dose at this appointment; the patient is given a written record with this date.
                </p>
              </div>
            )}
            {doseNumber === 'second' && (
              <p className="text-xs text-gray-600">
                This dose completes the course: protection for at least 25 years, no further routine boosters for immunocompetent people.
              </p>
            )}
            {doseNumber === 'booster-25-years' && (
              <p className="text-xs text-gray-600">
                Booster after a completed course: no further dose is due under this PGD.
              </p>
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 6: Post-Vaccine Advice */}
      {currentStep === 6 && (
        <StepWrapper
          title={STEP_LABELS[6]}
          description="Observation, counselling and the written record"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[6]}
          validationError={postVaccineValidationError}
          {...wrapperShared}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Adverse effects to advise the patient about:</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Very common: injection site pain and redness, fatigue, headache, and in children irritability</li>
                <li>Common: fever, malaise, injection site swelling or induration, gastrointestinal upset, drowsiness and loss of appetite</li>
                <li>Uncommon: dizziness, myalgia, rash, influenza-like illness, vomiting</li>
                <li>Rare or very rare: paraesthesia, arthralgia, urticaria, pruritus, lymphadenopathy, chills</li>
                <li>Reported post-marketing: anaphylaxis, Guillain-Barre syndrome, convulsions, vasculitis, thrombocytopenia, erythema multiforme and angioedema</li>
                <li>Report suspected adverse reactions via yellowcard.mhra.gov.uk and inform the GP as appropriate</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Counselling (every point, every time):</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>One dose protects you for about a year, starting around two weeks from today. The second dose, in 6 to 12 months, protects you for at least 25 years. Come back for it; we will book it now.</li>
                <li>If you miss the second dose date, come anyway. The course does not need restarting.</li>
                <li>The vaccine does not cover everything you can catch from food and water. Drink bottled or boiled water, avoid ice, salads, shellfish and food that has been standing, and wash your hands.</li>
                <li>Some soreness, tiredness, headache or mild fever in the first day or two is common and settles on its own.</li>
                <li>Where hepatitis B was discussed: this vaccine does not protect against hepatitis B or C. The precautions for those are avoiding unprotected sex, unsterile tattooing, piercing and acupuncture, and not sharing needles or razors.</li>
                <li>Seek medical advice for jaundice, dark urine or pale stools after travel, whatever the vaccination status. For a routine query about the vaccine or the schedule, contact the pharmacy.</li>
                <li>Supply the patient information leaflet for the product given, and a written record of the vaccine, the batch number, the date, and the date the second dose is due. The brand determines how the course is completed elsewhere.</li>
              </ul>
            </div>

            <Checkbox
              label="Observed for 15 minutes after vaccination, seated, and the observation period completed"
              checked={postVaccineAdvice.observationCompleted}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, observationCompleted: v })}
              description="Record that the observation period was completed. Procedures are in place to prevent injury from a faint"
              required
            />

            <Checkbox
              label="One dose protects from about 2 weeks and lasts about a year"
              checked={postVaccineAdvice.counselledOneDoseProtection}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledOneDoseProtection: v })}
              required
            />

            <Checkbox
              label={
                doseNumber === 'first'
                  ? 'Second dose in 6 to 12 months gives protection for at least 25 years; booked now'
                  : 'Course complete: protection for at least 25 years, no further routine boosters for immunocompetent people'
              }
              checked={postVaccineAdvice.counselledSecondDose}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledSecondDose: v })}
              required
            />

            {doseNumber === 'first' && (
              <Checkbox
                label="If the second dose date is missed, come anyway: the course does not need restarting"
                checked={postVaccineAdvice.counselledMissedDose}
                onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledMissedDose: v })}
                required
              />
            )}

            <Checkbox
              label="Food and water hygiene advice given"
              checked={postVaccineAdvice.counselledFoodWater}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledFoodWater: v })}
              description="Required in every case: the vaccine does not cover everything you can catch from food and water"
              required
            />

            <Checkbox
              label="Common self-limiting reactions explained: soreness, tiredness, headache or mild fever in the first day or two"
              checked={postVaccineAdvice.counselledReactions}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledReactions: v })}
              required
            />

            <Checkbox
              label="Where hepatitis B was discussed: this vaccine does not protect against hepatitis B or C, and the precautions for those were explained"
              checked={postVaccineAdvice.counselledHepBNotCovered}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledHepBNotCovered: v })}
              description={indication.hepBAlsoNeeded === 'yes' ? 'Required: hepatitis B was discussed in this consultation' : 'Tick where hepatitis B was discussed'}
              required={indication.hepBAlsoNeeded === 'yes'}
            />

            <Checkbox
              label="Follow-up advice given: seek medical advice for jaundice, dark urine or pale stools after travel, whatever the vaccination status; routine queries to the pharmacy"
              checked={postVaccineAdvice.counselledFollowUp}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, counselledFollowUp: v })}
              required
            />

            <Checkbox
              label="Patient information leaflet for the product given supplied"
              checked={postVaccineAdvice.pilSupplied}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, pilSupplied: v })}
              required
            />

            <Checkbox
              label={
                doseNumber === 'first'
                  ? 'Written record given: product, batch number, date and the date the second dose is due'
                  : 'Written record given: product, batch number and date, and that the course is complete'
              }
              checked={postVaccineAdvice.writtenRecordGiven}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, writtenRecordGiven: v })}
              description="Advise the patient to keep it, because the brand determines how the course is completed elsewhere"
              required
            />

            <Checkbox
              label={
                doseNumber === 'first'
                  ? `The patient was told the date the second dose is due${summary.secondDoseDue ? ` (${summary.secondDoseDue})` : ''}`
                  : 'The patient was told the course is complete and no further dose is due'
              }
              checked={postVaccineAdvice.toldSecondDoseDate}
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, toldSecondDoseDate: v })}
              required
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
              onChange={(v) => setPostVaccineAdvice({ ...postVaccineAdvice, patientAdvised: v })}
              description="Confirm the pharmacist has completed the patient consultation"
              required
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 7: Summary */}
      {currentStep === 7 && (
        <StepWrapper
          title={STEP_LABELS[7]}
          description="Complete the pharmacist declaration and generate the consultation record"
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceedByStep[7]}
          validationError={summaryValidationError}
          {...wrapperShared}
        >
          <div className="space-y-4 print:hidden">
            <TextInput
              label="Name of the administering pharmacist or pharmacy technician"
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
            <p className="text-xs text-gray-500">Administered under {HEPATITIS_A_PGD_VERSION}.</p>
          </div>
          {/* The printed record. Save & Print prints this page, so the report
              is the content of the last step. */}
          <div className="mt-6">
            <HepatitisASummaryReport
              patientDetails={patientDetails}
              consent={consent}
              indication={indication}
              course={course}
              medicalHistory={medicalHistory}
              summary={summary}
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

export default HepatitisAClient;
