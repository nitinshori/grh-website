'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Mounted directly: this tool does not use the shared StepWrapper,
// which is where the other fifteen vaccination tools pick this up. It is
// wired into this tool's own Next button and record below, so the panel's
// "Next stays locked" wording is true here too.
import {
  VaccineSafetyChecks,
  getVaccineSafety,
  clearVaccineSafety,
  vaccineSafetySatisfied,
} from "../shared/components/VaccineSafetyChecks";
import {
  JapaneseEncephalitisConsultationState,
  JapaneseEncephalitisScreening,
  JapaneseEncephalitisContraindications,
  JapaneseEncephalitisVaccineAdministration,
  JapaneseEncephalitisPostVaccineObs,
  JapaneseEncephalitisAdvice,
  initialJapaneseEncephalitisScreening,
  initialJapaneseEncephalitisContraindications,
  initialJapaneseEncephalitisVaccineAdministration,
  initialJapaneseEncephalitisPostVaccineObs,
  initialJapaneseEncephalitisAdvice,
} from './japanese-encephalitis-types';
import { ClinicalAlert, BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { useConsultationTracking, type ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import {
  evaluateJapaneseEncephalitisContraindications,
  hasHardStopContraindications,
  calculateNextDose,
  calculateAgeInMonths,
  getDoseVolume,
  isRapidScheduleOffLabel,
  secondBoosterAllowed,
  daysUntil,
  JE_PGD_VERSION,
} from './japanese-encephalitis-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateMedicalHistory,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
  validateSummary,
} from './japanese-encephalitis-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import Link from 'next/link';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import JapaneseEncephalitisSummaryReport from './components/JapaneseEncephalitisSummaryReport';
import { calculateAge, initialPatientDetails, initialConsent, initialSummary } from '../shared/types';

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Travel Assessment',
  'Medical History',
  'Contraindications',
  'Administration',
  'Post-Vaccine Advice',
  'Summary',
];

interface JapaneseEncephalitisClientProps {
  initialPatient?: BasePatientDetails;
}

