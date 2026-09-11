'use client';

import React, { useState, useCallback, useEffect } from 'react';
// The shared VaccineSafetyChecks panel is NOT mounted here. This tool has
// its own adrenaline gate, batch, expiry and site (Vaccine Administration)
// and its own observation record (Post-vaccine Observations); mounting the
// shared panel as well put a second batch number, expiry, site and
// observation tick above the page title on every step, including Patient
// Details (walkthrough review, 11 Sep 2026). The record still carries a
// vaccineSafetyChecks block in the shared shape, built from these fields.
import type { VaccineSafetyState } from "../shared/components/VaccineSafetyChecks";
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
  initialFluChildConsent,
  FluChildConsent,
  FluVaccineType,
  FLU_SEASON,
  FLU_VACCINES,
} from './lib/flu-types';
import { ClinicalAlert } from '../shared/types';
import {
  evaluateFluContraindications,
  hasHardStopContraindications,
  getObservationPeriodRecommendation,
  needsTwoDoses,
  permittedVaccineTypes,
  twoDoseCourseDoseNumber,
} from './lib/flu-clinical-logic';
import {
  validatePatientDetails,
  validateConsent,
  validateScreening,
  validateContraindications,
  validateAdministration,
  validatePostVaccineObs,
  validateAdvice,
  validateSummary,
} from './lib/flu-validation';
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from '../shared/components/FormInputs';
import { PostcodeLookup } from '../shared/components/PostcodeLookup';
import { ProgressBar } from '../shared/components/ProgressBar';
import Link from 'next/link';
import { AlertBanner } from '../shared/components/AlertBanner';
import VaccineAdminFields from './components/VaccineAdminFields';
import FluSummaryReport from './components/FluSummaryReport';
import { BasePatientDetails, BaseConsent, BaseSummary, calculateAge } from '../shared/types';
import { useConsultationTracking, type ConsultationRecordData } from '../shared/hooks/useConsultationTracking';

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

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
gpEmail: '',
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
    childConsent: initialFluChildConsent(),
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

  // "Administered by" on the administration step was typed by hand and then
  // the immuniser's name typed again on the summary step. Prefill it from the
  // profile; it stays editable for the case where someone else vaccinated.
  useEffect(() => {
    if (!__pharmProfile?.name) return;
    setState((prev) =>
      prev.administration.administeredBy
        ? prev
        : { ...prev, administration: { ...prev.administration, administeredBy: __pharmProfile.name } }
    );
  }, [__pharmProfile]);


  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set<number>()
  );
  const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(
    new Map<number, string[]>()
  );

  // Shared age calculation. A blank or unparseable date of birth gives -1,
  // which fails every age gate rather than passing them (adversarial review).
  const patientAge = calculateAge(state.patient.dateOfBirth) ?? -1;

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

  const handleAddressChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, address: value },
    }));
  }, []);

  const handleDOBChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, dateOfBirth: value, age: calculateAge(value) },
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

  const handleGpPracticeChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      patient: { ...prev.patient, gpPractice: value },
    }));
  }, []);

  /** Generic setters for the fields added for PGD v005. */
  const setScreeningField = useCallback(
    <K extends keyof FluScreening>(field: K, value: FluScreening[K]): void => {
      setState((prev) => ({ ...prev, screening: { ...prev.screening, [field]: value } }));
    },
    []
  );
  const setAdministrationField = useCallback(
    <K extends keyof FluVaccineAdministration>(field: K, value: FluVaccineAdministration[K]): void => {
      setState((prev) => ({ ...prev, administration: { ...prev.administration, [field]: value } }));
    },
    []
  );
  const setAdviceField = useCallback(
    <K extends keyof FluAdvice>(field: K, value: FluAdvice[K]): void => {
      setState((prev) => ({ ...prev, advice: { ...prev.advice, [field]: value } }));
    },
    []
  );
  const setChildConsentField = useCallback(
    <K extends keyof FluChildConsent>(field: K, value: FluChildConsent[K]): void => {
      setState((prev) => ({ ...prev, childConsent: { ...prev.childConsent, [field]: value } }));
    },
    []
  );

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
      administration: { ...prev.administration, vaccineName: value as FluVaccineType },
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

  const handlePharmacistGPhCChange = useCallback((value: string): void => {
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, pharmacistGPhC: value },
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
        const result = validatePatientDetails(state.patient, patientAge);
        errors.push(...result.errors);
        break;
      }
      case 1: {
        const result = validateConsent(state.consent, state.childConsent, patientAge);
        errors.push(...result.errors);
        break;
      }
      case 2: {
        const result = validateScreening(state.screening, patientAge);
        errors.push(...result.errors);
        break;
      }
      case 3: {
        const result = validateContraindications(state.contraindications);
        errors.push(...result.errors);
        break;
      }
      case 4: {
        const result = validateAdministration(state.administration, patientAge, state.screening);
        errors.push(...result.errors);
        break;
      }
      case 5: {
        const result = validatePostVaccineObs(state.postVaccineObs);
        errors.push(...result.errors);
        break;
      }
      case 6: {
        const result = validateAdvice(
          state.advice,
          needsTwoDoses(state.screening, patientAge) && state.administration.doseNumber === '1'
        );
        errors.push(...result.errors);
        break;
      }
      case 7: {
        const result = validateSummary(state.summary);
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

  // Contraindications used to be evaluated only when leaving the screening
  // step, so a stop introduced by going back (a corrected date of birth, a
  // newly ticked exclusion) was not seen until that step's Next was pressed
  // again. Evaluate whenever the inputs change (adversarial review, 11 Sep 2026).
  useEffect(() => {
    const { contraindications, alerts } = evaluateFluContraindications(state.screening, patientAge);
    setState((prev) => ({ ...prev, contraindications, alerts }));
  }, [state.screening, patientAge]);

  // Dose number in the under-9 two-dose course is derived from the screening
  // answers, not chosen freely; the dose 1 date comes from the same answer.
  useEffect(() => {
    const derived = twoDoseCourseDoseNumber(state.screening, patientAge);
    setState((prev) => {
      const nextPrev = derived === '2' ? prev.screening.firstDoseThisSeasonDate : prev.administration.previousDoseDate;
      if (prev.administration.doseNumber === derived && prev.administration.previousDoseDate === nextPrev) return prev;
      return {
        ...prev,
        administration: { ...prev.administration, doseNumber: derived, previousDoseDate: nextPrev },
      };
    });
  }, [state.screening, patientAge]);

  const hardStops = hasHardStopContraindications(state.contraindications);

  const handleNextStep = useCallback((): void => {
    if (hardStops) return;
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
  }, [state.step, state.screening, state.patient, validateStep, patientAge, hardStops]);

  const handlePreviousStep = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 0),
    }));
  }, []);

  // ─── Consultation tracking + record saving ───
  const { markComplete, saveRecord, reset: resetTracking } = useConsultationTracking('flu', state.step);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const getConsultationData = useCallback((): ConsultationRecordData => {
    const stop = hasHardStopContraindications(state.contraindications);
    const vaccine = state.administration.vaccineName
      ? FLU_VACCINES[state.administration.vaccineName]
      : null;
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
        ...(state as unknown as Record<string, unknown>),
        // Same shape as the shared safety panel writes, built from this tool's own fields.
        vaccineSafetyChecks: {
          adrenalineAvailable: state.administration.adrenalineAvailable,
          observedFifteenMinutes: state.postVaccineObs.observationCompleted,
          batchNumber: state.administration.batchNumber,
          expiryDate: state.administration.expiryDate,
          site: state.administration.injectionSite,
        } satisfies VaccineSafetyState,
      },
      outcome: stop ? 'not_supplied' : 'completed',
      medicine:
        !stop && vaccine
          ? {
              name: `${state.administration.brandName || vaccine.label} (${vaccine.label})`,
              dose: '0.5 ml intramuscular',
              quantity: '1 dose',
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
    // Same rules as Next: the immuniser's name and GPhC number are required,
    // and nothing is printed as a vaccination record while a stop exists.
    if (!validateStep(7)) return;
    if (hasHardStopContraindications(state.contraindications)) return;
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    window.print();
  }, [markComplete, saveRecord, getConsultationData, validateStep, state.contraindications]);

  // Every PGD requires the advice given to an excluded patient to be recorded.
  const handleSaveNotSupplied = useCallback(async (): Promise<void> => {
    setSaveStatus('saving');
    const data = getConsultationData();
    data.outcome = 'not_supplied';
    (data.clinicalData as Record<string, unknown>).stoppedAtStep = state.step;
    const success = await saveRecord(data);
    setSaveStatus(success ? 'saved' : 'error');
  }, [getConsultationData, saveRecord, state.step]);

  const handleNewConsultation = useCallback((): void => {
    if (!window.confirm('Start a new consultation? The current consultation data will be cleared.')) return;
    // Forget the saved consultation, or the next patient's save is skipped
    // and reported as saved (adversarial review, 11 Sep 2026).
    resetTracking();
    setState({
      patient: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        age: null,
        gpName: '',
        gpPractice: '',
        gpAddress: '',
        gpPhone: '', gpEmail: '',
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
      childConsent: initialFluChildConsent(),
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
  }, [resetTracking]);

  const getStepAlerts = useCallback((): React.ReactNode => {
    const stepAlerts = state.alerts.filter((alert: ClinicalAlert) => {
      // A stop is shown on whatever step the pharmacist is on: it disables
      // Next everywhere, so it must be visible everywhere (walkthrough
      // review, 11 Sep 2026: an under-2 date of birth or "already vaccinated
      // this season" greyed Next with no reason on screen).
      if (alert.severity === 'stop') return true;
      // Route the rest based on step
      if (alert.code === 'ACUTE_FEBRILE_ILLNESS' || alert.code === 'CURRENT_ILLNESS') return state.step === 2;
      if (alert.code === 'BLEEDING_DISORDER') return state.step === 4;
      if (alert.code === 'TWO_DOSE_CHILD' || alert.code === 'CHILD_IIVC_ONLY') return state.step === 3 || state.step === 4;
      return state.step === 3;
    });

    if (stepAlerts.length === 0) return null;

    return <AlertBanner alerts={stepAlerts} />;
  }, [state.alerts, state.step]);

  // A stop anywhere blocks Next on every step (adversarial review, 11 Sep 2026).
  const canProceedFromStep = useCallback((): boolean => {
    return !hasHardStopContraindications(state.contraindications);
  }, [state.contraindications]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Flu Vaccination ePGD, 2026/27 season
          </h1>
          <p className="text-gray-600">
            Seasonal influenza vaccines (IIVc, aIIV, IIVr and IIVe) under the Patient Group Direction, version 005, issued 11 September 2026. Privately funded vaccination, aged 2 years and over; single 0.5 ml intramuscular dose.
          </p>
        </div>

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
          {hardStops && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-red-900 font-semibold">
                Vaccination is contraindicated: see the alert above. Next is locked. Refer the patient to the GP or specialist as needed and use "Save as not supplied" to record the consultation.
              </p>
            </div>
          )}

          {/* Step Content */}
          {state.step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Patient Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="First Name"
                  required
                  value={state.patient.firstName}
                  onChange={handleFirstNameChange}
                  placeholder="John"
                />
                <TextInput
                  label="Last Name"
                  required
                  value={state.patient.lastName}
                  onChange={handleLastNameChange}
                  placeholder="Smith"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="Date of Birth"
                  type="date"
                  required
                  value={state.patient.dateOfBirth}
                  onChange={handleDOBChange}
                />
                <TextInput
                  label="NHS Number"
                  required
                  value={state.patient.nhsNumber}
                  onChange={handleNHSNumberChange}
                  placeholder="XXX XXX XXXX"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="Phone"
                  value={state.patient.phone}
                  onChange={handlePhoneChange}
                  placeholder="07700 900000"
                />
                <TextInput
                  label="GP practice with whom the individual is registered"
                  value={state.patient.gpPractice}
                  onChange={handleGpPracticeChange}
                  placeholder="Practice name"
                />
              </div>
              <PostcodeLookup
                onResolved={({ town, postcode }) => {
                  const locality = [town, postcode].filter(Boolean).join(', ');
                  handleAddressChange(
                    state.patient.address?.trim()
                      ? `${state.patient.address.trim()}, ${locality}`
                      : locality,
                  );
                }}
                onAddressSelected={({ address, postcode }) => {
                  handleAddressChange([address, postcode].filter(Boolean).join(', '));
                }}
              />
              <TextInput
                label="Patient address"
                value={state.patient.address}
                onChange={handleAddressChange}
                placeholder="123 High Street, Leeds"
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

              {patientAge < 16 && (
                <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-blue-900">
                    Patient is under 16: record the basis of consent
                  </p>
                  <p className="text-xs text-blue-900">
                    Consent must be obtained from a person with parental responsibility, or from the young person where they are assessed as Gillick competent. A parent accompanying a child does not automatically hold parental responsibility: ask.
                  </p>
                  <SelectInput
                    label="Consent given by"
                    value={state.childConsent.basis}
                    onChange={(v) => setChildConsentField('basis', v as FluChildConsent['basis'])}
                    options={[
                      { value: 'parental', label: 'A person with parental responsibility' },
                      { value: 'gillick', label: 'The young person, assessed as Gillick competent' },
                    ]}
                    required
                  />
                  {state.childConsent.basis === 'parental' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TextInput
                        label="Name of person with parental responsibility"
                        value={state.childConsent.parentName}
                        onChange={(v) => setChildConsentField('parentName', v)}
                        placeholder="Full name"
                        required
                      />
                      <TextInput
                        label="Relationship to the child"
                        value={state.childConsent.parentRelationship}
                        onChange={(v) => setChildConsentField('parentRelationship', v)}
                        placeholder="Mother, father, guardian"
                        required
                      />
                    </div>
                  )}
                  {state.childConsent.basis === 'gillick' && (
                    <TextArea
                      label="Basis of the Gillick competence assessment"
                      value={state.childConsent.gillickBasis}
                      onChange={(v) => setChildConsentField('gillickBasis', v)}
                      placeholder="What the young person understood about the vaccine, its benefits and risks, and the decision being made."
                      required
                    />
                  )}
                </div>
              )}
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
                  label="Previous flu vaccine (any season)"
                  checked={state.screening.previousFluVaccine}
                  onChange={handlePreviousVaccineChange}
                  description={
                    patientAge < 9
                      ? 'Has the child received influenza vaccine before? A child under 9 having it for the first time needs 2 doses at least 4 weeks apart.'
                      : 'Has the patient received flu vaccine before?'
                  }
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
                      <>
                        <SelectInput
                          label="Type of previous reaction"
                          value={state.screening.previousReactionType}
                          onChange={(v) => setScreeningField('previousReactionType', v as FluScreening['previousReactionType'])}
                          options={[
                            { value: 'anaphylaxis', label: 'Confirmed anaphylactic reaction (exclusion)' },
                            { value: 'other', label: 'Other reaction (observe 15 minutes)' },
                          ]}
                          required
                        />
                        <TextArea
                          label="Describe previous reaction"
                          value={state.screening.reactionDetails}
                          onChange={handleReactionDetailsChange}
                          placeholder="e.g., Mild fever, arm soreness, anaphylaxis..."
                          required
                        />
                      </>
                    )}
                  </div>
                )}
                {patientAge >= 0 && patientAge < 9 && state.screening.previousFluVaccine && (
                  <div className="mt-4 ml-6 space-y-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Checkbox
                      label={`The only previous influenza vaccine was dose 1 of this season's (${FLU_SEASON}) two-dose first course; the child is attending for dose 2`}
                      checked={state.screening.firstDoseThisSeason}
                      onChange={(v) => setScreeningField('firstDoseThisSeason', v)}
                      description="Permitted under the PGD: a child under 9 receiving influenza vaccine for the first time needs 2 doses at least 4 weeks apart. This visit will be recorded as dose 2 of 2."
                    />
                    {state.screening.firstDoseThisSeason && (
                      <TextInput
                        label="Date dose 1 was given"
                        type="date"
                        value={state.screening.firstDoseThisSeasonDate}
                        onChange={(v) => setScreeningField('firstDoseThisSeasonDate', v)}
                        required
                      />
                    )}
                  </div>
                )}
                <div className="mt-4">
                  <Checkbox
                    label={`Already received an influenza vaccine for the ${FLU_SEASON} season`}
                    checked={state.screening.receivedThisSeason}
                    onChange={(v) => setScreeningField('receivedThisSeason', v)}
                    description="Exclusion: one dose per individual per season, other than a child under 9 years attending for the second of two doses (record that above)."
                  />
                </div>
                <div className="mt-4">
                  <SelectInput
                    label="NHS entitlement (PGD inclusion)"
                    value={state.screening.nhsStatus}
                    onChange={(v) => setScreeningField('nhsStatus', v as FluScreening['nhsStatus'])}
                    options={[
                      { value: 'not-eligible', label: `Requires vaccination for ${FLU_SEASON} and does not qualify for NHS vaccination` },
                      { value: 'eligible-prefers-private', label: 'Qualifies for NHS vaccination but prefers to be vaccinated privately, having been told it is free on the NHS' },
                    ]}
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Allergies
                </h3>
                <Checkbox
                  label="Known hypersensitivity to the active substances, or to any excipient or residue listed in the SPC"
                  checked={state.screening.hypersensitivityToComponent}
                  onChange={(v) => setScreeningField('hypersensitivityToComponent', v)}
                  description="Exclusion. Check the SPC for the product to be given."
                />
                <Checkbox
                  label="Egg allergy"
                  checked={state.screening.eggAllergy}
                  onChange={handleEggAllergyChange}
                  description="Not a barrier to vaccination provided an egg-free vaccine (IIVc or IIVr) is used, including for a history of anaphylaxis to egg. aIIV and IIVe are egg-cultured and will not be offered."
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
                      required
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
                    unit="°C (38.0 or above is an acute febrile illness: postpone)"
                    min={30}
                    max={45}
                    required
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
                      required
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
                      required
                    />
                  )}
                  <Checkbox
                    label="Pregnant"
                    checked={state.screening.pregnant}
                    onChange={handlePregnantChange}
                    description="Inactivated influenza vaccine is recommended at any stage of pregnancy. Pregnant women are eligible under the NHS programme and must be told."
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
                    description="Exclusion unless intramuscular injection has been assessed as safe by a clinician familiar with the individual's bleeding risk."
                  />
                  {state.screening.bleedingDisorder && (
                    <div className="ml-6">
                      <SelectInput
                        label="Intramuscular injection assessed as safe by a clinician familiar with the bleeding risk"
                        value={
                          state.screening.bleedingDisorderAssessedSafe === null
                            ? ''
                            : state.screening.bleedingDisorderAssessedSafe
                              ? 'yes'
                              : 'no'
                        }
                        onChange={(v) =>
                          setScreeningField('bleedingDisorderAssessedSafe', v === '' ? null : v === 'yes')
                        }
                        options={[
                          { value: 'yes', label: 'Yes, assessed as safe (record who assessed it in the clinical notes)' },
                          { value: 'no', label: 'No, not assessed (exclusion: refer)' },
                        ]}
                        required
                      />
                    </div>
                  )}
                  <Checkbox
                    label="On anticoagulation"
                    checked={state.screening.anticoagulated}
                    onChange={(v) => setScreeningField('anticoagulated', v)}
                    description="Caution: stable anticoagulation (including warfarin with an up-to-date INR below the upper threshold of the therapeutic range) may be vaccinated IM with a 23 gauge or finer needle, firm pressure for at least 2 minutes."
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
                  <span className="text-gray-700">Egg allergy (egg-free vaccine required):</span>
                  <span
                    className={`font-semibold ${
                      state.screening.eggAllergy ? 'text-amber-600' : 'text-green-600'
                    }`}
                  >
                    {state.screening.eggAllergy ? 'IIVc OR IIVr ONLY' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Hypersensitivity to active substance or excipient:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.hypersensitivityToComponent ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.hypersensitivityToComponent ? 'CONTRAINDICATED' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Already vaccinated this season:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.alreadyVaccinatedThisSeason ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.alreadyVaccinatedThisSeason ? 'CONTRAINDICATED' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Bleeding disorder not assessed for IM injection:</span>
                  <span
                    className={`font-semibold ${
                      state.contraindications.bleedingDisorderUnassessed ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {state.contraindications.bleedingDisorderUnassessed ? 'CONTRAINDICATED' : 'OK'}
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
                  <span className="text-gray-700">Aged 2 years or over:</span>
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

            </div>
          )}

          {state.step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Vaccine Administration
              </h2>
              <VaccineAdminFields
                administration={state.administration}
                permittedTypes={permittedVaccineTypes(patientAge, state.screening.eggAllergy)}
                twoDoseSchedule={needsTwoDoses(state.screening, patientAge)}
                onVaccineChange={handleVaccineChange}
                onBrandChange={(v) => setAdministrationField('brandName', v)}
                onBatchChange={handleBatchChange}
                onExpiryChange={handleExpiryChange}
                onSiteChange={handleSiteChange}
                onRouteChange={handleRouteChange}
                onDoseChange={handleDoseChange}
                onAdministeredByChange={handleAdministeredByChange}
                onTimeChange={handleTimeChange}
                onDoseNumberChange={(v) => setAdministrationField('doseNumber', v as FluVaccineAdministration['doseNumber'])}
                onPreviousDoseDateChange={(v) => setAdministrationField('previousDoseDate', v)}
                onNextDoseDueChange={(v) => setAdministrationField('nextDoseDue', v)}
                onAdrenalineChange={(v) => setAdministrationField('adrenalineAvailable', v)}
                onCoAdministeredChange={(v) => setAdministrationField('coAdministeredVaccine', v)}
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
                  Observe for 15 minutes after vaccination where there is a history of allergy or previous vaccine reaction. Syncope can occur, particularly in adolescents; vaccinate seated. Anxiety related reactions (dizziness, palpitations, paraesthesia, sweating) are temporary and resolve on their own: ask the individual to report symptoms.
                </p>
              </div>
              <SelectInput
                label="Observation period (pre-set from the screening answers; change it if a different period was observed)"
                value={state.postVaccineObs.observationPeriod}
                onChange={handleObservationPeriodChange}
                options={[
                  { value: '15-min', label: '15 minutes' },
                  { value: '30-min', label: '30 minutes' },
                ]}
                required
              />
              <Checkbox
                label="Observation period completed: the patient stayed seated for the period recorded above"
                checked={state.postVaccineObs.observationCompleted}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    postVaccineObs: { ...prev.postVaccineObs, observationCompleted: v },
                  }))
                }
                description="Tick only once the period has actually been completed."
                required
              />
              <Checkbox
                label="Anaphylaxis kit checked"
                checked={state.postVaccineObs.anaphylaxisKitChecked}
                onChange={handleAnaphylaxisKitChange}
                description="Confirm anaphylaxis emergency kit is available and ready"
                required
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
                  label="Possible side effects and their management"
                  checked={state.advice.commonReactions}
                  onChange={handleCommonReactionsChange}
                  description="Pain, redness, swelling or induration at the injection site, headache, fatigue, myalgia, malaise and low grade fever; in children irritability, drowsiness and loss of appetite. Reactions may be more frequent with adjuvanted vaccine."
                />
                <Checkbox
                  label="Serious side effects and Yellow Card reporting"
                  checked={state.advice.seriousReactions}
                  onChange={handleSeriousReactionsChange}
                  description="Signs of anaphylaxis (difficulty breathing, swelling of face or throat, severe rash). Seek medical advice in the event of an adverse reaction and report it via the Yellow Card scheme."
                />
                <Checkbox
                  label="Pain relief advice"
                  checked={state.advice.paracetamolAdvice}
                  onChange={handleParacetamolAdviceChange}
                  description={
                    state.screening.pregnant
                      ? 'Paracetamol may be taken for mild fever or arm soreness. Do not advise ibuprofen or other NSAIDs in pregnancy.'
                      : 'Paracetamol may be taken for mild fever or arm soreness (ibuprofen only where not otherwise contraindicated for the patient)'
                  }
                />
                <Checkbox
                  label="When to seek help"
                  checked={state.advice.returnIfConcerned}
                  onChange={handleReturnIfConcernedChange}
                  description="Seek advice if they become unwell. Return to the pharmacy or GP if concerned, or call NHS 111 if needed"
                />
                <Checkbox
                  label="Protection develops over 10 to 14 days, lasts for the season; revaccination every year"
                  checked={state.advice.annualRevaccination}
                  onChange={handleAnnualRevaccinationChange}
                  description="Explain that protection develops over about 10 to 14 days and lasts for the season, and that revaccination is needed each year."
                />
                <Checkbox
                  label="Vaccine cannot cause influenza; does not protect against other respiratory infections; not 100% protection"
                  checked={state.advice.cannotCauseFlu}
                  onChange={(v) => setAdviceField('cannotCauseFlu', v)}
                />
                <Checkbox
                  label="Patient information leaflet and written record of the vaccine given offered"
                  checked={state.advice.pilAndRecordGiven}
                  onChange={(v) => setAdviceField('pilAndRecordGiven', v)}
                  description="The marketing authorisation holder's PIL, and a written record with the date, brand, vaccine type and batch number."
                />
                {needsTwoDoses(state.screening, patientAge) && state.administration.doseNumber === '1' && (
                  <Checkbox
                    label="Written confirmation of the date the second dose is due given to the parent or carer"
                    checked={state.advice.secondDoseDateGiven}
                    onChange={(v) => setAdviceField('secondDoseDateGiven', v)}
                    description={`Second dose booked for ${state.administration.nextDoseDue || '(date not recorded)'}.`}
                  />
                )}
              </div>
            </div>
          )}

          {state.step === 7 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 print:hidden space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Immuniser declaration</h2>
                <p className="text-sm text-gray-600">
                  The PGD requires the name and registration number of the healthcare professional administering. Prefilled from your profile; correct it if a different registrant vaccinated this patient.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextInput
                    label="Name of immuniser"
                    value={state.summary.pharmacistName}
                    onChange={handlePharmacistNameChange}
                    placeholder="Full name"
                    required
                  />
                  <TextInput
                    label="GPhC registration number"
                    value={state.summary.pharmacistGPhC}
                    onChange={handlePharmacistGPhCChange}
                    placeholder="e.g. 2123456"
                    required
                  />
                </div>
                <TextArea
                  label="Clinical notes (optional)"
                  value={state.summary.clinicalNotes}
                  onChange={handleClinicalNotesChange}
                  placeholder="Any additional clinical notes"
                  rows={3}
                />
                {validationErrors.get(7) && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                    {validationErrors.get(7)!.map((e) => (
                      <p key={e} className="text-sm text-red-700">{e}</p>
                    ))}
                  </div>
                )}
              </div>
              <FluSummaryReport state={state} onPrint={hardStops ? handleSaveNotSupplied : handlePrint} />
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

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handlePreviousStep}
              disabled={state.step === 0}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            {!canProceedFromStep() && saveStatus !== 'saved' && (
              <button
                onClick={handleSaveNotSupplied}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition text-sm font-semibold"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save as not supplied'}
              </button>
            )}
            {!canProceedFromStep() && saveStatus === 'saved' && (
              <span className="text-sm text-green-700 self-center">Recorded as not supplied</span>
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
  );
}
