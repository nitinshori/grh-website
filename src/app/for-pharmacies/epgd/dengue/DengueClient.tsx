'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Mounted directly: this tool does not use the shared StepWrapper,
// which is where the other fifteen vaccination tools pick this up. Unlike
// the StepWrapper tools it used not to block Next on the adrenaline
// confirmation; it does now (vaccineSafetySatisfied in handleNextStep).
import {
  VaccineSafetyChecks,
  vaccineSafetySatisfied,
  getVaccineSafety,
  clearVaccineSafety,
} from "../shared/components/VaccineSafetyChecks";
import {
  DengueConsultationState,
  DengueScreening,
  DengueAdvice,
  initialDengueScreening,
  initialDengueVaccineAdministration,
  initialDenguePostVaccineObs,
  initialDengueAdvice,
} from './dengue-types';
import { ClinicalAlert, BasePatientDetails, BaseSummary } from '../shared/types';
import {
  evaluateDengueContraindications,
  hasHardStopContraindications,
  getObservationPeriodRecommendation,
  calculateNextDoseDate,
  todayIso,
  DENGUE_PGD_VERSION,
  FEVER_THRESHOLD_C,
} from './dengue-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateTravel,
  validateMedicalHistory,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
  validateSummary,
} from './dengue-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import Link from 'next/link';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import DengueSummaryReport from './components/DengueSummaryReport';
import { calculateAge, initialPatientDetails, initialConsent, initialSummary } from '../shared/types';
import { useConsultationTracking, type ConsultationRecordData } from '../shared/hooks/useConsultationTracking';

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

interface DengueClientProps {
  initialPatient?: BasePatientDetails;
}