export default function JapaneseEncephalitisClient({
  initialPatient,
}: JapaneseEncephalitisClientProps): React.ReactNode {
  const [state, setState] = useState<JapaneseEncephalitisConsultationState>({
    patient: { ...(initialPatient || initialPatientDetails) },
    consent: { ...initialConsent },
    screening: initialJapaneseEncephalitisScreening(),
    contraindications: initialJapaneseEncephalitisContraindications(),
    administration: initialJapaneseEncephalitisVaccineAdministration(),
    postVaccineObs: initialJapaneseEncephalitisPostVaccineObs(),
    advice: initialJapaneseEncephalitisAdvice(),
    summary: initialSummary(),
    alerts: [],
    step: 0,
  });

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;
    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);


  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set<number>()
  );
  const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(
    new Map<number, string[]>()
  );

  const patientAge = calculateAge(state.patient.dateOfBirth);
  const patientAgeMonths = calculateAgeInMonths(state.patient.dateOfBirth);
  const underSixteen = patientAge !== null && patientAge < 16;
  const doseVolume = getDoseVolume(patientAgeMonths);
  const rapidOffLabel = isRapidScheduleOffLabel(patientAge);
  const daysToDeparture = daysUntil(state.screening.departureDate);
  const latePresenter = daysToDeparture !== null && daysToDeparture >= 0 && daysToDeparture < 14;

  // Contraindications and alerts are derived live from what is on screen, so
  // a stop raised on any step is enforced on that step and every later one,
  // never against a copy taken when a step was left.
  const live = useMemo(
    () => evaluateJapaneseEncephalitisContraindications(state.screening, patientAgeMonths, patientAge),
    [state.screening, patientAgeMonths, patientAge]
  );
  const hasStops = hasHardStopContraindications(live.contraindications);

  // Next dose is computed from the schedule and the dose number together.
  const nextDose = useMemo(
    () => calculateNextDose(state.administration.schedule, state.administration.doseNumber, patientAge),
    [state.administration.schedule, state.administration.doseNumber, patientAge]
  );
  /** State as it is recorded and printed: live alerts and the computed next-due date folded in. */
  const recordState = useMemo<JapaneseEncephalitisConsultationState>(
    () => ({
      ...state,
      contraindications: live.contraindications,
      alerts: live.alerts,
      administration: { ...state.administration, nextDueDate: nextDose.date },
    }),
    [state, live, nextDose.date]
  );

  /** Generic setter for screening fields added for PGD v006. */
  const setScreening = useCallback(
    (patch: Partial<JapaneseEncephalitisScreening>): void => {
      setState((prev) => ({
        ...prev,
        screening: { ...prev.screening, ...patch },
      }));
    },
    []
  );

  const setAdministration = useCallback(
    (patch: Partial<JapaneseEncephalitisVaccineAdministration>): void => {
      setState((prev) => ({
        ...prev,
        administration: { ...prev.administration, ...patch },
      }));
    },
    []
  );

  // Patient Details handlers
  const handlePatientChange = useCallback(
    (field: keyof BasePatientDetails, value: any): void => {
      setState((prev) => ({
        ...prev,
        patient: { ...prev.patient, [field]: value },
      }));
    },
    []
  );

  // Consent handlers
  const handleConsentChange = useCallback((field: string, value: unknown): void => {
    setState((prev) => ({
      ...prev,
      consent: { ...prev.consent, [field]: value },
    }));
  }, []);

  const handleIdVerifiedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      consent: { ...prev.consent, idVerified: value },
    }));
  }, []);

  const handlePatientAwareChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      consent: { ...prev.consent, patientAwarePrivateService: value },
    }));
  }, []);

  // Travel Assessment handlers
  const handleDestinationChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, destinationCountry: value },
    }));
  }, []);

  const handleRiskAreaChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, riskArea: value },
    }));
  }, []);

  const handleSeasonChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, seasonOfTravel: value },
    }));
  }, []);

  const handleOutdoorActivitiesChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: {
        ...prev.screening,
        outdoorActivities: value,
        activitiesDetails: value ? prev.screening.activitiesDetails : '',
      },
    }));
  }, []);

  const handleActivitiesDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, activitiesDetails: value },
    }));
  }, []);

  const handleDepartureDateChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, departureDate: value },
    }));
  }, []);

  const handleTravelDurationChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, travelDuration: value },
    }));
  }, []);

  const handleContinuedRiskChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, continuedRisk: value },
    }));
  }, []);

  // Medical History handlers
  const handleCurrentIllnessChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, currentIllness: value },
    }));
  }, []);

  const handleIllnessDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, illnessDetails: value },
    }));
  }, []);

  const handleImmunosuppressedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: {
        ...prev.screening,
        immunosuppressed: value,
        immunosuppressedDetails: value ? prev.screening.immunosuppressedDetails : '',
      },
    }));
  }, []);

  const handleImmunosuppressedDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, immunosuppressedDetails: value },
    }));
  }, []);

  const handlePregnantChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, pregnant: value },
    }));
  }, []);

  const handleSevereFebrileChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, severeFebrileIllness: value },
    }));
  }, []);

  const handleTemperatureChange = useCallback((value: number | null): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, temperature: value },
    }));
  }, []);

  // Administration handlers
  const handleBatchChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, batchNumber: value },
    }));
  }, []);

  const handleExpiryChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, expiryDate: value },
    }));
  }, []);

  const handleSiteChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, injectionSite: value as any },
    }));
  }, []);

  const handleDoseNumberChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, doseNumber: value as any },
    }));
  }, []);

  const handleScheduleChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, schedule: value as any },
    }));
  }, []);

  const handleAdministeredByChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, administeredBy: value },
    }));
  }, []);

  const handleTimeChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, timeAdministered: value },
    }));
  }, []);


  // Post-vaccine observation handlers
  const handleObservationPeriodChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, observationPeriod: value as any },
    }));
  }, []);

  const handlePatientWellChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, patientWell: value },
    }));
  }, []);

  const handleAdverseReactionChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, adverseReaction: value },
    }));
  }, []);

  const handleReactionDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, reactionDetails: value },
    }));
  }, []);

  const handleAnaphylaxisKitChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, anaphylaxisKitChecked: value },
      postVaccineObs: { ...prev.postVaccineObs, anaphylaxisKitChecked: value },
    }));
  }, []);

  const handleObservationCompletedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, observationCompleted: value },
    }));
  }, []);

  // Advice handlers
  const handleAdviceChange = useCallback(
    (field: keyof JapaneseEncephalitisAdvice, value: boolean): void => {
      setState((prev) => ({
        ...prev,
        advice: { ...prev.advice, [field]: value },
      }));
    },
    []
  );

  // Summary handlers
  const handleSummaryChange = useCallback(
    (field: keyof BaseSummary, value: string): void => {
      setState((prev) => ({
        ...prev,
        summary: { ...prev.summary, [field]: value },
      }));
    },
    []
  );

  // Validation
  const validateStep = useCallback((stepNum: number): boolean => {
    const errors: string[] = [];

    switch (stepNum) {
      case 0: {
        const result = validatePatientDetails(state.patient);
        errors.push(...result.errors);
        break;
      }
      case 1: {
        const result = validateConsent(state.consent, state.screening, patientAge);
        errors.push(...result.errors);
        break;
      }
      case 2: {
        const result = validateScreening(state.screening);
        errors.push(...result.errors);
        break;
      }
      case 3: {
        const result = validateMedicalHistory(state.screening);
        errors.push(...result.errors);
        break;
      }
      case 4: {
        const result = validateContraindications(state.contraindications);
        errors.push(...result.errors);
        break;
      }
      case 5: {
        const result = validateAdministration(state.administration, state.screening, patientAge);
        errors.push(...result.errors);
        break;
      }
      case 6: {
        const obsResult = validatePostVaccineObs(state.postVaccineObs);
        errors.push(...obsResult.errors);
        const result = validateAdvice(state.advice);
        errors.push(...result.errors);
        break;
      }
      case 7: {
        const result = validateSummary(state.summary);
        errors.push(...result.errors);
        break;
      }
    }

    // A stop anywhere blocks Next on every step. The route out is the
    // exclusion record (below), not a later step.
    const stop = live.alerts.find((a) => a.severity === 'stop');
    if (stop && stepNum < 7) {
      errors.push(`Exclusion present: ${stop.message}. Record the advice given and save the exclusion record.`);
    }
    // The shared pre-vaccination safety panel: adrenaline confirmed before proceeding.
    if (!vaccineSafetySatisfied('japanese-encephalitis')) {
      errors.push('Confirm in the pre-vaccination safety checks that adrenaline 1 in 1,000 is immediately available');
    }

    if (errors.length > 0) {
      setValidationErrors(new Map(validationErrors).set(stepNum, errors));
      return false;
    }

    setValidationErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(stepNum);
      return newErrors;
    });
    return true;
  }, [state, validationErrors, patientAge, live.alerts]);

  const handleNextStep = useCallback((): void => {
    if (!validateStep(state.step)) {
      return;
    }

    // The observation period is chosen by the pharmacist on the next step;
    // it is no longer pre-set to 30 minutes for every patient.
    setCompletedSteps((prev) => new Set(prev).add(state.step));
    setState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, STEP_LABELS.length - 1),
    }));
  }, [state, validateStep]);

  const handlePreviousStep = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 0),
    }));
  }, []);

  // ─── Consultation tracking + record saving ───
  const { markComplete, saveRecord, reset: resetTracking } = useConsultationTracking('japanese-encephalitis', state.step);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  /** True once an exclusion record has been saved: the summary prints as "not supplied". */
  const [excludedRecord, setExcludedRecord] = useState(false);

  const getConsultationData = useCallback((): ConsultationRecordData => {
    const blocked = hasStops;
    const stopMessages = live.alerts.filter((a) => a.severity === 'stop').map((a) => a.message);
    return {
      patient: {
        firstName: state.patient.firstName,
        lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth,
        nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone,
        email: state.patient.email,
        address: state.patient.address,
        gpName: state.patient.gpName,
        gpPractice: state.patient.gpPractice,
      },
      clinicalData: {
        ...recordState,
        pgdVersion: JE_PGD_VERSION,
        doseVolume: blocked ? null : doseVolume,
        nextDoseNote: nextDose.note,
        exclusion: blocked
          ? { reasons: stopMessages, advice: state.screening.exclusionAdvice, referral: state.screening.exclusionReferral }
          : null,
        adverseReaction: state.postVaccineObs.adverseReaction ? state.postVaccineObs.reactionDetails : null,
        // The shared pre-vaccination safety panel is attached here because this
        // tool does not go through StepWrapper, which does it for the others.
        vaccineSafetyChecks: getVaccineSafety('japanese-encephalitis'),
      } as unknown as Record<string, unknown>,
      outcome: blocked
        ? (state.screening.exclusionReferral && state.screening.exclusionReferral !== 'declined' ? 'referred' : 'not_supplied')
        : 'completed',
      ...(blocked
        ? {}
        : {
            medicine: {
              name: 'Ixiaro (Japanese encephalitis vaccine, inactivated, adsorbed)',
              dose: `${doseVolume || 'dose'} ${state.administration.route === 'deep-subcutaneous' ? 'deep subcutaneous' : 'intramuscular'}, ${state.administration.doseNumber || 'dose'}${state.administration.schedule ? `, ${state.administration.schedule === 'accelerated' ? 'rapid (day 0, day 7)' : 'conventional (day 0, day 28)'}` : ''}`,
              duration: nextDose.date ? `Next dose due ${nextDose.date}` : nextDose.note,
              quantity: 1,
            },
          }),
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: !!state.consent.notifyGp },
    };
  }, [state, recordState, hasStops, live, doseVolume, nextDose]);

  const handlePrint = useCallback(async (): Promise<void> => {
    // An excluded patient's record was saved by the exclusion route; this
    // only prints it. A vaccination record cannot be saved while a stop exists.
    if (hasStops) {
      if (excludedRecord) window.print();
      return;
    }
    // The record's pharmacist identity must not rest on autofill: name and
    // GPhC number are validated before anything is saved.
    if (!validateStep(7)) return;
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    window.print();
  }, [markComplete, saveRecord, getConsultationData, validateStep, hasStops, excludedRecord]);

  /**
   * Exclusion route. The document requires the reason, the advice given and
   * the decision reached to be documented, and the GP informed or the patient
   * referred. Saves the record as referred or not supplied and moves to the
   * summary, which prints as "not supplied".
   */
  const handleSaveExclusion = useCallback(async (): Promise<void> => {
    const errors: string[] = [];
    if (!state.screening.exclusionAdvice.trim()) errors.push('Record the advice given and the decision reached');
    if (!state.screening.exclusionReferral) errors.push('Record whether the GP was informed or a referral made');
    // Pharmacist name and GPhC come from the profile autofill; an exclusion
    // record with them blank is still better than none, so they are not
    // required here (the summary step is unreachable while a stop exists).
    if (errors.length > 0) {
      setValidationErrors(new Map(validationErrors).set(state.step, errors));
      return;
    }
    setValidationErrors(new Map());
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    setExcludedRecord(true);
    setState((prev) => ({ ...prev, step: STEP_LABELS.length - 1 }));
  }, [state, validationErrors, markComplete, saveRecord, getConsultationData]);

  const handleNewConsultation = useCallback((): void => {
    if (!window.confirm('Start a new consultation? The current consultation data will be cleared.')) return;
    // Forget the saved record and the shared safety panel values, or the
    // next patient is never written and inherits this one's batch number.
    resetTracking();
    clearVaccineSafety('japanese-encephalitis');
    setExcludedRecord(false);
    setState({
      patient: { ...(initialPatient || initialPatientDetails) },
      consent: { ...initialConsent },
      screening: initialJapaneseEncephalitisScreening(),
      contraindications: initialJapaneseEncephalitisContraindications(),
      administration: initialJapaneseEncephalitisVaccineAdministration(),
      postVaccineObs: initialJapaneseEncephalitisPostVaccineObs(),
      advice: initialJapaneseEncephalitisAdvice(),
      summary: initialSummary(),
      alerts: [],
      step: 0,
    });
    setCompletedSteps(new Set());
    setValidationErrors(new Map());
    setSaveStatus('idle');
  }, [initialPatient, resetTracking]);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const travelCodes = [
      'MONSOON_SEASON_JE',
      'OUTDOOR_ACTIVITIES_JE',
      'CONTINUED_RISK_JE',
      'LOW_RISK_ITINERARY_JE',
      'INSUFFICIENT_TIME_JE',
      'RAPID_SCHEDULE_NEEDED_JE',
      'AGE_OVER_65_JE',
      'AGE_UNDER_2_MONTHS_JE',
    ];
    const stepAlerts = live.alerts.filter((alert: ClinicalAlert) => {
      // A stop shows on every step. Travel and age cautions show from the
      // medical history step; every alert shows on the contraindications
      // review and after.
      if (alert.severity === 'stop') return true;
      if (state.step >= 4) return true;
      if (state.step === 3) return travelCodes.includes(alert.code);
      return false;
    });

    if (stepAlerts.length === 0) return null;

    return <AlertBanner alerts={stepAlerts} />;
  }, [live.alerts, state.step]);

  // Next is disabled on every step while a stop exists; the only route out is
  // the exclusion record.
  const canProceedFromStep = useCallback((): boolean => !hasStops, [hasStops]);

  const exclusionOutcomeBlock = hasStops && state.step < 7 ? (
    <div className="mb-6 space-y-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg print:hidden">
      <p className="text-red-900 font-semibold">Vaccination is excluded under this PGD. Record the exclusion.</p>
      <p className="text-sm text-red-800">
        Discuss the reason for exclusion with the patient and ensure they understand it. Advise on alternative options (GP, travel clinic or specialist service) and give bite avoidance advice. Where the exclusion is time critical, make the urgency of the referral explicit.
      </p>
      <TextArea
        label="Advice given and decision reached"
        value={state.screening.exclusionAdvice}
        onChange={(v) => setScreening({ exclusionAdvice: v })}
        placeholder="e.g. Short urban stay, vaccination not recommended: reasoning explained, bite avoidance advice given (DEET, cover up at dusk and dawn, treated nets)"
        required
      />
      <SelectInput
        label="GP informed or referral"
        value={state.screening.exclusionReferral}
        onChange={(v) => setScreening({ exclusionReferral: v as JapaneseEncephalitisScreening['exclusionReferral'] })}
        options={[
          { value: 'gp', label: 'GP informed or referred' },
          { value: 'travel-clinic', label: 'Referred to a travel clinic' },
          { value: 'specialist', label: 'Referred to a specialist service (e.g. pregnancy: individual assessment)' },
          { value: 'urgent', label: 'Urgent referral, urgency made explicit (time critical)' },
          { value: 'declined', label: 'No referral needed or declined; advice given (e.g. low risk itinerary)' },
        ]}
        required
      />
      <button
        onClick={handleSaveExclusion}
        disabled={saveStatus === 'saving'}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-red-400 text-red-800 hover:bg-red-100 transition disabled:opacity-50"
      >
        {saveStatus === 'saving' ? 'Saving...' : 'Save exclusion record (not supplied) and go to the record'}
      </button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <VaccineSafetyChecks slug="japanese-encephalitis" />
      <div className="max-w-4xl mx-auto">
        {state.step === 0 && (
          <div className="mb-4 print:hidden">
            <Link
              href="/for-pharmacies/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        )}
        <ProgressBar
          currentStep={state.step}
          stepLabels={STEP_LABELS}
          onStepClick={(s) => {
            // Backwards only, and never out of a saved exclusion record.
            if (s < state.step && !excludedRecord) setState((prev) => ({ ...prev, step: s }));
          }}
          completedSteps={completedSteps}
          hasErrors={validationErrors.has(state.step)}
        />

        <div className="bg-white rounded-lg shadow mt-8 p-8">
          {validationErrors.has(state.step) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Please fix the following errors:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.get(state.step)?.map((error, index) => (
                  <li key={index} className="text-sm text-red-800">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {getStepAlerts()}
          {exclusionOutcomeBlock}

          {state.step === 0 && (
            <PatientDetailsStep
              patient={state.patient}
              onChange={handlePatientChange}
              requireAdult={false}
          />
          )}

          {state.step === 1 && (
            <div className="space-y-4">
              <ConsentStep
                consent={state.consent}
                onChange={handleConsentChange}
              />
              {underSixteen && (
                <div className="space-y-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
                  <p className="text-sm font-semibold text-amber-900">Under 16: consent basis (PGD consent in children and young people)</p>
                  <SelectInput
                    label="Consent given by"
                    value={state.screening.consentBasis}
                    onChange={(v) => setScreening({ consentBasis: v as JapaneseEncephalitisScreening['consentBasis'] })}
                    options={[
                      { value: 'parental', label: 'A person with parental responsibility' },
                      { value: 'gillick', label: 'The young person, assessed as Gillick competent' },
                    ]}
                    required
                  />
                  <TextInput
                    label={state.screening.consentBasis === 'gillick' ? 'Basis of the Gillick competence assessment' : 'Name and relationship of the person with parental responsibility'}
                    value={state.screening.consentGiverDetails}
                    onChange={(v) => setScreening({ consentGiverDetails: v })}
                    placeholder={state.screening.consentBasis === 'gillick' ? 'Why the young person was judged competent' : 'A parent accompanying a child does not automatically hold parental responsibility. Ask.'}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {state.step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Travel Assessment</h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Travel Details
                </h3>
                <div className="space-y-4">
                  <TextInput
                    label="Destination country/region"
                    value={state.screening.destinationCountry}
                    onChange={handleDestinationChange}
                    placeholder="e.g., Thailand, Cambodia, Indonesia"
                  />
                  <TextInput
                    label="Risk area (rural/urban, rice paddies, etc)"
                    value={state.screening.riskArea}
                    onChange={handleRiskAreaChange}
                    placeholder="e.g., Rural areas, rice farming region"
                  />
                  <SelectInput
                    label="Green Book risk category (PGD inclusion and exclusion criteria)"
                    value={state.screening.riskCategory}
                    onChange={(v) => setScreening({ riskCategory: v as JapaneseEncephalitisScreening['riskCategory'] })}
                    options={[
                      { value: 'recommended-residence', label: 'Recommended: residence in an endemic or epidemic area' },
                      { value: 'recommended-long-stay', label: 'Recommended: stay of one month or longer in an endemic area during the transmission season' },
                      { value: 'recommended-frequent-travel', label: 'Recommended: frequent travel to endemic areas' },
                      { value: 'recommended-laboratory', label: 'Recommended: laboratory work with potential exposure' },
                      { value: 'consider-higher-risk-itinerary', label: 'Consider: shorter stay with a higher risk itinerary or activity (rural travel, rice fields, pig farming, extensive outdoor and evening exposure)' },
                      { value: 'consider-uncertain-itinerary', label: 'Consider: uncertain itinerary or duration within an endemic area' },
                      { value: 'not-recommended-urban-short-stay', label: 'Not recommended: short stay under one month confined to urban areas with a low risk itinerary (exclusion)' },
                    ]}
                    required
                  />
                  <SelectInput
                    label="Season of travel"
                    value={state.screening.seasonOfTravel}
                    onChange={handleSeasonChange}
                    options={[
                      { value: 'dry-season', label: 'Dry season' },
                      { value: 'wet-season', label: 'Wet/monsoon season' },
                      { value: 'year-round', label: 'Year-round' },
                      { value: 'spring-summer', label: 'Spring-summer' },
                    ]}
                  />
                  <TextInput
                    label="Departure date"
                    type="date"
                    value={state.screening.departureDate}
                    onChange={handleDepartureDateChange}
                  />
                  <TextInput
                    label="Duration of travel"
                    value={state.screening.travelDuration}
                    onChange={handleTravelDurationChange}
                    placeholder="e.g., 2 weeks, 1 month"
                  />
                  {daysToDeparture !== null && (
                    <p className="text-xs text-gray-600">{daysToDeparture < 0 ? `Departure date is ${-daysToDeparture} days in the past: check the dates` : `${daysToDeparture} days to departure`}</p>
                  )}
                  {latePresenter ? (
                    <Checkbox
                      label="Insufficient time to complete the primary course before travel: risk assessed, patient told protection will be incomplete, course to be completed on return"
                      checked={state.screening.insufficientTimeAcknowledged}
                      onChange={(v) => setScreening({ insufficientTimeAcknowledged: v, sufficientTimeBeforeTravel: false })}
                      description="Under 14 days to departure: even the rapid course (day 0 and day 7) cannot be completed a week before exposure. The second dose may still be given before exposure and the course should be completed rather than abandoned."
                      required
                    />
                  ) : (
                    <Checkbox
                      label={daysToDeparture !== null && daysToDeparture < 35
                        ? "Sufficient time before travel to complete the primary course using the rapid course (day 0 and day 7)"
                        : "Sufficient time before travel to complete the primary course"}
                      checked={state.screening.sufficientTimeBeforeTravel}
                      onChange={(v) => setScreening({ sufficientTimeBeforeTravel: v, insufficientTimeAcknowledged: false })}
                      description={daysToDeparture !== null && daysToDeparture < 35
                        ? "Under 35 days: the conventional course (day 0 and day 28) cannot be completed a week before travel. The rapid course is licensed for adults 18 to 64 only; otherwise off-label with documented consent."
                        : "Inclusion criterion: ideally at least one week between the second dose and potential exposure. Conventional course day 0 and day 28; rapid course day 0 and day 7 (licensed for adults 18 to 64 only)."}
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Activities & Risk
                </h3>
                <Checkbox
                  label="Extended outdoor activities planned"
                  checked={state.screening.outdoorActivities}
                  onChange={handleOutdoorActivitiesChange}
                  description="Spending significant time outdoors, especially at dusk/dawn"
                />
                {state.screening.outdoorActivities && (
                  <TextArea
                    label="Describe activities"
                    value={state.screening.activitiesDetails}
                    onChange={handleActivitiesDetailsChange}
                    placeholder="e.g., Rice farming, cycling, hiking, evening activities"
                  />
                )}

                <Checkbox
                  label="Continued risk (ongoing exposure)"
                  checked={state.screening.continuedRisk}
                  onChange={handleContinuedRiskChange}
                  description="Plans to return regularly or live in endemic area"
                />
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>

              <div className="space-y-4">
                <NumberInput
                  label="Body temperature (°C), optional"
                  value={state.screening.temperature}
                  onChange={handleTemperatureChange}
                  placeholder="Record if measured"
                />

                <Checkbox
                  label="Acute severe febrile illness"
                  checked={state.screening.severeFebrileIllness}
                  onChange={handleSevereFebrileChange}
                  description="Exclusion: postpone until recovered. The document sets no temperature threshold; this is the pharmacist's assessment."
                />

                <Checkbox
                  label="Confirmed anaphylactic or serious systemic reaction to a previous dose of Ixiaro, or to any component"
                  checked={state.screening.anaphylaxisToVaccineOrComponent}
                  onChange={(v) => setScreening({ anaphylaxisToVaccineOrComponent: v })}
                  description="Exclusion. Components include the residues protamine sulphate, formaldehyde, bovine serum albumin, host cell DNA and protein, and sodium metabisulphite. A history of allergy or urticaria is not in itself a reason to withhold Ixiaro."
                />

                <Checkbox
                  label="Hypersensitivity reaction following the first dose"
                  checked={state.screening.hypersensitivityAfterFirstDose}
                  onChange={(v) => setScreening({ hypersensitivityAfterFirstDose: v })}
                  description="Exclusion: do not give the second dose; refer."
                />

                <Checkbox
                  label="Bleeding disorder, thrombocytopenia or anticoagulation"
                  checked={state.screening.bleedingDisorder}
                  onChange={(v) => setScreening({ bleedingDisorder: v })}
                  description="Caution: give by deep subcutaneous injection rather than intramuscularly."
                />

                <Checkbox
                  label="Other current illness"
                  checked={state.screening.currentIllness}
                  onChange={handleCurrentIllnessChange}
                  description="Any other current illness symptoms?"
                />
                {state.screening.currentIllness && (
                  <TextArea
                    label="Describe current illness"
                    value={state.screening.illnessDetails}
                    onChange={handleIllnessDetailsChange}
                    placeholder="e.g., Cough, cold, sore throat..."
                  />
                )}

                <Checkbox
                  label="Immunosuppressed"
                  checked={state.screening.immunosuppressed}
                  onChange={handleImmunosuppressedChange}
                  description="Caution: an adequate immune response may not be achieved. Counsel accordingly and consider referral for serology where the risk is high."
                />
                {state.screening.immunosuppressed && (
                  <TextArea
                    label="Details of immunosuppression"
                    value={state.screening.immunosuppressedDetails}
                    onChange={handleImmunosuppressedDetailsChange}
                    placeholder="e.g., HIV, cancer treatment, immunosuppressant medication..."
                  />
                )}

                <Checkbox
                  label="Pregnant"
                  checked={state.screening.pregnant}
                  onChange={handlePregnantChange}
                  description="Exclusion unless the risk of Japanese encephalitis is high and cannot be avoided. Refer for individual assessment rather than vaccinating under this PGD."
                />

                <Checkbox
                  label="Breastfeeding"
                  checked={state.screening.breastfeeding}
                  onChange={(v) => setScreening(v ? { breastfeeding: true } : { breastfeeding: false, breastfeedingRiskAssessment: '' })}
                  description="Caution: limited data. Avoid as a precaution unless the risk of exposure is significant, and record the risk assessment."
                />
                {state.screening.breastfeeding && (
                  <TextArea
                    label="Breastfeeding risk assessment (recorded)"
                    value={state.screening.breastfeedingRiskAssessment}
                    onChange={(v) => setScreening({ breastfeedingRiskAssessment: v })}
                    placeholder="Why the risk of exposure is significant enough to vaccinate despite the precaution"
                    required
                  />
                )}
              </div>
            </div>
          )}

          {state.step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Contraindications Review
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Age appropriate (2+ months):</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.ageAppropriate
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {state.contraindications.ageAppropriate ? 'OK' : 'NOT OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Acute severe febrile illness:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.severeFebrileIllness
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.severeFebrileIllness
                      ? 'POSTPONE'
                      : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Anaphylaxis to Ixiaro or a component:</span>
                  <span className={`font-semibold ${state.contraindications.severeAllergy ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.severeAllergy ? 'EXCLUDED' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Hypersensitivity after first dose:</span>
                  <span className={`font-semibold ${state.contraindications.hypersensitivityAfterFirstDose ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.hypersensitivityAfterFirstDose ? 'EXCLUDED, REFER' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pregnancy:</span>
                  <span className={`font-semibold ${state.contraindications.pregnancy ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.pregnancy ? 'EXCLUDED, REFER' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Low risk itinerary (vaccination not recommended):</span>
                  <span className={`font-semibold ${state.contraindications.lowRiskItinerary ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.lowRiskItinerary ? 'EXCLUDED' : 'OK'}
                  </span>
                </div>
              </div>

            </div>
          )}

          {state.step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Vaccine Administration
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-1">
                  <p className="text-sm text-blue-900 font-semibold">
                    Ixiaro (Valneva), suspension for injection in a pre-filled syringe. Inactivated, adjuvanted, Vero cell derived, strain SA14-14-2.
                  </p>
                  <p className="text-sm text-blue-800">
                    Dose for this patient: {doseVolume || 'enter date of birth'} (0.5 mL from 3 years; 0.25 mL from 2 months to under 3 years, discarding the excess using the syringe marking and using a new sterile needle).
                  </p>
                  <p className="text-sm text-blue-800">
                    Conventional primary course: two doses, day 0 and day 28. Rapid primary course: day 0 and day 7, licensed only for adults aged 18 to 64 (off-label in children and from 65, requires explicit documented consent). Complete the course at least one week before potential exposure. If interrupted, resume rather than restart.
                  </p>
                  <p className="text-sm text-blue-800">
                    First booster 12 to 24 months after the primary course (12 months at continuous risk). Second booster: adults 18 to 64 at continued risk, 10 years after the first booster. Route: intramuscular, deltoid in older children and adults, anterolateral thigh in infants; deep subcutaneous in bleeding disorders. Shake before use. One dose per patient per attendance.
                  </p>
                </div>

                <Checkbox
                  label="Adrenaline 1:1000 injection immediately available, with a written anaphylaxis protocol, BEFORE the vaccine is given"
                  checked={state.administration.anaphylaxisKitChecked}
                  onChange={handleAnaphylaxisKitChange}
                  description="Required whenever a vaccine is administered under this PGD; protocol consistent with current Resuscitation Council UK guidance. Confirmed here, before the batch is drawn up, not retrospectively."
                  required
                />

                <TextInput
                  label="Batch number"
                  value={state.administration.batchNumber}
                  onChange={handleBatchChange}
                  placeholder="e.g., ABC123456"
                  disabled={!state.administration.anaphylaxisKitChecked}
                />

                <TextInput
                  label="Expiry date"
                  type="date"
                  value={state.administration.expiryDate}
                  onChange={handleExpiryChange}
                />

                <SelectInput
                  label="Injection site"
                  value={state.administration.injectionSite}
                  onChange={handleSiteChange}
                  options={[
                    { value: 'left-deltoid', label: 'Left deltoid (upper arm)' },
                    { value: 'right-deltoid', label: 'Right deltoid (upper arm)' },
                    { value: 'left-thigh', label: 'Left anterolateral thigh' },
                    { value: 'right-thigh', label: 'Right anterolateral thigh' },
                  ]}
                />

                <SelectInput
                  label="Route"
                  value={state.administration.route}
                  onChange={(v) => setAdministration({ route: v as JapaneseEncephalitisVaccineAdministration['route'] })}
                  options={[
                    ...(state.screening.bleedingDisorder ? [] : [{ value: 'intramuscular', label: 'Intramuscular' }]),
                    ...(state.screening.bleedingDisorder ? [{ value: 'deep-subcutaneous', label: 'Deep subcutaneous (bleeding disorders, thrombocytopenia or anticoagulation)' }] : []),
                  ]}
                  required
                />
                {!state.screening.bleedingDisorder && (
                  <p className="text-xs text-gray-500">Deep subcutaneous is offered only where a bleeding disorder, thrombocytopenia or anticoagulation was recorded on the Medical History step.</p>
                )}
                {state.screening.bleedingDisorder && state.administration.route !== 'deep-subcutaneous' && (
                  <p className="text-xs text-amber-700">Bleeding disorder, thrombocytopenia or anticoagulation recorded: give by deep subcutaneous injection instead.</p>
                )}

                <SelectInput
                  label="Dose number"
                  value={state.administration.doseNumber}
                  onChange={handleDoseNumberChange}
                  options={[
                    { value: '1st', label: '1st dose (primary course)' },
                    { value: '2nd', label: '2nd dose (primary course)' },
                    { value: 'booster', label: 'First booster (12 to 24 months after primary course)' },
                    ...(secondBoosterAllowed(patientAge) ? [{ value: 'second-booster', label: 'Second booster (adults 18 to 64 at continued risk, 10 years after first booster)' }] : []),
                  ]}
                />

                <SelectInput
                  label="Schedule"
                  value={state.administration.schedule}
                  onChange={handleScheduleChange}
                  options={[
                    { value: 'standard', label: 'Conventional (day 0 and day 28)' },
                    { value: 'accelerated', label: 'Rapid (day 0 and day 7), licensed for adults 18 to 64 only' },
                  ]}
                />
                {state.administration.schedule === 'accelerated' && rapidOffLabel && (
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50">
                    <Checkbox
                      label="Off-label rapid schedule explained and explicit consent documented"
                      checked={state.administration.offLabelRapidConsent}
                      onChange={(v) => setAdministration({ offLabelRapidConsent: v })}
                      description="The rapid course is licensed only for adults aged 18 to 64. The Green Book permits it in children and in adults aged 65 and over where there is genuinely insufficient time before travel; off-label use requires explicit documented consent."
                      required
                    />
                  </div>
                )}

                {state.administration.doseNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <p className="font-semibold">{nextDose.date ? `Next dose due: ${nextDose.date}` : 'No further dose scheduled'}</p>
                    <p className="text-xs mt-1">{nextDose.note}. Computed from the schedule and the dose number; give it to the patient in writing.</p>
                  </div>
                )}

                <TextInput
                  label="Administered by (name)"
                  value={state.administration.administeredBy}
                  onChange={handleAdministeredByChange}
                  placeholder="Pharmacist name"
                />

                <TextInput
                  label="Time administered"
                  type="time"
                  value={state.administration.timeAdministered}
                  onChange={handleTimeChange}
                />
              </div>
            </div>
          )}

          {state.step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Post-Vaccine Observations & Advice
              </h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Immediate Observations
                </h3>
                <div className="space-y-4">
                  <SelectInput
                    label="Observation period"
                    value={state.postVaccineObs.observationPeriod}
                    onChange={handleObservationPeriodChange}
                    options={[
                      { value: '15-min', label: '15 minutes, seated (PGD minimum)' },
                      { value: '30-min', label: '30 minutes (extended)' },
                    ]}
                  />

                  <Checkbox
                    label="Observation period completed, patient seated"
                    checked={state.postVaccineObs.observationCompleted}
                    onChange={handleObservationCompletedChange}
                    description="Observe every patient for 15 minutes after vaccination, seated, and record that the observation period was completed. Procedures in place to prevent injury from a vasovagal faint."
                    required
                  />

                  <Checkbox
                    label="Patient is well after vaccination"
                    checked={state.postVaccineObs.patientWell}
                    onChange={handlePatientWellChange}
                    description="Patient is comfortable with no symptoms"
                  />

                  <Checkbox
                    label="Adverse reaction observed"
                    checked={state.postVaccineObs.adverseReaction}
                    onChange={handleAdverseReactionChange}
                    description="Any adverse reaction during observation?"
                  />

                  {state.postVaccineObs.adverseReaction && (
                    <TextArea
                      label="Describe adverse reaction"
                      value={state.postVaccineObs.reactionDetails}
                      onChange={handleReactionDetailsChange}
                      placeholder="e.g., Rash, swelling, difficulty breathing..."
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Counselling Given
                </h3>
                <p className="text-gray-600 mb-4">
                  Confirm all advice points have been provided to patient:
                </p>
                <div className="space-y-4">
                  <Checkbox
                    label="Manufacturer's patient information leaflet given"
                    checked={state.advice.leafletGiven}
                    onChange={(v) => handleAdviceChange('leafletGiven', v)}
                  />

                  <Checkbox
                    label="Two-dose primary course explained"
                    checked={state.advice.twoDozeSchedule}
                    onChange={(v) => handleAdviceChange('twoDozeSchedule', v)}
                    description="Patient understands the need for two doses and that the course must be completed at least one week before exposure"
                  />

                  <Checkbox
                    label="Schedule and date of the second dose"
                    checked={state.advice.scheduleExplained}
                    onChange={(v) => handleAdviceChange('scheduleExplained', v)}
                    description="Conventional (day 0 and day 28) or rapid (day 0 and day 7); the date the second dose is due given clearly. If the course is interrupted it is resumed, not restarted."
                  />

                  <Checkbox
                    label="Common local and systemic reactions"
                    checked={state.advice.commonReactions}
                    onChange={(v) => handleAdviceChange('commonReactions', v)}
                    description="Very common: headache, myalgia, injection site pain or tenderness, fatigue. Common: nausea, injection site redness, induration, swelling and itching, influenza-like illness and fever. In children: fever, diarrhoea, influenza-like illness and irritability."
                  />

                  <Checkbox
                    label="Serious reactions and no vaccine is completely protective"
                    checked={state.advice.seriousReactions}
                    onChange={(v) => handleAdviceChange('seriousReactions', v)}
                    description="Anaphylaxis signs (difficulty breathing, face or throat swelling). Any febrile illness with headache, confusion or neurological symptoms during or after travel needs urgent medical assessment, mentioning the travel history."
                  />

                  <Checkbox
                    label="Mosquito bite avoidance as the primary protection"
                    checked={state.advice.mosquitoBitePrevention}
                    onChange={(v) => handleAdviceChange('mosquitoBitePrevention', v)}
                    description="Repellent containing DEET, covering up at dusk and dawn, and treated bed nets. Vaccination supplements this and does not replace it."
                  />

                  <Checkbox
                    label="Dusk to dawn biting mosquitoes"
                    checked={state.advice.duskDawnBiting}
                    onChange={(v) => handleAdviceChange('duskDawnBiting', v)}
                    description="The mosquito that transmits Japanese encephalitis bites mainly between dusk and dawn"
                  />

                  <Checkbox
                    label="Booster information"
                    checked={state.advice.boosterInformation}
                    onChange={(v) => handleAdviceChange('boosterInformation', v)}
                    description="First booster 12 to 24 months after the primary course and before re-exposure (12 months at continuous risk, and consider at 12 months if over 65). Second booster for adults 18 to 64 at continued risk, 10 years after the first booster."
                  />

                  <Checkbox
                    label="When to seek help"
                    checked={state.advice.returnIfConcerned}
                    onChange={(v) => handleAdviceChange('returnIfConcerned', v)}
                    description="Return to pharmacy/GP if concerned, or call NHS 111. Report suspected adverse reactions via the Yellow Card scheme."
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 7 && (
            <>
              <JapaneseEncephalitisSummaryReport state={recordState} onPrint={handlePrint} blocked={hasStops} nextDoseNote={nextDose.note} />
              {hasStops && !excludedRecord && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg print:hidden">
                  <p className="text-sm text-red-800">An exclusion is present. Go back and save the exclusion record; a vaccination record cannot be saved or printed while a stop exists.</p>
                </div>
              )}
              {saveStatus !== 'idle' && (
                <div className={`mt-4 px-4 py-3 rounded-lg print:hidden ${
                  saveStatus === 'saving' ? 'bg-blue-50 border border-blue-200' :
                  saveStatus === 'saved' ? 'bg-green-50 border border-green-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    saveStatus === 'saving' ? 'text-blue-700' :
                    saveStatus === 'saved' ? 'text-green-700' :
                    'text-red-700'
                  }`}>
                    {saveStatus === 'saving' && 'Saving consultation record...'}
                    {saveStatus === 'saved' && 'Consultation record saved. You can access it from Patient Records on your dashboard.'}
                    {saveStatus === 'error' && 'Could not save consultation record. Please print this page as a backup.'}
                  </p>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="mt-4 print:hidden">
                  <button
                    onClick={handleNewConsultation}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-[color:var(--tenant-primary)] border border-[color:var(--tenant-primary)]/30 hover:bg-[color:var(--tenant-primary)]/10 transition-colors"
                  >
                    New Consultation
                  </button>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handlePreviousStep}
              disabled={state.step === 0 || excludedRecord}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              disabled={state.step === STEP_LABELS.length - 1 || !canProceedFromStep()}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {state.step === STEP_LABELS.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
