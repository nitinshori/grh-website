'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  getObservationPeriodRecommendation,
  calculateNextDoseDate,
} from './japanese-encephalitis-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
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
    patient: initialPatient || initialPatientDetails,
    consent: initialConsent,
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
    setState((prev) => {
      const nextDueDate = value
        ? calculateNextDoseDate(new Date().toISOString().split('T')[0], value as any)
        : '';
      return {
        ...prev,
        administration: {
          ...prev.administration,
          schedule: value as any,
          nextDueDate,
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
        const result = validateConsent(state.consent);
        errors.push(...result.errors);
        break;
      }
      case 2: {
        const result = validateScreening(state.screening);
        errors.push(...result.errors);
        break;
      }
      case 3: {
        // Medical history validation included in screening
        break;
      }
      case 4: {
        const result = validateContraindications(state.contraindications);
        errors.push(...result.errors);
        break;
      }
      case 5: {
        const result = validateAdministration(state.administration);
        errors.push(...result.errors);
        break;
      }
      case 6: {
        const result = validateAdvice(state.advice);
        errors.push(...result.errors);
        break;
      }
      case 7: {
        // Summary can be skipped
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
  }, [state, validationErrors]);

  const handleNextStep = useCallback((): void => {
    if (!validateStep(state.step)) {
      return;
    }

    // On step 2 (Travel Assessment), evaluate contraindications
    if (state.step === 2) {
      const { contraindications, alerts } = evaluateJapaneseEncephalitisContraindications(
        state.screening,
        patientAge || 0
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
  const { markComplete, saveRecord } = useConsultationTracking('japanese-encephalitis', state.step);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const getConsultationData = useCallback((): ConsultationRecordData => {
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
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: hasHardStopContraindications(state.contraindications) ? 'not_supplied' : 'completed',
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state]);

  const handlePrint = useCallback(async (): Promise<void> => {
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    window.print();
  }, [markComplete, saveRecord, getConsultationData]);

  const handleNewConsultation = useCallback((): void => {
    if (!window.confirm('Start a new consultation? The current consultation data will be cleared.')) return;
    setState({
      patient: initialPatient || initialPatientDetails,
      consent: initialConsent,
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
  }, []);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const stepAlerts = state.alerts.filter((alert: ClinicalAlert) => {
      if (alert.code === 'SEVERE_FEBRILE_ILLNESS_JE') return state.step === 3;
      if (alert.code === 'PREGNANCY_JE') return state.step === 4;
      if (alert.code === 'IMMUNOSUPPRESSED_JE') return state.step === 4;
      if (alert.code === 'MONSOON_SEASON_JE') return state.step === 2;
      if (alert.code === 'OUTDOOR_ACTIVITIES_JE') return state.step === 2;
      if (alert.code === 'CONTINUED_RISK_JE') return state.step === 2;
      return false;
    });

    if (stepAlerts.length === 0) return null;

    return <AlertBanner alerts={stepAlerts} />;
  }, [state.alerts, state.step]);

  const canProceedFromStep = useCallback((): boolean => {
    if (state.step === 4 && hasHardStopContraindications(state.contraindications)) {
      return false;
    }
    return true;
  }, [state.step, state.contraindications]);

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
                  label="Body temperature (°C)"
                  value={state.screening.temperature}
                  onChange={handleTemperatureChange}
                  placeholder="36.5"
                />

                <Checkbox
                  label="Currently unwell or severely febrile"
                  checked={state.screening.severeFebrileIllness}
                  onChange={handleSevereFebrileChange}
                  description="Has patient got fever (>38.5°C) or severe illness?"
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
                  description="Condition or medication affecting immunity?"
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
                  description="Is the patient pregnant?"
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
                  <span className="text-gray-700">Severe febrile illness:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.severeFebrileIllness
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.severeFebrileIllness
                      ? 'DEFER'
                      : 'OK'}
                  </span>
                </div>
              </div>

              {!canProceedFromStep() && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-900 font-semibold">
                    Vaccination is contraindicated. Do not proceed.
                    Refer patient to GP as needed.
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
                    Ixiaro (Japanese Encephalitis Inactivated Vaccine)
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Schedule: 2 doses, Day 0 and Day 28 (or Day 7 for accelerated)
                  </p>
                </div>

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
                  label="Dose number"
                  value={state.administration.doseNumber}
                  onChange={handleDoseNumberChange}
                  options={[
                    { value: '1st', label: '1st dose' },
                    { value: '2nd', label: '2nd dose' },
                    { value: 'booster', label: 'Booster' },
                  ]}
                />

                <SelectInput
                  label="Schedule"
                  value={state.administration.schedule}
                  onChange={handleScheduleChange}
                  options={[
                    { value: 'standard', label: 'Standard (Day 0, 28)' },
                    { value: 'accelerated', label: 'Accelerated (Day 0, 7)' },
                  ]}
                />

                <TextInput
                  label="Next dose due date"
                  type="date"
                  value={state.administration.nextDueDate}
                  onChange={handleNextDueDateChange}
                />

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
                      { value: '30-min', label: '30 minutes (standard for first dose)' },
                    ]}
                  />

                  <Checkbox
                    label="Anaphylaxis kit checked"
                    checked={state.postVaccineObs.anaphylaxisKitChecked}
                    onChange={handleAnaphylaxisKitChange}
                    description="Confirm anaphylaxis emergency kit is available"
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
                    label="Two-dose schedule explained"
                    checked={state.advice.twoDozeSchedule}
                    onChange={(v) => handleAdviceChange('twoDozeSchedule', v)}
                    description="Patient understands need for 2 doses"
                  />

                  <Checkbox
                    label="Schedule intervals"
                    checked={state.advice.scheduleExplained}
                    onChange={(v) => handleAdviceChange('scheduleExplained', v)}
                    description="Standard (Day 0, 28) or Accelerated (Day 0, 7)"
                  />

                  <Checkbox
                    label="Common side effects"
                    checked={state.advice.commonReactions}
                    onChange={(v) => handleAdviceChange('commonReactions', v)}
                    description="Headache, myalgia, fatigue, injection site reactions (1-2 days)"
                  />

                  <Checkbox
                    label="Serious side effects"
                    checked={state.advice.seriousReactions}
                    onChange={(v) => handleAdviceChange('seriousReactions', v)}
                    description="Anaphylaxis: difficulty breathing, face/throat swelling"
                  />

                  <Checkbox
                    label="Mosquito bite prevention"
                    checked={state.advice.mosquitoBitePrevention}
                    onChange={(v) => handleAdviceChange('mosquitoBitePrevention', v)}
                    description="Use insect repellent (DEET), wear protective clothing"
                  />

                  <Checkbox
                    label="Dusk/dawn biting mosquitoes"
                    checked={state.advice.duskDawnBiting}
                    onChange={(v) => handleAdviceChange('duskDawnBiting', v)}
                    description="Japanese encephalitis mosquitoes bite mainly at dusk and dawn - avoid outdoor exposure during these times"
                  />

                  <Checkbox
                    label="Booster information"
                    checked={state.advice.boosterInformation}
                    onChange={(v) => handleAdviceChange('boosterInformation', v)}
                    description="Booster at 12-24 months if continued risk exposure"
                  />

                  <Checkbox
                    label="When to seek help"
                    checked={state.advice.returnIfConcerned}
                    onChange={(v) => handleAdviceChange('returnIfConcerned', v)}
                    description="Return to pharmacy/GP if concerned, or call NHS 111"
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 7 && (
            <>
              <JapaneseEncephalitisSummaryReport state={state} onPrint={handlePrint} />
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
