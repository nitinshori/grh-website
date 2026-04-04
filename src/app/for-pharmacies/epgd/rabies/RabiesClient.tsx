'use client';

import React, { useState, useCallback } from 'react';
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
import {
  evaluateRabiesContraindications,
  hasHardStopContraindications,
  getObservationPeriodRecommendation,
  calculateNextDueDates,
} from './rabies-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
} from './rabies-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import RabiesSummaryReport from './components/RabiesSummaryReport';
import { calculateAge, initialPatientDetails, initialConsent, initialSummary } from '../shared/types';

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

  const handleDoseNumberChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, doseNumber: value as any },
    }));
  }, []);

  const handleScheduleChange = useCallback((value: string): void => {
    setState((prev) => {
      const nextDueDates = value
        ? calculateNextDueDates(new Date().toISOString().split('T')[0], value as any)
        : '';
      return {
        ...prev,
        administration: {
          ...prev.administration,
          schedule: value as any,
          nextDueDates,
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
      const { contraindications, alerts } = evaluateRabiesContraindications(
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

  const handlePrint = useCallback((): void => {
    window.print();
  }, []);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const stepAlerts = state.alerts.filter((alert: ClinicalAlert) => {
      if (alert.code === 'SEVERE_EGG_ALLERGY_RABIES') return state.step === 4;
      if (alert.code === 'MILD_EGG_ALLERGY_RABIES') return state.step === 4;
      if (alert.code === 'ACUTE_FEBRILE_ILLNESS_RABIES') return state.step === 3;
      if (alert.code === 'PREGNANCY_RABIES') return state.step === 4;
      if (alert.code === 'IMMUNOSUPPRESSED_RABIES') return state.step === 4;
      if (alert.code === 'LIMITED_PEP_ACCESS') return state.step === 2;
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
              <h2 className="text-2xl font-bold text-gray-900">Travel Assessment & Risk</h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Travel Details
                </h3>
                <div className="space-y-4">
                  <TextInput
                    label="Destination country/region"
                    value={state.screening.destinationCountry}
                    onChange={handleDestinationChange}
                    placeholder="e.g., Nepal, India, Philippines"
                  />
                  <TextInput
                    label="Departure date"
                    type="date"
                    value={state.screening.departureDate}
                    onChange={handleDepartureDateChange}
                  />
                </div>
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
                  label="Other activities or exposure risks"
                  value={state.screening.otherActivities}
                  onChange={handleOtherActivitiesChange}
                  placeholder="e.g., work in healthcare, research with animals..."
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Post-Exposure Prophylaxis Access
                </h3>
                <Checkbox
                  label="Good access to post-exposure prophylaxis (PEP)"
                  checked={state.screening.accessToPEP}
                  onChange={handleAccessToPEPChange}
                  description="Healthcare facilities with rabies immunoglobulin and vaccine available nearby"
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
                  label="Currently unwell"
                  checked={state.screening.currentIllness}
                  onChange={handleCurrentIllnessChange}
                  description="Is the patient experiencing acute illness symptoms?"
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
                    placeholder="e.g., HIV, chemotherapy, immunosuppressant medication..."
                  />
                )}

                <Checkbox
                  label="Pregnant"
                  checked={state.screening.pregnant}
                  onChange={handlePregnantChange}
                  description="Is the patient pregnant?"
                />

                <Checkbox
                  label="Egg allergy"
                  checked={state.screening.eggAllergy}
                  onChange={handleEggAllergyChange}
                  description="Does the patient have an egg allergy?"
                />
                {state.screening.eggAllergy && (
                  <SelectInput
                    label="Egg allergy severity"
                    value={state.screening.eggAllergySeverity}
                    onChange={handleEggAllergySeverityChange}
                    options={[
                      { value: 'mild', label: 'Mild (itching)' },
                      { value: 'severe', label: 'Severe (anaphylaxis risk)' },
                    ]}
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
                  <span className="text-gray-700">Severe egg allergy:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.severeEggAllergy
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.severeEggAllergy
                      ? 'CONTRAINDICATED'
                      : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Acute febrile illness:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.acuteFebrileIllness
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.acuteFebrileIllness
                      ? 'DEFER'
                      : 'OK'}
                  </span>
                </div>
              </div>

              {!canProceedFromStep() && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-900 font-semibold">
                    Vaccination is contraindicated. Do not proceed with vaccination.
                    Refer patient to GP or specialist.
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
                    Rabies Vaccine (Rabipur or RabAvert) - Inactivated
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Standard: Day 0, 7, 21-28 | Accelerated: Day 0, 3, 7 (+1yr booster)
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
                    { value: '3rd', label: '3rd dose' },
                  ]}
                />

                <SelectInput
                  label="Schedule"
                  value={state.administration.schedule}
                  onChange={handleScheduleChange}
                  options={[
                    { value: 'standard', label: 'Standard (Day 0, 7, 21-28)' },
                    { value: 'accelerated', label: 'Accelerated (Day 0, 3, 7 +1yr booster)' },
                  ]}
                />

                <TextInput
                  label="Next due dates"
                  value={state.administration.nextDueDates}
                  onChange={(v) => {
                    setState((prev) => ({
                      ...prev,
                      administration: { ...prev.administration, nextDueDates: v },
                    }));
                  }}
                  placeholder="Automatically calculated"
                  disabled
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
                      { value: '30-min', label: '30 minutes' },
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
                    label="Three-dose schedule explained"
                    checked={state.advice.threeDozeSchedule}
                    onChange={(v) => handleAdviceChange('threeDozeSchedule', v)}
                    description="Patient understands 3-dose pre-exposure schedule"
                  />

                  <Checkbox
                    label="Schedule intervals"
                    checked={state.advice.scheduleExplained}
                    onChange={(v) => handleAdviceChange('scheduleExplained', v)}
                    description="Standard (Day 0,7,21-28) or Accelerated (Day 0,3,7 +1yr booster)"
                  />

                  <Checkbox
                    label="PEP simplification"
                    checked={state.advice.pEPSimplification}
                    onChange={(v) => handleAdviceChange('pEPSimplification', v)}
                    description="Pre-exposure vaccination simplifies post-exposure response to 2 booster doses instead of full course"
                  />

                  <Checkbox
                    label="Wound cleaning critical"
                    checked={state.advice.woundCleaning}
                    onChange={(v) => handleAdviceChange('woundCleaning', v)}
                    description="Thorough wound cleaning with soap/water or antiseptic is essential after any bite/scratch"
                  />

                  <Checkbox
                    label="Still need PEP after exposure"
                    checked={state.advice.stillNeedPEP}
                    onChange={(v) => handleAdviceChange('stillNeedPEP', v)}
                    description="Even with pre-exposure vaccination, post-exposure prophylaxis is still required after exposure"
                  />

                  <Checkbox
                    label="Exposure warning signs"
                    checked={state.advice.exposureWarning}
                    onChange={(v) => handleAdviceChange('exposureWarning', v)}
                    description="Any bite, scratch, or mucous membrane exposure requires urgent medical attention"
                  />

                  <Checkbox
                    label="When to seek help"
                    checked={state.advice.returnIfConcerned}
                    onChange={(v) => handleAdviceChange('returnIfConcerned', v)}
                    description="Return to pharmacy/GP if concerned, or seek emergency care after exposure"
                  />

                  <Checkbox
                    label="Booster information"
                    checked={state.advice.boosterInformation}
                    onChange={(v) => handleAdviceChange('boosterInformation', v)}
                    description="If accelerated schedule, booster at 1 year if continued risk. Serological testing available."
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 7 && (
            <RabiesSummaryReport state={state} onPrint={handlePrint} />
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
