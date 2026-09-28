'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { SaveDraftButton } from '../shared/components/SaveDraftButton';
import { useConsultationTracking } from '../shared/hooks/useConsultationTracking';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { calculateAge } from '../shared/types';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import type {
  OMPatientDetails,
  OMConsent,
  OMSupplyHistory,
  OMDiagnosis,
  OMWomen,
  OMMedicalHistory,
  OMMedicines,
  OMMeasurements,
  OMSupply,
  OMCounselling,
  OMSummary,
  ExclusionReferral,
  ContraceptionMethod,
  TestSource,
  Dose,
  Sex,
  SupplyType,
  DoseDecision,
  PrescriberReviewType,
  CvStopReviewType,
  PrefillableField,
} from './oral-minoxidil-types';
import type { BasePatientDetails } from '../shared/types';
import { applyPrefill, derivePrefill, describePrefill, fetchPreviousOralMinoxidilRecord } from './oral-minoxidil-carry-forward';
import type { DerivedPrefill } from './oral-minoxidil-carry-forward';
import {
  initialOMPatientDetails,
  initialOMConsent,
  initialOMSupplyHistory,
  initialOMDiagnosis,
  initialOMWomen,
  initialOMMedicalHistory,
  initialOMMedicines,
  initialOMMeasurements,
  initialOMSupply,
  initialOMCounselling,
  initialOMSummary,
  ORAL_MINOXIDIL_PGD_VERSION,
  ORAL_MINOXIDIL_PGD_NAME,
  OFF_LABEL_CONSENT_SCRIPT,
  OFF_LABEL_RECORD_WORDS,
  PATIENT_CONSENT_STATEMENT,
  STOP_AND_SEEK_HELP_ADVICE,
  LABEL_STOP_WORDING,
  PRODUCT,
  DOSE_INFO,
  SUPPLY_TYPE_LABEL,
  CONTRACEPTION_LABEL,
  TEST_SOURCE_LABEL,
  REFERRAL_LABEL,
  REFERRAL_OUTCOMES,
  MAX_SUPPLIES,
  RESTART_GAP_DAYS,
  AWAITING_REVIEW_MAX_GAP_DAYS,
  BASELINE_SYSTOLIC_DEFINITION,
  PRESCRIBER_REVIEW_TYPE_LABEL,
  CV_STOP_REVIEW_TYPE_LABEL,
} from './oral-minoxidil-types';
import {
  STEP_LABELS,
  STEP,
  getOralMinoxidilAlerts,
  shouldBlockConsultation,
  stopsBlockStep,
  isCardiovascularStop,
  stopSymptomUrgency,
  startingDose,
  maximumDose,
  dosesForSex,
  doseToday,
  tabletsFor,
  doseIncreaseBlockedReason,
  doseResumeBlockedReason,
  resumeAvailable,
  onHigherDose,
  increaseUsed,
  sinceLastVisitSymptomsApply,
  cautionMedicinesList,
  cocMigraineAuraApplies,
  todaySupplyNumber,
  periodVisitNumber,
  visitNumberSinceRestart,
  prescriberReviewSoughtToday,
  approxWeeksOnTreatment,
  suppliesCounted,
  gapDays,
  gapIsRestart,
  repeatPhotosRequired,
  lowerSeated,
  repeatReading,
  effectiveSeated,
  effectivePulse,
  applicableBaselineSystolic,
  isHigh,
  isLow,
  isBorderlineLow,
  posturalFall,
  bmi,
  weightChange,
  nextReviewDateFromToday,
} from './oral-minoxidil-clinical-logic';
import {
  validateOMPatientStep,
  validateOMConsentStep,
  validateOMHistoryStep,
  validateOMDiagnosisStep,
  validateOMWomenStep,
  validateOMMedicalStep,
  validateOMMedicinesStep,
  validateOMMeasurementsStep,
  validateOMSupplyStep,
  validateOMCounsellingStep,
  validateOMSummaryStep,
  validateOMExclusionOutcome,
} from './oral-minoxidil-validation';
import OralMinoxidilSummaryReport from './components/OralMinoxidilSummaryReport';

const DATE_INPUT_CLASS =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent';

function DateField({ label, value, onChange, required, max, min, hint }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; max?: string; min?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy-900 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input type="date" value={value} max={max} min={min} onChange={(e) => onChange(e.target.value)} className={DATE_INPUT_CLASS} />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * A course-history field carried forward from the previous record. Shown
 * read-only until the pharmacist unlocks it; unlocking requires a reason,
 * which is stored with the prefilled value on the record. Restoring the
 * carried-forward value relocks it and drops the override.
 */
function Prefilled({
  field,
  label,
  display,
  history,
  setHistory,
  children,
}: {
  field: PrefillableField;
  label: string;
  display: string;
  history: OMSupplyHistory;
  setHistory: React.Dispatch<React.SetStateAction<OMSupplyHistory>>;
  children: React.ReactNode;
}) {
  const p = history.prefill;
  if (!p || !p.fields.includes(field)) return <>{children}</>;
  const unlocked = field in p.overrides;
  if (!unlocked) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-medium text-emerald-900">{label}</p>
        <p className="text-sm font-semibold text-navy-900">{display}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-[11px] text-emerald-800">Carried forward from the record of {p.consultationDate}.</p>
          <button
            type="button"
            onClick={() => setHistory((prev) => (prev.prefill ? { ...prev, prefill: { ...prev.prefill, overrides: { ...prev.prefill.overrides, [field]: '' } } } : prev))}
            className="rounded border border-emerald-400 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-100"
          >
            Edit (reason required)
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      {children}
      <TextInput
        label={`Reason for changing the carried-forward value (was: ${display})`}
        value={p.overrides[field] ?? ''}
        onChange={(v) => setHistory((prev) => (prev.prefill ? { ...prev, prefill: { ...prev.prefill, overrides: { ...prev.prefill.overrides, [field]: v } } } : prev))}
        placeholder="e.g. previous record entered in error; patient supplied elsewhere in between"
        required
      />
      <button
        type="button"
        onClick={() =>
          setHistory((prev) => {
            if (!prev.prefill) return prev;
            const overrides = { ...prev.prefill.overrides };
            delete overrides[field];
            const restored = prev.prefill.values[field];
            return { ...prev, ...(restored !== undefined ? { [field]: restored } : {}), prefill: { ...prev.prefill, overrides } };
          })
        }
        className="rounded border border-amber-400 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
      >
        Restore the carried-forward value
      </button>
    </div>
  );
}

