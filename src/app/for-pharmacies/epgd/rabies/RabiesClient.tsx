'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  RabiesConsultationState,
  RabiesScreening,
  RabiesContraindications,
  RabiesVaccineAdministration,
  RabiesPostVaccineObs,
  RabiesAdvice,
  initialRabiesScreening,
  initialRabiesContraindications,
  initialRabiesVaccineAdministration,
  initialRabiesPostVaccineObs,
  initialRabiesAdvice,
} from './rabies-types';
import { ClinicalAlert, BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { useConsultationTracking, type ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import {
  evaluateRabiesContraindications,
  hasHardStopContraindications,
  getObservationPeriodRecommendation,
  calculateNextDueDates,
  getDoseVolume,
  getProductLabel,
  daysFromToday,
} from './rabies-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateMedicalHistory,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
  validateSummaryStep,
  validateExclusionRecord,
} from './rabies-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import Link from 'next/link';
import { AlertBanner } from '../shared/components/AlertBanner';
// The shared safety panel is no longer mounted here: this tool has its own
// required adrenaline confirmation (on the administration step, before the
// injection is recorded), observation, batch, expiry and site fields, and the
// panel's copy of those went nowhere. The store is cleared on New
// Consultation in case an earlier session left values in it.
import { clearVaccineSafety } from '../shared/components/VaccineSafetyChecks';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import RabiesSummaryReport from './components/RabiesSummaryReport';
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

const HIGH_RISK_ACTIVITIES = [
  { id: 'caving', label: 'Caving/Bat exposure' },
  { id: 'animal-handling', label: 'Animal handling' },
  { id: 'cycling', label: 'Cycling in rural areas' },
  { id: 'outdoor-work', label: 'Outdoor work (farmer, vet)' },
];

interface RabiesClientProps {
  initialPatient?: BasePatientDetails;
}

export default function RabiesClient({
  initialPatient,
}: RabiesClientProps): React.ReactNode {
  const [state, setState] = useState<RabiesConsultationState>({
    patient: initialPatient || initialPatientDetails,
    consent: initialConsent,
    screening: initialRabiesScreening(),
    contraindications: initialRabiesContraindications(),
    administration: initialRabiesVaccineAdministration(),
    postVaccineObs: initialRabiesPostVaccineObs(),
    advice: initialRabiesAdvice(),
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
  const underSixteen = patientAge !== null && patientAge < 16;
  const underEighteen = patientAge !== null && patientAge < 18;

  /** Generic setters for fields added for PGD v005. */
  const setScreening = useCallback(
    (patch: Partial<RabiesScreening>): void => {
      setState((prev) => ({
        ...prev,
        screening: { ...prev.screening, ...patch },
      }));
    },
    []
  );

  const setAdministration = useCallback(
    (patch: Partial<RabiesVaccineAdministration>): void => {
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
        patient: {
          ...prev.patient,
          [field]: value,
          // Age is recomputed on every DOB change so the under-2 gate on the
          // patient step is live, not dead code.
          ...(field === 'dateOfBirth' ? { age: calculateAge(String(value ?? '')) } : {}),
        },
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

  const handleActivityToggle = useCallback((activityId: string): void => {
    setState((prev) => {
      const newActivities = prev.screening.highRiskActivities.includes(activityId)
        ? prev.screening.highRiskActivities.filter((a) => a !== activityId)
        : [...prev.screening.highRiskActivities, activityId];
      return {
        ...prev,
        screening: { ...prev.screening, highRiskActivities: newActivities },
      };
    });
  }, []);

  const handleOtherActivitiesChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, otherActivities: value },
    }));
  }, []);

  const handleDepartureDateChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, departureDate: value },
    }));
  }, []);

  const handleAccessToPEPChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: {
        ...prev.screening,
        accessToPEP: value,
        pepAccessDetails: value ? prev.screening.pepAccessDetails : '',
      },
    }));
  }, []);

  const handlePEPDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, pepAccessDetails: value },
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

  const handleEggAllergyChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: {
        ...prev.screening,
        eggAllergy: value,
        eggAllergySeverity: value ? prev.screening.eggAllergySeverity : '',
      },
    }));
  }, []);

  const handleEggAllergySeverityChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, eggAllergySeverity: value },
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

  const todayIso = (): string => new Date().toISOString().split('T')[0];

  const handleDoseNumberChange = useCallback((value: string): void => {
    setState((prev) => {
      const doseNumber = value as RabiesVaccineAdministration['doseNumber'];
      const previousDoseDate = doseNumber === '1st' ? '' : prev.administration.previousDoseDate;
      const nextDueDates =
        prev.administration.schedule && doseNumber
          ? calculateNextDueDates(todayIso(), prev.administration.schedule, doseNumber, previousDoseDate)
          : '';
      return {
        ...prev,
        administration: { ...prev.administration, doseNumber, previousDoseDate, nextDueDates },
      };
    });
  }, []);

  const handlePreviousDoseDateChange = useCallback((value: string): void => {
    setState((prev) => {
      const nextDueDates =
        prev.administration.schedule && prev.administration.doseNumber
          ? calculateNextDueDates(todayIso(), prev.administration.schedule, prev.administration.doseNumber, value)
          : '';
      return {
        ...prev,
        administration: { ...prev.administration, previousDoseDate: value, nextDueDates },
      };
    });
  }, []);

  const handleScheduleChange = useCallback((value: string): void => {
    setState((prev) => {
      const schedule = value as RabiesVaccineAdministration['schedule'];
      const nextDueDates =
        schedule && prev.administration.doseNumber
          ? calculateNextDueDates(todayIso(), schedule, prev.administration.doseNumber, prev.administration.previousDoseDate)
          : '';
      return {
        ...prev,
        administration: {
          ...prev.administration,
          schedule,
          nextDueDates,
          scheduleReason: schedule === 'accelerated' ? prev.administration.scheduleReason : '',
          offLabelConsent: schedule === 'accelerated' ? prev.administration.offLabelConsent : false,
        },
      };
    });
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
      postVaccineObs: { ...prev.postVaccineObs, anaphylaxisKitChecked: value },
    }));
  }, []);

  // Advice handlers
  const handleAdviceChange = useCallback(
    (field: keyof RabiesAdvice, value: boolean): void => {
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
        const result = validateAdministration(
          state.administration,
          state.screening,
          state.contraindications,
          patientAge,
          state.postVaccineObs.anaphylaxisKitChecked
        );
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
        // Name and registration number of the administering professional are
        // in the PGD records row: the record cannot be saved without them.
        const result = validateSummaryStep(state.summary);
        errors.push(...result.errors);
        break;
      }
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
  }, [state, validationErrors, patientAge]);

  const handleNextStep = useCallback((): void => {
    if (!validateStep(state.step)) {
      return;
    }

    // Evaluate contraindications on leaving Travel Assessment (step 2) and
    // again on leaving Medical History (step 3), once allergy, pregnancy,
    // immunosuppression and temperature have been entered.
    if (state.step === 2 || state.step === 3) {
      const { contraindications, alerts } = evaluateRabiesContraindications(
        state.screening,
        patientAge
      );
      setState((prev) => ({
        ...prev,
        contraindications,
        alerts,
      }));
    }

    // On step 5 (Administration), set recommended observation period
    if (state.step === 5) {
      const recommendedPeriod = getObservationPeriodRecommendation(
        state.screening
      );
      setState((prev) => ({
        ...prev,
        postVaccineObs: {
          ...prev.postVaccineObs,
          observationPeriod: recommendedPeriod,
        },
      }));
    }

    setCompletedSteps((prev) => new Set(prev).add(state.step));
    setState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, STEP_LABELS.length - 1),
    }));
  }, [state, patientAge, validateStep]);

  const handlePreviousStep = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 0),
    }));
  }, []);

  // ─── Consultation tracking + record saving ───
  const { markComplete, saveRecord, reset: resetTracking } = useConsultationTracking('rabies', state.step);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const hasStop = hasHardStopContraindications(state.contraindications);

  const getConsultationData = useCallback((): ConsultationRecordData => {
    const stopped = hasHardStopContraindications(state.contraindications);
    const productChosen = !stopped && state.administration.product !== '';
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
        gpAddress: state.patient.gpAddress,
        gpPhone: state.patient.gpPhone,
        gpEmail: state.patient.gpEmail,
        gpOdsCode: state.patient.gpOdsCode,
      },
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: stopped ? 'not_supplied' : 'completed',
      medicine: productChosen
        ? {
            name: getProductLabel(state.administration.product),
            dose: `${getDoseVolume(state.administration.product)} ${state.administration.route === 'deep-subcutaneous' ? 'deep subcutaneous' : 'intramuscular'}, ${state.administration.doseNumber} dose, ${state.administration.schedule === 'accelerated' ? 'accelerated (day 0, 3, 7)' : 'conventional (day 0, 7, 28)'} schedule`,
            duration: 'Single dose this attendance',
            quantity: 1,
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || '',
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || '',
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, __pharmProfile]);

  const handlePrint = useCallback(async (): Promise<void> => {
    // Same rules as Next: no print or save with a stop on screen or without
    // the pharmacist's name and registration number.
    if (hasHardStopContraindications(state.contraindications)) return;
    if (!validateStep(7)) return;
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    window.print();
  }, [markComplete, saveRecord, getConsultationData, validateStep, state.contraindications]);

  // An excluded patient used to leave no record at all: Next was disabled on
  // the contraindications step and the only save lived on the summary. The
  // PGD requires the reason for exclusion, the advice given and the decision
  // reached to be documented.
  const handleSaveExclusion = useCallback(async (): Promise<void> => {
    const result = validateExclusionRecord(state.screening);
    if (!result.isValid) {
      setValidationErrors((prev) => new Map(prev).set(4, result.errors));
      return;
    }
    setValidationErrors((prev) => {
      const next = new Map(prev);
      next.delete(4);
      return next;
    });
    markComplete();
    setSaveStatus('saving');
    const data = getConsultationData();
    data.outcome = state.contraindications.priorExposure ? 'referred' : 'not_supplied';
    (data.clinicalData as Record<string, unknown>).stoppedAtStep = 4;
    (data.clinicalData as Record<string, unknown>).stopReason = state.alerts
      .filter((a) => a.severity === 'stop')
      .map((a) => a.message)
      .join('; ');
    const success = await saveRecord(data);
    setSaveStatus(success ? 'saved' : 'error');
  }, [state.screening, state.contraindications, state.alerts, markComplete, saveRecord, getConsultationData]);

  const handleNewConsultation = useCallback((): void => {
    if (!window.confirm('Start a new consultation? The current consultation data will be cleared.')) return;
    // Forget the saved consultation so the next patient is actually posted,
    // and clear any stale values in the shared vaccine safety store.
    resetTracking();
    clearVaccineSafety('rabies');
    setState({
      patient: initialPatient || initialPatientDetails,
      consent: initialConsent,
      screening: initialRabiesScreening(),
      contraindications: initialRabiesContraindications(),
      administration: initialRabiesVaccineAdministration(),
      postVaccineObs: initialRabiesPostVaccineObs(),
      advice: initialRabiesAdvice(),
      summary: initialSummary(),
      alerts: [],
      step: 0,
    });
    setCompletedSteps(new Set());
    setValidationErrors(new Map());
    setSaveStatus('idle');
  }, [initialPatient, resetTracking]);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const travelCodes = ['LIMITED_PEP_ACCESS', 'PRIOR_EXPOSURE_RABIES', 'AGE_UNDER_2_RABIES'];
    const stepAlerts = state.alerts.filter((alert: ClinicalAlert) => {
      // Travel and age alerts (raised on leaving step 2) show on the medical
      // history step; every alert shows on the contraindications review.
      if (state.step === 4) return true;
      if (state.step === 3) return travelCodes.includes(alert.code);
      return false;
    });

    if (stepAlerts.length === 0) return null;

    return <AlertBanner alerts={stepAlerts} />;
  }, [state.alerts, state.step]);

  // A stop raised on the contraindications review blocks Next on that step
  // and on every step after it.
  const canProceedFromStep = useCallback((): boolean => {
    if (state.step >= 4 && hasHardStopContraindications(state.contraindications)) {
      return false;
    }
    return true;
  }, [state.step, state.contraindications]);

  const daysToDeparture = daysFromToday(state.screening.departureDate);
  const isTravelIndication = state.screening.indication !== 'occupational-uk';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
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
          onStepClick={() => {}}
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
                  <p className="text-sm font-semibold text-amber-900">Under 16: consent basis (PGD inclusion criterion)</p>
                  <SelectInput
                    label="Consent given by"
                    value={state.screening.consentBasis}
                    onChange={(v) => setScreening({ consentBasis: v as RabiesScreening['consentBasis'] })}
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
              <h2 className="text-2xl font-bold text-gray-900">Travel Assessment & Risk</h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Travel Details
                </h3>
                <div className="space-y-4">
                  <SelectInput
                    label="Indication (PGD inclusion criteria)"
                    value={state.screening.indication}
                    onChange={(v) => setScreening({ indication: v as RabiesScreening['indication'] })}
                    options={[
                      { value: 'travel-enzootic-area', label: 'Travel to a rabies enzootic area (particularly where post-exposure treatment is lacking, higher risk activities such as cycling or running, or a stay longer than one month)' },
                      { value: 'occupational-abroad', label: 'Occupational risk abroad: animal control and wildlife workers, veterinary staff and zoologists in enzootic areas' },
                      { value: 'occupational-uk', label: 'UK-based occupational risk: rabies laboratory staff, DEFRA quarantine premises or carriers, bat handlers, veterinary and technical staff' },
                    ]}
                    required
                  />
                  {isTravelIndication ? (
                    <>
                      <TextInput
                        label="Destination country/region"
                        value={state.screening.destinationCountry}
                        onChange={handleDestinationChange}
                        placeholder="e.g., Nepal, India, Philippines"
                        required
                      />
                      <TextInput
                        label="Departure date"
                        type="date"
                        value={state.screening.departureDate}
                        onChange={handleDepartureDateChange}
                        required
                      />
                      {daysToDeparture !== null && (
                        <p className={`text-sm ${daysToDeparture < 7 ? 'text-red-700 font-semibold' : daysToDeparture < 21 ? 'text-amber-700' : 'text-gray-700'}`}>
                          {daysToDeparture < 0
                            ? 'Departure date is in the past.'
                            : daysToDeparture < 7
                              ? `${daysToDeparture} days to departure: a first dose today cannot be followed by a complete course (accelerated course needs 7 days). Refer to a travel clinic unless this attendance is for a later dose in a course already started.`
                              : daysToDeparture < 21
                                ? `${daysToDeparture} days to departure: the conventional course (third dose from day 21) cannot be completed from a first dose today. The accelerated course (18 and over, off-label) is the only option for a new course.`
                                : `${daysToDeparture} days to departure: the conventional course can be completed (third dose from day 21). The accelerated course may not be used.`}
                        </p>
                      )}
                      <Checkbox
                        label="Sufficient time before travel to complete the chosen course"
                        checked={state.screening.sufficientTimeBeforeTravel}
                        onChange={(v) => setScreening({ sufficientTimeBeforeTravel: v })}
                        description="Inclusion criterion. Conventional course day 0, 7 and 28 (third dose may be brought forward to day 21). Accelerated course day 0, 3 and 7 is for adults 18 and over only, off-label, and only where there is genuinely insufficient time for the conventional course. The administration step checks the departure date against the chosen course."
                        required
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">UK-based occupational indication: no destination or departure date applies. Record the occupation below.</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-red-300 bg-red-50">
                <Checkbox
                  label="Any actual or possible exposure has ALREADY occurred (bite, scratch or lick on broken skin from a mammal in a rabies risk area, however trivial and however long ago)"
                  checked={state.screening.priorExposure}
                  onChange={(v) => setScreening({ priorExposure: v })}
                  description="Exclusion. This is post-exposure and a same-day medical emergency. Refer for urgent medical assessment today; do not manage it here."
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  High-Risk Activities
                </h3>
                <p className="text-gray-600 mb-4">Select all applicable activities:</p>
                <div className="space-y-3">
                  {HIGH_RISK_ACTIVITIES.map((activity) => (
                    <Checkbox
                      key={activity.id}
                      label={activity.label}
                      checked={state.screening.highRiskActivities.includes(activity.id)}
                      onChange={() => handleActivityToggle(activity.id)}
                      description=""
                    />
                  ))}
                </div>
                <TextArea
                  label="Other activities, exposure risks or occupational indication"
                  value={state.screening.otherActivities}
                  onChange={handleOtherActivitiesChange}
                  placeholder="e.g., bat handling, quarantine premises, laboratory work with rabies virus, veterinary work..."
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Post-Exposure Prophylaxis Access
                </h3>
                <Checkbox
                  label="Good access to post-exposure treatment at destination"
                  checked={state.screening.accessToPEP}
                  onChange={handleAccessToPEPChange}
                  description="Post-exposure treatment and rabies biologics (vaccine and immunoglobulin) available and not in short supply at the destination. Leave unticked where they are lacking."
                />
                {state.screening.accessToPEP && (
                  <TextArea
                    label="Details of PEP availability"
                    value={state.screening.pepAccessDetails}
                    onChange={handlePEPDetailsChange}
                    placeholder="e.g., Hospital in capital city, travel time from location..."
                  />
                )}
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>

              <div className="space-y-4">
                <NumberInput
                  label="Body temperature (°C)"
                  value={state.screening.temperature}
                  onChange={handleTemperatureChange}
                  placeholder="36.5"
                />

                <Checkbox
                  label="Acute severe febrile illness (acutely unwell with fever or systemic upset)"
                  checked={state.screening.acuteFebrileIllness}
                  onChange={(v) => setScreening({ acuteFebrileIllness: v })}
                  description="Exclusion: postpone until recovered. A minor illness without fever is not a reason to defer. A recorded temperature of 38.5 C or above also triggers this."
                />

                <Checkbox
                  label="Minor current illness (no fever or systemic upset)"
                  checked={state.screening.currentIllness}
                  onChange={handleCurrentIllnessChange}
                  description="Not a reason to postpone. Record for completeness."
                />
                {state.screening.currentIllness && (
                  <TextArea
                    label="Describe current illness"
                    value={state.screening.illnessDetails}
                    onChange={handleIllnessDetailsChange}
                    placeholder="e.g., Fever, cough, sore throat..."
                  />
                )}

                <Checkbox
                  label="Immunosuppressed, including HIV"
                  checked={state.screening.immunosuppressed}
                  onChange={handleImmunosuppressedChange}
                  description="Caution: a full response may not be mounted. Conventional three dose schedule only (the accelerated course is excluded); refer for post-course serology (protective titre 0.5 IU/mL or above)."
                />
                {state.screening.immunosuppressed && (
                  <TextArea
                    label="Details of immunosuppression"
                    value={state.screening.immunosuppressedDetails}
                    onChange={handleImmunosuppressedDetailsChange}
                    placeholder="e.g., HIV, chemotherapy, immunosuppressant medication..."
                  />
                )}

                <Checkbox
                  label="Pregnant"
                  checked={state.screening.pregnant}
                  onChange={handlePregnantChange}
                  description="Caution: give pre-exposure vaccine where the risk of exposure is high and rapid access to post-exposure treatment would be limited, and record the risk assessment."
                />
                {state.screening.pregnant && (
                  <TextArea
                    label="Pregnancy risk assessment (recorded)"
                    value={state.screening.pregnancyRiskAssessment}
                    onChange={(v) => setScreening({ pregnancyRiskAssessment: v })}
                    placeholder="Why the risk of exposure is high and post-exposure treatment access would be limited"
                    required
                  />
                )}

                <Checkbox
                  label="Breastfeeding"
                  checked={state.screening.breastfeeding}
                  onChange={(v) => setScreening(v ? { breastfeeding: true } : { breastfeeding: false, breastfeedingRiskAssessment: '' })}
                  description="Caution: the same principle as pregnancy applies. No risk to the infant has been identified. Record the risk assessment."
                />
                {state.screening.breastfeeding && (
                  <TextArea
                    label="Breastfeeding risk assessment (recorded)"
                    value={state.screening.breastfeedingRiskAssessment}
                    onChange={(v) => setScreening({ breastfeedingRiskAssessment: v })}
                    placeholder="Why the risk of exposure is high and post-exposure treatment access would be limited"
                    required
                  />
                )}

                <Checkbox
                  label="Confirmed anaphylactic reaction to a previous dose of rabies vaccine or to any component of the product to be used"
                  checked={state.screening.anaphylaxisToVaccineOrComponent}
                  onChange={(v) => setScreening({ anaphylaxisToVaccineOrComponent: v })}
                  description="Exclusion: refer, do not vaccinate."
                />

                <Checkbox
                  label="Egg allergy"
                  checked={state.screening.eggAllergy}
                  onChange={handleEggAllergyChange}
                  description="Severe egg allergy excludes Rabipur (chick embryo cell residues including ovalbumin). Verorab may be a suitable alternative."
                />
                {state.screening.eggAllergy && (
                  <SelectInput
                    label="Egg allergy severity"
                    value={state.screening.eggAllergySeverity}
                    onChange={handleEggAllergySeverityChange}
                    options={[
                      { value: 'mild', label: 'Mild (not severe)' },
                      { value: 'severe', label: 'Severe (Rabipur excluded)' },
                    ]}
                  />
                )}

                <Checkbox
                  label="Hypersensitivity to polymyxin B, streptomycin or neomycin, or to any antibiotic of the same class"
                  checked={state.screening.antibioticHypersensitivity}
                  onChange={(v) => setScreening({ antibioticHypersensitivity: v, hypersensitivityIncludesNeomycin: v ? state.screening.hypersensitivityIncludesNeomycin : '' })}
                  description="Excludes Verorab. Rabipur contains traces of neomycin, chlortetracycline and amphotericin B, so where the hypersensitivity extends to neomycin neither product can be given."
                />
                {state.screening.antibioticHypersensitivity && (
                  <SelectInput
                    label="Does the hypersensitivity extend to neomycin?"
                    value={state.screening.hypersensitivityIncludesNeomycin}
                    onChange={(v) => setScreening({ hypersensitivityIncludesNeomycin: v as RabiesScreening['hypersensitivityIncludesNeomycin'] })}
                    options={[
                      { value: 'yes', label: 'Yes, or not known: neomycin cannot be excluded (both products excluded, refer)' },
                      { value: 'no', label: 'No: confirmed hypersensitivity to polymyxin B or streptomycin only (Rabipur may be used)' },
                    ]}
                    required
                  />
                )}

                <Checkbox
                  label="Bleeding disorder, thrombocytopenia or anticoagulation"
                  checked={state.screening.bleedingDisorder}
                  onChange={(v) => setScreening({ bleedingDisorder: v })}
                  description="Caution: give by deep subcutaneous injection rather than intramuscularly."
                />
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
                  <span className="text-gray-700">Age appropriate (2 years and over):</span>
                  <span className={`font-semibold ${state.contraindications.ageAppropriate ? 'text-green-600' : 'text-red-600'}`}>
                    {state.contraindications.ageAppropriate ? 'OK' : 'NOT OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Exposure already occurred (post-exposure):</span>
                  <span className={`font-semibold ${state.contraindications.priorExposure ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.priorExposure ? 'REFER SAME DAY' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Anaphylaxis to rabies vaccine or a component:</span>
                  <span className={`font-semibold ${state.contraindications.anaphylaxisHistory ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.anaphylaxisHistory ? 'EXCLUDED' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Severe egg allergy (Rabipur):</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.severeEggAllergy
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.severeEggAllergy
                      ? 'RABIPUR EXCLUDED, USE VERORAB'
                      : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Polymyxin B, streptomycin or neomycin hypersensitivity (Verorab):</span>
                  <span className={`font-semibold ${state.contraindications.antibioticHypersensitivity ? 'text-red-600' : 'text-green-600'}`}>
                    {state.contraindications.neomycinHypersensitivity
                      ? 'NEOMYCIN: BOTH PRODUCTS EXCLUDED'
                      : state.contraindications.antibioticHypersensitivity
                        ? 'VERORAB EXCLUDED'
                        : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Acute severe febrile illness:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.acuteFebrileIllness
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.acuteFebrileIllness
                      ? 'POSTPONE'
                      : 'OK'}
                  </span>
                </div>
                {underEighteen && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Under 18:</span>
                    <span className="font-semibold text-amber-700">CONVENTIONAL COURSE ONLY</span>
                  </div>
                )}
                {state.screening.immunosuppressed && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Immunosuppressed:</span>
                    <span className="font-semibold text-amber-700">CONVENTIONAL COURSE ONLY, POST-COURSE SEROLOGY</span>
                  </div>
                )}
              </div>

              {!canProceedFromStep() && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-900 font-semibold">
                    Vaccination is excluded under this PGD. Do not proceed.
                  </p>
                  <p className="text-sm text-red-800 mt-2">
                    Discuss the reason for exclusion with the patient and make sure they understand it. Advise on alternative options: the GP, a travel clinic, or a specialist service. Where the exclusion is a possible exposure that has already occurred, make the urgency explicit: that patient needs assessment today, not an appointment. Document the reason for exclusion, the advice given and the decision reached. Inform or refer to the GP as appropriate.
                  </p>
                  <div className="mt-4 space-y-3">
                    <TextArea
                      label="Advice given and decision reached (recorded with the exclusion)"
                      value={state.screening.exclusionAdviceGiven}
                      onChange={(v) => setScreening({ exclusionAdviceGiven: v })}
                      placeholder="e.g., Advised same-day attendance at the emergency department for post-exposure assessment; GP informed."
                      required
                    />
                    {saveStatus !== 'saved' ? (
                      <button
                        type="button"
                        onClick={handleSaveExclusion}
                        disabled={saveStatus === 'saving'}
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Record exclusion and finish (save as not supplied)'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-green-700">Exclusion recorded. No vaccine supplied.</span>
                        <button
                          type="button"
                          onClick={handleNewConsultation}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-[color:var(--tenant-primary)] border border-[color:var(--tenant-primary)]/30 hover:bg-[color:var(--tenant-primary)]/10 transition-colors"
                        >
                          New Consultation
                        </button>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <p className="text-sm text-red-700">Could not save the exclusion record. Check the connection and try again.</p>
                    )}
                  </div>
                </div>
              )}
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
                    Rabipur (Bavarian Nordic) or Verorab (Sanofi), intramuscular route only, pre-exposure only
                  </p>
                  <p className="text-sm text-blue-800">
                    THE DOSE VOLUMES DIFFER: Rabipur 1.0 mL, Verorab 0.5 mL. Confirm which product is in hand before drawing up. Do not carry a volume across from one product to the other. Reconstitute immediately before use: Rabipur within one hour of reconstitution, Verorab for intramuscular use immediately.
                  </p>
                  <p className="text-sm text-blue-800">
                    Conventional, preferred, all ages: day 0, day 7 and day 28 (third dose may be brought forward to day 21). Accelerated, 18 and over only, off-label, documented consent required: day 0, day 3 and day 7, with a further dose at one year if travel to high risk areas continues. Do NOT use the two dose day 0 and day 7 SPC regimen. Complete a course with the same product wherever possible.
                  </p>
                  <p className="text-sm text-blue-800">
                    Route: intramuscular into the deltoid in older children and adults, or the anterolateral thigh in infants and young children. Never into the buttock. Deep subcutaneous in bleeding disorders. Verorab prefilled syringes without an attached needle have a tip cap containing a natural rubber latex derivative; Verorab contains phenylalanine 4.1 micrograms per dose. One dose per patient per attendance.
                  </p>
                </div>

                <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50">
                  <Checkbox
                    label="Adrenaline (epinephrine) 1 in 1,000 injection is immediately available in this room, in date, with a written anaphylaxis protocol and a telephone"
                    checked={state.postVaccineObs.anaphylaxisKitChecked}
                    onChange={handleAnaphylaxisKitChange}
                    description="Required whenever a vaccine is administered under this PGD (protocol consistent with current Resuscitation Council UK guidance). Confirm before drawing up: the administration cannot be recorded until this is ticked."
                    required
                  />
                </div>

                <SelectInput
                  label="Product in hand"
                  value={state.administration.product}
                  onChange={(v) => setAdministration({ product: v as RabiesVaccineAdministration['product'] })}
                  options={[
                    { value: 'rabipur', label: 'Rabipur, purified chick embryo cell vaccine, 1.0 mL per dose' },
                    { value: 'verorab', label: 'Verorab, purified Vero cell rabies vaccine, 0.5 mL per dose' },
                  ]}
                  required
                />
                {state.administration.product && (
                  <p className="text-sm font-semibold text-blue-900">Dose volume for this product: {getDoseVolume(state.administration.product)}</p>
                )}
                {state.administration.product === 'rabipur' && state.contraindications.severeEggAllergy && (
                  <p className="text-xs text-red-700">Severe egg allergy recorded: Rabipur is excluded. Select Verorab or refer.</p>
                )}
                {state.administration.product === 'verorab' && state.contraindications.antibioticHypersensitivity && (
                  <p className="text-xs text-red-700">Polymyxin B, streptomycin or neomycin hypersensitivity recorded: Verorab is excluded.</p>
                )}
                {state.administration.product === 'rabipur' && state.contraindications.neomycinHypersensitivity && (
                  <p className="text-xs text-red-700">Neomycin hypersensitivity recorded: Rabipur contains traces of neomycin and is excluded. Refer.</p>
                )}

                <TextInput
                  label="Batch number"
                  value={state.administration.batchNumber}
                  onChange={handleBatchChange}
                  placeholder="e.g., ABC123456"
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
                  onChange={(v) => setAdministration({ route: v as RabiesVaccineAdministration['route'] })}
                  options={[
                    { value: 'intramuscular', label: 'Intramuscular' },
                    { value: 'deep-subcutaneous', label: 'Deep subcutaneous (bleeding disorders, thrombocytopenia or anticoagulation)' },
                  ]}
                  required
                />
                {state.screening.bleedingDisorder && state.administration.route !== 'deep-subcutaneous' && (
                  <p className="text-xs text-amber-700">Bleeding disorder, thrombocytopenia or anticoagulation recorded: give by deep subcutaneous injection instead.</p>
                )}

                <SelectInput
                  label="Schedule"
                  value={state.administration.schedule}
                  onChange={handleScheduleChange}
                  options={[
                    { value: 'standard', label: 'Conventional, preferred, all ages (day 0, 7 and 28; third dose may be brought forward to day 21)' },
                    { value: 'accelerated', label: 'Accelerated, 18 and over only, off-label (day 0, 3 and 7, plus a further dose at one year if travel to high risk areas continues)' },
                  ]}
                  required
                />
                {state.administration.schedule === 'accelerated' && underEighteen && (
                  <p className="text-xs text-red-700">Under 18: the accelerated course may not be given under this PGD. Give the conventional course, or direct the patient to a travel clinic where a fast course is needed.</p>
                )}
                {state.administration.schedule === 'accelerated' && state.screening.immunosuppressed && (
                  <p className="text-xs text-red-700">Immunosuppressed: the accelerated course is excluded. Use the conventional course and refer for post-course serology.</p>
                )}
                {state.administration.schedule === 'accelerated' && (
                  <div className="space-y-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
                    <p className="text-sm font-semibold text-amber-900">Accelerated course is off-label: what to say and record</p>
                    <TextInput
                      label="Reason the conventional course was not possible"
                      value={state.administration.scheduleReason}
                      onChange={(v) => setAdministration({ scheduleReason: v })}
                      placeholder="e.g., departure in 12 days"
                      required
                    />
                    <Checkbox
                      label="Consent script given and consent to off-label use recorded, naming the day 0, 3 and 7 schedule"
                      checked={state.administration.offLabelConsent}
                      onChange={(v) => setAdministration({ offLabelConsent: v })}
                      description="Told the patient: the schedule is recommended by UK national guidance but is not the schedule in the manufacturer's licence; the conventional day 0, 7 and 28 course is preferred and is being departed from only because there is not enough time before travel; a further dose will be needed at one year if travel to high risk areas continues; pre-exposure vaccination does not remove the need for urgent treatment after any bite, scratch or lick on broken skin. A general consent to vaccination is not sufficient."
                      required
                    />
                  </div>
                )}

                <SelectInput
                  label="Dose number"
                  value={state.administration.doseNumber}
                  onChange={handleDoseNumberChange}
                  options={[
                    { value: '1st', label: '1st dose (day 0)' },
                    { value: '2nd', label: '2nd dose (day 7 conventional, day 3 accelerated)' },
                    { value: '3rd', label: '3rd dose (day 28 or 21 conventional, day 7 accelerated)' },
                    { value: 'one-year-dose', label: 'Further dose at one year (after accelerated course, continued travel to high risk areas)' },
                    { value: 'booster', label: 'Booster (single booster after risk assessment, or reinforcing dose for frequent unrecognised exposure risk)' },
                  ]}
                  required
                />

                {state.administration.doseNumber && state.administration.doseNumber !== '1st' && (
                  <TextInput
                    label="Date of the previous dose in this course"
                    type="date"
                    value={state.administration.previousDoseDate}
                    onChange={handlePreviousDoseDateChange}
                    required
                  />
                )}
                {state.administration.doseNumber && state.administration.doseNumber !== '1st' && state.administration.previousDoseDate && (
                  <p className="text-sm text-gray-700">
                    Previous dose {-(daysFromToday(state.administration.previousDoseDate) ?? 0)} days ago.
                    Minimum interval for this dose: conventional 2nd dose 7 days, 3rd dose 14 days; accelerated 2nd dose 3 days, 3rd dose 4 days.
                  </p>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700">Next due dates (calculated from the schedule, dose number and previous dose date)</p>
                  <p className="mt-1 text-sm text-gray-900 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    {state.administration.nextDueDates || 'Select the schedule and dose number'}
                  </p>
                </div>

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
                  <Checkbox
                    label="15 minute observation period completed"
                    checked={state.postVaccineObs.observationCompleted}
                    onChange={(v) => setState((prev) => ({ ...prev, postVaccineObs: { ...prev.postVaccineObs, observationCompleted: v } }))}
                    description="Observe every patient for 15 minutes after vaccination. Vaccinate seated. Procedures in place to prevent injury from a faint."
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
                    label="Patient information leaflet and written vaccination record given"
                    checked={state.advice.writtenRecordGiven}
                    onChange={(v) => handleAdviceChange('writtenRecordGiven', v)}
                    description="PIL for the product given, and a written record of the vaccine, the schedule used, the batch number and the date the next dose is due. Keep it with the passport: if ever bitten, it determines the post-exposure treatment needed."
                  />

                  <Checkbox
                    label="Three-dose course explained: come back for every dose"
                    checked={state.advice.threeDozeSchedule}
                    onChange={(v) => handleAdviceChange('threeDozeSchedule', v)}
                    description="A part course is not a course. The next dose has been booked at this appointment."
                  />

                  <Checkbox
                    label="Schedule intervals"
                    checked={state.advice.scheduleExplained}
                    onChange={(v) => handleAdviceChange('scheduleExplained', v)}
                    description="Conventional: day 0, 7 and 28 (third dose may be brought forward to day 21). Accelerated (18 and over, off-label): day 0, 3 and 7, plus a further dose at one year if travel to high risk areas continues."
                  />

                  <Checkbox
                    label="This does not make you immune to rabies"
                    checked={state.advice.pEPSimplification}
                    onChange={(v) => handleAdviceChange('pEPSimplification', v)}
                    description="If bitten, scratched or licked on broken skin by any mammal you still need urgent medical treatment. Pre-exposure vaccination buys time and removes the need for rabies immunoglobulin, which is often unavailable where the risk is highest."
                  />

                  <Checkbox
                    label="Wound cleaning"
                    checked={state.advice.woundCleaning}
                    onChange={(v) => handleAdviceChange('woundCleaning', v)}
                    description="Wash any bite or scratch immediately with soap under running water for several minutes, apply a suitable disinfectant, then seek medical help the same day, wherever you are. Avoid primary suture until post-exposure treatment has started."
                  />

                  <Checkbox
                    label="Post-exposure treatment still needed after any exposure"
                    checked={state.advice.stillNeedPEP}
                    onChange={(v) => handleAdviceChange('stillNeedPEP', v)}
                    description="A fully immunised person with a significant exposure still needs two doses of vaccine, on days 0 and 3 to 7. Seek urgent medical attention whatever your vaccination status and however long ago the exposure was."
                  />

                  <Checkbox
                    label="Exposure warning"
                    checked={state.advice.exposureWarning}
                    onChange={(v) => handleAdviceChange('exposureWarning', v)}
                    description="Any bite, scratch or lick on broken skin or mucous membranes from any warm blooded animal (including bats, monkeys and rodents as well as cats, dogs and foxes) needs same-day medical attention. A normal appearance and behaviour of the animal does not exclude rabies."
                  />

                  <Checkbox
                    label="Avoid contact with animals while away"
                    checked={state.advice.avoidAnimals}
                    onChange={(v) => handleAdviceChange('avoidAnimals', v)}
                    description="Including dogs, cats, monkeys and bats. Do not feed or handle them."
                  />

                  <Checkbox
                    label="Side effects and when to seek help"
                    checked={state.advice.returnIfConcerned}
                    onChange={(v) => handleAdviceChange('returnIfConcerned', v)}
                    description="Some soreness, headache, aching or mild fever in the first day or two is common and settles on its own. For a routine query about the vaccine or the schedule, contact the pharmacy. Report suspected adverse reactions via the Yellow Card scheme."
                  />

                  <Checkbox
                    label="Booster information"
                    checked={state.advice.boosterInformation}
                    onChange={(v) => handleAdviceChange('boosterInformation', v)}
                    description="Boosters are not routinely recommended for most travellers; a single booster may be considered after risk assessment if travelling again to an enzootic area more than a year after the course. Accelerated course: further dose at one year if travel to high risk areas continues. Frequent unrecognised exposure risk (bat handlers): reinforcing dose at one year then every 3 to 5 years or by serology. Laboratory staff: 6 monthly titres via occupational health. Where given with JE vaccine on the accelerated JE schedule, rabies antibody declines faster."
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 7 && (
            <>
              <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3 print:hidden">
                <p className="text-sm font-semibold text-gray-800">Administering professional (PGD records row: name and registration number)</p>
                <TextInput
                  label="Pharmacist name"
                  value={state.summary.pharmacistName}
                  onChange={(v) => handleSummaryChange('pharmacistName', v)}
                  required
                />
                <TextInput
                  label="GPhC registration number"
                  value={state.summary.pharmacistGPhC}
                  onChange={(v) => handleSummaryChange('pharmacistGPhC', v)}
                  required
                />
                <TextArea
                  label="Clinical notes (optional)"
                  value={state.summary.clinicalNotes}
                  onChange={(v) => handleSummaryChange('clinicalNotes', v)}
                />
              </div>
              <RabiesSummaryReport state={state} onPrint={handlePrint} />
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
              disabled={state.step === 0}
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
