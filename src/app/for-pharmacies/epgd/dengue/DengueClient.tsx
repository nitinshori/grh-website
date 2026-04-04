'use client';

import React, { useState, useCallback } from 'react';
import {
  DengueConsultationState,
  DengueScreening,
  DengueContraindications,
  DengueVaccineAdministration,
  DenguePostVaccineObs,
  DengueAdvice,
  initialDengueScreening,
  initialDengueContraindications,
  initialDengueVaccineAdministration,
  initialDenguePostVaccineObs,
  initialDengueAdvice,
} from './dengue-types';
import { ClinicalAlert, BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import {
  evaluateDengueContraindications,
  hasHardStopContraindications,
  getObservationPeriodRecommendation,
  calculateNextDoseDate,
} from './dengue-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
} from './dengue-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import DengueSummaryReport from './components/DengueSummaryReport';
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

interface DengueClientProps {
  initialPatient?: BasePatientDetails;
}

export default function DengueClient({
  initialPatient,
}: DengueClientProps): React.ReactNode {
  const [state, setState] = useState<DengueConsultationState>({
    patient: initialPatient || initialPatientDetails,
    consent: initialConsent,
    screening: initialDengueScreening(),
    contraindications: initialDengueContraindications(),
    administration: initialDengueVaccineAdministration(),
    postVaccineObs: initialDenguePostVaccineObs(),
    advice: initialDengueAdvice(),
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
        nextDueDate: value === '1st' ? calculateNextDoseDate(new Date().toISOString().split('T')[0]) : '',
      },
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
      const { contraindications, alerts } = evaluateDengueContraindications(
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
      if (alert.code === 'PREGNANCY_DENGUE') return state.step === 4;
      if (alert.code === 'BREASTFEEDING_DENGUE') return state.step === 4;
      if (alert.code === 'ACUTE_FEBRILE_ILLNESS_DENGUE') return state.step === 3;
      if (alert.code === 'IMMUNOSUPPRESSED_DENGUE') return state.step === 4;
      if (alert.code === 'PREVIOUS_DENGUE_INFECTION') return state.step === 2;
      if (alert.code === 'ENDEMIC_AREA_TRAVEL') return state.step === 2;
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
                    label="Endemic dengue area"
                    checked={state.screening.endemicArea}
                    onChange={handleEndemicAreaChange}
                    description="Travel to dengue endemic region (tropical areas)"
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
                />

                <Checkbox
                  label="Currently unwell"
                  checked={state.screening.currentIllness}
                  onChange={handleCurrentIllnessChange}
                  description="Is the patient currently experiencing illness symptoms?"
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
                    placeholder="e.g., HIV (with CD4 count), chemotherapy, immunosuppressant medication..."
                  />
                )}

                <Checkbox
                  label="Pregnant"
                  checked={state.screening.pregnant}
                  onChange={handlePregnantChange}
                  description="Is the patient pregnant?"
                />

                <Checkbox
                  label="Breastfeeding"
                  checked={state.screening.breastfeeding}
                  onChange={handleBreastfeedingChange}
                  description="Is the patient breastfeeding?"
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
                  <span className="text-gray-700">Age appropriate (4+ years):</span>
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
                  <span className="text-gray-700">Pregnancy:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.pregnancy
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.pregnancy
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
                      ? 'CONTRAINDICATED'
                      : 'OK'}
                  </span>
                </div>
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
                    Schedule: 2 doses, 3 months apart
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
                    description="Patient understands need for 2nd dose in 3 months"
                  />

                  <Checkbox
                    label="Common side effects"
                    checked={state.advice.commonReactions}
                    onChange={(v) => handleAdviceChange('commonReactions', v)}
                    description="Headache, myalgia, injection site pain usually resolve in 1-2 days"
                  />

                  <Checkbox
                    label="Serious side effects"
                    checked={state.advice.seriousReactions}
                    onChange={(v) => handleAdviceChange('seriousReactions', v)}
                    description="Anaphylaxis: difficulty breathing, swelling of face/throat, severe rash"
                  />

                  <Checkbox
                    label="Mosquito bite prevention"
                    checked={state.advice.mosquitoPrevention}
                    onChange={(v) => handleAdviceChange('mosquitoPrevention', v)}
                    description="Continue bite prevention (repellent, clothing) - vaccine does not provide 100% protection"
                  />

                  <Checkbox
                    label="Dengue symptom warning signs"
                    checked={state.advice.dengueSymptomsWarning}
                    onChange={(v) => handleAdviceChange('dengueSymptomsWarning', v)}
                    description="Seek medical attention if dengue symptoms (fever, rash, joint pain) develop after travel"
                  />

                  <Checkbox
                    label="No other live vaccines for 4 weeks"
                    checked={state.advice.noOtherLiveVaccines}
                    onChange={(v) => handleAdviceChange('noOtherLiveVaccines', v)}
                    description="Do not give other live vaccines within 4 weeks of this vaccine"
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
            <DengueSummaryReport state={state} onPrint={handlePrint} />
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