export function OralMinoxidilClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patient, setPatient] = useState<OMPatientDetails>(initialOMPatientDetails);
  const [consent, setConsent] = useState<OMConsent>(initialOMConsent);
  const [history, setHistory] = useState<OMSupplyHistory>(initialOMSupplyHistory);
  const [diagnosis, setDiagnosis] = useState<OMDiagnosis>(initialOMDiagnosis);
  const [women, setWomen] = useState<OMWomen>(initialOMWomen);
  const [medical, setMedical] = useState<OMMedicalHistory>(initialOMMedicalHistory);
  const [medicines, setMedicines] = useState<OMMedicines>(initialOMMedicines);
  const [measurements, setMeasurements] = useState<OMMeasurements>(initialOMMeasurements);
  const [supply, setSupply] = useState<OMSupply>(initialOMSupply);
  const [counselling, setCounselling] = useState<OMCounselling>(initialOMCounselling);
  const [summary, setSummary] = useState<OMSummary>(initialOMSummary());

  const formState = useMemo(
    () => ({ currentStep, patient, consent, history, diagnosis, women, medical, medicines, measurements, supply, counselling, summary }),
    [currentStep, patient, consent, history, diagnosis, women, medical, medicines, measurements, supply, counselling, summary]
  );

  const restoreState = useCallback((s: Partial<typeof formState>) => {
    if (s.currentStep !== undefined) setCurrentStep(s.currentStep);
    if (s.patient) {
      const p = { ...initialOMPatientDetails, ...s.patient };
      setPatient({ ...p, age: calculateAge(p.dateOfBirth) });
    }
    if (s.consent) setConsent({ ...initialOMConsent, ...s.consent });
    if (s.history) setHistory({ ...initialOMSupplyHistory, ...s.history });
    if (s.diagnosis) setDiagnosis({ ...initialOMDiagnosis, ...s.diagnosis });
    if (s.women) setWomen({ ...initialOMWomen, ...s.women });
    if (s.medical) setMedical({ ...initialOMMedicalHistory, ...s.medical });
    if (s.medicines) setMedicines({ ...initialOMMedicines, ...s.medicines });
    if (s.measurements) setMeasurements({ ...initialOMMeasurements, ...s.measurements });
    if (s.supply) setSupply({ ...initialOMSupply, ...s.supply });
    if (s.counselling) setCounselling({ ...initialOMCounselling, ...s.counselling });
    if (s.summary) {
      const fresh = initialOMSummary();
      setSummary({ ...fresh, ...s.summary, consultationDate: fresh.consultationDate, consultationTime: fresh.consultationTime });
    }
  }, []);

  const { clearSaved } = useFormPersistence('epgd-oral-minoxidil', formState, restoreState);

  // Pharmacist profile: auto-fill, and the pharmacists-only rule. The
  // document does not allow supply by a pharmacy technician, so a profile
  // whose clinician record says technician blocks the tool on every step.
  const profile = usePharmacistProfile();
  const technicianProfile = profile?.practitionerRole === 'technician';
  // Where /api/me fails or returns no practitionerRole the role is unknown:
  // the pharmacist self-declaration is required (it is on every record) and
  // the record says the role could not be verified. The technician gate is
  // never dropped silently.
  const roleVerified = profile?.practitionerRole === 'pharmacist';
  const roleUnknown = !technicianProfile && !roleVerified;
  useEffect(() => {
    if (!profile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- profile arrives asynchronously from the shared hook; same pattern as every other ePGD tool
    setSummary((prev) => ({
      ...prev,
      pharmacistName: profile.name,
      pharmacistGPhC: profile.gphcNumber,
      pharmacyName: profile.pharmacyName,
      pharmacyAddress: profile.pharmacyAddress,
    }));
  }, [profile, summary.pharmacistName, summary.pharmacistGPhC]);

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

  const handlePatientChange = useCallback((field: keyof OMPatientDetails, value: OMPatientDetails[keyof OMPatientDetails]) => {
    setPatient((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'dateOfBirth') updated.age = calculateAge(typeof value === 'string' ? value : '');
      return updated;
    });
  }, []);

  // ─── Carry-forward from the previous oral minoxidil record ───
  // Looked up when a returning patient is picked from the search box, and
  // again on entering the History step where the name and date of birth
  // were typed. The derived prefill is kept so the course history can be
  // re-applied whenever the supply type is re-selected.
  const [derived, setDerived] = useState<DerivedPrefill | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'none' | 'error'>('idle');
  const [lookupKey, setLookupKey] = useState('');

  const lookupPrevious = useCallback(
    async (p: { firstName?: string; lastName?: string; dateOfBirth?: string }, sex: Sex) => {
      const firstName = (p.firstName ?? '').trim();
      const lastName = (p.lastName ?? '').trim();
      const dateOfBirth = (p.dateOfBirth ?? '').trim();
      if (!firstName || !lastName || !dateOfBirth) return;
      const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dateOfBirth}|${sex}`;
      if (key === lookupKey && lookupState !== 'idle') return;
      // The lookup is a network round trip; state is set only once it has
      // started (after a yield) and once it has returned, so the effect that
      // triggers it on entering the History step sets no state itself.
      await Promise.resolve();
      setLookupKey(key);
      setLookupState('loading');
      const prev = await fetchPreviousOralMinoxidilRecord({ firstName, lastName, dateOfBirth });
      if (!prev) {
        setDerived(null);
        setLookupState('none');
        setHistory((h) => (h.prefill ? { ...h, prefill: null } : h));
        return;
      }
      const d = derivePrefill(prev, sex);
      setDerived(d);
      setLookupState('found');
      setHistory((h) => applyPrefill(h, d));
    },
    [lookupKey, lookupState]
  );

  useEffect(() => {
    if (currentStep !== STEP.history) return;
    if (!patient.firstName || !patient.lastName || !patient.dateOfBirth || !patient.sex) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the lookup is a fetch against the records API; state is set only after the network round trip, same pattern as the profile effect above
    void lookupPrevious(patient, patient.sex);
  }, [currentStep, patient, lookupPrevious]);

  const clinicalAlerts = useMemo(
    () => getOralMinoxidilAlerts(patient, consent, history, diagnosis, women, medical, medicines, measurements, supply),
    [patient, consent, history, diagnosis, women, medical, medicines, measurements, supply]
  );
  const isBlocked = useMemo(() => shouldBlockConsultation(clinicalAlerts), [clinicalAlerts]);
  const cvStop = useMemo(() => isCardiovascularStop(clinicalAlerts, history), [clinicalAlerts, history]);

  const { saveRecord, reset: resetTracking } = useConsultationTracking('oral-minoxidil', currentStep);
  const [stopSaveStatus, setStopSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [stopSaveAttempted, setStopSaveAttempted] = useState(false);

  // Derived
  const isWoman = patient.sex === 'female';
  const isMan = patient.sex === 'male';
  const isFirst = history.supplyType === 'first';
  const isContinuation = history.supplyType === 'continuation';
  const isReview = isContinuation || history.supplyType === 'restart';
  const dose = doseToday(patient.sex, history, supply);
  const doseInfo = dose ? DOSE_INFO[dose] : null;
  const tablets = tabletsFor(dose);
  const supplyNumber = todaySupplyNumber(history);
  const visit = periodVisitNumber(history);
  const visitSinceRestart = visitNumberSinceRestart(history);
  const counted = suppliesCounted(history);
  const reviewSought = prescriberReviewSoughtToday(history);
  const lower = lowerSeated(measurements);
  const repeat = repeatReading(measurements);
  const effective = effectiveSeated(measurements);
  const pulse = effectivePulse(measurements);
  const fall = posturalFall(measurements);
  const b = bmi(measurements);
  const change = weightChange(history, measurements);
  const gap = gapDays(history);
  const baselineToday = applicableBaselineSystolic(history, measurements);
  const increaseReason = useMemo(() => doseIncreaseBlockedReason(patient.sex, history, diagnosis, measurements), [patient.sex, history, diagnosis, measurements]);
  const resumeReason = useMemo(() => doseResumeBlockedReason(patient.sex, history, diagnosis, measurements), [patient.sex, history, diagnosis, measurements]);
  const canResume = resumeAvailable(patient.sex, history);
  const start = startingDose(patient.sex);
  const isRestart = history.supplyType === 'restart';

  // Validation
  const patientError = useMemo(() => validateOMPatientStep(patient), [patient]);
  const consentError = useMemo(() => validateOMConsentStep(consent), [consent]);
  const historyError = useMemo(() => validateOMHistoryStep(history, patient), [history, patient]);
  const diagnosisError = useMemo(() => validateOMDiagnosisStep(diagnosis, patient, history), [diagnosis, patient, history]);
  const womenError = useMemo(() => validateOMWomenStep(women, patient, history, medical), [women, patient, history, medical]);
  const medicalError = useMemo(() => validateOMMedicalStep(medical, history), [medical, history]);
  const medicinesError = useMemo(() => validateOMMedicinesStep(medicines, patient, history), [medicines, patient, history]);
  const measurementsError = useMemo(() => validateOMMeasurementsStep(measurements, history, medicines), [measurements, history, medicines]);
  const supplyError = useMemo(() => validateOMSupplyStep(supply, history, patient, diagnosis, measurements), [supply, history, patient, diagnosis, measurements]);
  const counsellingError = useMemo(() => validateOMCounsellingStep(counselling, patient, history), [counselling, patient, history]);
  const summaryError = useMemo(() => validateOMSummaryStep(summary, !!technicianProfile), [summary, technicianProfile]);

  const errors = [patientError, consentError, historyError, diagnosisError, womenError, medicalError, medicinesError, measurementsError, supplyError, counsellingError, summaryError];
  const blockedByStep = STEP_LABELS.map((_, i) => stopsBlockStep(clinicalAlerts, i));
  const canProceedByStep = errors.map((e, i) => e === null && !blockedByStep[i] && !technicianProfile);
  const blockedHere = blockedByStep[currentStep] || !!technicianProfile;

  const handleNext = () => {
    if (canProceedByStep[currentStep]) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      // The next review date is 8 weeks from today: pre-filled on entering
      // the supply step, editable there.
      if (currentStep + 1 === STEP.supply && !supply.nextReviewDate) {
        setSupply((prev) => (prev.nextReviewDate ? prev : { ...prev, nextReviewDate: nextReviewDateFromToday() }));
      }
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Exclusion outcome ───
  const urgency = stopSymptomUrgency(history, measurements);
  const bpHighOnRepeat = clinicalAlerts.some((a) => a.code === 'BP_HIGH_ON_REPEAT');
  const bpOutsideOnRepeat = clinicalAlerts.some((a) => ['BP_HIGH_ON_REPEAT', 'BP_LOW', 'BP_LOW_WITH_SYMPTOMS', 'POSTURAL_FALL', 'PULSE_OUT_OF_RANGE'].includes(a.code));
  const bpSevere = clinicalAlerts.some((a) => a.code === 'BP_SEVERE');
  const noResults = clinicalAlerts.some((a) => a.code === 'WOMAN_NO_RESULTS' || a.code === 'RESULTS_TOO_OLD');
  const resultsTooOld = clinicalAlerts.some((a) => a.code === 'RESULTS_TOO_OLD');
  const cvReviewCodes = ['PREVIOUS_CV_STOP_NO_REVIEW', 'CV_STOP_REVIEW_NOT_FACE_TO_FACE', 'CV_STOP_NOT_RESOLVED', 'CV_STOP_REVIEW_INCOMPLETE'];
  const sixSupplies = clinicalAlerts.some((a) => a.code === 'SIX_SUPPLIES' || cvReviewCodes.includes(a.code));
  const cvReviewFaceToFaceNeeded = clinicalAlerts.some((a) => cvReviewCodes.includes(a.code));
  const notAndrogenetic = clinicalAlerts.some((a) => ['NOT_ANDROGENETIC', 'PULL_TEST', 'HEAVY_SHEDDING', 'HEAVY_SHEDDING_PERSISTING', 'TRIGGER_12_MONTHS', 'HYPERANDROGENISM'].includes(a.code));
  const cocFirst = clinicalAlerts.some((a) => a.code === 'COC_MIGRAINE_AURA_FIRST');
  const over65 = clinicalAlerts.some((a) => a.code === 'AGE_OVER_65');
  const isDeclined = consent.patientDeclined;
  const sameDay = cvStop && (urgency === 'same-day' || bpSevere);
  const returnVisitAvailable = isFirst && measurements.returnVisitForBp !== 'yes' && !history.returnVisitUsedBefore;

  const referralOptions = useMemo<{ value: ExclusionReferral; label: string }[]>(
    () => [
      ...(cvStop || bpSevere ? [{ value: 'gp-same-day' as const, label: REFERRAL_LABEL['gp-same-day'] }] : []),
      ...(cvStop ? [{ value: 'prescriber-review' as const, label: REFERRAL_LABEL['prescriber-review'] }] : []),
      ...(bpOutsideOnRepeat && returnVisitAvailable ? [{ value: 'return-bp' as const, label: REFERRAL_LABEL['return-bp'] }] : []),
      ...(bpOutsideOnRepeat ? [{ value: 'gp-bp' as const, label: REFERRAL_LABEL['gp-bp'] }] : []),
      ...(noResults ? [{ value: 'return-with-results' as const, label: REFERRAL_LABEL['return-with-results'] }] : []),
      ...(cocFirst || resultsTooOld ? [{ value: 'return-with-outcome' as const, label: REFERRAL_LABEL['return-with-outcome'] }] : []),
      ...(sixSupplies && !cvStop ? [{ value: 'prescriber-review' as const, label: REFERRAL_LABEL['prescriber-review'] }] : []),
      ...(over65 && !cvStop ? [{ value: 'prescriber-review' as const, label: 'Finishes the supply in hand, then referred to a prescriber (no further supply under this PGD)' }] : []),
      { value: 'gp-routine' as const, label: REFERRAL_LABEL['gp-routine'] },
      { value: 'advice-only' as const, label: REFERRAL_LABEL['advice-only'] },
      { value: 'declined' as const, label: REFERRAL_LABEL.declined },
    ],
    [cvStop, bpSevere, bpOutsideOnRepeat, returnVisitAvailable, noResults, cocFirst, resultsTooOld, sixSupplies, over65]
  );

  const effectiveSummary = useMemo<OMSummary>(
    () => (referralOptions.some((o) => o.value === summary.referral) ? summary : { ...summary, referral: '' }),
    [summary, referralOptions]
  );

  const exclusionOutcomeError = useMemo(() => {
    const base = validateOMExclusionOutcome(effectiveSummary);
    if (base) return base;
    if (!supply.alternativesOffered) return 'Record which licensed alternatives were offered (or that none was, where the hair loss needs a diagnosis first)';
    if (isReview && cvStop && !counselling.stopSeekHelpWritten) return 'Cardiovascular stop: give the stop-and-seek-help advice in writing and tick it';
    if (isReview && cvStop && (!counselling.adverseReaction || !counselling.adverseReactionDetails.trim()))
      return 'Cardiovascular stop: record the adverse reaction and the action taken (every cardiovascular adverse event is reported via Yellow Card because this is off-label)';
    return null;
  }, [effectiveSummary, supply.alternativesOffered, isReview, cvStop, counselling.stopSeekHelpWritten, counselling.adverseReaction, counselling.adverseReactionDetails]);

  // ─── Consultation record ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    clearSaved();
    const stopReasons = clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message);
    const supplied = !isBlocked && !!dose;
    return {
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        nhsNumber: patient.nhsNumber,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        gpName: patient.gpName,
        gpPractice: patient.gpPractice,
        gpAddress: patient.gpAddress,
        gpPhone: patient.gpPhone,
        gpEmail: patient.gpEmail,
        gpOdsCode: patient.gpOdsCode,
      },
      clinicalData: {
        patient,
        consent,
        history,
        diagnosis,
        women: isWoman ? women : null,
        medicalHistory: medical,
        medicines,
        measurements,
        supply,
        counselling,
        summary,
        clinicalAlerts,
        pgdVersion: ORAL_MINOXIDIL_PGD_VERSION,
        pgdName: ORAL_MINOXIDIL_PGD_NAME,
        offLabelRecordWords: OFF_LABEL_RECORD_WORDS,
        offLabel: {
          licensedUse: 'Severe hypertension, 5 mg to 100 mg daily with a diuretic and a beta-blocker',
          basis: '2024 international consensus (Akiska et al.), 2021 safety series of 1,404 patients (Vano-Galvan et al.), 2024 randomised trial (Penha et al.), NICE MPG2',
          scriptGiven: consent.offLabelScriptGiven,
          toldLicenceAndAlternatives: consent.toldLicenceAndAlternatives,
          accepted: consent.acceptsOffLabel,
          consentStatementSigned: consent.consentStatementSigned,
        },
        suppliedUnderPgd: supplied,
        practitionerRole: 'pharmacist',
        /** Whether /api/me confirmed the practitioner as a pharmacist; where it could not, the supply rests on the self-declaration. */
        practitionerRoleVerified: roleVerified,
        practitionerRoleSource: roleVerified ? 'clinician record' : 'self-declaration only (role could not be verified)',
        registeredPharmacistConfirmed: summary.registeredPharmacistConfirmed,
        /** Course history carried forward from the previous oral minoxidil record, with any overrides and their reasons. */
        carriedForward: history.prefill
          ? {
              fromRecordId: history.prefill.recordId,
              fromConsultationDate: history.prefill.consultationDate,
              fields: history.prefill.fields,
              prefilledValues: history.prefill.values,
              overrides: history.prefill.overrides,
            }
          : null,
        supplyNumber,
        periodVisitNumber: visit,
        visitNumberSinceRestart: visitSinceRestart,
        suppliesCountedAgainstMaximum: counted,
        fullReviewVisit: repeatPhotosRequired(history),
        prescriberReviewSoughtToday: reviewSought,
        gapDays: gap,
        gapAwaitingReview: isContinuation && history.gapAwaitingReview,
        dose: supplied ? dose : null,
        doseLabel: supplied && doseInfo ? doseInfo.label : null,
        tablets: supplied ? tablets : null,
        product: supplied ? { name: PRODUCT.name, plNumber: PRODUCT.plNumber, batch: supply.batchNumber, expiry: supply.expiryDate } : null,
        labelWording: supplied && doseInfo ? `${doseInfo.labelWords}. ${LABEL_STOP_WORDING}` : null,
        nextReviewDate: supplied ? supply.nextReviewDate : null,
        doseIncrease: {
          usedBefore: increaseUsed(patient.sex, history),
          usedToday: isContinuation && supply.doseDecision === 'increase' && supplied,
          resumedToday: isContinuation && supply.doseDecision === 'resume' && supplied,
          onHigherDoseBefore: onHigherDose(patient.sex, history),
          onHigherDoseAfter: supplied && !!dose && dose === maximumDose(patient.sex),
        },
        restart: isReview
          ? { restartedBefore: history.restartedBefore || isRestart, suppliesSinceRestart: history.suppliesSinceRestart, nonCvStopBefore: history.previousNonCvStop === 'yes', nonCvStopRetriedBefore: history.nonCvStopRetriedBefore }
          : null,
        doseChange:
          isContinuation && (supply.doseDecision === 'increase' || supply.doseDecision === 'resume' || supply.doseDecision === 'reduce')
            ? { previousDose: history.currentDose, newDose: dose, decision: supply.doseDecision, reason: supply.doseDecision === 'reduce' ? supply.reductionReason : `inadequate response against baseline photographs${diagnosis.responseNote ? `: ${diagnosis.responseNote}` : ''}`, patientTold: supply.doseChangeToldPatient }
            : null,
        bloodPressure: {
          seated1: [measurements.seated1Systolic, measurements.seated1Diastolic],
          seated2: [measurements.seated2Systolic, measurements.seated2Diastolic],
          lowerRecorded: lower,
          repeat,
          effective,
          standing: [measurements.standingSystolic, measurements.standingDiastolic],
          posturalFall: fall,
          pulse,
          weightKg: measurements.weightKg,
          weightChangeKg: change,
          heightCm: isFirst ? measurements.heightCm : null,
          bmi: isFirst ? b : null,
          baselineSystolic: baselineToday,
          baselineSystolicDefinition: BASELINE_SYSTOLIC_DEFINITION,
          baselineSystolicRecordedToday: isFirst || isRestart,
        },
        cardiovascularStop: cvStop,
        referralUrgency: cvStop ? (sameDay ? 'same-day' : 'routine within a week') : null,
        exclusion: isBlocked
          ? {
              reasons: stopReasons,
              adviceGiven: effectiveSummary.exclusionAdvice,
              referral: effectiveSummary.referral,
              alternativesOffered: supply.alternativesOffered,
              // A patient who turned 66 finishes the supply in hand and is then referred: the record carries that supply.
              supplyInHand:
                over65 && isReview
                  ? { supplyType: history.supplyType, supplyNumber: history.suppliesSoFar, dose: history.currentDose, doseLabel: history.currentDose ? DOSE_INFO[history.currentDose].label : null, wording: 'Finishes the 8 week supply in hand, then referred to a prescriber; no further supply under this PGD' }
                  : null,
            }
          : null,
        gpNotification: { agreed: patient.gpNotificationAgreed === 'yes', within7Days: true, method: summary.gpNotificationMethod },
        adverseReaction: counselling.adverseReaction ? counselling.adverseReactionDetails : null,
        prescriberReviewHeld: history.prescriberReviewHeld ? { date: history.prescriberReviewDate, by: history.prescriberReviewBy, type: history.prescriberReviewType } : null,
        cvStopReview:
          history.previousCvStop === 'yes'
            ? { held: history.cvStopReviewHeld, date: history.cvStopReviewDate, by: history.cvStopReviewBy, type: history.cvStopReviewType, oedemaExamined: history.cvStopReviewOedemaExamined, repeatBloodPressure: history.cvStopReviewRepeatBp, symptomResolvedConfirmed: history.cvStopSymptomResolvedConfirmed }
            : null,
        contraceptionCaution:
          isWoman && cocMigraineAuraApplies(women, medical)
            ? { cocWithMigraineAura: true, triggeredAutomatically: !women.cocWithMigraineAura, migraineWithAuraRecorded: medical.migraineWithAura, prescriberReviewed: women.cocPrescriberReviewed, reviewOutcome: women.cocReviewOutcome, referralRecorded: women.cocReferralRecorded }
            : null,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked ? (REFERRAL_OUTCOMES.has(effectiveSummary.referral) ? 'referred' : 'not_supplied') : 'completed',
      ...(supplied && doseInfo
        ? {
            medicine: {
              name: `${PRODUCT.name}, ${PRODUCT.plNumber} (off-label, low dose)`,
              dose: doseInfo.label,
              duration: '8 weeks (56 days)',
              quantity: `${tablets} tablets`,
            },
          }
        : {}),
      summary: {
        pharmacistName: summary.pharmacistName,
        pharmacistGPhC: summary.pharmacistGPhC,
        pharmacyName: summary.pharmacyName,
        pharmacyAddress: summary.pharmacyAddress,
        consultationDate: summary.consultationDate,
        consultationTime: summary.consultationTime,
        clinicalNotes: summary.clinicalNotes,
      },
      consent: { notifyGp: patient.gpNotificationAgreed === 'yes' || !!consent.notifyGp },
    };
  }, [clearSaved, clinicalAlerts, isBlocked, dose, patient, consent, history, diagnosis, isWoman, women, medical, medicines, measurements, supply, counselling, summary, supplyNumber, visit, visitSinceRestart, counted, reviewSought, gap, doseInfo, tablets, isContinuation, isReview, isRestart, lower, repeat, effective, fall, pulse, change, isFirst, b, baselineToday, cvStop, sameDay, effectiveSummary, roleVerified, over65]);

  const handleNewConsultation = useCallback(() => {
    clearSaved();
    setDerived(null);
    setLookupState('idle');
    setLookupKey('');
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatient({ ...initialOMPatientDetails });
    setConsent({ ...initialOMConsent });
    setHistory({ ...initialOMSupplyHistory });
    setDiagnosis({ ...initialOMDiagnosis });
    setWomen({ ...initialOMWomen });
    setMedical({ ...initialOMMedicalHistory });
    setMedicines({ ...initialOMMedicines });
    setMeasurements({ ...initialOMMeasurements });
    setSupply({ ...initialOMSupply });
    setCounselling({ ...initialOMCounselling });
    setSummary(initialOMSummary());
    setStopSaveStatus('idle');
    setStopSaveAttempted(false);
  }, [clearSaved]);

  // While a stop is on screen the record is saved through the exclusion
  // block, which insists on the advice, alternatives and referral the
  // document requires (same reasoning as the hepatitis A tool). A technician
  // profile saves nothing: the PGD does not cover them at all.
  const wrapperShared = {
    isBlocked: blockedHere,
    getConsultationData: isBlocked || technicianProfile ? undefined : getConsultationData,
    onNewConsultation: handleNewConsultation,
  };

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
    (data.clinicalData as Record<string, unknown>).stopReason = clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message).join('; ');
    const ok = await saveRecord(data);
    if (!ok) {
      setStopSaveStatus('error');
      return;
    }
    resetTracking();
    handleNewConsultation();
  }, [exclusionOutcomeError, getConsultationData, currentStep, clinicalAlerts, saveRecord, resetTracking, handleNewConsultation]);

  const technicianBlock = technicianProfile ? (
    <div className="mb-6 rounded-lg border border-red-400 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">Pharmacists only: this PGD is not used by pharmacy technicians</p>
      <p className="mt-1 text-xs text-red-800">
        Your practitioner record is a pharmacy technician. The diagnosis, the cardiovascular screen and the off-label consent are the pharmacist&apos;s and are not delegated. This consultation cannot proceed or be saved under your login; a registered pharmacist named under this PGD must conduct it.
      </p>
    </div>
  ) : roleUnknown ? (
    <div className="mb-6 rounded-lg border border-amber-400 bg-amber-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-amber-900">Practitioner role could not be verified</p>
      <p className="mt-1 text-xs text-amber-900">
        Your login did not return a practitioner role (pharmacist or technician), so the tool cannot confirm from your clinician record that you are a pharmacist. This PGD is for pharmacists only and is not used by pharmacy technicians. The supply rests on your declaration on the Summary step (&quot;I am a pharmacist registered and practising with the GPhC&quot;), which is required, and the record says the role could not be verified. If you are a pharmacy technician, stop here.
      </p>
    </div>
  ) : null;

  const exclusionOutcomeBlock = isBlocked && !technicianProfile ? (
    <div className="mb-6 space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        {isDeclined ? 'Patient declines: record the advice given and the decision' : cvStop ? 'CARDIOVASCULAR STOP: not supplied. Record the advice given, the referral and the decision' : 'Not supplied under this PGD: record the reason, the advice given and the decision'}
      </p>
      <p className="text-xs text-red-800">
        Explain the reason. Offer the licensed alternatives (topical minoxidil 5%, a pharmacy medicine for men and women; for men, finasteride under the Male Pattern Hair Loss PGD where its criteria are met) and record which was offered. Where the hair loss pattern is not androgenetic, refer to the GP for diagnosis rather than offering any treatment. Then save the record with the button below. To change an answer instead, go back to the step it was given on: the stop clears when the answer does.
      </p>
      {cvStop && (
        <p className="text-xs font-semibold text-red-900">
          Tell the patient to stop the tablets, give the stop-and-seek-help advice in writing, and refer: {sameDay ? 'the same day (chest pain, breathlessness, palpitations, fainting, facial swelling, or 180/120 or above)' : 'to the GP within a week'}. No dose reduction. No further supply under this PGD until a prescriber has reviewed the patient and confirmed in writing that treatment may restart. Report the event via Yellow Card (every cardiovascular adverse event, however minor, because this is off-label). Inform the GP within 7 days.
          {currentStep < STEP.measurements ? ' Record today\'s blood pressure, pulse and weight on the Measurements step before saving, so the not-supplied record carries them.' : ''}
        </p>
      )}
      {over65 && isReview && (
        <p className="text-xs font-semibold text-red-900">
          Turned 66 during treatment: finishes the supply in hand ({history.supplyType === 'restart' ? 'restart' : 'continuation'} course, supply {history.suppliesSoFar ?? '?'}, {history.currentDose ? DOSE_INFO[history.currentDose].label : 'dose not recorded'}), then referred to a prescriber; no further supply under this PGD.
        </p>
      )}
      {bpHighOnRepeat && (
        <p className="text-xs font-semibold text-red-900">
          Blood pressure reading: say so plainly and advise the patient to have it assessed by their GP whatever they decide about hair loss: routinely for 140/90 to 179/119; the same day for 180/120 or above, or for chest pain, breathlessness, headache with visual change or confusion.
        </p>
      )}
      {bpOutsideOnRepeat && isFirst && (
        <p className="text-xs font-semibold text-red-900">
          {!returnVisitAvailable
            ? 'This was the one permitted return visit and the reading is outside the limits again: refer to the GP for assessment and do not supply.'
            : 'A patient outside the limits on repeat at a first visit (high or low blood pressure, a postural fall, or the pulse) may return once on another day; outside the limits again, refer to the GP for assessment.'}
        </p>
      )}
      {noResults && (
        <p className="text-xs font-semibold text-red-900">
          Advise her to ask her GP for ferritin and thyroid function tests, or to arrange a private test, and to return with the results. She is not supplied today.
        </p>
      )}
      {cocFirst && (
        <p className="text-xs font-semibold text-red-900">
          Combined hormonal contraception with migraine with aura: do not make a first supply until her prescriber has reviewed the method and she attends with the outcome. Advise her to see her GP or sexual health service about the method and to return with the outcome; record the advice.
        </p>
      )}
      {notAndrogenetic && (
        <p className="text-xs font-semibold text-red-900">
          Hair loss not clearly androgenetic, or heavy shedding persisting beyond 12 weeks of treatment: refer to the GP for diagnosis rather than offering any treatment. Scarring alopecia, alopecia areata, telogen effluvium and tinea capitis need a diagnosis first.
        </p>
      )}
      {sixSupplies && !cvReviewFaceToFaceNeeded && (
        <p className="text-xs font-semibold text-red-900">
          Prescriber review: the patient&apos;s GP, or where the GP declines a Get Real Health prescriber by face to face or video consultation, reviews the blood pressure, pulse and weight record, the photographs and the side effects, and confirms in writing that treatment may continue. Hold that written confirmation in the record before any further supply.
        </p>
      )}
      {cvReviewFaceToFaceNeeded && (
        <p className="text-xs font-semibold text-red-900">
          Restart after a cardiovascular stop: the prescriber review must be FACE TO FACE (the GP, or a Get Real Health prescriber in person) with examination for oedema and a repeat blood pressure, and the written confirmation must say the symptom has resolved off treatment. A video or telephone review is not acceptable here. Hold that written confirmation in the record before any restart.
        </p>
      )}
      <SelectInput
        label="Licensed alternatives offered"
        value={supply.alternativesOffered}
        onChange={(v) => setSupply({ ...supply, alternativesOffered: v as OMSupply['alternativesOffered'] })}
        options={[
          { value: 'topical', label: 'Topical minoxidil 5% (pharmacy medicine)' },
          ...(isMan ? [{ value: 'finasteride', label: 'Finasteride under the Male Pattern Hair Loss PGD' }, { value: 'both', label: 'Topical minoxidil 5% and finasteride under the Male Pattern Hair Loss PGD' }] : []),
          { value: 'none', label: 'None offered: referred to the GP for diagnosis first' },
        ]}
        required
      />
      {isReview && cvStop && (
        <>
          <Checkbox
            label="Stop-and-seek-help advice given in writing"
            checked={counselling.stopSeekHelpWritten}
            onChange={(v) => setCounselling({ ...counselling, stopSeekHelpWritten: v })}
            required
          />
          <Checkbox
            label="Adverse reaction recorded (Yellow Card report; GP informed within 7 days)"
            checked={counselling.adverseReaction}
            onChange={(v) => setCounselling({ ...counselling, adverseReaction: v, ...(v ? {} : { adverseReactionDetails: '' }) })}
            description="Every cardiovascular adverse event is reported via yellowcard.mhra.gov.uk, however minor, because this is an off-label use"
            required
          />
          {counselling.adverseReaction && (
            <TextArea
              label="Adverse reaction and action taken"
              value={counselling.adverseReactionDetails}
              onChange={(v) => setCounselling({ ...counselling, adverseReactionDetails: v })}
              placeholder="e.g. ankle swelling since week 3 on 2.5 mg; tablets stopped; Yellow Card submitted; GP letter sent"
              rows={2}
              required
            />
          )}
        </>
      )}
      <TextArea
        label="Reason for exclusion discussed, advice given and decision reached"
        value={summary.exclusionAdvice}
        onChange={(v) => setSummary({ ...summary, exclusionAdvice: v })}
        placeholder="e.g. BP 146/92 on repeat: explained, advised routine GP assessment; topical minoxidil 5% offered; may return once on another day"
        rows={3}
        required
      />
      <SelectInput
        label="Referral or next action"
        value={effectiveSummary.referral}
        onChange={(v) => setSummary({ ...summary, referral: v as ExclusionReferral })}
        options={referralOptions}
        required
      />
      {stopSaveAttempted && exclusionOutcomeError && <p className="text-xs font-medium text-red-700">{exclusionOutcomeError}</p>}
      {stopSaveStatus === 'error' && <p className="text-xs font-medium text-red-700">Could not save the consultation record. Try again, or print this page as a backup.</p>}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSaveStopAndNew}
          disabled={stopSaveStatus === 'saving'}
          className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
        >
          {stopSaveStatus === 'saving' ? 'Saving...' : 'Save as not supplied and start a new consultation'}
        </button>
        <span className="text-xs text-red-800">
          Saved as {REFERRAL_OUTCOMES.has(effectiveSummary.referral) ? '"referred"' : '"not supplied"'}, then the form is cleared for the next patient.
        </span>
      </div>
    </div>
  ) : null;

  const declineBlock =
    currentStep >= STEP.consent && currentStep <= STEP.counselling ? (
      <div className="mt-6 border-t pt-4 print:hidden">
        <Checkbox
          label="The patient declines treatment after counselling"
          checked={consent.patientDeclined}
          onChange={(v) => setConsent({ ...consent, patientDeclined: v })}
          description="The tool stops here. Record the reason discussed, the alternatives offered and the decision reached, then save the record"
        />
      </div>
    ) : null;

  const stepProps = (i: number, description: string) => ({
    title: STEP_LABELS[i],
    description,
    currentStep,
    totalSteps: STEP_LABELS.length,
    onNext: handleNext,
    onPrev: handlePrev,
    canProceed: canProceedByStep[i],
    validationError: errors[i],
    ...wrapperShared,
  });

  return (
    <>
      <div className="mb-3 flex justify-end">
        <SaveDraftButton pgdSlug="oral-minoxidil" patientFirstName={patient.firstName} patientLastName={patient.lastName} patientDob={patient.dateOfBirth} getDraftState={() => formState} />
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

      {technicianBlock}
      {(currentStep >= STEP.history || isBlocked) && clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}
      {exclusionOutcomeBlock}

      {/* Step 0: Patient Details */}
      {currentStep === STEP.patient && (
        <StepWrapper {...stepProps(STEP.patient, 'Patient information; age is calculated from the date of birth')}>
          <p className="mb-4 text-xs text-gray-600">
            Adults aged 18 to 65 at every supply, men and women, with androgenetic alopecia. Pharmacists only; face to face on the premises. The record must carry the patient&apos;s name, address, date of birth, sex and the GP with whom they are registered. {ORAL_MINOXIDIL_PGD_VERSION}.
          </p>
          <PatientDetailsStep
            patient={patient}
            onChange={handlePatientChange}
            requireAdult
            onReturningPatient={(p: Partial<BasePatientDetails>) => {
              if (patient.sex) void lookupPrevious(p, patient.sex);
            }}
          />
          {lookupState === 'found' && history.prefill && (
            <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
              <p className="font-semibold">This patient has a previous oral minoxidil record at this pharmacy ({history.prefill.consultationDate})</p>
              <p className="mt-1">{describePrefill(history.prefill)}. The course history has been carried forward to the Supply Type and History step, where it is shown read-only; any change there needs a reason.</p>
            </div>
          )}
          {patient.age !== null && patient.age > 65 && (
            <div className="mt-3 space-y-3 rounded-lg border border-red-300 bg-red-50 p-3">
              <p className="text-xs text-red-700">Over 65 at the time of supply: this PGD is for adults aged 18 to 65 at every supply. A patient who turns 66 during treatment finishes the supply in hand and is then referred to a prescriber; no further supply under this PGD. Record the supply in hand so the record carries it.</p>
              <SelectInput
                label="Supply in hand"
                value={history.supplyType}
                onChange={(v) => setHistory({ ...history, supplyType: v as SupplyType })}
                options={[
                  { value: 'first', label: 'None: this would have been a first supply' },
                  { value: 'continuation', label: 'Continuation course: finishes the supply in hand' },
                  { value: 'restart', label: 'Restart course: finishes the supply in hand' },
                ]}
              />
              {isReview && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <DateField label="Date of the first supply" value={history.firstSupplyDate} onChange={(v) => setHistory({ ...history, firstSupplyDate: v })} />
                  <NumberInput label="Supplies so far (the supply in hand is the last)" value={history.suppliesSoFar} onChange={(v) => setHistory({ ...history, suppliesSoFar: v === null ? null : Math.floor(v) })} min={1} />
                  <SelectInput
                    label="Dose of the supply in hand"
                    value={history.currentDose}
                    onChange={(v) => setHistory({ ...history, currentDose: v as Dose, ...(v && v === maximumDose(patient.sex) ? { doseIncreasedBefore: true } : {}) })}
                    options={dosesForSex(patient.sex).map((d) => ({ value: d, label: DOSE_INFO[d].label }))}
                  />
                </div>
              )}
            </div>
          )}
          <div className="mt-4 space-y-4">
            <SelectInput
              label="Sex"
              value={patient.sex}
              onChange={(v) => handlePatientChange('sex', v as Sex)}
              options={[
                { value: 'male', label: 'Male (starting dose 2.5 mg once daily)' },
                { value: 'female', label: 'Female (starting dose 1.25 mg once daily; ferritin, thyroid and pregnancy checks apply)' },
              ]}
              required
            />
            <SelectInput
              label="Is the patient registered with a GP?"
              value={patient.gpRegistered}
              onChange={(v) => handlePatientChange('gpRegistered', v as OMPatientDetails['gpRegistered'])}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No (exclusion: GP notification is a condition of supply)' },
              ]}
              required
            />
            <SelectInput
              label="Does the patient agree to the GP being informed of the supply, of any dose change and of any stop for a side effect, within 7 days?"
              value={patient.gpNotificationAgreed}
              onChange={(v) => handlePatientChange('gpNotificationAgreed', v as OMPatientDetails['gpNotificationAgreed'])}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No (exclusion: a patient who will not allow the GP to be told is not supplied)' },
              ]}
              required
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 1: Consent */}
      {currentStep === STEP.consent && (
        <StepWrapper {...stepProps(STEP.consent, 'Off-label consent, informed consent, ID and the private service')}>
          <div className="mb-6 space-y-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">OFF-LABEL SUPPLY: consent script (give in substance, then record)</p>
            <p className="text-xs text-amber-900">
              Minoxidil tablets are licensed for severe hypertension only, at 5 mg to 100 mg daily with a diuretic and a beta-blocker. Use for hair loss at 1.25 mg to 5 mg daily, taken alone, is off-label. The basis for authorising it under this PGD is the 2024 international consensus statement, the published safety series of 1,404 patients and the 2024 randomised trial (NICE MPG2 permits off-label use under a PGD where it is justified by best clinical practice and the PGD says so).
            </p>
            <blockquote className="rounded border border-amber-300 bg-white p-3 text-sm text-navy-900 italic">&quot;{OFF_LABEL_CONSENT_SCRIPT}&quot;</blockquote>
            <Checkbox label="The off-label consent script above was given in substance" checked={consent.offLabelScriptGiven} onChange={(v) => setConsent({ ...consent, offLabelScriptGiven: v })} required />
            <Checkbox
              label="The patient was told the supply is off-label, what the licence is for, why it is being used, and the alternatives (topical minoxidil; for men, finasteride)"
              checked={consent.toldLicenceAndAlternatives}
              onChange={(v) => setConsent({ ...consent, toldLicenceAndAlternatives: v })}
              required
            />
            <SelectInput
              label="Does the patient accept off-label treatment after the explanation?"
              value={consent.acceptsOffLabel}
              onChange={(v) => setConsent({ ...consent, acceptsOffLabel: v as OMConsent['acceptsOffLabel'] })}
              options={[
                { value: 'yes', label: 'Yes: happy to go ahead on that basis' },
                { value: 'no', label: 'No (exclusion: offer the licensed alternatives)' },
              ]}
              required
            />
            <p className="text-xs font-semibold text-amber-900">Consent statement the patient signs (Appendix 3; printed verbatim above the signature line on the record)</p>
            <blockquote className="rounded border border-amber-300 bg-white p-3 text-xs text-navy-900">&quot;{PATIENT_CONSENT_STATEMENT}&quot;</blockquote>
            <Checkbox
              label="The patient signs the consent statement on the consultation record"
              checked={consent.consentStatementSigned}
              onChange={(v) => setConsent({ ...consent, consentStatementSigned: v })}
              description="The statement and signature line print on the record (Summary step); the record says the statement was signed"
              required
            />
          </div>
          <div className="mb-6 space-y-3 border-b pb-6">
            <Checkbox
              label="Consultation is face to face on the pharmacy premises"
              checked={consent.faceToFace}
              onChange={(v) => setConsent({ ...consent, faceToFace: v })}
              description="Remote or telephone consultation is outside this PGD: the scalp is examined and the blood pressure measured on the premises by the pharmacist who supplies"
              required
            />
            <Checkbox
              label="The patient lacks capacity to consent (exclusion)"
              checked={consent.lacksCapacity}
              onChange={(v) => setConsent({ ...consent, lacksCapacity: v })}
              description="Mental Capacity Act 2005: valid informed consent is a condition of supply"
            />
          </div>
          <ConsentStep consent={consent} onChange={(field, value) => setConsent({ ...consent, [field]: value })} />
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox
              label="The patient understands what this service costs"
              checked={consent.understandsCost}
              onChange={(v) => setConsent({ ...consent, understandsCost: v })}
              description="Supply under this PGD is a private service"
              required
            />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 2: Supply Type and History */}
      {currentStep === STEP.history && (
        <StepWrapper {...stepProps(STEP.history, 'First supply, continuation or restart; the count of supplies; the stop symptoms since the last visit')}>
          <div className="space-y-4">
            <SelectInput
              label="Supply type"
              value={history.supplyType}
              onChange={(v) => {
                const base: OMSupplyHistory = { ...initialOMSupplyHistory, onFinasteride: history.onFinasteride, finasterideSource: history.finasterideSource, onTopicalMinoxidil: history.onTopicalMinoxidil, topicalMinoxidilSource: history.topicalMinoxidilSource, oralMinoxidilElsewhere: history.oralMinoxidilElsewhere, supplyType: v as SupplyType };
                // Re-selecting the supply type resets the course history, but never the values carried forward from the previous record.
                setHistory(derived ? applyPrefill(base, derived) : history.prefill ? ({ ...base, ...(history.prefill.values as Partial<OMSupplyHistory>), prefill: { ...history.prefill, overrides: {} } } as OMSupplyHistory) : base);
              }}
              options={(Object.keys(SUPPLY_TYPE_LABEL) as Exclude<SupplyType, ''>[]).map((t) => ({ value: t, label: SUPPLY_TYPE_LABEL[t] }))}
              required
            />
            <p className="text-xs text-gray-600">
              Every supply is 8 weeks (56 days) and is numbered, with a review at each. Everything runs on the supply number, not the calendar: a full review with repeat photographs at supply visits 4 and 6; the dose increase at or after supply visit 4; the prescriber review sought at supply visit 6 and complete before supply 7. Maximum six supplies under this PGD, counted by supply number from the first supply and not reset by a gap or restart. A gap of more than 4 weeks without tablets is a restart at the starting dose with a new baseline blood pressure, unless it was caused only by waiting for the prescriber review after supply 6 and the patient has been off tablets for no more than 8 weeks. A return after a cardiovascular stop is always a restart, after the face to face prescriber review.
            </p>

            {lookupState === 'loading' && <p className="text-xs text-gray-500">Looking up the patient&apos;s previous oral minoxidil record at this pharmacy...</p>}
            {lookupState === 'none' && <p className="text-xs text-gray-500">No previous oral minoxidil record for this patient at this pharmacy: the course history is entered by hand.</p>}
            {history.prefill && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                <p className="font-semibold">Carried forward from the previous record ({history.prefill.consultationDate}, record {history.prefill.recordId.slice(0, 8)})</p>
                <p className="mt-1">{describePrefill(history.prefill)}.{history.prefill.expectedRunOutDate ? ` That supply was expected to run out on ${history.prefill.expectedRunOutDate}.` : ''} Carried-forward values are read-only below; each has an &quot;Edit (reason required)&quot; control, and the record stores the prefilled value, the change and the reason.</p>
              </div>
            )}

            {isReview && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Course so far</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Prefilled field="firstSupplyDate" label="Date of the first supply under this PGD" display={history.firstSupplyDate || 'not recorded'} history={history} setHistory={setHistory}>
                    <DateField label="Date of the first supply under this PGD" value={history.firstSupplyDate} onChange={(v) => setHistory({ ...history, firstSupplyDate: v })} required />
                  </Prefilled>
                  <Prefilled field="suppliesSoFar" label="Supplies so far under this PGD" display={history.suppliesSoFar !== null ? `${history.suppliesSoFar}` : 'not recorded'} history={history} setHistory={setHistory}>
                    <NumberInput label="Supplies so far under this PGD (by supply number from the first supply; not reset by a gap or restart)" value={history.suppliesSoFar} onChange={(v) => setHistory({ ...history, suppliesSoFar: v === null ? null : Math.floor(v) })} min={1} required />
                  </Prefilled>
                </div>
                {supplyNumber !== null && (
                  <p className={`text-xs ${counted !== null && counted >= MAX_SUPPLIES ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>
                    Today is supply number {supplyNumber} from the first supply{history.prescriberReviewHeld && visit !== null ? `, supply visit ${visit} of the period since the prescriber review` : ''}. {counted !== null && counted >= MAX_SUPPLIES ? `${counted} supplies completed without a documented prescriber review since: no further supply until the written confirmation is held.` : `${counted ?? 0} of ${MAX_SUPPLIES} supplies used ${history.prescriberReviewHeld ? 'since the prescriber review' : 'under this PGD'}.`}
                    {repeatPhotosRequired(history) ? ` Supply visit ${visit}: a full review with repeat photographs and a response assessment.` : ''}
                    {reviewSought ? ' The record of this visit is sent for the prescriber review, which must be complete before a seventh supply.' : ''}
                  </p>
                )}
                <Prefilled field="prescriberReviewHeld" label="Documented prescriber review held" display={history.prescriberReviewHeld ? `Yes: ${history.prescriberReviewDate || 'date not recorded'}, ${history.prescriberReviewBy || 'prescriber not recorded'}` : 'No'} history={history} setHistory={setHistory}>
                  <Checkbox
                    label="A documented prescriber review has been held, with written confirmation that treatment may continue"
                    checked={history.prescriberReviewHeld}
                    onChange={(v) => setHistory({ ...history, prescriberReviewHeld: v, ...(v ? {} : { prescriberReviewDate: '', prescriberReviewBy: '', prescriberReviewType: '' as const, suppliesSinceReview: null, gapAwaitingReview: false }) })}
                    description="Required before any seventh supply. The GP, or where the GP declines a Get Real Health prescriber by face to face or video consultation, reviews the blood pressure, pulse and weight record, the photographs and the side effects. The pharmacist holds the written confirmation in the record; a further period of up to six supplies may then follow (the once-only dose increase does not reset)"
                  />
                </Prefilled>
                {history.prescriberReviewHeld && (
                  <div className="ml-6 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <DateField label="Date of the written confirmation" value={history.prescriberReviewDate} onChange={(v) => setHistory({ ...history, prescriberReviewDate: v })} required />
                      <TextInput label="Prescriber (name and role)" value={history.prescriberReviewBy} onChange={(v) => setHistory({ ...history, prescriberReviewBy: v })} placeholder="e.g. Dr A Smith, GP" required />
                      <Prefilled field="suppliesSinceReview" label="Supplies since that review" display={history.suppliesSinceReview !== null ? `${history.suppliesSinceReview}` : 'not recorded'} history={history} setHistory={setHistory}>
                        <NumberInput label="Supplies since that review" value={history.suppliesSinceReview} onChange={(v) => setHistory({ ...history, suppliesSinceReview: v === null ? null : Math.floor(v) })} min={0} required />
                      </Prefilled>
                    </div>
                    <SelectInput
                      label="How the review was held"
                      value={history.prescriberReviewType}
                      onChange={(v) => setHistory({ ...history, prescriberReviewType: v as PrescriberReviewType })}
                      options={(Object.keys(PRESCRIBER_REVIEW_TYPE_LABEL) as Exclude<PrescriberReviewType, ''>[]).map((t) => ({ value: t, label: PRESCRIBER_REVIEW_TYPE_LABEL[t] }))}
                      required
                    />
                  </div>
                )}
                <Prefilled field="currentDose" label={isRestart ? 'Dose the patient was taking before the gap' : 'Dose the patient has been taking'} display={history.currentDose ? DOSE_INFO[history.currentDose].label : 'not recorded'} history={history} setHistory={setHistory}>
                  <SelectInput
                    label={isRestart ? 'Dose the patient was taking before the gap' : 'Dose the patient has been taking'}
                    value={history.currentDose}
                    onChange={(v) => setHistory({ ...history, currentDose: v as Dose, ...(v && v === maximumDose(patient.sex) ? { doseIncreasedBefore: true } : {}) })}
                    options={dosesForSex(patient.sex).map((d) => ({ value: d, label: DOSE_INFO[d].label }))}
                    required
                  />
                </Prefilled>
                {onHigherDose(patient.sex, history) && (
                  <p className="text-xs text-amber-800">The higher dose is only reached by the once-only increase, so &quot;the dose increase has already been used&quot; is set and cannot be unticked. It needs at least {4} supplies so far{isContinuation && history.restartedBefore ? ', and at least 4 since the restart' : ''}.</p>
                )}
                <Prefilled field="doseIncreasedBefore" label="Dose increase used at some point in the course" display={increaseUsed(patient.sex, history) ? 'Yes' : 'No'} history={history} setHistory={setHistory}>
                  <Checkbox
                    label="The dose increase has already been used at some point in this patient's course"
                    checked={increaseUsed(patient.sex, history)}
                    onChange={(v) => setHistory({ ...history, doseIncreasedBefore: onHigherDose(patient.sex, history) ? true : v })}
                    description="Once in the whole course: no second increase under this PGD, and none in a later period after a prescriber review. A patient who used it and then restarted at the starting dose may resume the higher dose at or after the fourth supply visit following the restart. Set automatically where the patient is on the higher dose"
                  />
                </Prefilled>
                {isContinuation && (
                  <>
                    <Prefilled field="restartedBefore" label="Restarted at the starting dose before" display={history.restartedBefore ? 'Yes' : 'No'} history={history} setHistory={setHistory}>
                      <Checkbox
                        label="The course has been restarted at the starting dose after a gap at some point since the first supply"
                        checked={history.restartedBefore}
                        onChange={(v) => setHistory({ ...history, restartedBefore: v, ...(v ? {} : { suppliesSinceRestart: null }) })}
                        description="The baseline systolic is then the one recorded at the most recent restart; resuming a previously used higher dose is counted from that restart"
                      />
                    </Prefilled>
                    {history.restartedBefore && (
                      <div className="ml-6">
                        <Prefilled field="suppliesSinceRestart" label="Supplies since the most recent restart" display={history.suppliesSinceRestart !== null ? `${history.suppliesSinceRestart}` : 'not recorded'} history={history} setHistory={setHistory}>
                          <NumberInput label="Supplies since the most recent restart (counting the restart supply as 1)" value={history.suppliesSinceRestart} onChange={(v) => setHistory({ ...history, suppliesSinceRestart: v === null ? null : Math.floor(v) })} min={1} required />
                        </Prefilled>
                        {visitSinceRestart !== null && <p className="mt-1 text-xs text-gray-600">Today is supply visit {visitSinceRestart} since the restart.</p>}
                      </div>
                    )}
                  </>
                )}
                <div className="grid sm:grid-cols-3 gap-4">
                  <DateField label="Date the last tablet was taken" value={history.lastTabletDate} onChange={(v) => setHistory({ ...history, lastTabletDate: v })} required hint={gap !== null ? `${gap} days without tablets${history.previousCvStop === 'yes' ? ' (after a cardiovascular stop the return is a restart whatever the gap)' : gap > RESTART_GAP_DAYS ? (gap > AWAITING_REVIEW_MAX_GAP_DAYS ? ': more than 8 weeks, a restart' : ': more than 4 weeks, a restart unless waiting only for the prescriber review after supply 6') : ''}` : undefined} />
                  {isContinuation ? (
                    <Prefilled field="previousWeightKg" label="Weight at the previous supply" display={history.previousWeightKg !== null ? `${history.previousWeightKg} kg` : 'not recorded'} history={history} setHistory={setHistory}>
                      <NumberInput label="Weight at the previous supply" value={history.previousWeightKg} onChange={(v) => setHistory({ ...history, previousWeightKg: v })} unit="kg" required />
                    </Prefilled>
                  ) : (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                      Restart: the weight comparison starts afresh. Today&apos;s weight (Measurements step) becomes the new previous weight; the 2 kg rule is not applied today{history.previousWeightKg !== null ? ` (last recorded weight ${history.previousWeightKg} kg, for information only)` : ''}.
                    </div>
                  )}
                  {isContinuation ? (
                    <Prefilled field="baselineSystolic" label="Baseline systolic" display={history.baselineSystolic !== null ? `${history.baselineSystolic} mmHg` : 'not recorded'} history={history} setHistory={setHistory}>
                      <NumberInput label="Baseline systolic: the lower seated systolic at the first supply, or at the most recent restart" value={history.baselineSystolic} onChange={(v) => setHistory({ ...history, baselineSystolic: v })} unit="mmHg" required />
                    </Prefilled>
                  ) : (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                      Restart: a NEW baseline blood pressure is recorded today. Today&apos;s lower seated systolic (Measurements step) becomes the baseline for the 10 mmHg dose rule.
                    </div>
                  )}
                </div>
                {isContinuation && gap !== null && gap > RESTART_GAP_DAYS && gap <= AWAITING_REVIEW_MAX_GAP_DAYS && (
                  <Checkbox
                    label="The gap was caused only by waiting for the prescriber review after supply 6 (not a restart provided the patient has been off tablets for no more than 8 weeks)"
                    checked={history.gapAwaitingReview}
                    onChange={(v) => setHistory({ ...history, gapAwaitingReview: v })}
                    description="Applies only after six supplies, with the prescriber review now held and no supply made since it. Otherwise select Restart as the supply type"
                  />
                )}
                {isContinuation && gap !== null && gap > RESTART_GAP_DAYS && gapIsRestart(history) === false && (
                  <p className="text-xs text-gray-600">The awaiting-review exception applies: continue at the recorded dose.</p>
                )}
                <Prefilled field="previousCvStop" label="Returning after a cardiovascular stop" display={history.previousCvStop === 'yes' ? 'Yes' : history.previousCvStop === 'no' ? 'No' : 'not recorded'} history={history} setHistory={setHistory}>
                  <SelectInput
                    label="Is the patient returning after a course under this PGD was stopped for a cardiovascular stop (weight gain of 2 kg or more, swelling, dizziness or faintness, palpitations, chest pain, breathlessness, fainting, or blood pressure or pulse outside the limits) that has not yet been followed by a restart?"
                    value={history.previousCvStop}
                    onChange={(v) => setHistory({ ...history, previousCvStop: v as OMSupplyHistory['previousCvStop'], ...(v === 'yes' ? {} : { cvStopReviewHeld: false, cvStopReviewDate: '', cvStopReviewBy: '', cvStopReviewType: '' as const, cvStopSymptomResolvedConfirmed: false, cvStopReviewOedemaExamined: false, cvStopReviewRepeatBp: false }) })}
                    options={[
                      { value: 'no', label: 'No' },
                      { value: 'yes', label: 'Yes (the return is a restart at the starting dose, whatever the gap, after the face to face prescriber review)' },
                    ]}
                    required
                  />
                </Prefilled>
                {history.previousCvStop === 'yes' && (
                  <div className="ml-6 space-y-3">
                    <Checkbox
                      label="A prescriber has since reviewed the patient FACE TO FACE and confirmed in writing that treatment may restart (confirmation held in the record)"
                      checked={history.cvStopReviewHeld}
                      onChange={(v) => setHistory({ ...history, cvStopReviewHeld: v, ...(v ? {} : { cvStopReviewDate: '', cvStopReviewBy: '', cvStopReviewType: '' as const, cvStopSymptomResolvedConfirmed: false, cvStopReviewOedemaExamined: false, cvStopReviewRepeatBp: false }) })}
                      description="The GP, or a Get Real Health prescriber in person, with examination for oedema and a repeat blood pressure. Video or telephone is not acceptable after a cardiovascular stop. Without this, no restart under this PGD, whichever supply type is chosen and however short the gap"
                    />
                    {history.cvStopReviewHeld && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <DateField label="Date of the written confirmation" value={history.cvStopReviewDate} onChange={(v) => setHistory({ ...history, cvStopReviewDate: v })} required />
                          <TextInput label="Prescriber (name and role)" value={history.cvStopReviewBy} onChange={(v) => setHistory({ ...history, cvStopReviewBy: v })} placeholder="e.g. Dr A Smith, GP" required />
                        </div>
                        <SelectInput
                          label="How the review was held"
                          value={history.cvStopReviewType}
                          onChange={(v) => setHistory({ ...history, cvStopReviewType: v as CvStopReviewType })}
                          options={(Object.keys(CV_STOP_REVIEW_TYPE_LABEL) as Exclude<CvStopReviewType, ''>[]).map((t) => ({ value: t, label: CV_STOP_REVIEW_TYPE_LABEL[t] }))}
                          required
                        />
                        <Checkbox
                          label="The review included examination for oedema"
                          checked={history.cvStopReviewOedemaExamined}
                          onChange={(v) => setHistory({ ...history, cvStopReviewOedemaExamined: v })}
                          required
                        />
                        <Checkbox
                          label="The review included a repeat blood pressure"
                          checked={history.cvStopReviewRepeatBp}
                          onChange={(v) => setHistory({ ...history, cvStopReviewRepeatBp: v })}
                          required
                        />
                        <Checkbox
                          label="The written confirmation says the symptom has resolved off treatment"
                          checked={history.cvStopSymptomResolvedConfirmed}
                          onChange={(v) => setHistory({ ...history, cvStopSymptomResolvedConfirmed: v })}
                          required
                        />
                      </>
                    )}
                  </div>
                )}
                <Prefilled field="previousNonCvStop" label="Previous non-cardiovascular stop (starting dose not tolerated)" display={history.previousNonCvStop === 'yes' ? 'Yes' : history.previousNonCvStop === 'no' ? 'No' : 'not recorded'} history={history} setHistory={setHistory}>
                  <SelectInput
                    label="Was a course under this PGD previously stopped because the starting dose was not tolerated (a non-cardiovascular stop)?"
                    value={history.previousNonCvStop}
                    onChange={(v) => setHistory({ ...history, previousNonCvStop: v as OMSupplyHistory['previousNonCvStop'], ...(v === 'yes' ? {} : { nonCvStopRetriedBefore: false }) })}
                    options={[
                      { value: 'no', label: 'No' },
                      { value: 'yes', label: 'Yes' },
                    ]}
                    required
                  />
                </Prefilled>
                {history.previousNonCvStop === 'yes' && (
                  <div className="ml-6">
                    <Prefilled field="nonCvStopRetriedBefore" label="Starting dose tried once more and not tolerated again" display={history.nonCvStopRetriedBefore ? 'Yes (the PGD no longer applies)' : 'No'} history={history} setHistory={setHistory}>
                      <Checkbox
                        label="After that stop, the starting dose was tried once more and was not tolerated again"
                        checked={history.nonCvStopRetriedBefore}
                        onChange={(v) => setHistory({ ...history, nonCvStopRetriedBefore: v })}
                        description="The patient may try the starting dose once more at a later date, after which the PGD does not apply. Tick this where that one further try has already been made and failed"
                      />
                    </Prefilled>
                  </div>
                )}
                {history.returnVisitUsedBefore && (
                  <Prefilled field="returnVisitUsedBefore" label="One return visit after a reading outside the limits" display="Used at the previous first visit" history={history} setHistory={setHistory}>
                    <Checkbox label="The one permitted return visit after a reading outside the limits on repeat at a first visit has already been used" checked={history.returnVisitUsedBefore} onChange={(v) => setHistory({ ...history, returnVisitUsedBefore: v })} />
                  </Prefilled>
                )}
              </div>
            )}

            {isFirst && history.returnVisitUsedBefore && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                Carried forward: the previous first visit ({history.prefill?.consultationDate}) was not supplied because a reading was outside the limits on repeat. Today is the one permitted return visit; outside the limits again on repeat, the patient is referred to the GP for assessment and not supplied.
              </div>
            )}

            {isReview && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                {isContinuation
                  ? 'The stop symptoms since the last visit (weight gain of 2 kg or more, swelling, palpitations, chest pain, breathlessness, dizziness or faintness, fainting) are asked at the top of the Measurements step, so that today\'s blood pressure, pulse and weight are recorded on the same step whatever the answer.'
                  : 'Restart: the "since the last visit" stop symptoms and the 2 kg rule do not apply; the comparison starts afresh from today\'s values. Dizziness or faintness today is judged under the hypotension rule, as at a first supply (Measurements step).'}
              </div>
            )}

            {isReview && (
              <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Non-cardiovascular side effects since the last visit (dose reduction or a non-cardiovascular stop; never a cardiovascular stop)</p>
                <Checkbox label="Hypertrichosis (extra fine hair on the face, arms or body)" checked={history.seHypertrichosis} onChange={(v) => setHistory({ ...history, seHypertrichosis: v, ...(v ? {} : { seHypertrichosisMinds: false }) })} />
                {history.seHypertrichosis && (
                  <div className="ml-6">
                    <Checkbox label="The patient minds the hypertrichosis" checked={history.seHypertrichosisMinds} onChange={(v) => setHistory({ ...history, seHypertrichosisMinds: v })} description="A reason to step the dose down where above the starting dose, or to stop where a woman is on 1.25 mg; not a cardiovascular stop, the patient may restart later. No dose increase where the patient minds it" />
                  </div>
                )}
                <Checkbox label="Headache" checked={history.seHeadache} onChange={(v) => setHistory({ ...history, seHeadache: v })} />
                <Checkbox label="Insomnia" checked={history.seInsomnia} onChange={(v) => setHistory({ ...history, seInsomnia: v })} />
                <Checkbox label="Gastrointestinal upset" checked={history.seGiUpset} onChange={(v) => setHistory({ ...history, seGiUpset: v })} />
                <TextInput label="Other side effect" value={history.seOther} onChange={(v) => setHistory({ ...history, seOther: v })} placeholder="e.g. breast tenderness" />
                <Checkbox label="The patient finds a side effect above unacceptable" checked={history.seUnacceptable} onChange={(v) => setHistory({ ...history, seUnacceptable: v })} description="Reduce to the starting dose at the Dose and Supply step; where the starting dose is not tolerated, stop (not a cardiovascular stop)" />
                <TextArea label={isRestart ? 'Adherence before the gap, and the reason for the gap' : 'Adherence since the last supply'} value={history.adherenceNote} onChange={(v) => setHistory({ ...history, adherenceNote: v })} placeholder={isRestart ? 'e.g. taken daily until the tablets ran out; did not return for 7 weeks (holiday)' : 'e.g. taken daily, two doses missed'} rows={2} required />
                {isWoman && (
                  <>
                    <Checkbox label="Her contraceptive method was stopped or changed since the last supply" checked={history.contraceptionChanged} onChange={(v) => setHistory({ ...history, contraceptionChanged: v, ...(v ? {} : { contraceptionReplacementConfirmed: false }) })} />
                    {history.contraceptionChanged && (
                      <div className="ml-6">
                        <Checkbox label="The replacement method is confirmed (record it on the Women step)" checked={history.contraceptionReplacementConfirmed} onChange={(v) => setHistory({ ...history, contraceptionReplacementConfirmed: v })} required />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-navy-900">Other hair loss treatment</p>
              <Checkbox label="Already taking oral minoxidil from another source (exclusion)" checked={history.oralMinoxidilElsewhere} onChange={(v) => setHistory({ ...history, oralMinoxidilElsewhere: v })} />
              {isMan && (
                <>
                  <Checkbox label="Taking finasteride (permitted: record the source)" checked={history.onFinasteride} onChange={(v) => setHistory({ ...history, onFinasteride: v, ...(v ? {} : { finasterideSource: '' }) })} description="Under the Male Pattern Hair Loss PGD or prescribed elsewhere; where both are supplied here, review them at the same visits" />
                  {history.onFinasteride && <div className="ml-6"><TextInput label="Source of the finasteride" value={history.finasterideSource} onChange={(v) => setHistory({ ...history, finasterideSource: v })} placeholder="e.g. this pharmacy, Male Pattern Hair Loss PGD" required /></div>}
                </>
              )}
              <Checkbox label="Using topical minoxidil (permitted: record the source)" checked={history.onTopicalMinoxidil} onChange={(v) => setHistory({ ...history, onTopicalMinoxidil: v, ...(v ? {} : { topicalMinoxidilSource: '' }) })} description="Tell the patient the oral and topical products are the same drug and that stopping the topical product once the oral is established is reasonable" />
              {history.onTopicalMinoxidil && <div className="ml-6"><TextInput label="Source of the topical minoxidil" value={history.topicalMinoxidilSource} onChange={(v) => setHistory({ ...history, topicalMinoxidilSource: v })} placeholder="e.g. bought over the counter, 5% foam" required /></div>}
            </div>
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 3: Diagnosis */}
      {currentStep === STEP.diagnosis && (
        <StepWrapper {...stepProps(STEP.diagnosis, isRestart ? 'Restart: re-examine the scalp and repeat the pull test as at a first supply (Appendix 2)' : 'Is it androgenetic alopecia? Examine the scalp on the premises with the hair parted (Appendix 2)')}>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
              Androgenetic alopecia: gradual onset over months or years; men, recession at the temples and thinning at the crown; women, widening of the central parting and thinning over the crown with the frontal hairline kept; scalp normal with the hair parted; follicular openings present; gentle pull test releases no more than a few hairs. Alopecia areata, telogen effluvium, frontal fibrosing alopecia, other scarring alopecia, tinea capitis, traction alopecia and hyperandrogenism in a woman are referrals, not supplies.
              {isRestart ? ' Restart after a gap of more than 4 weeks: the scalp is re-examined and the pull test repeated as at a first supply.' : ''}
            </div>
            <Checkbox label={isRestart ? 'Scalp re-examined on the premises with the hair parted, as at a first supply' : 'Scalp examined on the premises with the hair parted'} checked={diagnosis.scalpExamined} onChange={(v) => setDiagnosis({ ...diagnosis, scalpExamined: v })} required />
            <SelectInput
              label="Onset"
              value={diagnosis.onset}
              onChange={(v) => setDiagnosis({ ...diagnosis, onset: v as OMDiagnosis['onset'] })}
              options={[
                { value: 'gradual', label: 'Gradual, over months or years' },
                { value: 'sudden', label: 'Sudden, over days to weeks (exclusion: refer)' },
              ]}
              required
            />
            <SelectInput
              label="Pattern"
              value={diagnosis.pattern}
              onChange={(v) => setDiagnosis({ ...diagnosis, pattern: v as OMDiagnosis['pattern'] })}
              options={[
                ...(isMan || !patient.sex ? [{ value: 'male', label: 'Male pattern: bitemporal recession, vertex thinning (Hamilton-Norwood)' }] : []),
                ...(isWoman || !patient.sex ? [{ value: 'female', label: 'Female pattern: diffuse thinning over the crown, frontal hairline preserved (Ludwig)' }] : []),
                { value: 'other', label: 'Other pattern: patchy, diffuse all over, along the margins (exclusion: refer)' },
              ]}
              required
            />
            <TextInput label="Pattern and duration of hair loss" value={diagnosis.durationText} onChange={(v) => setDiagnosis({ ...diagnosis, durationText: v })} placeholder="e.g. thinning at the crown and temples over about 4 years" required />

            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-navy-900">Scalp examination: tick any feature present (each is an exclusion)</p>
              <Checkbox label="Each of these was examined or asked about" checked={diagnosis.scalpFeaturesAsked} onChange={(v) => setDiagnosis({ ...diagnosis, scalpFeaturesAsked: v })} required />
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Checkbox label="Redness" checked={diagnosis.redness} onChange={(v) => setDiagnosis({ ...diagnosis, redness: v })} />
                <Checkbox label="Scale" checked={diagnosis.scale} onChange={(v) => setDiagnosis({ ...diagnosis, scale: v })} />
                <Checkbox label="Pustules" checked={diagnosis.pustules} onChange={(v) => setDiagnosis({ ...diagnosis, pustules: v })} />
                <Checkbox label="Scarring (smooth shiny skin)" checked={diagnosis.scarring} onChange={(v) => setDiagnosis({ ...diagnosis, scarring: v })} />
                <Checkbox label="Pain" checked={diagnosis.pain} onChange={(v) => setDiagnosis({ ...diagnosis, pain: v })} />
                <Checkbox label="Itch" checked={diagnosis.itch} onChange={(v) => setDiagnosis({ ...diagnosis, itch: v })} />
                <Checkbox label="Patches of complete loss" checked={diagnosis.patchesCompleteLoss} onChange={(v) => setDiagnosis({ ...diagnosis, patchesCompleteLoss: v })} />
                <Checkbox label="Loss of follicular openings" checked={diagnosis.lossFollicularOpenings} onChange={(v) => setDiagnosis({ ...diagnosis, lossFollicularOpenings: v })} />
                <Checkbox label="Broken hairs" checked={diagnosis.brokenHairs} onChange={(v) => setDiagnosis({ ...diagnosis, brokenHairs: v })} />
              </div>
              {isWoman && (
                <>
                  <Checkbox label="Receding frontal or temporal hairline in a woman (band-like recession, pale smooth skin behind the hairline)" checked={diagnosis.womanHairlineRecession} onChange={(v) => setDiagnosis({ ...diagnosis, womanHairlineRecession: v })} description="Frontal fibrosing alopecia is easily mistaken for female pattern loss; the preserved frontal hairline of true female pattern loss is the difference" />
                  <Checkbox label="Loss of the eyebrows" checked={diagnosis.eyebrowLoss} onChange={(v) => setDiagnosis({ ...diagnosis, eyebrowLoss: v })} />
                </>
              )}
              {isMan && <Checkbox label="Loss of the eyebrows (exclusion)" checked={diagnosis.eyebrowLoss} onChange={(v) => setDiagnosis({ ...diagnosis, eyebrowLoss: v })} />}
            </div>

            {isFirst || isRestart ? (
              <NumberInput label={isRestart ? 'Pull test repeated at the restart: hairs released by a gentle pull on a bundle of about 50 to 60 hairs' : 'Pull test: hairs released by a gentle pull on a bundle of about 50 to 60 hairs'} value={diagnosis.pullTestCount} onChange={(v) => setDiagnosis({ ...diagnosis, pullTestCount: v === null ? null : Math.floor(v) })} min={0} unit={isRestart ? 'hairs (6 or more is an exclusion, as at a first supply)' : 'hairs (6 or more is an exclusion at the first supply)'} required />
            ) : (
              <NumberInput label="Pull test at review (optional)" value={diagnosis.pullTestCount} onChange={(v) => setDiagnosis({ ...diagnosis, pullTestCount: v === null ? null : Math.floor(v) })} min={0} unit="hairs (6 or more at a review is a caution, not a stop)" />
            )}
            <Checkbox label="Heavy diffuse shedding (handfuls on washing or brushing)" checked={diagnosis.heavyDiffuseShedding} onChange={(v) => setDiagnosis({ ...diagnosis, heavyDiffuseShedding: v, ...(v ? {} : { sheddingBeyond12Weeks: false }) })} description={isFirst ? 'Exclusion at the first supply' : isRestart ? 'Exclusion at a restart, as at a first supply (the scalp assessment is repeated)' : 'Shedding in the first 4 to 8 weeks of treatment, settling by 12 weeks, is expected and is not a reason to stop; heavy shedding persisting beyond 12 weeks of treatment is a stop (refer for diagnosis)'} />
            {isContinuation && diagnosis.heavyDiffuseShedding && (
              <div className="ml-6">
                <Checkbox
                  label="The heavy shedding has persisted beyond 12 weeks of treatment (stop: refer to the GP for diagnosis)"
                  checked={diagnosis.sheddingBeyond12Weeks}
                  onChange={(v) => setDiagnosis({ ...diagnosis, sheddingBeyond12Weeks: v })}
                  description={`Not a cardiovascular stop.${approxWeeksOnTreatment(history) !== null ? ` A patient attending on time has completed about ${approxWeeksOnTreatment(history)} weeks of treatment${history.restartedBefore || isRestart ? ' since the restart' : ''} before today's visit.` : ''}`}
                />
              </div>
            )}
            <Checkbox label="Hair loss began or worsened within 12 months of childbirth, a serious illness, major surgery, rapid weight loss or starting a medicine known to cause hair loss" checked={diagnosis.trigger12Months} onChange={(v) => setDiagnosis({ ...diagnosis, trigger12Months: v, ...(v ? {} : { trigger12MonthsDetail: '' }) })} description="Suggests telogen effluvium: exclusion, refer" />
            {diagnosis.trigger12Months && <div className="ml-6"><TextInput label="Trigger" value={diagnosis.trigger12MonthsDetail} onChange={(v) => setDiagnosis({ ...diagnosis, trigger12MonthsDetail: v })} placeholder="e.g. childbirth 5 months ago" required /></div>}

            {isWoman && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Hyperandrogenism in a woman: tick any present (each is an exclusion)</p>
                <Checkbox label="Each of these was examined or asked about" checked={diagnosis.hyperandrogenismAsked} onChange={(v) => setDiagnosis({ ...diagnosis, hyperandrogenismAsked: v })} required />
                <div className="grid sm:grid-cols-2 gap-x-4">
                  <Checkbox label="Hirsutism" checked={diagnosis.hirsutism} onChange={(v) => setDiagnosis({ ...diagnosis, hirsutism: v })} />
                  <Checkbox label="New or worsening acne" checked={diagnosis.newAcne} onChange={(v) => setDiagnosis({ ...diagnosis, newAcne: v })} />
                  <Checkbox label="Irregular or absent periods" checked={diagnosis.irregularPeriods} onChange={(v) => setDiagnosis({ ...diagnosis, irregularPeriods: v })} />
                  <Checkbox label="Deepening voice" checked={diagnosis.deepeningVoice} onChange={(v) => setDiagnosis({ ...diagnosis, deepeningVoice: v })} />
                  <Checkbox label="Diagnosis of polycystic ovary syndrome" checked={diagnosis.pcosDiagnosis} onChange={(v) => setDiagnosis({ ...diagnosis, pcosDiagnosis: v })} />
                </div>
              </div>
            )}

            {isFirst && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Baseline photographs (first supply)</p>
                <p className="text-xs text-gray-600">Same room lighting; to be repeated in the same way at supply visits 4 and 6.</p>
                <Checkbox label="Patient consents to photographs being taken and stored in the record" checked={diagnosis.photoConsent} onChange={(v) => setDiagnosis({ ...diagnosis, photoConsent: v })} required />
                <Checkbox label="Crown from above" checked={diagnosis.photoCrownTaken} onChange={(v) => setDiagnosis({ ...diagnosis, photoCrownTaken: v })} required />
                <Checkbox label="Frontal hairline from the front, hair parted in the midline" checked={diagnosis.photoFrontalTaken} onChange={(v) => setDiagnosis({ ...diagnosis, photoFrontalTaken: v })} required />
                <Checkbox label="Photographs stored in the record" checked={diagnosis.photosStored} onChange={(v) => setDiagnosis({ ...diagnosis, photosStored: v })} required />
              </div>
            )}
            {isReview && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Review photographs and response</p>
                <p className="text-xs text-gray-600">
                  {repeatPhotosRequired(history)
                    ? `This is supply visit ${visit}: a full review with repeat photographs and a response assessment against the baseline.${reviewSought ? ' This record is sent for the prescriber review.' : ''}`
                    : 'Repeat photographs and a response assessment are required at supply visits 4 and 6. Response is not assessed at the first review (supply visit 2); it takes 3 to 6 months.'}
                </p>
                <Checkbox label="Repeat photographs taken in the same way as the baseline (crown from above, frontal hairline, midline parting, same lighting)" checked={diagnosis.repeatPhotosTaken} onChange={(v) => setDiagnosis({ ...diagnosis, repeatPhotosTaken: v })} required={repeatPhotosRequired(history)} />
                <SelectInput
                  label="Response against the baseline photographs"
                  value={diagnosis.response}
                  onChange={(v) => setDiagnosis({ ...diagnosis, response: v as OMDiagnosis['response'] })}
                  options={[
                    { value: 'adequate', label: 'Adequate: continue at the same dose' },
                    { value: 'inadequate', label: 'Inadequate (a dose increase may be considered at or after supply visit 4)' },
                    { value: 'not-assessed', label: 'Not assessed at this review' },
                  ]}
                  required={repeatPhotosRequired(history)}
                />
                <TextInput label="Response recorded" value={diagnosis.responseNote} onChange={(v) => setDiagnosis({ ...diagnosis, responseNote: v })} placeholder="e.g. parting width narrower than baseline; crown density improved" />
              </div>
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 4: Women */}
      {currentStep === STEP.women && (
        <StepWrapper {...stepProps(STEP.women, 'Ferritin and thyroid results, childbearing potential, pregnancy, breastfeeding and contraception')}>
          {!isWoman ? (
            <p className="text-sm text-gray-600">Not applicable: the patient is male. Press Next.</p>
          ) : (
            <div className="space-y-4">
              <Checkbox label="Each of the questions on this step was put to the patient" checked={women.questionsAsked} onChange={(v) => setWomen({ ...women, questionsAsked: v })} required />
              {isFirst ? (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">Blood tests before a first supply</p>
                  <p className="text-xs text-gray-600">
                    A ferritin of 30 micrograms/L or more and a thyroid stimulating hormone within the laboratory reference range, tested within the last 12 months by the NHS or a private laboratory, seen by the pharmacist. Iron deficiency and thyroid disease cause diffuse hair loss that looks like the female pattern and are treated differently. A woman without results is advised to ask her GP or to arrange a private test and to return with them; she is not supplied today.
                  </p>
                  <SelectInput
                    label="Ferritin and thyroid results from the last 12 months seen by the pharmacist?"
                    value={women.resultsAvailable}
                    onChange={(v) => setWomen({ ...women, resultsAvailable: v as OMWomen['resultsAvailable'] })}
                    options={[
                      { value: 'yes', label: 'Yes: results seen' },
                      { value: 'no', label: 'No: not supplied today, advised to obtain them and return' },
                    ]}
                    required
                  />
                  {women.resultsAvailable === 'yes' && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberInput label="Ferritin" value={women.ferritinValue} onChange={(v) => setWomen({ ...women, ferritinValue: v })} unit="micrograms/L (30 or more)" required />
                        <DateField label="Date of the ferritin test" value={women.ferritinDate} onChange={(v) => setWomen({ ...women, ferritinDate: v })} required />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <TextInput label="TSH value" value={women.tshValue} onChange={(v) => setWomen({ ...women, tshValue: v })} placeholder="e.g. 2.1 mU/L" required />
                        <SelectInput
                          label="TSH within the laboratory reference range?"
                          value={women.tshWithinRange}
                          onChange={(v) => setWomen({ ...women, tshWithinRange: v as OMWomen['tshWithinRange'] })}
                          options={[
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No (exclusion)' },
                          ]}
                          required
                        />
                        <DateField label="Date of the thyroid test" value={women.tshDate} onChange={(v) => setWomen({ ...women, tshDate: v })} required />
                      </div>
                      <SelectInput
                        label="Where the results were seen"
                        value={women.testSource}
                        onChange={(v) => setWomen({ ...women, testSource: v as TestSource })}
                        options={(Object.keys(TEST_SOURCE_LABEL) as Exclude<TestSource, ''>[]).map((s) => ({ value: s, label: TEST_SOURCE_LABEL[s] }))}
                        required
                      />
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-600">Ferritin and thyroid results were seen and recorded at the first supply.</p>
              )}
              <Checkbox label="A thyroid or iron problem under investigation or not yet stable on treatment (exclusion)" checked={women.thyroidOrIronUnstable} onChange={(v) => setWomen({ ...women, thyroidOrIronUnstable: v })} description="Stable treated hypothyroidism is not an exclusion in itself" />

              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Childbearing potential, pregnancy and contraception</p>
                <SelectInput
                  label="Is she of childbearing potential?"
                  value={women.childbearingPotential}
                  onChange={(v) => setWomen({ ...women, childbearingPotential: v as OMWomen['childbearingPotential'], ...(v === 'yes' ? { notPotentialReason: '' as const } : {}) })}
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No: post-menopausal (12 months without periods after the age of 45 with no other cause) or permanently sterilised' },
                  ]}
                  required
                />
                <p className="text-xs text-gray-600">Absence of periods because of contraception, breastfeeding or recent childbirth does not remove childbearing potential.</p>
                <Checkbox label="Breastfeeding (exclusion: minoxidil is excreted in milk)" checked={women.breastfeeding} onChange={(v) => setWomen({ ...women, breastfeeding: v })} description="Asked of every woman whatever the answer above: a sterilised woman can breastfeed" />
                <Checkbox label="Planning a pregnancy during the treatment period (exclusion)" checked={women.planningPregnancy} onChange={(v) => setWomen({ ...women, planningPregnancy: v })} description="Asked of every woman whatever the answer above" />
                {women.childbearingPotential === 'no' && (
                  <SelectInput
                    label="Reason"
                    value={women.notPotentialReason}
                    onChange={(v) => setWomen({ ...women, notPotentialReason: v as OMWomen['notPotentialReason'] })}
                    options={[
                      { value: 'post-menopausal', label: 'Post-menopausal: 12 months without periods after the age of 45 with no other cause' },
                      { value: 'sterilised', label: 'Permanently sterilised' },
                    ]}
                    required
                  />
                )}
                {women.childbearingPotential === 'yes' && (
                  <>
                    <SelectInput
                      label="Pregnant, on her own account?"
                      value={women.pregnant}
                      onChange={(v) => setWomen({ ...women, pregnant: v as OMWomen['pregnant'] })}
                      options={[
                        { value: 'no', label: 'No: pregnancy excluded' },
                        { value: 'yes', label: 'Yes or possibly (exclusion)' },
                      ]}
                      required
                    />
                    {women.pregnant === 'no' && <DateField label="Last menstrual period" value={women.lmpDate} onChange={(v) => setWomen({ ...women, lmpDate: v })} required />}
                    <SelectInput
                      label="Contraceptive method"
                      value={women.contraceptionMethod}
                      onChange={(v) => setWomen({ ...women, contraceptionMethod: v as ContraceptionMethod })}
                      options={(Object.keys(CONTRACEPTION_LABEL) as Exclude<ContraceptionMethod, ''>[]).map((m) => ({ value: m, label: CONTRACEPTION_LABEL[m] }))}
                      required
                    />
                    <Checkbox label="She agrees to continue the method and to tell the pharmacy if she stops" checked={women.agreesToContinue} onChange={(v) => setWomen({ ...women, agreesToContinue: v })} required />
                    <Checkbox
                      label="Combined hormonal contraception with migraine with aura"
                      checked={cocMigraineAuraApplies(women, medical)}
                      onChange={(v) => setWomen({ ...women, cocWithMigraineAura: v, ...(v ? {} : { cocPrescriberReviewed: false, cocReviewOutcome: '', cocReferralRecorded: false }) })}
                      description={`${women.contraceptionMethod === 'combined-hormonal' && medical.migraineWithAura ? 'Triggered automatically: combined hormonal contraception is the method and migraine with aura is recorded on the Medical step. ' : 'Also triggered automatically where the method is combined hormonal contraception and migraine with aura is ticked on the Medical step. '}${isFirst
                        ? 'The suitability of her method is her prescriber\'s responsibility, but where something obvious is wrong do not make a first supply until her prescriber has reviewed the method and she attends with the outcome'
                        : 'At a continuation visit supply may continue on her existing method provided she is seen about it within 4 weeks and the referral is recorded. If her method is stopped or changed she must confirm the replacement before continuing; without contraception she stops minoxidil'}`}
                    />
                    {cocMigraineAuraApplies(women, medical) && isFirst && (
                      <div className="ml-6 space-y-3">
                        <Checkbox label="Her prescriber has reviewed the method and she attends today with the outcome" checked={women.cocPrescriberReviewed} onChange={(v) => setWomen({ ...women, cocPrescriberReviewed: v, ...(v ? {} : { cocReviewOutcome: '' }) })} description="Without this she is not supplied today: advise her to see her GP or sexual health service about the method and to return with the outcome" />
                        {women.cocPrescriberReviewed && <TextInput label="Outcome of the prescriber's review" value={women.cocReviewOutcome} onChange={(v) => setWomen({ ...women, cocReviewOutcome: v })} placeholder="e.g. changed to the progestogen-only pill; record the method above" required />}
                      </div>
                    )}
                    {cocMigraineAuraApplies(women, medical) && !isFirst && (
                      <div className="ml-6">
                        <Checkbox label="Referred to be seen about the method within 4 weeks (GP or sexual health service), and the referral is recorded" checked={women.cocReferralRecorded} onChange={(v) => setWomen({ ...women, cocReferralRecorded: v })} required />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 5: Cardiovascular and Medical History */}
      {currentStep === STEP.medical && (
        <StepWrapper {...stepProps(STEP.medical, 'Every cardiovascular exclusion, and the other medical exclusions; tick any that applies')}>
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">ANY CARDIOVASCULAR DISEASE (each is an exclusion)</p>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Checkbox label="Ischaemic heart disease or angina" checked={medical.ischaemicHeartDisease} onChange={(v) => setMedical({ ...medical, ischaemicHeartDisease: v })} />
                <Checkbox label="Previous myocardial infarction" checked={medical.previousMI} onChange={(v) => setMedical({ ...medical, previousMI: v })} />
                <Checkbox label="Heart failure" checked={medical.heartFailure} onChange={(v) => setMedical({ ...medical, heartFailure: v })} />
                <Checkbox label="Any arrhythmia including atrial fibrillation" checked={medical.arrhythmia} onChange={(v) => setMedical({ ...medical, arrhythmia: v })} />
                <Checkbox label="Valvular heart disease" checked={medical.valvularDisease} onChange={(v) => setMedical({ ...medical, valvularDisease: v })} />
                <Checkbox label="Cardiomyopathy" checked={medical.cardiomyopathy} onChange={(v) => setMedical({ ...medical, cardiomyopathy: v })} />
                <Checkbox label="Congenital heart disease" checked={medical.congenitalHeartDisease} onChange={(v) => setMedical({ ...medical, congenitalHeartDisease: v })} />
                <Checkbox label="Previous stroke or transient ischaemic attack" checked={medical.strokeTia} onChange={(v) => setMedical({ ...medical, strokeTia: v })} />
                <Checkbox label="Peripheral arterial disease" checked={medical.peripheralArterialDisease} onChange={(v) => setMedical({ ...medical, peripheralArterialDisease: v })} />
                <Checkbox label="Pulmonary hypertension" checked={medical.pulmonaryHypertension} onChange={(v) => setMedical({ ...medical, pulmonaryHypertension: v })} />
                <Checkbox label="Postural tachycardia syndrome (POTS) or other orthostatic intolerance" checked={medical.pots} onChange={(v) => setMedical({ ...medical, pots: v })} />
                <Checkbox label="History of pericarditis or pericardial effusion" checked={medical.pericarditisOrEffusion} onChange={(v) => setMedical({ ...medical, pericarditisOrEffusion: v })} />
                <Checkbox label="History of pleural effusion" checked={medical.pleuralEffusion} onChange={(v) => setMedical({ ...medical, pleuralEffusion: v })} />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">Blood pressure and syncope history (each is an exclusion)</p>
              <Checkbox label="Hypertension, whether treated, untreated or managed by lifestyle" checked={medical.hypertension} onChange={(v) => setMedical({ ...medical, hypertension: v })} />
              <Checkbox label="Hypotension or orthostatic intolerance" checked={medical.hypotensionOrOrthostatic} onChange={(v) => setMedical({ ...medical, hypotensionOrOrthostatic: v })} />
              <Checkbox label="Unexplained syncope at any time" checked={medical.unexplainedSyncope} onChange={(v) => setMedical({ ...medical, unexplainedSyncope: v })} />
              <Checkbox label="Any syncope in the last 12 months" checked={medical.syncopeLast12Months} onChange={(v) => setMedical({ ...medical, syncopeLast12Months: v })} />
            </div>
            <div className="space-y-2 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">Other exclusions</p>
              <Checkbox label="Phaeochromocytoma" checked={medical.phaeochromocytoma} onChange={(v) => setMedical({ ...medical, phaeochromocytoma: v })} />
              <Checkbox label="Renal impairment: known eGFR below 60, chronic kidney disease stage 3 or worse, or dialysis" checked={medical.renalImpairment} onChange={(v) => setMedical({ ...medical, renalImpairment: v })} />
              <Checkbox label="Hepatic impairment" checked={medical.hepaticImpairment} onChange={(v) => setMedical({ ...medical, hepaticImpairment: v })} />
              <Checkbox label="Known anaemia not yet treated" checked={medical.untreatedAnaemia} onChange={(v) => setMedical({ ...medical, untreatedAnaemia: v })} />
              <Checkbox label="Any thyroid disease that is not stable on treatment" checked={medical.unstableThyroid} onChange={(v) => setMedical({ ...medical, unstableThyroid: v })} description="Stable treated hypothyroidism is not an exclusion" />
              <Checkbox label="Eating disorder" checked={medical.eatingDisorder} onChange={(v) => setMedical({ ...medical, eatingDisorder: v })} description="A body mass index below 18.5 is checked at Measurements" />
              <Checkbox label="Confirmed hypersensitivity to minoxidil (oral or topical) or to any excipient (lactose monohydrate, microcrystalline cellulose, starch, colloidal silicon dioxide, magnesium stearate)" checked={medical.hypersensitivity} onChange={(v) => setMedical({ ...medical, hypersensitivity: v })} />
              <Checkbox label="Rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption" checked={medical.hereditaryGalactose} onChange={(v) => setMedical({ ...medical, hereditaryGalactose: v })} description="Each tablet contains 95.8 mg lactose monohydrate; ordinary lactose intolerance is not relevant at this quantity" />
            </div>
            <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Cautions (not exclusions in themselves)</p>
              <Checkbox
                label="Migraine with aura"
                checked={medical.migraineWithAura}
                onChange={(v) => setMedical({ ...medical, migraineWithAura: v })}
                description={isWoman ? 'With combined hormonal contraception (combined pill, patch or ring) as her method this triggers the contraception rule automatically: no first supply until her prescriber has reviewed the method and she attends with the outcome; at a continuation, seen about it within 4 weeks with the referral recorded' : 'Migraine is not an exclusion in itself; propranolol for migraine is (Medicines step)'}
              />
            </div>
            <TextArea label="Other conditions (recorded; not exclusions in themselves)" value={medical.otherConditions} onChange={(v) => setMedical({ ...medical, otherConditions: v })} placeholder="e.g. diabetes on metformin, migraine, asthma, well-controlled epilepsy, stable treated hypothyroidism, depression" rows={2} />
            <Checkbox label={isRestart ? 'Restart: the cardiovascular and medical history was re-taken and every exclusion question on this step was put to the patient again' : 'Every cardiovascular and medical exclusion question on this step was put to the patient'} checked={medical.questionsAsked} onChange={(v) => setMedical({ ...medical, questionsAsked: v })} required />
            <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-4">
              <Checkbox
                label="Pharmacist has clinical doubt about suitability (refer)"
                checked={medical.pharmacistDoubt}
                onChange={(v) => setMedical({ ...medical, pharmacistDoubt: v, ...(v ? {} : { pharmacistDoubtReason: '' }) })}
                description="Refer where in doubt: a stop, not supplied under this PGD. Record the reason, the advice given and the referral"
              />
              {medical.pharmacistDoubt && (
                <div className="ml-6">
                  <TextInput label="Reason for the doubt" value={medical.pharmacistDoubtReason} onChange={(v) => setMedical({ ...medical, pharmacistDoubtReason: v })} placeholder="e.g. vague chest symptoms on exertion not yet assessed" />
                </div>
              )}
            </div>
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 6: Medicines */}
      {currentStep === STEP.medicines && (
        <StepWrapper {...stepProps(STEP.medicines, 'Excluded medicine classes (any indication), PDE5 inhibitors, cautions and current medicines')}>
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">ANY OF THE FOLLOWING MEDICINES, for any indication (each is an exclusion: the effect on blood pressure or heart rate is additive)</p>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Checkbox label="Any antihypertensive" checked={medicines.antihypertensive} onChange={(v) => setMedicines({ ...medicines, antihypertensive: v })} />
                <Checkbox label="Any beta-blocker, including propranolol for anxiety or migraine" checked={medicines.betaBlocker} onChange={(v) => setMedicines({ ...medicines, betaBlocker: v })} />
                <Checkbox label="Any calcium channel blocker" checked={medicines.calciumChannelBlocker} onChange={(v) => setMedicines({ ...medicines, calciumChannelBlocker: v })} />
                <Checkbox label="Any diuretic, including spironolactone" checked={medicines.diuretic} onChange={(v) => setMedicines({ ...medicines, diuretic: v })} />
                <Checkbox label="An alpha-blocker (tamsulosin, doxazosin, alfuzosin, prazosin)" checked={medicines.alphaBlocker} onChange={(v) => setMedicines({ ...medicines, alphaBlocker: v })} />
                <Checkbox label="A nitrate" checked={medicines.nitrate} onChange={(v) => setMedicines({ ...medicines, nitrate: v })} />
                <Checkbox label="Sacubitril/valsartan" checked={medicines.sacubitrilValsartan} onChange={(v) => setMedicines({ ...medicines, sacubitrilValsartan: v })} />
                <Checkbox label="Clonidine, moxonidine or methyldopa" checked={medicines.centrallyActing} onChange={(v) => setMedicines({ ...medicines, centrallyActing: v })} />
                <Checkbox label="Daily tadalafil or any other PDE5 inhibitor taken daily" checked={medicines.dailyPde5} onChange={(v) => setMedicines({ ...medicines, dailyPde5: v })} />
                <Checkbox label="An SGLT2 inhibitor (dapagliflozin, empagliflozin, canagliflozin, ertugliflozin)" checked={medicines.sglt2} onChange={(v) => setMedicines({ ...medicines, sglt2: v })} />
                <Checkbox label="A stimulant (methylphenidate, lisdexamfetamine, dexamfetamine, modafinil)" checked={medicines.stimulant} onChange={(v) => setMedicines({ ...medicines, stimulant: v })} />
                <Checkbox label="Regular pseudoephedrine or phenylephrine" checked={medicines.regularDecongestant} onChange={(v) => setMedicines({ ...medicines, regularDecongestant: v })} />
                <Checkbox label="Non-prescribed stimulant drug use" checked={medicines.nonPrescribedStimulant} onChange={(v) => setMedicines({ ...medicines, nonPrescribedStimulant: v })} />
                <Checkbox label="A systemic corticosteroid (salt and water retention)" checked={medicines.systemicCorticosteroid} onChange={(v) => setMedicines({ ...medicines, systemicCorticosteroid: v })} />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Cautions (not exclusions)</p>
              <Checkbox label="PDE5 inhibitor (sildenafil, tadalafil, vardenafil) taken on demand" checked={medicines.pde5OnDemand} onChange={(v) => setMedicines({ ...medicines, pde5OnDemand: v, ...(v ? {} : { edVascularAsked: false, edVascularDoubt: false }) })} description="The blood pressure lowering effects add together and minoxidil's effect lasts for days: no safe interval to advise. Tell the patient light-headedness is possible, to sit or lie down, and not to take a second PDE5 dose that day" />
              {medicines.pde5OnDemand && isMan && patient.age !== null && patient.age < 40 && (
                <div className="ml-6 space-y-2">
                  <Checkbox label="Man under 40: asked about exercise tolerance and chest symptoms" checked={medicines.edVascularAsked} onChange={(v) => setMedicines({ ...medicines, edVascularAsked: v })} description="Erectile dysfunction in a man under 40 can be an early sign of vascular disease" required />
                  <Checkbox label="Any doubt about vascular disease: refer before supplying (stop)" checked={medicines.edVascularDoubt} onChange={(v) => setMedicines({ ...medicines, edVascularDoubt: v })} />
                </div>
              )}
              <Checkbox label="A daily NSAID" checked={medicines.dailyNsaid} onChange={(v) => setMedicines({ ...medicines, dailyNsaid: v })} />
              <Checkbox label="A tricyclic antidepressant" checked={medicines.tricyclic} onChange={(v) => setMedicines({ ...medicines, tricyclic: v })} />
              <Checkbox label="A phenothiazine" checked={medicines.phenothiazine} onChange={(v) => setMedicines({ ...medicines, phenothiazine: v })} />
              <Checkbox label="Pregabalin or gabapentin" checked={medicines.pregabalinGabapentin} onChange={(v) => setMedicines({ ...medicines, pregabalinGabapentin: v })} />
              <p className="text-xs text-amber-900">These can lower blood pressure or cause fluid retention: measure the blood pressure with that in mind, warn about dizziness and swelling, and refer where in doubt.</p>
              {cautionMedicinesList(medicines).length > 0 && (
                <SelectInput
                  label="Pharmacist satisfied to supply after considering blood pressure and fluid retention?"
                  value={medicines.cautionSatisfied}
                  onChange={(v) => setMedicines({ ...medicines, cautionSatisfied: v as OMMedicines['cautionSatisfied'] })}
                  options={[
                    { value: 'yes', label: 'Yes: satisfied to supply (the caution is recorded)' },
                    { value: 'no', label: 'No: refer where in doubt (stop, not supplied)' },
                  ]}
                  required
                />
              )}
              <Checkbox label="Weight loss treatment (GLP-1 agonist, orlistat, dieting)" checked={medicines.weightLossTreatment} onChange={(v) => setMedicines({ ...medicines, weightLossTreatment: v })} description="Ongoing weight loss can mask the 2 kg fluid retention trigger: ask specifically about ankle swelling, tight shoes or rings and breathlessness at every supply, and treat new swelling as a cardiovascular stop whatever the scales say" />
            </div>
            <p className="text-xs text-gray-600">Diabetes on metformin, sulfonylureas, DPP-4 inhibitors, GLP-1 agonists or insulin, migraine, asthma, well-controlled epilepsy, stable treated hypothyroidism and depression are not exclusions in themselves.</p>
            <TextArea label="Current medicines (prescribed, over the counter and herbal)" value={medicines.currentMedicines} onChange={(v) => setMedicines({ ...medicines, currentMedicines: v })} placeholder="List every medicine, or record 'none'" rows={3} />
            <Checkbox label={isRestart ? 'Restart: the medicines history was re-taken, every medicine in the exclusion list was asked about again, and the record states that no medicine in the exclusion list is taken' : 'Every medicine in the exclusion list was asked about, and the record states that no medicine in the exclusion list is taken'} checked={medicines.questionsAsked} onChange={(v) => setMedicines({ ...medicines, questionsAsked: v })} required />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 7: Measurements */}
      {currentStep === STEP.measurements && (
        <StepWrapper {...stepProps(STEP.measurements, 'Seated and standing blood pressure, pulse and weight at every supply; height and body mass index at the first supply')}>
          <div className="space-y-4">
            {sinceLastVisitSymptomsApply(history) && (
              <div className="space-y-3 rounded-lg border-2 border-red-300 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">Stop symptoms since the last visit (any one is a cardiovascular stop: no dose reduction, no further supply until a prescriber review). Today&apos;s blood pressure, pulse and weight are still recorded below whatever the answer.</p>
                <Checkbox label="Each of these was asked about" checked={history.sxQuestionsAsked} onChange={(v) => setHistory({ ...history, sxQuestionsAsked: v })} required />
                <Checkbox label="Weight gain of 2 kg or more since the previous supply (reported; also checked on the scales below)" checked={history.sxWeightGainReported} onChange={(v) => setHistory({ ...history, sxWeightGainReported: v })} />
                <Checkbox label="New ankle swelling" checked={history.sxAnkleSwelling} onChange={(v) => setHistory({ ...history, sxAnkleSwelling: v })} />
                <Checkbox label="New facial swelling (same-day referral)" checked={history.sxFacialSwelling} onChange={(v) => setHistory({ ...history, sxFacialSwelling: v })} />
                <Checkbox label="Palpitations (same-day referral)" checked={history.sxPalpitations} onChange={(v) => setHistory({ ...history, sxPalpitations: v })} />
                <Checkbox label="Chest pain (same-day referral)" checked={history.sxChestPain} onChange={(v) => setHistory({ ...history, sxChestPain: v })} />
                <Checkbox label="Breathlessness (same-day referral)" checked={history.sxBreathlessness} onChange={(v) => setHistory({ ...history, sxBreathlessness: v })} />
                <Checkbox label="Dizziness or faintness since the last visit" checked={history.sxDizzinessFaintness} onChange={(v) => setHistory({ ...history, sxDizzinessFaintness: v })} />
                <Checkbox label="Fainting (same-day referral)" checked={history.sxFainting} onChange={(v) => setHistory({ ...history, sxFainting: v })} />
              </div>
            )}
            {isRestart && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                Restart: the weight and symptom comparison starts afresh from today&apos;s values. The &quot;since the last visit&quot; checklist and the 2 kg rule do not apply; today&apos;s weight becomes the new previous weight and today&apos;s lower seated systolic the new baseline. Dizziness or faintness today is judged under the hypotension rule, as at a first supply: systolic 90 to 99 with dizziness or faintness is a stop on repeat; otherwise a caution.
              </div>
            )}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
              Validated automatic monitor. Seated after 5 minutes rest, two readings 1 to 2 minutes apart with the lower recorded: systolic 100 to 139 mmHg and diastolic below 90 mmHg (systolic 90 to 99 only where the patient has no dizziness or faintness). Where a reading is outside these limits in either direction (140/90 or above, or below 90 systolic, or 90 to 99 with dizziness or faintness), a third seated reading after a further 5 minutes (&quot;on repeat&quot;) decides; outside the limits on repeat is a stop, and a patient outside the limits on repeat at a first visit may return once on another day. Standing after 1 minute: no fall of 20 mmHg or more in systolic OR 10 mmHg or more in diastolic, and no symptoms. Resting pulse 50 to 100 (on repeat).
              {isContinuation && history.baselineSystolic !== null ? ` Baseline systolic (${BASELINE_SYSTOLIC_DEFINITION}): ${history.baselineSystolic} mmHg. A higher dose needs today's systolic to be 100 or more and not more than 10 mmHg below it.` : ''}
              {isRestart ? " Restart: today's lower seated systolic is recorded as the NEW baseline for the 10 mmHg rule." : ''}
              {isFirst ? " First supply: today's lower seated systolic is recorded as the baseline for the 10 mmHg rule." : ''}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-3 space-y-2">
                <p className="text-sm font-semibold text-navy-900">Seated reading 1 (after 5 minutes rest)</p>
                <div className="flex gap-3">
                  <NumberInput label="Systolic" value={measurements.seated1Systolic} onChange={(v) => setMeasurements({ ...measurements, seated1Systolic: v })} unit="mmHg" required />
                  <NumberInput label="Diastolic" value={measurements.seated1Diastolic} onChange={(v) => setMeasurements({ ...measurements, seated1Diastolic: v })} unit="mmHg" required />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 space-y-2">
                <p className="text-sm font-semibold text-navy-900">Seated reading 2 (1 to 2 minutes later)</p>
                <div className="flex gap-3">
                  <NumberInput label="Systolic" value={measurements.seated2Systolic} onChange={(v) => setMeasurements({ ...measurements, seated2Systolic: v })} unit="mmHg" required />
                  <NumberInput label="Diastolic" value={measurements.seated2Diastolic} onChange={(v) => setMeasurements({ ...measurements, seated2Diastolic: v })} unit="mmHg" required />
                </div>
              </div>
            </div>
            {lower && (
              <p className={`text-xs ${isHigh(lower) || isLow(lower) || (isBorderlineLow(lower) && measurements.dizzinessOrFaintness) ? 'text-red-700 font-semibold' : isBorderlineLow(lower) ? 'text-amber-700' : 'text-gray-600'}`}>
                Lower reading recorded: {lower.systolic}/{lower.diastolic} mmHg.{' '}
                {isHigh(lower)
                  ? 'At or above 140/90: take a third reading after a further 5 minutes seated.'
                  : isLow(lower)
                  ? 'Below 90 systolic: take a third reading after a further 5 minutes seated (the hypotension limit applies on repeat).'
                  : isBorderlineLow(lower)
                  ? measurements.dizzinessOrFaintness
                    ? 'Systolic 90 to 99 with dizziness or faintness: take a third reading after a further 5 minutes seated.'
                    : 'Systolic 90 to 99: acceptable only without dizziness or faintness.'
                  : 'Within the limits.'}
                {(isFirst || isRestart) && !isHigh(lower) && !isLow(lower) ? ` Recorded as the ${isRestart ? 'new ' : ''}baseline systolic: ${lower.systolic} mmHg.` : ''}
              </p>
            )}
            <Checkbox label="Dizziness or faintness today" checked={measurements.dizzinessOrFaintness} onChange={(v) => setMeasurements({ ...measurements, dizzinessOrFaintness: v })} description={isContinuation ? 'At a continuation this is a cardiovascular stop symptom in its own right (no dose reduction, prescriber review before any further supply); it also makes a systolic of 90 to 99 unacceptable' : `Systolic 90 to 99 is acceptable only where the patient has no dizziness or faintness${isRestart ? ' (at a restart, as at a first supply, dizziness is judged under the hypotension rule, not as a cardiovascular stop)' : ''}`} />
            <Checkbox label="Third reading taken after a further 5 minutes seated (repeat)" checked={measurements.repeatTaken} onChange={(v) => setMeasurements({ ...measurements, repeatTaken: v, ...(v ? {} : { repeatSystolic: null, repeatDiastolic: null }) })} required={!!lower && (isHigh(lower) || isLow(lower) || (isBorderlineLow(lower) && measurements.dizzinessOrFaintness))} />
            {measurements.repeatTaken && (
              <div className="ml-6 flex gap-3">
                <NumberInput label="Repeat systolic" value={measurements.repeatSystolic} onChange={(v) => setMeasurements({ ...measurements, repeatSystolic: v })} unit="mmHg" required />
                <NumberInput label="Repeat diastolic" value={measurements.repeatDiastolic} onChange={(v) => setMeasurements({ ...measurements, repeatDiastolic: v })} unit="mmHg" required />
              </div>
            )}
            {isFirst && bpOutsideOnRepeat && history.returnVisitUsedBefore && (
              <p className="text-xs font-semibold text-red-700">The one permitted return visit was used at the previous first visit ({history.prefill?.consultationDate}): outside the limits again on repeat, refer to the GP for assessment and do not supply.</p>
            )}
            {isFirst && bpOutsideOnRepeat && !history.returnVisitUsedBefore && (
              <SelectInput
                label="Is this the one permitted return visit after a blood pressure or pulse reading outside the limits on repeat at the first visit?"
                value={measurements.returnVisitForBp}
                onChange={(v) => setMeasurements({ ...measurements, returnVisitForBp: v as OMMeasurements['returnVisitForBp'] })}
                options={[
                  { value: 'no', label: 'No: first visit (the patient may return once on another day)' },
                  { value: 'yes', label: 'Yes: outside the limits again, refer to the GP for assessment' },
                ]}
                required
              />
            )}
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Standing blood pressure (after 1 minute standing)</p>
              <div className="flex gap-3">
                <NumberInput label="Systolic" value={measurements.standingSystolic} onChange={(v) => setMeasurements({ ...measurements, standingSystolic: v })} unit="mmHg" required />
                <NumberInput label="Diastolic" value={measurements.standingDiastolic} onChange={(v) => setMeasurements({ ...measurements, standingDiastolic: v })} unit="mmHg" required />
              </div>
              <Checkbox label="Symptoms on standing (light-headedness, faintness)" checked={measurements.standingSymptoms} onChange={(v) => setMeasurements({ ...measurements, standingSymptoms: v })} />
              {fall && (
                <p className={`text-xs ${fall.systolic >= 20 || fall.diastolic >= 10 ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>
                  Change on standing: systolic {fall.systolic >= 0 ? 'fall' : 'rise'} of {Math.abs(fall.systolic)} mmHg, diastolic {fall.diastolic >= 0 ? 'fall' : 'rise'} of {Math.abs(fall.diastolic)} mmHg.
                  {fall.systolic >= 20 || fall.diastolic >= 10 ? ` A fall of 20 or more systolic OR 10 or more diastolic is a stop${fall.diastolic >= 10 && fall.systolic < 20 ? ' (the diastolic fall alone is enough)' : ''}.` : ''}
                </p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Resting pulse" value={measurements.pulse} onChange={(v) => setMeasurements({ ...measurements, pulse: v })} unit="per minute (50 to 100)" required />
              <div>
                <Checkbox label="Pulse repeated after a further 5 minutes seated" checked={measurements.pulseRepeatTaken} onChange={(v) => setMeasurements({ ...measurements, pulseRepeatTaken: v, ...(v ? {} : { pulseRepeat: null }) })} required={measurements.pulse !== null && (measurements.pulse < 50 || measurements.pulse > 100)} />
                {measurements.pulseRepeatTaken && <NumberInput label="Repeat pulse" value={measurements.pulseRepeat} onChange={(v) => setMeasurements({ ...measurements, pulseRepeat: v })} unit="per minute" required />}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Weight (pharmacy scales, light clothing)" value={measurements.weightKg} onChange={(v) => setMeasurements({ ...measurements, weightKg: v })} unit="kg" required />
              {isFirst && <NumberInput label="Height (first supply)" value={measurements.heightCm} onChange={(v) => setMeasurements({ ...measurements, heightCm: v })} unit="cm" required />}
            </div>
            {isFirst && b !== null && <p className={`text-xs ${b < 18.5 ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>Body mass index: {b} kg/m2{b < 18.5 ? ' (below 18.5: exclusion)' : ''}</p>}
            {isContinuation && change !== null && (
              <p className={`text-xs ${change >= 2 ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>
                Weight change since the previous supply ({history.previousWeightKg} kg): {change >= 0 ? '+' : ''}{change} kg.{change >= 2 ? ' A gain of 2 kg or more is a cardiovascular stop.' : ''}
              </p>
            )}
            {isRestart && measurements.weightKg !== null && <p className="text-xs text-gray-600">Restart: {measurements.weightKg} kg is recorded as the new previous weight for the 2 kg rule at the next supply.</p>}
            {medicines.weightLossTreatment && (
              <Checkbox label="Weight loss treatment: asked specifically about ankle swelling, tight shoes or rings and breathlessness" checked={measurements.fluidSymptomsAsked} onChange={(v) => setMeasurements({ ...measurements, fluidSymptomsAsked: v })} description={isContinuation ? 'New swelling is a cardiovascular stop whatever the scales say (tick it in the checklist at the top of this step)' : 'New swelling is a cardiovascular stop whatever the scales say'} required />
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 8: Dose and Supply */}
      {currentStep === STEP.supply && (
        <StepWrapper {...stepProps(STEP.supply, 'The dose today, the product, batch and expiry, the label and the next review date')}>
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              OFF-LABEL. Licensed use is 5 mg to 100 mg daily for severe hypertension with a diuretic and a beta-blocker. MEN: 2.5 mg (one tablet) once daily; WOMEN: 1.25 mg (half a tablet) once daily. One step up in the whole course, at or after supply visit 4: men to 5 mg (two tablets), women to 2.5 mg. Never more, never twice daily. One step down at any review for a non-cardiovascular side effect. Every supply is 8 weeks (56 days). Only {PRODUCT.shortName}, {PRODUCT.plNumber}; the 5 mg and 10 mg tablets are not used.
            </div>

            {isRestart && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                Restart: the starting dose is supplied ({start ? DOSE_INFO[start as Exclude<Dose, ''>].label : 'per sex'}), whatever dose the patient was on before the gap.{increaseUsed(patient.sex, history) ? ' The patient has already used the dose increase: the higher dose may be resumed at or after the fourth supply visit following this restart if the conditions are met; nobody has two increases.' : ''}
              </div>
            )}

            {isContinuation && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Dose decision at this review (current dose: {history.currentDose ? DOSE_INFO[history.currentDose].label : 'not recorded'}{increaseUsed(patient.sex, history) ? '; the increase has been used' : ''}{onHigherDose(patient.sex, history) ? '; currently on the higher dose' : ''})</p>
                <SelectInput
                  label="Decision"
                  value={supply.doseDecision}
                  onChange={(v) => setSupply({ ...supply, doseDecision: v as DoseDecision, reductionReason: '', doseChangeToldPatient: false })}
                  options={[
                    { value: 'unchanged', label: 'Dose unchanged' },
                    ...(!increaseUsed(patient.sex, history)
                      ? [{ value: 'increase', label: `Increase to ${maximumDose(patient.sex) ? DOSE_INFO[maximumDose(patient.sex) as Exclude<Dose, ''>].label : 'the maximum'} (once in the whole course, at or after supply visit 4)` }]
                      : []),
                    ...(canResume
                      ? [{ value: 'resume', label: `Resume the higher dose ${maximumDose(patient.sex) ? DOSE_INFO[maximumDose(patient.sex) as Exclude<Dose, ''>].label : ''} (increase already used; restarted at the starting dose; at or after the fourth supply visit following the restart)` }]
                      : []),
                    { value: 'reduce', label: `Reduce to the starting dose ${start ? DOSE_INFO[start as Exclude<Dose, ''>].label : ''} for a non-cardiovascular side effect` },
                    { value: 'stop-non-cv', label: history.previousNonCvStop === 'yes' ? 'Stop: starting dose not tolerated on the one further try (the PGD then no longer applies)' : 'Stop: starting dose not tolerated (not a cardiovascular stop; may try the starting dose once more later)' },
                  ]}
                  required
                />
                {supply.doseDecision === 'increase' && (
                  <p className={`text-xs ${increaseReason ? 'text-red-700 font-semibold' : 'text-green-700'}`}>
                    {increaseReason
                      ? `Not permitted: ${increaseReason}.`
                      : `Permitted: supply visit ${supplyNumber}, response inadequate against the baseline photographs, no stop symptom, no hypertrichosis the patient minds, systolic ${effective?.systolic} mmHg against baseline ${history.baselineSystolic} mmHg, pulse ${pulse}. This uses the one increase in the patient's whole course.`}
                  </p>
                )}
                {supply.doseDecision === 'resume' && (
                  <p className={`text-xs ${resumeReason ? 'text-red-700 font-semibold' : 'text-green-700'}`}>
                    {resumeReason
                      ? `Not permitted: ${resumeReason}.`
                      : `Permitted: supply visit ${visitSinceRestart} since the restart, response inadequate against the baseline photographs, no stop symptom, no hypertrichosis the patient minds, systolic ${effective?.systolic} mmHg against the restart baseline ${history.baselineSystolic} mmHg, pulse ${pulse}. This resumes the higher dose already used once; it is not a second increase.`}
                  </p>
                )}
                {supply.doseDecision === 'reduce' && (
                  <TextInput label="Non-cardiovascular side effect justifying the reduction" value={supply.reductionReason} onChange={(v) => setSupply({ ...supply, reductionReason: v })} placeholder="e.g. hypertrichosis the patient minds; headache; insomnia; gastrointestinal upset" required />
                )}
                {(supply.doseDecision === 'increase' || supply.doseDecision === 'resume' || supply.doseDecision === 'reduce') && (
                  <Checkbox label="The patient was told about the dose change and the review findings that justify it" checked={supply.doseChangeToldPatient} onChange={(v) => setSupply({ ...supply, doseChangeToldPatient: v })} description="The GP is informed of any dose change within 7 days" required />
                )}
                {supply.doseDecision === 'stop-non-cv' && (
                  <p className="text-xs text-red-700">
                    {history.previousNonCvStop === 'yes'
                      ? 'The starting dose has now been tried once more after a previous non-cardiovascular stop and is not tolerated: the PGD no longer applies to this patient. Refer to the GP; offer the licensed alternatives. Record the advice given in the block above and save as not supplied.'
                      : 'Where the starting dose is not tolerated, stop. This is not a cardiovascular stop: the patient may try the starting dose once more at a later date if they wish, after which the PGD does not apply. Record the advice given in the block above and save as not supplied.'}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border-2 border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 p-4 space-y-1 text-sm">
              <p className="font-semibold text-navy-900">Supply today</p>
              <p>Product: {PRODUCT.name}, {PRODUCT.plNumber}</p>
              <p>Dose: {doseInfo ? `${doseInfo.label} (label: "${doseInfo.labelWords}")` : 'not yet determined'}</p>
              <p>Quantity: {tablets !== null ? `${tablets} tablets of 2.5 mg for 8 weeks (56 days)` : 'not yet determined'}</p>
              <p>Supply number: {supplyNumber ?? '?'} ({history.supplyType ? SUPPLY_TYPE_LABEL[history.supplyType].split(' (')[0].toLowerCase() : 'type not recorded'}); {counted ?? 0} supplies so far {history.prescriberReviewHeld ? 'since the prescriber review' : 'under this PGD'}, maximum {MAX_SUPPLIES}.{reviewSought ? ' Prescriber review sought at this visit; it must be complete before supply 7.' : ''}</p>
              <p>Baseline systolic ({BASELINE_SYSTOLIC_DEFINITION}): {baselineToday !== null ? `${baselineToday} mmHg${isFirst || isRestart ? ' (recorded today)' : ''}` : 'not yet recorded'}.</p>
              <p className="text-xs text-gray-600">{PRODUCT.description} {PRODUCT.storage}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Batch number" value={supply.batchNumber} onChange={(v) => setSupply({ ...supply, batchNumber: v })} required placeholder="Batch" />
              <DateField label="Expiry date" value={supply.expiryDate} onChange={(v) => setSupply({ ...supply, expiryDate: v })} required />
            </div>
            <DateField label="Next review due (8 weeks, before the supply runs out)" value={supply.nextReviewDate} onChange={(v) => setSupply({ ...supply, nextReviewDate: v })} required hint={`Pre-filled at 56 days from today (${nextReviewDateFromToday()}). Every supply is numbered; supply visits 4 and 6 are full reviews with repeat photographs, and the prescriber review is sought at supply visit 6.${visit !== null ? ` The next visit will be supply visit ${visit + 1}.` : ''}`} />
            {dose === '1.25' && (
              <Checkbox label="Shown how to halve the tablet along the score line; tablet splitter offered or supplied; other half kept in the original blister or container and taken within 24 hours" checked={supply.tabletSplitterSupplied} onChange={(v) => setSupply({ ...supply, tabletSplitterSupplied: v })} required />
            )}
            <Checkbox
              label={`Labelled as a dispensed medicine with the patient's name, the dose in plain words (${doseInfo ? `"${doseInfo.labelWords}"` : 'ONE, TWO or HALF a tablet once a day'}), the date and the pharmacy, and the stop wording`}
              checked={supply.labelledAsDirected}
              onChange={(v) => setSupply({ ...supply, labelledAsDirected: v })}
              description={`Add to the label: "${LABEL_STOP_WORDING}"`}
              required
            />
            <Checkbox label="Manufacturer's patient information leaflet supplied" checked={supply.pilSupplied} onChange={(v) => setSupply({ ...supply, pilSupplied: v })} required />
            <Checkbox label="Told the patient the leaflet describes use for blood pressure because that is the licence" checked={supply.pilLicensedUseExplained} onChange={(v) => setSupply({ ...supply, pilLicensedUseExplained: v })} required />
            <SelectInput
              label="Licensed alternatives discussed or offered"
              value={supply.alternativesOffered}
              onChange={(v) => setSupply({ ...supply, alternativesOffered: v as OMSupply['alternativesOffered'] })}
              options={[
                { value: 'topical', label: 'Topical minoxidil 5% discussed (pharmacy medicine)' },
                ...(isMan ? [{ value: 'finasteride', label: 'Finasteride under the Male Pattern Hair Loss PGD discussed' }, { value: 'both', label: 'Topical minoxidil 5% and finasteride discussed' }] : []),
              ]}
              required
            />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 9: Counselling */}
      {currentStep === STEP.counselling && (
        <StepWrapper {...stepProps(STEP.counselling, 'Every point, every supply; the written record the patient takes away')}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900">Stop and seek help (tell every patient, and write it on the label and the record they take away)</p>
              <p className="text-xs text-red-900 mt-2">{STOP_AND_SEEK_HELP_ADVICE}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900">Adverse effects at the low doses used for hair loss (1,404 patients)</p>
              <p className="text-xs text-blue-800 mt-2">Hypertrichosis 15 per cent, lightheadedness 1.7 per cent, fluid retention 1.3 per cent, tachycardia 0.9 per cent, headache 0.4 per cent, periorbital oedema 0.3 per cent, insomnia 0.2 per cent. From the SmPC at antihypertensive doses, and to be watched for at any dose: tachycardia, pericarditis, pericardial effusion, fluid retention, oedema, ECG T wave change, gastrointestinal upset, pleural effusion, breast tenderness, rare blood dyscrasias and severe skin reactions. Report suspected adverse reactions via yellowcard.mhra.gov.uk; because this is an off-label use, report every cardiovascular adverse event, however minor.</p>
            </div>
            <Checkbox label="Take one dose a day at the same time, with or without food. Women: half a tablet, split along the line; keep the other half for tomorrow. Missed dose: take it when remembered the same day; do not double up" checked={counselling.oneDoseDaily} onChange={(v) => setCounselling({ ...counselling, oneDoseDaily: v })} required />
            <Checkbox label="You may shed more hair in the first 4 to 8 weeks: expected. Improvement takes 3 to 6 months; if you stop, the gain is lost over a few months. Treatment is long term" checked={counselling.sheddingExpected} onChange={(v) => setCounselling({ ...counselling, sheddingExpected: v })} required />
            <Checkbox label="Hypertrichosis warning given, IN WRITING: extra fine hair on the face, arms or body is the commonest side effect, and the colour of your hair can change. Both go away over a few months if you stop, and where you are above the starting dose it can be lowered" checked={counselling.hypertrichosisWarningWritten} onChange={(v) => setCounselling({ ...counselling, hypertrichosisWarningWritten: v })} description={isWoman ? 'It matters more to women; a woman who would find facial hair unacceptable may reasonably decline' : undefined} required />
            <Checkbox label="Stop and seek advice for a rash or blistering of the skin or mouth" checked={counselling.rashBlisteringAdvice} onChange={(v) => setCounselling({ ...counselling, rashBlisteringAdvice: v })} description="Rare Stevens-Johnson syndrome, bullous dermatitis and toxic epidermal necrolysis are in the SmPC" required />
            <Checkbox label="Stop-and-seek-help advice given, IN WRITING (the wording above)" checked={counselling.stopSeekHelpWritten} onChange={(v) => setCounselling({ ...counselling, stopSeekHelpWritten: v })} required />
            {isMan && <Checkbox label="Men: if you use sildenafil, tadalafil or a similar tablet, you may feel light-headed after taking it with minoxidil; sit or lie down until it passes and do not take a second dose that day. Tell us if you start buying it over the counter" checked={counselling.pde5Advice} onChange={(v) => setCounselling({ ...counselling, pde5Advice: v })} required />}
            <Checkbox label="Stand up slowly, go easy on alcohol and hot environments in the first few weeks, and do not drive if you feel dizzy" checked={counselling.standSlowlyAlcoholDriving} onChange={(v) => setCounselling({ ...counselling, standSlowlyAlcoholDriving: v })} required />
            {isWoman && <Checkbox label="Women: you must not become pregnant while taking this. Keep using your contraception, tell us if you stop it, and stop the tablets before trying for a baby" checked={counselling.pregnancyAdvice} onChange={(v) => setCounselling({ ...counselling, pregnancyAdvice: v })} required />}
            <Checkbox label="Tell any doctor, dentist, anaesthetist or pharmacist you see that you take minoxidil, especially if you are given a blood pressure or heart medicine; stop and seek advice if one is started. We will let your GP know" checked={counselling.tellDoctors} onChange={(v) => setCounselling({ ...counselling, tellDoctors: v })} required />
            <Checkbox label="Come back at your review date, before your tablets run out; a gap of more than 4 weeks means starting again at the first dose. We check blood pressure, pulse and weight before each supply, and after six supplies (about eleven months) a doctor must review you before we can continue" checked={counselling.reviewDateAndGap} onChange={(v) => setCounselling({ ...counselling, reviewDateAndGap: v })} required />
            <Checkbox label="Keep your last week of tablets until that doctor's review is confirmed" checked={counselling.keepLastWeekTablets} onChange={(v) => setCounselling({ ...counselling, keepLastWeekTablets: v })} description="A gap caused only by waiting for the prescriber review after supply 6 is not a restart provided the patient is off tablets for no more than 8 weeks" required />
            <Checkbox label={`The patient was told the date the next review is due${supply.nextReviewDate ? ` (${supply.nextReviewDate})` : ''}`} checked={counselling.toldNextReviewDate} onChange={(v) => setCounselling({ ...counselling, toldNextReviewDate: v })} required />
            <Checkbox label="Written record given: the dose, the stop-and-seek-help advice, the hypertrichosis warning and the review date" checked={counselling.writtenRecordGiven} onChange={(v) => setCounselling({ ...counselling, writtenRecordGiven: v })} required />
            {history.onTopicalMinoxidil && <Checkbox label="Told that the oral and topical products are the same drug and that stopping the topical product once the oral is established is reasonable" checked={counselling.topicalSameDrugExplained} onChange={(v) => setCounselling({ ...counselling, topicalSameDrugExplained: v })} required />}
            <Checkbox label="The GP will be informed within 7 days of this supply, of any dose change and of any stop for a side effect" checked={counselling.gpToBeInformed} onChange={(v) => setCounselling({ ...counselling, gpToBeInformed: v })} required />
            <Checkbox label="Adverse reaction reported or observed" checked={counselling.adverseReaction} onChange={(v) => setCounselling({ ...counselling, adverseReaction: v, ...(v ? {} : { adverseReactionDetails: '' }) })} description="The record must carry details of any adverse drug reaction and the action taken" />
            {counselling.adverseReaction && <TextArea label="Adverse reaction and action taken (Yellow Card; inform the GP)" value={counselling.adverseReactionDetails} onChange={(v) => setCounselling({ ...counselling, adverseReactionDetails: v })} rows={2} required />}
            <Checkbox label="All counselling completed and documented" checked={counselling.allCounsellingComplete} onChange={(v) => setCounselling({ ...counselling, allCounsellingComplete: v })} required />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 10: Summary */}
      {currentStep === STEP.summary && (
        <StepWrapper {...stepProps(STEP.summary, 'Pharmacist declaration (pharmacists only) and the consultation record')}>
          <div className="space-y-4 print:hidden">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">Pharmacists only. This PGD is not used by pharmacy technicians: the diagnosis, the cardiovascular screen and the off-label consent are the pharmacist&apos;s.</p>
              {roleUnknown && <p className="mt-1 text-xs text-amber-900">Your practitioner role could not be verified from your clinician record, so the declaration below is what the record relies on; the record says the role was not verified.</p>}
              <Checkbox label="I am a pharmacist registered and practising with the GPhC, named and authorised under this PGD, and I have completed the Get Real Health training module and competency assessment for it" checked={summary.registeredPharmacistConfirmed} onChange={(v) => setSummary({ ...summary, registeredPharmacistConfirmed: v })} required />
            </div>
            <TextInput label="Name of the supplying pharmacist" value={summary.pharmacistName} onChange={(v) => setSummary({ ...summary, pharmacistName: v })} required placeholder="Full name" />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary({ ...summary, pharmacistGPhC: v })} required placeholder="e.g. 2046322" />
            <TextInput label="Pharmacy name" value={summary.pharmacyName} onChange={(v) => setSummary({ ...summary, pharmacyName: v })} placeholder="Pharmacy name" />
            <TextInput label="Pharmacy address" value={summary.pharmacyAddress} onChange={(v) => setSummary({ ...summary, pharmacyAddress: v })} placeholder="Full address" />
            <TextInput label="How the GP will be informed within 7 days" value={summary.gpNotificationMethod} onChange={(v) => setSummary({ ...summary, gpNotificationMethod: v })} placeholder="e.g. emailed to the practice on saving; letter posted" required />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary({ ...summary, clinicalNotes: v })} placeholder="Any additional clinical notes or recommendations" rows={4} />
            <p className="text-xs text-gray-500">Supplied under {ORAL_MINOXIDIL_PGD_NAME}, {ORAL_MINOXIDIL_PGD_VERSION}. Records signed, dated, legible and contemporaneous, kept for 8 years.</p>
          </div>
          <div className="mt-6">
            <OralMinoxidilSummaryReport
              patient={patient}
              consent={consent}
              history={history}
              diagnosis={diagnosis}
              women={women}
              medical={medical}
              medicines={medicines}
              measurements={measurements}
              supply={supply}
              counselling={counselling}
              summary={effectiveSummary}
              clinicalAlerts={clinicalAlerts}
              isBlocked={isBlocked}
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default OralMinoxidilClient;
