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
  OccupationalGroup,
  HepBDecision,
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
  OCCUPATIONAL_GROUP_LABEL,
  DOSE_NUMBER_LABEL,
  SITE_LABEL,
  REFERRAL_OUTCOMES,
  OFF_LABEL_BASIS,
  OFF_LABEL_BASIS_TEXT,
  HEPATITIS_A_PGD_VERSION,
  FIRST_DOSE_APPROX_LABEL,
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
  firstDoseIntervalText,
  firstDoseProductLabel,
  anticoagulationApplies,
  bleedingDisorderApplies,
  bleedingRouteReason,
  haemophiliaIndicationApplies,
  hepBSteer,
  occupationalRiskText,
  stopsBlockStep,
  HEP_B_MONOVALENT_DAYS,
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

  // Restore saved state over the initial state, so a field added since the
  // draft was saved is never undefined, and recompute the age from the date
  // of birth: a draft saved before a birthday would otherwise carry an age
  // that no longer matches the date, and the age chooses the product.
  const restoreState = useCallback((s: Partial<typeof formState>) => {
    if (s.currentStep !== undefined) setCurrentStep(s.currentStep);
    if (s.patientDetails) {
      const p = { ...initialHepatitisAPatientDetails, ...s.patientDetails };
      setPatientDetails({ ...p, age: calculateAge(p.dateOfBirth) });
    }
    if (s.consent) setConsent({ ...initialHepatitisAConsent, ...s.consent });
    if (s.indication) setIndication({ ...initialHepatitisAIndication, ...s.indication });
    if (s.course) setCourse({ ...initialHepatitisACourse, ...s.course });
    if (s.medicalHistory) setMedicalHistory({ ...initialHepatitisAMedicalHistory, ...s.medicalHistory });
    if (s.contraIndicationsReviewed) setContraIndicationsReviewed(s.contraIndicationsReviewed);
    if (s.summary) {
      // A draft resumed on a later day is administered today, not on the day
      // it was started: the record's date of administration must be today's.
      const fresh = initialHepatitisASummary();
      setSummary({ ...fresh, ...s.summary, consultationDate: fresh.consultationDate, consultationTime: fresh.consultationTime });
    }
    if (s.postVaccineAdvice) setPostVaccineAdvice({ ...initialHepatitisAPostVaccineAdvice, ...s.postVaccineAdvice });
    if (s.exclusionOutcome) setExclusionOutcome({ ...initialHepatitisAExclusionOutcome, ...s.exclusionOutcome });
  }, []);

  const { clearSaved } = useFormPersistence('epgd-hepatitis-a', formState, restoreState);

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
        restoreState(data.draftState);
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
  const medicalHistoryValidationError = useMemo(
    () => validateHepatitisAMedicalHistoryStep(medicalHistory, consent),
    [medicalHistory, consent]
  );
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
    () => assessSecondDoseTiming(course, summary.product),
    [course, summary.product]
  );
  const dueWindow = useMemo(() => secondDoseWindow(), []);
  const bleedingDisorder = bleedingDisorderApplies(indication, medicalHistory);
  const anticoagulation = anticoagulationApplies(medicalHistory);
  const bleedingCaution = bleedingDisorder || anticoagulation;
  const travelIndication = indication.indicationType === 'travel' || indication.indicationType === 'both';
  const nonTravelIndication = indication.indicationType === 'non-travel' || indication.indicationType === 'both';
  const hepBSteerResult = useMemo(() => hepBSteer(indication), [indication]);
  // Off-label second dose: outside the licensed window of the product being
  // given today, or first-dose product not known.
  const offLabel = doseNumber === 'second' && secondDoseTiming.offLabel;

  // A stop disables Next from the step that sets it onwards (and Save &
  // Print on the last). It does not disable Next on the steps before it:
  // the progress bar is backwards-only, so a pharmacist who went back to
  // check an earlier answer must be able to press Next to return to the
  // step whose control clears the stop. Every step from the stop's own
  // step onwards still refuses Next, so no gate is skipped.
  const blockedByStep = STEP_LABELS.map((_, i) => stopsBlockStep(clinicalAlerts, i));
  const canProceedByStep = [
    patientValidationError === null && !blockedByStep[0],
    consentValidationError === null && !blockedByStep[1],
    indicationValidationError === null && !blockedByStep[2],
    medicalHistoryValidationError === null && !blockedByStep[3],
    contraIndicationsReviewed.confirmedNoAbsoluteContraindications && !blockedByStep[4],
    administrationValidationError === null && !blockedByStep[5],
    postVaccineValidationError === null && !blockedByStep[6],
    summaryValidationError === null && !blockedByStep[7],
  ];
  const blockedHere = blockedByStep[currentStep];

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

  // ─── Exclusion outcome ───
  const isPostExposure = indication.postExposure === 'yes';
  const isHepAbRoute = indication.hepBDecision === 'use-combined-pgd';
  const isPostpone = medicalHistory.acuteSevereFebrileIllness;
  const isTooEarly = clinicalAlerts.some((a) => a.code === 'SECOND_DOSE_TOO_EARLY');
  const isCompletedCourse = course.courseStatus === 'completed';
  const isOccupationalNotIndicated = clinicalAlerts.some((a) => a.code === 'OCCUPATIONAL_NOT_INDICATED');
  const isDeclined = consent.patientDeclined;

  const referralOptions = useMemo<{ value: ExclusionReferral; label: string }[]>(
    () => [
      ...(isPostExposure
        ? [
            { value: 'hpt-same-day' as const, label: 'Referred to the Health Protection Team the same day (post-exposure)' },
            { value: 'gp-same-day' as const, label: 'Referred to the GP the same day (post-exposure)' },
          ]
        : []),
      ...(isCompletedCourse
        ? [
            { value: 'gp-reinforcing-dose' as const, label: 'Referred to the GP for a reinforcing dose outside this PGD (ongoing risk, 25 years or more since the course)' },
            { value: 'travel-clinic-reinforcing-dose' as const, label: 'Referred to a travel clinic for a reinforcing dose outside this PGD (ongoing risk, 25 years or more since the course)' },
          ]
        : []),
      { value: 'gp' as const, label: 'Referred to GP' },
      { value: 'travel-clinic' as const, label: 'Referred to a travel clinic' },
      ...(isHepAbRoute ? [{ value: 'hep-ab-pgd' as const, label: 'Seen under the Hepatitis A and B (Travel) PGD instead' }] : []),
      ...(isPostpone ? [{ value: 'postpone' as const, label: 'Postponed: return when recovered' }] : []),
      ...(isTooEarly ? [{ value: 'rebook' as const, label: 'Rebooked: second dose within the 6 to 12 month window' }] : []),
      ...(isDeclined ? [{ value: 'declined-vaccination' as const, label: 'Patient declined vaccination after counselling; advice given and the decision recorded' }] : []),
      { value: 'advice-only' as const, label: 'No referral needed: advice given and the decision recorded' },
      { value: 'declined' as const, label: 'Patient declined referral; advice given' },
    ],
    [isPostExposure, isCompletedCourse, isHepAbRoute, isPostpone, isTooEarly, isDeclined]
  );

  // A referral chosen for one stop (for example "Postponed") is not offered
  // for another. When the stop changes and the chosen option is no longer
  // in the list, the select shows the placeholder, so the record must not
  // carry the old value either: the outcome used for validation, the saved
  // record and the printed report treats it as not yet selected.
  const effectiveExclusionOutcome = useMemo<HepatitisAExclusionOutcome>(
    () =>
      referralOptions.some((o) => o.value === exclusionOutcome.referral)
        ? exclusionOutcome
        : { ...exclusionOutcome, referral: '' },
    [exclusionOutcome, referralOptions]
  );

  // ─── Consultation record (saved to the database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    // The record is being written: forget the sessionStorage copy so that
    // reopening the tool in this tab does not resume a saved consultation
    // and write a duplicate.
    clearSaved();
    const product = summary.product ? PRODUCTS[summary.product] : null;
    const dose = doseNumberFor(course);
    const timing =
      dose === 'second'
        ? assessSecondDoseTiming(course, summary.product)
        : null;
    const stopReasons = clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message);
    const steer = hepBSteer(indication);
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
        occupationalRisk: indication.occupationalRisk ? occupationalRiskText(indication) : null,
        hepB:
          indication.hepBAlsoNeeded === 'yes'
            ? {
                toolRecommendedMonovalentNow: steer.monovalentRecommended,
                reason: steer.reason || null,
                decision: indication.hepBDecision || null,
              }
            : null,
        firstDose:
          dose === 'second'
            ? {
                product: firstDoseProductLabel(course.firstDoseProduct),
                date: course.firstDoseDateKnown === 'known' ? course.firstDoseDate : null,
                dateNote: course.firstDoseDateKnown === 'not-known' ? course.firstDoseDateNote : null,
                sixMonthsReliablyReported: course.firstDoseDateKnown === 'not-known' ? course.firstDoseSixMonthsConfirmed : null,
                approxInterval: course.firstDoseDateKnown === 'not-known' && course.firstDoseApproxInterval ? FIRST_DOSE_APPROX_LABEL[course.firstDoseApproxInterval] : null,
                monthsSinceFirstDose: timing?.months ?? null,
                licensedWindowOfProductGiven: timing?.windowLabel || null,
              }
            : null,
        secondDoseDue: !isBlocked && dose === 'first' ? summary.secondDoseDue : null,
        patientToldSecondDoseDate: postVaccineAdvice.toldSecondDoseDate,
        // Document, "Records to be kept": the interval since the first dose,
        // the first-dose product or "not known", the words "off-label, Green
        // Book chapter 17", and that the patient was told and consented.
        offLabel:
          timing?.offLabel
            ? {
                basis: OFF_LABEL_BASIS,
                reason: timing.offLabelReason,
                intervalSinceFirstDose: firstDoseIntervalText(course),
                firstDoseProduct: firstDoseProductLabel(course.firstDoseProduct),
                patientToldAndConsented: course.offLabelConsent,
                immunosuppressedSerologyAdvised: medicalHistory.immunosuppressed,
              }
            : null,
        immunosuppression: medicalHistory.immunosuppressed
          ? {
              detail: medicalHistory.immunosuppressionDetail || null,
              counselledSerologyAndFurtherDoses: medicalHistory.immunosuppressionCounselled,
              gpNotificationConsented: !!consent.notifyGp,
              gpNotificationRefused: !consent.notifyGp ? medicalHistory.gpNotificationRefusedNote || 'refused, reason not recorded' : null,
            }
          : null,
        bleeding:
          bleedingCaution
            ? {
                stableAnticoagulation: anticoagulation,
                bleedingDisorder,
                routeAndWhy: isBlocked ? null : bleedingRouteReason(indication, medicalHistory, summary),
              }
            : null,
        dose: isBlocked || !product ? null : `${product.volume}, ${product.label}`,
        route: isBlocked ? null : summary.route,
        site: isBlocked || !summary.administrationSite ? null : SITE_LABEL[summary.administrationSite],
        foodWaterAdviceGiven: isBlocked ? effectiveExclusionOutcome.foodWaterAdviceGiven : postVaccineAdvice.counselledFoodWater,
        observationCompleted: postVaccineAdvice.observationCompleted,
        exclusion: isBlocked ? { reasons: stopReasons, ...effectiveExclusionOutcome } : null,
        adverseReaction: postVaccineAdvice.adverseReaction ? postVaccineAdvice.adverseReactionDetails : null,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked
        ? (REFERRAL_OUTCOMES.has(effectiveExclusionOutcome.referral) ? 'referred' : 'not_supplied')
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
  }, [patientDetails, consent, indication, course, medicalHistory, contraIndicationsReviewed, postVaccineAdvice, summary, clinicalAlerts, isBlocked, effectiveExclusionOutcome, bleedingCaution, anticoagulation, bleedingDisorder, clearSaved]);

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

  // Passed to every StepWrapper. While a stop is on screen the record is
  // saved only through the "Save record and start a new consultation"
  // button in the exclusion block above, which insists on the advice,
  // decision and referral the document requires. The footer's generic
  // "Save as not supplied" (rendered whenever getConsultationData is
  // present) saved with those fields blank, marked the consultation as
  // saved so it could not be written again, and then left the pharmacist
  // on a step whose only remaining button demanded the fields it had just
  // skipped. Withholding getConsultationData while blocked removes that
  // button; Save & Print on the last step is refused while blocked anyway.
  const wrapperShared = {
    isBlocked: blockedHere,
    getConsultationData: isBlocked ? undefined : getConsultationData,
    onNewConsultation: handleNewConsultation,
  };

  const exclusionOutcomeError = useMemo(() => validateHepatitisAExclusionOutcome(effectiveExclusionOutcome), [effectiveExclusionOutcome]);

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

  const exclusionOutcomeBlock = isBlocked ? (
    <div className="mb-6 space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        {isDeclined ? 'Patient declines: record the advice given and the decision' : 'Not vaccinated under this PGD: record the reason, the advice given and the decision'}
      </p>
      <p className="text-xs text-red-800">
        Discuss the reason with the patient and make sure they understand it. Give food and water hygiene advice for the destination regardless of whether vaccine is given. Refer to the GP, a travel clinic or the Health Protection Team as appropriate, and make the urgency explicit where it is a post-exposure situation. Where hepatitis B is also needed, offer the Hepatitis A and B (Travel) consultation instead of two separate ones. Then save the record with the button below. To change an answer instead, go back to the step it was given on: the stop clears when the answer does.
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
      {isCompletedCourse && (
        <p className="text-xs font-semibold text-red-900">
          Completed course: nothing is authorised. Where the patient is at ongoing risk and 25 years or more have passed since the course, refer to the GP or a travel clinic for a reinforcing dose; that dose is outside this PGD. Record what the patient told you about the course.
        </p>
      )}
      {isOccupationalNotIndicated && (
        <p className="text-xs font-semibold text-red-900">
          Food handlers, day-care staff and healthcare workers are not included unless the request comes from occupational health or the Health Protection Team. Refer to the GP or occupational health.
        </p>
      )}
      <Checkbox
        label={
          travelIndication
            ? 'Food and water hygiene advice given for the destination (required in every case)'
            : 'Food and water hygiene advice given (required in every case, whether or not the patient is travelling)'
        }
        checked={exclusionOutcome.foodWaterAdviceGiven}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, foodWaterAdviceGiven: v })}
        required
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
        value={effectiveExclusionOutcome.referral}
        onChange={(v) => setExclusionOutcome({ ...exclusionOutcome, referral: v as ExclusionReferral })}
        options={referralOptions}
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
          Saved as {REFERRAL_OUTCOMES.has(effectiveExclusionOutcome.referral) ? '"referred"' : '"not supplied"'}, then the form is cleared for the next patient.
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
              description="Administration under this PGD is a private service"
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
                { value: 'travel', label: 'Travel to a destination for which NaTHNaC TravelHealthPro recommends hepatitis A vaccination' },
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
                  label="NaTHNaC TravelHealthPro recommends hepatitis A for this destination and itinerary"
                  checked={indication.travelHealthProRecommends}
                  onChange={(v) => setIndication({ ...indication, travelHealthProRecommends: v })}
                  description="In practice that is most of the world outside northern and western Europe, North America, Australia and New Zealand; check the country page rather than assuming"
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
                  description="Prefer Havrix where held; Avaxim has not been studied in liver disease"
                />
                <Checkbox
                  label="Haemophilia, or receipt of plasma-derived clotting factors"
                  checked={indication.haemophiliaClottingFactors}
                  onChange={(v) => setIndication({ ...indication, haemophiliaClottingFactors: v })}
                  description="Bleeding disorder caution: deep subcutaneous injection, or intramuscular only where a doctor familiar with the patient's bleeding risk has advised that route is safe"
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
                  label="Occupational risk"
                  checked={indication.occupationalRisk}
                  onChange={(v) =>
                    setIndication({
                      ...indication,
                      occupationalRisk: v,
                      ...(v ? {} : { occupationalGroup: '' as const, occupationalOhRequest: false, occupationalRiskDetail: '' }),
                    })
                  }
                  description="The occupational list is closed to the Green Book groups. Food handlers, day-care staff and healthcare workers are not included unless the request comes from occupational health or the Health Protection Team; otherwise refer"
                />
                {indication.occupationalRisk && (
                  <div className="ml-6 space-y-3">
                    <SelectInput
                      label="Occupational group"
                      value={indication.occupationalGroup}
                      onChange={(v) =>
                        setIndication({
                          ...indication,
                          occupationalGroup: v as OccupationalGroup,
                          ...(v === 'other-request' ? {} : { occupationalOhRequest: false }),
                        })
                      }
                      options={(Object.keys(OCCUPATIONAL_GROUP_LABEL) as Exclude<OccupationalGroup, ''>[]).map((g) => ({
                        value: g,
                        label: OCCUPATIONAL_GROUP_LABEL[g],
                      }))}
                      required
                    />
                    {indication.occupationalGroup === 'other-request' && (
                      <Checkbox
                        label="The request comes from occupational health or the Health Protection Team"
                        checked={indication.occupationalOhRequest}
                        onChange={(v) => setIndication({ ...indication, occupationalOhRequest: v })}
                        description="Without this, an other occupational request is not an indication under this PGD: with no other indication the patient is referred"
                      />
                    )}
                    <TextInput
                      label="Occupational risk recorded"
                      value={indication.occupationalRiskDetail}
                      onChange={(v) => setIndication({ ...indication, occupationalRiskDetail: v })}
                      placeholder="e.g. sewage worker with repeated exposure to raw sewage; or the occupational health service that made the request"
                      required
                    />
                  </div>
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
                  ...(v === 'yes' ? {} : { hepBDecision: '' as const, rapidHepAProtectionNeeded: false }),
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
                <p className="text-sm font-semibold text-blue-900">Hepatitis B is also needed (not an exclusion)</p>
                <p className="text-xs text-blue-900">
                  This PGD does not cover hepatitis B or the combined vaccines. Where there is time to complete a three dose course before exposure, the combined vaccine under the{' '}
                  <Link href="/for-pharmacies/epgd/hep-ab-travel" className="font-semibold underline">Hepatitis A and B (Travel) PGD</Link>{' '}
                  is convenient. Where departure is within about a month, or rapid hepatitis A protection is needed, give monovalent hepatitis A under this PGD now, because the Green Book states monovalent vaccine protects against hepatitis A sooner than Twinrix, and arrange hepatitis B separately. Record the decision and tell the patient this vaccine gives no protection against hepatitis B or C.
                </p>
                <Checkbox
                  label="Rapid hepatitis A protection is needed"
                  checked={indication.rapidHepAProtectionNeeded}
                  onChange={(v) => setIndication({ ...indication, rapidHepAProtectionNeeded: v })}
                  description={`Tick where protection is needed quickly for a reason other than the departure date (departure within ${HEP_B_MONOVALENT_DAYS} days is taken from the date above)`}
                />
                {hepBSteerResult.monovalentRecommended ? (
                  <div className="rounded-lg border border-blue-300 bg-white p-3">
                    <p className="text-xs font-semibold text-blue-900">
                      Recommended: monovalent hepatitis A now under this PGD, hepatitis B arranged separately.
                    </p>
                    <p className="mt-1 text-xs text-blue-900">
                      Reason: {hepBSteerResult.reason}. The Green Book states monovalent vaccine protects against hepatitis A sooner than Twinrix: Havrix Monodose (1440 ELISA units) carries more hepatitis A antigen than Twinrix Adult (720), and Havrix Junior Monodose (720) more than Twinrix Paediatric (360).
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-blue-900">
                    {travelIndication && daysToDeparture !== null
                      ? `${daysToDeparture} days to departure: there is time to complete a three dose course, so the combined vaccine under the Hepatitis A and B (Travel) PGD is convenient. `
                      : ''}
                    Either route is acceptable; the pharmacist chooses and the decision is recorded.
                  </p>
                )}
                <SelectInput
                  label="Decision"
                  value={indication.hepBDecision}
                  onChange={(v) => setIndication({ ...indication, hepBDecision: v as HepBDecision })}
                  options={[
                    {
                      value: 'monovalent-now',
                      label: hepBSteerResult.monovalentRecommended
                        ? 'Monovalent hepatitis A now under this PGD; hepatitis B arranged separately (recommended)'
                        : 'Monovalent hepatitis A now under this PGD; hepatitis B arranged separately',
                    },
                    {
                      value: 'use-combined-pgd',
                      label: hepBSteerResult.monovalentRecommended
                        ? 'Use the Hepatitis A and B (Travel) PGD instead (the tool will stop here; not recommended where protection is needed quickly)'
                        : 'Use the Hepatitis A and B (Travel) PGD for this consultation (the tool will stop here)',
                    },
                  ]}
                  required
                />
              </div>
            )}

            <Checkbox
              label="The patient asks for proof of immunity (serology)"
              checked={indication.serologyRequested}
              onChange={(v) => setIndication({ ...indication, serologyRequested: v })}
              description="Serology is not provided under this PGD. Vaccination may still proceed; refer for serology if it is needed"
            />

            <div className="space-y-4 border-t pt-4">
              <SelectInput
                label="Previous hepatitis A vaccination"
                value={course.courseStatus}
                onChange={(v) => {
                  setCourse({
                    ...initialHepatitisACourse,
                    courseStatus: v as HepatitisACourse['courseStatus'],
                  });
                  // The due date is pre-filled at 6 months when the product
                  // is selected. Where the product was chosen while this was
                  // a second dose and the course is now changed to a first
                  // dose, pre-fill it here too, so the field is never empty
                  // with only the helper text saying it was pre-filled.
                  if (v === 'none') {
                    setSummary((prev) =>
                      prev.product && !prev.secondDoseDue ? { ...prev, secondDoseDue: dueWindow.earliest } : prev
                    );
                  }
                }}
                options={[
                  { value: 'none', label: 'None: this is the first dose' },
                  { value: 'one-dose', label: 'One previous dose of any inactivated hepatitis A-containing vaccine: this is the second dose' },
                  { value: 'completed', label: 'A completed course: two doses at least 6 months apart, or a full Twinrix or Ambirix course (nothing is authorised: the tool will stop)' },
                ]}
                required
              />
              <p className="text-xs text-gray-600">
                Ask about any previous hepatitis A vaccine, including a combined hepatitis A and B (Twinrix, Ambirix) or hepatitis A and typhoid (ViATIM) vaccine, and record what the patient tells you.
              </p>

              {course.courseStatus === 'completed' && (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs text-amber-900">
                    Someone who completed a course (two doses at least 6 months apart, or a full Twinrix or Ambirix course), at any time in the past, needs no further dose. Nothing is authorised under this PGD. Where the patient is at ongoing risk and 25 years or more have passed, refer to the GP or a travel clinic for a reinforcing dose; that dose is outside this PGD because no SmPC includes it. Record what the patient told you in the exclusion block above.
                  </p>
                </div>
              )}

              {course.courseStatus === 'one-dose' && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">First dose</p>
                  <SelectInput
                    label="Product of the first dose"
                    value={course.firstDoseProduct}
                    onChange={(v) => setCourse({ ...course, firstDoseProduct: v as FirstDoseProduct, offLabelConsent: false })}
                    options={(Object.keys(FIRST_DOSE_PRODUCT_LABEL) as Exclude<FirstDoseProduct, ''>[]).map((p) => ({
                      value: p,
                      label: FIRST_DOSE_PRODUCT_LABEL[p],
                    }))}
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Any inactivated hepatitis A-containing vaccine counts as the first dose: monovalent, ViATIM, or a single dose of Twinrix or Ambirix. A completed Twinrix (three doses) or Ambirix (two doses) course is a completed course: select that above. Where the first-dose product is not known the second dose is off-label and is given on the terms stated, not declined. A course started with one product should be completed with the same product where possible; where it is not, the booster may be given with the other. A patient who has turned 16 since the first dose has the second dose with the adult product for their age now.
                  </p>
                  {course.firstDoseProduct === 'not-known' && (
                    <p className="text-xs font-semibold text-amber-800">
                      First-dose product not known: the second dose is off-label. The basis and the consent tick are on the Vaccine Administration step.
                    </p>
                  )}
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
                        firstDoseApproxInterval: '',
                        offLabelConsent: false,
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
                        onChange={(e) => setCourse({ ...course, firstDoseDate: e.target.value, offLabelConsent: false })}
                        className={DATE_INPUT_CLASS}
                      />
                      {monthsSinceFirst !== null && monthsSinceFirst >= 0 && (
                        <p className={`text-xs mt-1 ${monthsSinceFirst < 6 ? 'text-red-700' : monthsSinceFirst > 12 ? 'text-amber-700' : 'text-gray-500'}`}>
                          {monthsSinceFirst < 6
                            ? `${monthsSinceFirst} months since the first dose: too early, the second dose is 6 to 12 months after the first. Rebook`
                            : monthsSinceFirst > 12
                            ? `${monthsSinceFirst} months since the first dose: a late second dose still counts, do not restart. The licensed window is that of the product given today (${productOptions.map((p) => `${PRODUCTS[p].shortName} ${PRODUCTS[p].windowLabel}`).join('; ') || 'checked on the Vaccine Administration step'}); outside it the dose is off-label`
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
                        description="Stands in for the date. Inclusion criterion for a second dose; a late second dose still counts, do not restart"
                        required
                      />
                      <SelectInput
                        label="Roughly how long ago was the first dose"
                        value={course.firstDoseApproxInterval}
                        onChange={(v) => setCourse({ ...course, firstDoseApproxInterval: v as HepatitisACourse['firstDoseApproxInterval'], offLabelConsent: false })}
                        options={(['under-1', '1-2', '2-3', '3-5', 'over-5', 'cannot-say'] as const).map((k) => ({ value: k, label: FIRST_DOSE_APPROX_LABEL[k] }))}
                        required
                      />
                      <p className="text-xs text-gray-600">The top of the band is checked against the licensed window of the vaccine given today. Beyond it, or if the patient cannot say, the dose is off-label and is given on the terms in the PGD, not declined.</p>
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
              label="Confirmed anaphylactic reaction, or other severe hypersensitivity reaction, to a previous dose of any hepatitis A-containing vaccine or to any component of the product to be used, including neomycin"
              checked={medicalHistory.severeHypersensitivity}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, severeHypersensitivity: v })}
              description="Exclusion: refer, do not vaccinate. All four products may contain trace neomycin, so confirmed anaphylaxis or other severe hypersensitivity to neomycin excludes every product under this PGD. Contact dermatitis to topical neomycin is not a contraindication"
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
              description="May be given where clearly indicated; the vaccines are inactivated. Havrix preferred where held; where only Avaxim or Avaxim Junior is held, give it after a recorded risk-benefit assessment rather than delaying, as their SmPCs require (recorded on the Vaccine Administration step)"
            />
            <Checkbox
              label="Breastfeeding"
              checked={medicalHistory.breastfeeding}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, breastfeeding: v, ...(v ? {} : { breastfeedingDecision: '' }) })}
              description="The Avaxim SmPCs permit use during breastfeeding; the Havrix SmPCs ask for a benefit decision because excretion in milk is unknown; the Green Book records no evidence of risk from inactivated vaccines in breastfeeding. Give where indicated and record the decision"
            />
            {medicalHistory.breastfeeding && (
              <TextInput
                label="Breastfeeding: decision recorded"
                value={medicalHistory.breastfeedingDecision}
                onChange={(v) => setMedicalHistory({ ...medicalHistory, breastfeedingDecision: v })}
                placeholder="e.g. breastfeeding a 4 month old; inactivated vaccine, no evidence of risk; patient wishes to proceed"
                required
              />
            )}
            <Checkbox
              label="Immunosuppression, including HIV, immunosuppressive treatment and haemodialysis"
              checked={medicalHistory.immunosuppressed}
              onChange={(v) =>
                setMedicalHistory({
                  ...medicalHistory,
                  immunosuppressed: v,
                  ...(v ? {} : { immunosuppressionDetail: '', immunosuppressionCounselled: false, gpNotificationRefusedNote: '' }),
                })
              }
              description="May be vaccinated, and vaccination of a person with chronic immunodeficiency such as HIV is recommended; the response may be reduced and further doses may be needed. Where the immunosuppression is a time-limited treatment and travel allows, advise deferral until it ends (Avaxim SmPC). Serology and further doses are outside this PGD. Write to the GP or specialist. Do not tell the patient they are protected"
            />
            {medicalHistory.immunosuppressed && (
              <div className="ml-6 space-y-3">
                <TextInput
                  label="Nature of the immunosuppression (for the letter to the GP or specialist)"
                  value={medicalHistory.immunosuppressionDetail}
                  onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressionDetail: v })}
                  placeholder="e.g. chemotherapy until November, travel cannot be deferred; or HIV, under the clinic at ..."
                />
                <Checkbox
                  label="The patient was told that serology and further doses may be needed, that both are outside this PGD, and that the GP or specialist will be written to"
                  checked={medicalHistory.immunosuppressionCounselled}
                  onChange={(v) => setMedicalHistory({ ...medicalHistory, immunosuppressionCounselled: v })}
                  description="Do not tell the patient they are protected"
                  required
                />
                {consent.notifyGp ? (
                  <p className="text-xs text-gray-600">
                    Consent to GP notification was given on the Consent step: a copy of this consultation goes to the GP when the record is saved. Where a specialist manages the immunosuppression, write to them as well.
                  </p>
                ) : (
                  <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-900">
                      The GP or specialist must be written to. Consent to GP notification was not given on the Consent step: go back and record it, or record the patient&apos;s refusal here.
                    </p>
                    <TextInput
                      label="Patient refuses GP notification: reason and the advice given"
                      value={medicalHistory.gpNotificationRefusedNote}
                      onChange={(v) => setMedicalHistory({ ...medicalHistory, gpNotificationRefusedNote: v })}
                      placeholder="e.g. does not want the GP told; advised to tell the specialist that a hepatitis A dose was given and that serology may be needed"
                      required
                    />
                  </div>
                )}
              </div>
            )}
            <Checkbox
              label="Stable anticoagulation: warfarin with INR testing up to date and the latest INR below the upper limit of the therapeutic range, or a direct oral anticoagulant taken as prescribed"
              checked={medicalHistory.stableAnticoagulation}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, stableAnticoagulation: v })}
              description="Give intramuscularly with a 23 gauge or finer needle, firm pressure without rubbing for at least 2 minutes; if in doubt consult the anticoagulant prescriber"
            />
            <Checkbox
              label="Haemophilia or other bleeding disorder, or thrombocytopenia"
              checked={medicalHistory.bleedingDisorder}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, bleedingDisorder: v })}
              description="Give by deep subcutaneous injection, which all four SmPCs allow for patients at risk of haemorrhage, or intramuscularly only where a doctor familiar with the patient's bleeding risk has advised that route is safe. The route and why are recorded on the Vaccine Administration step"
            />
            {haemophiliaIndicationApplies(indication) && !medicalHistory.bleedingDisorder && (
              <p className="text-xs text-amber-800">
                Haemophilia or plasma-derived clotting factors is recorded as the indication: the bleeding disorder caution applies.
              </p>
            )}
            <Checkbox
              label="Phenylketonuria"
              checked={medicalHistory.phenylketonuria}
              onChange={(v) => setMedicalHistory({ ...medicalHistory, phenylketonuria: v })}
              description="All four products contain phenylalanine: Havrix Monodose 166 micrograms per dose, Havrix Junior Monodose 83 micrograms, Avaxim and Avaxim Junior 10 micrograms. Advise the patient or carer to account for it in meal planning on the day"
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
                setCourse((prev) => ({ ...prev, offLabelConsent: false }));
              }}
              options={productOptions.map((p) => ({ value: p, label: `${PRODUCTS[p].label}: dose ${PRODUCTS[p].volume}` }))}
              required
            />
            <p className="text-xs text-gray-600">
              Havrix and Avaxim are both UK-licensed inactivated hepatitis A vaccines and either may be used. Use whichever the pharmacy holds; do not delay vaccination to obtain the other.
            </p>
            {nonTravelIndication && indication.chronicLiverDisease && (
              <p className="text-xs font-semibold text-amber-800">
                Chronic liver disease: prefer Havrix where held; Avaxim has not been studied in liver disease.
              </p>
            )}
            {medicalHistory.pregnant && (
              <p className="text-xs font-semibold text-amber-800">
                Pregnancy: Havrix preferred where held; where only Avaxim or Avaxim Junior is held, give it after a recorded risk-benefit assessment rather than delaying.
              </p>
            )}

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
                label="Pregnancy with Avaxim: risk-benefit assessment recorded (Havrix preferred where held; where only Avaxim is held, give after a recorded risk-benefit assessment rather than delaying)"
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

            {doseNumber === 'second' && (
              <div className={`rounded-lg border p-4 text-sm ${offLabel ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="font-semibold text-navy-900">
                  Second dose timing: {secondDoseTiming.months !== null ? `${secondDoseTiming.months} months since the first dose` : 'date of the first dose not known'}
                </p>
                <p className="mt-1 text-xs text-gray-700">
                  First-dose product: {firstDoseProductLabel(course.firstDoseProduct)}.{' '}
                  {secondDoseTiming.windowLabel
                    ? `The licensed window is that of the product being given today (${secondDoseTiming.windowLabel}).`
                    : 'Select the vaccine given to check the licensed window, which is that of the product being given today.'}{' '}
                  {secondDoseTiming.months === null
                    ? 'The window cannot be checked against a date; the first dose was 6 months or more ago as reliably reported. A late second dose still counts. Do not restart the course.'
                    : secondDoseTiming.months > 12
                    ? 'A late second dose still counts. Do not restart the course.'
                    : 'Within the 6 to 12 month window.'}
                </p>
                {offLabel && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs font-semibold text-amber-900">
                      Off-label second dose: {secondDoseTiming.offLabelReason}. Give it on the terms stated, do not decline.
                    </p>
                    <p className="text-xs text-amber-900">{OFF_LABEL_BASIS_TEXT}</p>
                    <p className="text-xs text-amber-900">
                      Recorded: interval since the first dose {firstDoseIntervalText(course)}; first-dose product {firstDoseProductLabel(course.firstDoseProduct)}; &quot;{OFF_LABEL_BASIS}&quot;.
                    </p>
                    {medicalHistory.immunosuppressed && (
                      <p className="text-xs font-semibold text-amber-900">
                        Immunosuppressed: the Havrix data on delayed boosting are from immunocompetent adults. Arrange serology as well (outside this PGD) and include this in the letter to the GP or specialist.
                      </p>
                    )}
                    <Checkbox
                      label="The patient was told this dose is off-label and why, and consented on that basis"
                      checked={course.offLabelConsent}
                      onChange={(v) => setCourse({ ...course, offLabelConsent: v })}
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
              <p className="text-xs text-gray-500 mt-1">
                Where the pack shows only a month and year, the vaccine is in date to the end of that month: enter the last day of the month, not the first.
              </p>
            </div>

            <SelectInput
              label="Route"
              value={summary.route}
              onChange={(v) =>
                setSummary({
                  ...summary,
                  route: v as AdministrationRoute,
                  bleedingPrecautionsConfirmed: false,
                  imAdvisedByDoctor: false,
                  imAdvisedBy: '',
                })
              }
              options={[
                { value: 'intramuscular', label: 'Intramuscular' },
                ...(bleedingDisorder
                  ? [{ value: 'subcutaneous', label: 'Deep subcutaneous (haemophilia or other bleeding disorder, or thrombocytopenia)' }]
                  : []),
              ]}
              required
            />
            <p className="text-xs text-gray-600">
              Never into the gluteal muscle, and never intravascularly or intradermally: the response is unreliable.
            </p>
            {bleedingDisorder && (
              <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900">
                  {haemophiliaIndicationApplies(indication) && !medicalHistory.bleedingDisorder
                    ? 'Haemophilia or receipt of plasma-derived clotting factors'
                    : 'Haemophilia or other bleeding disorder, or thrombocytopenia'}
                  : give by deep subcutaneous injection, which all four SmPCs allow for patients at risk of haemorrhage, or intramuscularly only where a doctor familiar with the patient&apos;s bleeding risk has advised that route is safe. The route and why are recorded.
                </p>
                {summary.route === 'intramuscular' && (
                  <>
                    <Checkbox
                      label="A doctor familiar with the patient's bleeding risk has advised the intramuscular route is safe"
                      checked={summary.imAdvisedByDoctor}
                      onChange={(v) => setSummary({ ...summary, imAdvisedByDoctor: v, ...(v ? {} : { imAdvisedBy: '' }) })}
                      description="Otherwise select the deep subcutaneous route"
                      required
                    />
                    {summary.imAdvisedByDoctor && (
                      <TextInput
                        label="Who advised the intramuscular route"
                        value={summary.imAdvisedBy}
                        onChange={(v) => setSummary({ ...summary, imAdvisedBy: v })}
                        placeholder="e.g. Dr A Smith, haemophilia centre, by letter dated ..."
                        required
                      />
                    )}
                  </>
                )}
                {summary.route === 'subcutaneous' && (
                  <p className="text-xs text-amber-900">
                    Recorded: deep subcutaneous, the route the SmPCs allow for patients at risk of haemorrhage.
                  </p>
                )}
              </div>
            )}
            {anticoagulation && summary.route === 'intramuscular' && (
              <p className="text-xs text-amber-800">
                Stable anticoagulation: intramuscular with a 23 gauge or finer needle, firm pressure without rubbing for at least 2 minutes; if in doubt consult the anticoagulant prescriber.
              </p>
            )}
            {bleedingCaution && summary.route === 'intramuscular' && (
              <Checkbox
                label="23 gauge or finer needle, and firm pressure without rubbing for at least 2 minutes"
                checked={summary.bleedingPrecautionsConfirmed}
                onChange={(v) => setSummary({ ...summary, bleedingPrecautionsConfirmed: v })}
                description="Anticoagulation or a bleeding disorder with the intramuscular route"
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
                This dose completes the course: protection for at least 25 years, no further routine boosters for immunocompetent people. No reinforcing dose after a completed course is authorised under this PGD.
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
                <li>Rare: paraesthesia, hypoaesthesia, pruritus, chills</li>
                <li>Reported post-marketing (frequency not known): anaphylaxis and allergic reactions, urticaria, angioedema, erythema multiforme, lymphadenopathy, arthralgia, convulsions, Guillain-Barre syndrome, transverse myelitis, neuralgic amyotrophy, vasculitis, and transient rises in liver function tests. Consult the current SmPC for the product used</li>
                <li>Report suspected adverse reactions via yellowcard.mhra.gov.uk and inform the GP as appropriate</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900">Counselling (every point, every time):</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>One dose protects you for about a year, starting around two weeks from today. The second dose, in 6 to 12 months, protects you for at least 25 years. Come back for it; we will book it now.</li>
                <li>If you miss the second dose date, come anyway. The course does not need restarting. If it is a long time later, we may give it outside the licence, and we will tell you so.</li>
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
                label="If you miss the second dose date, come anyway; the course does not need restarting; if it is a long time later we may give it outside the licence and will tell you so"
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
              exclusionOutcome={effectiveExclusionOutcome}
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default HepatitisAClient;