export default function DengueClient({
  initialPatient,
}: DengueClientProps): React.ReactNode {
  const [state, setState] = useState<DengueConsultationState>({
    patient: initialPatient ? { ...initialPatient } : { ...initialPatientDetails },
    consent: { ...initialConsent },
    screening: initialDengueScreening(),
    administration: initialDengueVaccineAdministration(),
    postVaccineObs: initialDenguePostVaccineObs(),
    advice: initialDengueAdvice(),
    summary: initialSummary(),
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

  // Contraindications and alerts are derived from the current answers, so a
  // stop raised by going back and ticking an exclusion is enforced at once
  // on every later step (they used to be evaluated only on leaving steps 2
  // and 3 and enforced only on step 4).
  const evaluation = useMemo(
    () => evaluateDengueContraindications(state.screening, patientAge ?? 0),
    [state.screening, patientAge]
  );
  const hasStops = hasHardStopContraindications(evaluation.contraindications);

  // Patient Details handlers
  const handlePatientChange = useCallback(
    (field: keyof BasePatientDetails, value: any): void => {
      setState((prev) => ({
        ...prev,
        patient: {
          ...prev.patient,
          [field]: value,
          // Age is computed on every DOB change; it used never to be set.
          ...(field === 'dateOfBirth' ? { age: calculateAge(value as string) } : {}),
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

  // Screening/Travel Assessment handlers
  const handleDestinationChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, destinationCountry: value },
    }));
  }, []);

  const handleEndemicAreaChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, endemicArea: value },
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

  const handlePreviousDengueChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: {
        ...prev.screening,
        previousDengueInfection: value,
        dengueInfectionDetails: value ? prev.screening.dengueInfectionDetails : '',
      },
    }));
  }, []);

  const handleDengueDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, dengueInfectionDetails: value },
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

  const handleBreastfeedingChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, breastfeeding: value },
    }));
  }, []);

  const handleTemperatureChange = useCallback((value: number | null): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, temperature: value },
    }));
  }, []);

  // Generic screening flag handler (PGD v006 inclusion / exclusion checkboxes)
  const handleScreeningFlagChange = useCallback(
    (field: keyof DengueScreening, value: boolean): void => {
      setState((prev) => ({
        ...prev,
        screening: { ...prev.screening, [field]: value },
      }));
    },
    []
  );

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
      administration: {
        ...prev.administration,
        doseNumber: value as any,
        nextDueDate: value === '1st' ? calculateNextDoseDate(todayIso()) : '',
        firstDoseDate: value === '2nd' ? prev.administration.firstDoseDate : '',
      },
    }));
  }, []);

  const handleFirstDoseDateChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, firstDoseDate: value },
    }));
  }, []);

  const handleAdrenalineConfirmedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, adrenalineConfirmed: value },
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

  const handleNextDueDateChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, nextDueDate: value },
    }));
  }, []);

  // Post-vaccine observation handlers
  const handleObservationPeriodChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, observationPeriod: value as any },
    }));
  }, []);

  const handleObservationCompletedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      postVaccineObs: { ...prev.postVaccineObs, observationCompleted: value },
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

  // Advice handlers
  const handleAdviceChange = useCallback(
    (field: keyof DengueAdvice, value: boolean): void => {
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

  // Validation: pure per-step check, used by Next and by the pre-save sweep.
  const errorsForStep = useCallback((stepNum: number): string[] => {
    const errors: string[] = [];

    switch (stepNum) {
      case 0: {
        errors.push(...validatePatientDetails(state.patient).errors);
        break;
      }
      case 1: {
        errors.push(...validateConsent(state.consent).errors);
        break;
      }
      case 2: {
        errors.push(...validateTravel(state.screening).errors);
        break;
      }
      case 3: {
        errors.push(...validateMedicalHistory(state.screening).errors);
        break;
      }
      case 4: {
        errors.push(...validateContraindications(evaluation.contraindications).errors);
        break;
      }
      case 5: {
        errors.push(...validateAdministration(state.administration).errors);
        break;
      }
      case 6: {
        errors.push(...validatePostVaccineObs(state.postVaccineObs).errors);
        errors.push(...validateAdvice(state.advice).errors);
        break;
      }
      case 7: {
        errors.push(...validateSummary(state.summary).errors);
        break;
      }
    }

    // A stop anywhere blocks every step from the one it is raised on.
    if (hasStops && stepNum >= 3) {
      errors.push('Exclusion criteria met: vaccination is contraindicated under this PGD. Record the advice given and save as not vaccinated.');
    }
    // Adrenaline confirmation on the shared safety panel locks Next on every
    // step, as it does on the StepWrapper tools.
    if (!vaccineSafetySatisfied('dengue')) {
      errors.push('Confirm on the pre-vaccination safety panel that adrenaline 1 in 1,000 is immediately available');
    }
    return errors;
  }, [state, evaluation, hasStops]);

  const validateStep = useCallback((stepNum: number): boolean => {
    const errors = errorsForStep(stepNum);
    if (errors.length > 0) {
      setValidationErrors((prev) => new Map(prev).set(stepNum, errors));
      return false;
    }
    setValidationErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(stepNum);
      return newErrors;
    });
    return true;
  }, [errorsForStep]);

  const handleNextStep = useCallback((): void => {
    if (!validateStep(state.step)) {
      return;
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
  }, [state, validateStep]);

  // Backwards only; going forward always means pressing Next.
  const handleStepClick = useCallback((step: number): void => {
    if (step < state.step) {
      setState((prev) => ({ ...prev, step }));
    }
  }, [state.step]);

  const handlePreviousStep = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 0),
    }));
  }, []);

  // ─── Consultation tracking + record saving ───
  const { markComplete, saveRecord, reset } = useConsultationTracking('dengue', state.step);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  const getConsultationData = useCallback((): ConsultationRecordData => {
    const vaccinated = !hasStops && !!state.administration.batchNumber.trim();
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
      clinicalData: {
        ...(state as unknown as Record<string, unknown>),
        contraindications: evaluation.contraindications,
        alerts: evaluation.alerts,
        vaccineSafetyChecks: getVaccineSafety('dengue'),
        pgdVersion: DENGUE_PGD_VERSION,
      },
      outcome: hasStops ? 'not_supplied' : 'completed',
      medicine: vaccinated
        ? {
            name: 'Qdenga (TAK-003) dengue vaccine',
            dose: '0.5 mL subcutaneous',
            duration: state.administration.doseNumber === '2nd' ? 'Dose 2 of 2' : 'Dose 1 of 2 (dose 2 due in 3 months)',
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
  }, [state, hasStops, evaluation, __pharmProfile]);

  // Save & Print re-runs every step's validation first. The summary used to
  // save and print whatever was on screen.
  const handlePrint = useCallback(async (): Promise<void> => {
    const all: string[] = [];
    const names = STEP_LABELS;
    for (let i = 0; i < STEP_LABELS.length; i++) {
      const errs = errorsForStep(i);
      all.push(...errs.map((e) => `${names[i]}: ${e}`));
    }
    if (all.length > 0) {
      setSaveErrors(Array.from(new Set(all)));
      return;
    }
    setSaveErrors([]);
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    window.print();
  }, [markComplete, saveRecord, getConsultationData, errorsForStep]);

  // An excluded patient is saved as "not vaccinated" from any step; the
  // document requires the advice given to an excluded patient to be recorded.
  const handleSaveNotVaccinated = useCallback(async (): Promise<void> => {
    setSaveStatus('saving');
    const data = getConsultationData();
    data.outcome = 'not_supplied';
    (data.clinicalData as Record<string, unknown>).stoppedAtStep = state.step;
    (data.clinicalData as Record<string, unknown>).stopReason = evaluation.alerts
      .filter((a) => a.severity === 'stop')
      .map((a) => a.message)
      .join('; ');
    const success = await saveRecord(data);
    setSaveStatus(success ? 'saved' : 'error');
  }, [getConsultationData, saveRecord, state.step, evaluation]);

  const handleNewConsultation = useCallback((): void => {
    if (!window.confirm('Start a new consultation? The current consultation data will be cleared.')) return;
    // Fresh objects every time; never reuse the module-level defaults.
    setState({
      patient: { ...initialPatientDetails },
      consent: { ...initialConsent },
      screening: initialDengueScreening(),
      administration: initialDengueVaccineAdministration(),
      postVaccineObs: initialDenguePostVaccineObs(),
      advice: initialDengueAdvice(),
      summary: initialSummary(),
      step: 0,
    });
    setCompletedSteps(new Set());
    setValidationErrors(new Map());
    setSaveErrors([]);
    setSaveStatus('idle');
    reset();
    clearVaccineSafety('dengue');
  }, [reset]);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const travelCodes = ['PREVIOUS_DENGUE_INFECTION', 'ENDEMIC_AREA_TRAVEL'];
    const stepAlerts = evaluation.alerts.filter((alert: ClinicalAlert) => {
      if (alert.severity === 'stop') return state.step >= 3;
      if (travelCodes.includes(alert.code)) return state.step === 2 || state.step === 4;
      return state.step >= 3;
    });

    if (stepAlerts.length === 0) return null;

    return <AlertBanner alerts={stepAlerts} />;
  }, [evaluation.alerts, state.step]);

  const canProceedFromStep = useCallback((): boolean => {
    if (hasStops && state.step >= 3) {
      return false;
    }
    return true;
  }, [state.step, hasStops]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <VaccineSafetyChecks slug="dengue" />
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
        <div className="print:hidden">
          <ProgressBar
            currentStep={state.step}
            stepLabels={STEP_LABELS}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
            hasErrors={validationErrors.has(state.step)}
          />
        </div>

        <div className="bg-white rounded-lg shadow mt-8 p-8">
          {validationErrors.has(state.step) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg print:hidden">
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

          <div className="print:hidden">{getStepAlerts()}</div>

          {state.step === 0 && (
            <PatientDetailsStep
              patient={state.patient}
              onChange={handlePatientChange}
              requireAdult={false}
          />
          )}

          {state.step === 1 && (
            <ConsentStep
              consent={state.consent}
              onChange={handleConsentChange}
            />
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
                    label="Destination country"
                    value={state.screening.destinationCountry}
                    onChange={handleDestinationChange}
                    placeholder="e.g., Thailand, Brazil, India"
                  />
                  <Checkbox
                    label="Travel to or residence in a dengue-endemic area"
                    checked={state.screening.endemicArea}
                    onChange={handleEndemicAreaChange}
                    description="PGD inclusion criterion. Check current NaTHNaC / TravelHealthPro country information."
                    required
                  />
                  <TextInput
                    label="Departure date"
                    type="date"
                    value={state.screening.departureDate}
                    onChange={handleDepartureDateChange}
                  />
                  <TextInput
                    label="Travel duration"
                    value={state.screening.travelDuration}
                    onChange={handleTravelDurationChange}
                    placeholder="e.g., 2 weeks, 1 month"
                  />
                  <Checkbox
                    label="Willing to receive two doses, 3 months apart"
                    checked={state.screening.willingTwoDoses}
                    onChange={(v) => handleScreeningFlagChange('willingTwoDoses', v)}
                    description="PGD inclusion criterion. First dose at least 3 months before travel when possible."
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Dengue History
                </h3>
                <Checkbox
                  label="Previous dengue infection"
                  checked={state.screening.previousDengueInfection}
                  onChange={handlePreviousDengueChange}
                  description="Has patient previously had dengue fever?"
                />
                {state.screening.previousDengueInfection && (
                  <TextArea
                    label="Describe previous infection"
                    value={state.screening.dengueInfectionDetails}
                    onChange={handleDengueDetailsChange}
                    placeholder="e.g., Year, severity, serotype if known..."
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
                  min={30}
                  max={45}
                  unit="°C"
                  required
                />
                <p className="text-xs text-gray-600">
                  Decimals are accepted. The tool treats {FEVER_THRESHOLD_C.toFixed(1)} °C or above as an acute fever
                  (exclusion: defer until recovered). The document says &quot;acute fever&quot; without a figure.
                </p>

                <Checkbox
                  label="Acute fever or significant intercurrent illness"
                  checked={state.screening.currentIllness}
                  onChange={handleCurrentIllnessChange}
                  description="Exclusion: defer vaccination until recovered."
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
                  label="Immune deficiency of any cause"
                  checked={state.screening.immunosuppressed}
                  onChange={handleImmunosuppressedChange}
                  description="Exclusion (live vaccine): any congenital or acquired immune deficiency, including chemotherapy or other immunosuppressive therapy, systemic corticosteroids at 20 mg/day prednisolone (or 2 mg/kg/day) or more for 2 weeks or longer within the previous 4 weeks, active malignancy, symptomatic HIV, or asymptomatic HIV with impaired immune function."
                />
                {state.screening.immunosuppressed && (
                  <TextArea
                    label="Details of immunosuppression"
                    value={state.screening.immunosuppressedDetails}
                    onChange={handleImmunosuppressedDetailsChange}
                    placeholder="e.g., HIV (with CD4 count), chemotherapy, immunosuppressant medication..."
                  />
                )}

                <Checkbox
                  label="Pregnant"
                  checked={state.screening.pregnant}
                  onChange={handlePregnantChange}
                  description="Exclusion."
                />

                <Checkbox
                  label="Breastfeeding"
                  checked={state.screening.breastfeeding}
                  onChange={handleBreastfeedingChange}
                  description="Exclusion."
                />

                <Checkbox
                  label="Known hypersensitivity to any component of the vaccine"
                  checked={state.screening.vaccineComponentAllergy}
                  onChange={(v) => handleScreeningFlagChange('vaccineComponentAllergy', v)}
                  description="Exclusion. Check the Qdenga SmPC excipient list."
                />

                <Checkbox
                  label="Another live vaccine given or planned within 4 weeks before or after this dose"
                  checked={state.screening.liveVaccineWithin4Weeks}
                  onChange={(v) => handleScreeningFlagChange('liveVaccineWithin4Weeks', v)}
                  description="Exclusion. Live vaccines are given on the same day or separated by at least 4 weeks."
                />

                <Checkbox
                  label="History of Guillain-Barre syndrome following prior dengue vaccination"
                  checked={state.screening.gbsAfterDengueVaccine}
                  onChange={(v) => handleScreeningFlagChange('gbsAfterDengueVaccine', v)}
                  description="Exclusion."
                />

                <Checkbox
                  label="Anticoagulant therapy"
                  checked={state.screening.anticoagulantTherapy}
                  onChange={(v) => handleScreeningFlagChange('anticoagulantTherapy', v)}
                  description="Caution: assess bleeding risk."
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
                  <span className="text-gray-700">Age appropriate (18 years and over):</span>
                  <span
                    className={`font-semibold ${
                      evaluation.contraindications.ageAppropriate
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {evaluation.contraindications.ageAppropriate ? 'OK' : 'NOT OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pregnancy:</span>
                  <span
                    className={`font-semibold ${
                      evaluation.contraindications.pregnancy
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {evaluation.contraindications.pregnancy
                      ? 'CONTRAINDICATED'
                      : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Acute fever or significant intercurrent illness:</span>
                  <span
                    className={`font-semibold ${
                      evaluation.contraindications.acuteFebrileIllness
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {evaluation.contraindications.acuteFebrileIllness
                      ? 'CONTRAINDICATED'
                      : 'OK'}
                  </span>
                </div>
                {([
                  ['Breastfeeding', evaluation.contraindications.breastfeeding],
                  ['Immune deficiency of any cause', evaluation.contraindications.immunosuppressed],
                  ['Hypersensitivity to a vaccine component', evaluation.contraindications.severeAllergy],
                  ['Other live vaccine within 4 weeks', evaluation.contraindications.liveVaccineInterval],
                  ['Guillain-Barre syndrome after prior dengue vaccination', evaluation.contraindications.gbsHistory],
                ] as [string, boolean][]).map(([label, flagged]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-700">{label}:</span>
                    <span className={`font-semibold ${flagged ? 'text-red-600' : 'text-green-600'}`}>
                      {flagged ? 'CONTRAINDICATED' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>

              {!canProceedFromStep() && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-900 font-semibold">
                    Vaccination is contraindicated. Do not proceed with vaccination.
                    Refer patient to GP or specialist as needed.
                  </p>
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
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold">
                    Qdenga (TAK-003) - Live Attenuated Dengue Vaccine
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    {DENGUE_PGD_VERSION}. Powder and solvent for solution for injection: reconstitute the vial with the 0.5 mL solvent in the pre-filled syringe immediately before use (use within 30 minutes at room temperature).
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Dose: 0.5 mL subcutaneously, preferably in the deltoid area of the upper arm. Schedule: 2 doses, 3 months apart.
                  </p>
                </div>

                <Checkbox
                  label="Adrenaline 1 in 1,000 immediately available, checked BEFORE vaccinating"
                  checked={state.administration.adrenalineConfirmed}
                  onChange={handleAdrenalineConfirmedChange}
                  description="In date, in the room where vaccination takes place, with a telephone and a written anaphylaxis protocol. The document requires this to be in place before the vaccine is given."
                  required
                />

                <TextInput
                  label="Batch number"
                  value={state.administration.batchNumber}
                  onChange={handleBatchChange}
                  placeholder="e.g., ABC123456"
                  required
                />

                <TextInput
                  label="Expiry date"
                  type="date"
                  value={state.administration.expiryDate}
                  onChange={handleExpiryChange}
                />

                <SelectInput
                  label="Injection site (subcutaneous; deltoid preferred)"
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
                  label="Dose number"
                  value={state.administration.doseNumber}
                  onChange={handleDoseNumberChange}
                  options={[
                    { value: '1st', label: '1st dose' },
                    { value: '2nd', label: '2nd dose' },
                  ]}
                />

                {state.administration.doseNumber === '1st' && (
                  <TextInput
                    label="Next dose due date (3 months later)"
                    type="date"
                    value={state.administration.nextDueDate}
                    onChange={handleNextDueDateChange}
                  />
                )}

                {state.administration.doseNumber === '2nd' && (
                  <div>
                    <TextInput
                      label="Date of the first dose"
                      type="date"
                      value={state.administration.firstDoseDate}
                      onChange={handleFirstDoseDateChange}
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      The schedule is a second dose 3 months after the first. The tool refuses a second dose before
                      that interval has elapsed. Check the first dose against the patient&apos;s record.
                    </p>
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
                      { value: '15-min', label: '15 minutes' },
                      { value: '30-min', label: '30 minutes' },
                    ]}
                  />

                  <Checkbox
                    label="Observation period completed, seated"
                    checked={state.postVaccineObs.observationCompleted}
                    onChange={handleObservationCompletedChange}
                    description="Every patient is observed for 15 minutes after vaccination, seated. Record that it was completed."
                    required
                  />

                  <Checkbox
                    label="Patient is well after vaccination"
                    checked={state.postVaccineObs.patientWell}
                    onChange={handlePatientWellChange}
                    description="Patient is comfortable and has no symptoms"
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
                    label="Two-dose schedule explained"
                    checked={state.advice.twoDozeSchedule}
                    onChange={(v) => handleAdviceChange('twoDozeSchedule', v)}
                    description="Second dose in 3 months; attend for the appointment. Keep the PIL supplied with Qdenga."
                  />

                  <Checkbox
                    label="Common side effects"
                    checked={state.advice.commonReactions}
                    onChange={(v) => handleAdviceChange('commonReactions', v)}
                    description="Very common: injection site pain, headache, myalgia. Common: malaise, fatigue, fever (usually within 7 days). Seek medical advice if fever develops or persists beyond 7 days."
                  />

                  <Checkbox
                    label="Serious side effects"
                    checked={state.advice.seriousReactions}
                    onChange={(v) => handleAdviceChange('seriousReactions', v)}
                    description="Seek immediate medical attention for rash, difficulty breathing or signs of anaphylaxis. Report unusual or severe symptoms to a healthcare provider or via Yellow Card."
                  />

                  <Checkbox
                    label="Mosquito bite prevention"
                    checked={state.advice.mosquitoPrevention}
                    onChange={(v) => handleAdviceChange('mosquitoPrevention', v)}
                    description="Continue mosquito bite prevention (insect repellent, protective clothing, screened or air-conditioned accommodation) even after vaccination"
                  />

                  <Checkbox
                    label="Dengue symptom warning signs"
                    checked={state.advice.dengueSymptomsWarning}
                    onChange={(v) => handleAdviceChange('dengueSymptomsWarning', v)}
                    description="If signs of dengue fever (fever, headache, rash, joint pain) develop whilst travelling, seek medical attention promptly"
                  />

                  <Checkbox
                    label="No other live vaccines for 4 weeks"
                    checked={state.advice.noOtherLiveVaccines}
                    onChange={(v) => handleAdviceChange('noOtherLiveVaccines', v)}
                    description="Other live vaccines are given on the same day or separated by at least 4 weeks"
                  />

                  <Checkbox
                    label="When to seek help"
                    checked={state.advice.returnIfConcerned}
                    onChange={(v) => handleAdviceChange('returnIfConcerned', v)}
                    description="Return to pharmacy/GP if concerned, or call NHS 111"
                  />

                  <Checkbox
                    label="Avoid pregnancy for at least 4 weeks after each dose"
                    checked={state.advice.avoidPregnancy4Weeks}
                    onChange={(v) => handleAdviceChange('avoidPregnancy4Weeks', v)}
                    description="If of childbearing potential"
                  />

                  <Checkbox
                    label="Keep a record of vaccination dates"
                    checked={state.advice.keepVaccinationRecord}
                    onChange={(v) => handleAdviceChange('keepVaccinationRecord', v)}
                    description="Bring documentation when travelling"
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 7 && (
            <>
              <div className="space-y-4 mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>
                <TextArea
                  label="Clinical notes"
                  value={state.summary.clinicalNotes}
                  onChange={(v) => handleSummaryChange('clinicalNotes', v)}
                  placeholder="Any additional clinical notes or observations..."
                />
              </div>
              {saveErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg print:hidden">
                  <p className="text-sm font-semibold text-red-900 mb-2">
                    The record cannot be saved until these are fixed:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {saveErrors.map((error) => (
                      <li key={error} className="text-sm text-red-800">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <DengueSummaryReport state={state} alerts={evaluation.alerts} onPrint={handlePrint} />
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

          {hasStops && state.step >= 3 && state.step < STEP_LABELS.length - 1 && saveStatus !== 'idle' && (
            <div className={`mt-6 px-4 py-3 rounded-lg print:hidden ${
              saveStatus === 'saving' ? 'bg-blue-50 border border-blue-200' :
              saveStatus === 'saved' ? 'bg-green-50 border border-green-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <p className="text-sm">
                {saveStatus === 'saving' && 'Saving consultation record...'}
                {saveStatus === 'saved' && 'Consultation saved as not vaccinated. You can access it from Patient Records on your dashboard.'}
                {saveStatus === 'error' && 'Could not save consultation record.'}
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200 print:hidden">
            <button
              onClick={handlePreviousStep}
              disabled={state.step === 0}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <div className="flex items-center gap-3">
              {hasStops && state.step >= 3 && (
                <span className="text-xs text-red-600 font-medium">Cannot proceed: exclusion criteria met</span>
              )}
              {hasStops && state.step >= 3 && saveStatus !== 'saved' && (
                <button
                  onClick={handleSaveNotVaccinated}
                  disabled={saveStatus === 'saving'}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-50 transition"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save as not vaccinated'}
                </button>
              )}
              {hasStops && state.step >= 3 && saveStatus === 'saved' && (
                <button
                  onClick={handleNewConsultation}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[color:var(--tenant-primary)] border border-[color:var(--tenant-primary)]/30 hover:bg-[color:var(--tenant-primary)]/10 transition"
                >
                  New Consultation
                </button>
              )}
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
    </div>
  );
}
