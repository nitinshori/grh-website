'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  FluConsultationState,
  FluScreening,
  FluContraindications,
  FluVaccineAdministration,
  FluPostVaccineObs,
  FluAdvice,
  initialFluScreening,
  initialFluContraindications,
  initialFluVaccineAdministration,
  initialFluPostVaccineObs,
  initialFluAdvice,
} from './lib/flu-types';
import { ClinicalAlert } from '../shared/types';
import {
  evaluateFluContraindications,
  hasHardStopContraindications,
  getObservationPeriodRecommendation,
} from './lib/flu-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
} from './lib/flu-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import Link from 'next/link';
import { AlertBanner } from '../shared/components/AlertBanner';
import VaccineAdminFields from './components/VaccineAdminFields';
import FluSummaryReport from './components/FluSummaryReport';
import { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { useConsultationTracking, type ConsultationRecordData } from '../shared/hooks/useConsultationTracking';

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
// Inline date utility function
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Screening',
  'Contraindications',
  'Administration',
  'Observations',
  'Advice',
  'Summary',
];

interface FluToolClientProps {
  initialPatient?: BasePatientDetails;
}

export default function FluToolClient({
  initialPatient,
}: FluToolClientProps): React.ReactNode {
  const [state, setState] = useState<FluConsultationState>({
    patient: initialPatient || {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: null,
      gpName: '',
      gpPractice: '',
gpAddress: '',
gpPhone: '',
gpOdsCode: '',
      nhsNumber: '',
      address: '',
      phone: '',
      email: '',
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: '',
      patientAwarePrivateService: false,
    },
    screening: initialFluScreening(),
    contraindications: initialFluContraindications(),
    administration: initialFluVaccineAdministration(),
    postVaccineObs: initialFluPostVaccineObs(),
    advice: initialFluAdvice(),
    summary: {
      pharmacistName: '',
      pharmacistGPhC: '',
      pharmacyName: '',
      pharmacyAddress: '',
      consultationDate: new Date().toISOString().split('T')[0],
      consultationTime: '',
      clinicalNotes: '',
    },
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
  const handleFirstNameChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, firstName: value },
    }));
  }, []);

  const handleLastNameChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, lastName: value },
    }));
  }, []);

  const handleDOBChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, dateOfBirth: value },
    }));
  }, []);

  const handleNHSNumberChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, nhsNumber: value },
    }));
  }, []);

  const handlePhoneChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, phone: value },
    }));
  }, []);

  // Consent handlers
  const handleConsentChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      consent: { ...prev.consent, informedConsentGiven: value },
    }));
  }, []);

  const handleIdVerifiedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      consent: { ...prev.consent, idVerified: value },
    }));
  }, []);

  // Screening handlers
  const handlePreviousVaccineChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, previousFluVaccine: value },
    }));
  }, []);

  const handlePreviousReactionChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, previousReaction: value },
    }));
  }, []);

  const handleReactionDetailsChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, reactionDetails: value },
    }));
  }, []);

  const handleEggAllergyChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: {
        ...prev.screening,
        eggAllergy: value,
        eggAllergySeverity: value ? '' : '',
      },
    }));
  }, []);

  const handleEggAllergySeverityChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, eggAllergySeverity: value as any },
    }));
  }, []);

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
      screening: { ...prev.screening, immunosuppressed: value },
    }));
  }, []);

  const handleImmunosuppressedDetailsChange = useCallback(
    (value: string): void => {
      setState((prev) => ({
        ...prev,
        screening: { ...prev.screening, immunosuppressedDetails: value },
      }));
    },
    []
  );

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

  const handleAspirinTherapyChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, aspirinTherapy: value },
    }));
  }, []);

  const handleBleedingDisorderChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, bleedingDisorder: value },
    }));
  }, []);

  const handlePreviousGBSChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, previousGBS: value },
    }));
  }, []);

  const handleTemperatureChange = useCallback((value: number | null): void => {
    setState((prev) => ({
      ...prev,
      screening: { ...prev.screening, temperature: value },
    }));
  }, []);

  // Administration handlers
  const handleVaccineChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, vaccineName: value },
    }));
  }, []);

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

  const handleRouteChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, route: value as any },
    }));
  }, []);

  const handleDoseChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, doseVolume: value },
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

  const handleReactionDetailsObsChange = useCallback((value: string): void => {
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
  const handleCommonReactionsChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      advice: { ...prev.advice, commonReactions: value },
    }));
  }, []);

  const handleSeriousReactionsChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      advice: { ...prev.advice, seriousReactions: value },
    }));
  }, []);

  const handleParacetamolAdviceChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      advice: { ...prev.advice, paracetamolAdvice: value },
    }));
  }, []);

  const handleReturnIfConcernedChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      advice: { ...prev.advice, returnIfConcerned: value },
    }));
  }, []);

  const handleAnnualRevaccinationChange = useCallback((value: boolean): void => {
    setState((prev) => ({
      ...prev,
      advice: { ...prev.advice, annualRevaccination: value },
    }));
  }, []);

  // Summary handlers
  const handlePharmacistNameChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, pharmacistName: value },
    }));
  }, []);

  const handleClinicalNotesChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, clinicalNotes: value },
    }));
  }, []);

  // Navigation and validation
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
        const result = validateContraindications(state.contraindications);
        errors.push(...result.errors);
        break;
      }
      case 4: {
        const result = validateAdministration(state.administration);
        errors.push(...result.errors);
        break;
      }
      case 5: {
        const result = validatePostVaccineObs(state.postVaccineObs);
        errors.push(...result.errors);
        break;
      }
      case 6: {
        const result = validateAdvice(state.advice);
        errors.push(...result.errors);
        break;
      }
      case 7: {
        // Summary validation can be skipped
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

    // On step 2 (screening), evaluate contraindications
    if (state.step === 2) {
      const { contraindications, alerts } = evaluateFluContraindications(
        state.screening,
        patientAge
      );
      setState((prev) => ({
        ...prev,
        contraindications,
        alerts,
      }));
    }

    // On step 5 (observations), set recommended observation period
    if (state.step === 4) {
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
  }, [state.step, state.screening, state.patient, validateStep, patientAge]);

  const handlePreviousStep = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 0),
    }));
  }, []);

  // ─── Consultation tracking + record saving ───
  const { markComplete, saveRecord } = useConsultationTracking('flu', state.step);
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
      patient: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        age: null,
        gpName: '',
        gpPractice: '',
        gpAddress: '',
        gpPhone: '',
        gpOdsCode: '',
        nhsNumber: '',
        address: '',
        phone: '',
        email: '',
      },
      consent: {
        informedConsentGiven: false,
        idVerified: false,
        idType: '',
        patientAwarePrivateService: false,
      },
      screening: initialFluScreening(),
      contraindications: initialFluContraindications(),
      administration: initialFluVaccineAdministration(),
      postVaccineObs: initialFluPostVaccineObs(),
      advice: initialFluAdvice(),
      summary: {
        pharmacistName: '',
        pharmacistGPhC: '',
        pharmacyName: '',
        pharmacyAddress: '',
        consultationDate: new Date().toISOString().split('T')[0],
        consultationTime: '',
        clinicalNotes: '',
      },
      alerts: [],
      step: 0,
    });
    setCompletedSteps(new Set());
    setValidationErrors(new Map());
    setSaveStatus('idle');
  }, []);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const stepAlerts = state.alerts.filter((alert: ClinicalAlert) => {
      // Route alerts based on step
      if (alert.code === 'ANAPHYLAXIS_PREVIOUS_DOSE') return state.step === 3;
      if (alert.code === 'SEVERE_EGG_ALLERGY') return state.step === 3;
      if (alert.code === 'ACUTE_FEBRILE_ILLNESS') return state.step === 2;
      if (alert.code === 'MILD_EGG_ALLERGY') return state.step === 3;
      if (alert.code === 'PREVIOUS_MILD_REACTION') return state.step === 3;
      if (alert.code === 'PREVIOUS_GBS') return state.step === 3;
      if (alert.code === 'IMMUNOSUPPRESSED') return state.step === 3;
      if (alert.code === 'PREGNANT') return state.step === 3;
      if (alert.code === 'BLEEDING_DISORDER') return state.step === 4;
      if (alert.code === 'CURRENT_ILLNESS') return state.step === 2;
      return false;
    });

    if (stepAlerts.length === 0) return null;

    return <AlertBanner alerts={stepAlerts} />;
  }, [state.alerts, state.step]);

  const canProceedFromStep = useCallback((): boolean => {
    if (state.step === 3 && hasHardStopContraindications(state.contraindications)) {
      return false;
    }
    return true;
  }, [state.step, state.contraindications]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Flu Vaccination ePGD
          </h1>
          <p className="text-gray-600">
            UK Pharmacy PGD Consultation
          </p>
        </div>

        {state.step === 0 && (
          <div className="mb-4 print:hidden">
            <Link
              href="/for-pharmacies/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar
          currentStep={state.step}
          stepLabels={STEP_LABELS}
          onStepClick={() => {}}
          completedSteps={completedSteps}
          hasErrors={validationErrors.has(state.step)}
        />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow mt-8 p-8">
          {/* Validation Errors */}
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

          {/* Step Alerts */}
          {getStepAlerts()}

          {/* Step Content */}
          {state.step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Patient Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="First Name"
                  value={state.patient.firstName}
                  onChange={handleFirstNameChange}
                  placeholder="John"
                />
                <TextInput
                  label="Last Name"
                  value={state.patient.lastName}
                  onChange={handleLastNameChange}
                  placeholder="Smith"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="Date of Birth"
                  type="date"
                  value={state.patient.dateOfBirth}
                  onChange={handleDOBChange}
                />
                <TextInput
                  label="NHS Number"
                  value={state.patient.nhsNumber}
                  onChange={handleNHSNumberChange}
                  placeholder="XXX XXX XXXX"
                />
              </div>
              <TextInput
                label="Phone"
                value={state.patient.phone}
                onChange={handlePhoneChange}
                placeholder="07700 900000"
              />
            </div>
          )}

          {state.step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Consent & ID Verification</h2>
              <Checkbox
                label="Patient provides informed consent for flu vaccination"
                checked={state.consent.informedConsentGiven}
                onChange={handleConsentChange}
                description="Patient has been provided with vaccination information and consents to vaccination"
              />
              <Checkbox
                label="ID verified"
                checked={state.consent.idVerified}
                onChange={handleIdVerifiedChange}
                description="Patient identity has been verified"
              />
            </div>
          )}

          {state.step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Pre-vaccination Screening
              </h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Vaccination History
                </h3>
                <Checkbox
                  label="Previous flu vaccine"
                  checked={state.screening.previousFluVaccine}
                  onChange={handlePreviousVaccineChange}
                  description="Has the patient received flu vaccine before?"
                />
                {state.screening.previousFluVaccine && (
                  <div className="mt-4 ml-6 space-y-4">
                    <Checkbox
                      label="Previous reaction to flu vaccine"
                      checked={state.screening.previousReaction}
                      onChange={handlePreviousReactionChange}
                      description="Did the patient experience any adverse reaction?"
                    />
                    {state.screening.previousReaction && (
                      <TextArea
                        label="Describe previous reaction"
                        value={state.screening.reactionDetails}
                        onChange={handleReactionDetailsChange}
                        placeholder="e.g., Mild fever, arm soreness, anaphylaxis..."
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Allergies
                </h3>
                <Checkbox
                  label="Egg allergy"
                  checked={state.screening.eggAllergy}
                  onChange={handleEggAllergyChange}
                  description="Does the patient have an egg allergy?"
                />
                {state.screening.eggAllergy && (
                  <div className="mt-4 ml-6">
                    <SelectInput
                      label="Egg allergy severity"
                      value={state.screening.eggAllergySeverity}
                      onChange={handleEggAllergySeverityChange}
                      options={[
                        { value: 'mild', label: 'Mild (oral itching)' },
                        { value: 'severe', label: 'Severe (anaphylaxis risk)' },
                      ]}
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Current Health Status
                </h3>
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
                      placeholder="e.g., Cough, cold, sore throat..."
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Medical History
                </h3>
                <div className="space-y-4">
                  <Checkbox
                    label="Immunosuppressed"
                    checked={state.screening.immunosuppressed}
                    onChange={handleImmunosuppressedChange}
                    description="Does the patient have any condition or medication affecting immunity?"
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
                    label="Breastfeeding"
                    checked={state.screening.breastfeeding}
                    onChange={handleBreastfeedingChange}
                    description="Is the patient breastfeeding?"
                  />
                  {patientAge < 18 && (
                    <Checkbox
                      label="On aspirin therapy"
                      checked={state.screening.aspirinTherapy}
                      onChange={handleAspirinTherapyChange}
                      description="Is the patient on long-term aspirin therapy?"
                    />
                  )}
                  <Checkbox
                    label="Bleeding disorder"
                    checked={state.screening.bleedingDisorder}
                    onChange={handleBleedingDisorderChange}
                    description="Does the patient have a bleeding disorder?"
                  />
                  <Checkbox
                    label="Previous Guillain-Barré syndrome"
                    checked={state.screening.previousGBS}
                    onChange={handlePreviousGBSChange}
                    description="Has the patient previously experienced Guillain-Barré syndrome?"
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Contraindications Review
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">
                    Anaphylaxis to previous dose:
                  </span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.anaphylaxisToPreviousDose
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.anaphylaxisToPreviousDose
                      ? 'CONTRAINDICATED'
                      : 'OK'}
                  </span>
                </div>
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
                      ? 'CONTRAINDICATED'
                      : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Age appropriate:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.ageAppropriate
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {state.contraindications.ageAppropriate ? 'Yes' : 'No'}
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

          {state.step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Vaccine Administration
              </h2>
              <VaccineAdminFields
                administration={state.administration}
                onVaccineChange={handleVaccineChange}
                onBatchChange={handleBatchChange}
                onExpiryChange={handleExpiryChange}
                onSiteChange={handleSiteChange}
                onRouteChange={handleRouteChange}
                onDoseChange={handleDoseChange}
                onAdministeredByChange={handleAdministeredByChange}
                onTimeChange={handleTimeChange}
              />
            </div>
          )}

          {state.step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Post-vaccine Observations
              </h2>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  Keep patient under observation for the recommended period before
                  discharge.
                </p>
              </div>
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
                description="Confirm anaphylaxis emergency kit is available and ready"
              />
              <Checkbox
                label="Patient is well"
                checked={state.postVaccineObs.patientWell}
                onChange={handlePatientWellChange}
                description="Patient is comfortable and has no symptoms"
              />
              <Checkbox
                label="Adverse reaction observed"
                checked={state.postVaccineObs.adverseReaction}
                onChange={handleAdverseReactionChange}
                description="Any adverse reaction during observation period?"
              />
              {state.postVaccineObs.adverseReaction && (
                <TextArea
                  label="Describe adverse reaction"
                  value={state.postVaccineObs.reactionDetails}
                  onChange={handleReactionDetailsObsChange}
                  placeholder="e.g., Rash, swelling, difficulty breathing..."
                />
              )}
            </div>
          )}

          {state.step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Post-vaccine Advice
              </h2>
              <p className="text-gray-600">
                Confirm that all of the following advice has been provided to the
                patient:
              </p>
              <div className="space-y-4">
                <Checkbox
                  label="Common side effects"
                  checked={state.advice.commonReactions}
                  onChange={handleCommonReactionsChange}
                  description="Patient advised about common reactions: sore arm, mild fever, muscle ache (usually resolve in 1-2 days)"
                />
                <Checkbox
                  label="Serious side effects"
                  checked={state.advice.seriousReactions}
                  onChange={handleSeriousReactionsChange}
                  description="Patient advised about signs of anaphylaxis: difficulty breathing, swelling of face/throat, severe rash"
                />
                <Checkbox
                  label="Pain relief advice"
                  checked={state.advice.paracetamolAdvice}
                  onChange={handleParacetamolAdviceChange}
                  description="Patient can take paracetamol or ibuprofen for mild fever or arm soreness"
                />
                <Checkbox
                  label="When to seek help"
                  checked={state.advice.returnIfConcerned}
                  onChange={handleReturnIfConcernedChange}
                  description="Return to pharmacy or GP if concerned, or call NHS 111 if needed"
                />
                <Checkbox
                  label="Annual revaccination"
                  checked={state.advice.annualRevaccination}
                  onChange={handleAnnualRevaccinationChange}
                  description="Annual flu vaccination is recommended"
                />
              </div>
            </div>
          )}

          {state.step === 7 && (
            <>
              <FluSummaryReport state={state} onPrint={handlePrint} />
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
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-teal-600 border border-teal-300 hover:bg-teal-50 transition-colors"
                  >
                    New Consultation
                  </button>
                </div>
              )}
            </>
          )}

          {/* Navigation Buttons */}
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
