'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { SaveDraftButton } from '../shared/components/SaveDraftButton';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { useConsultationTracking } from '../shared/hooks/useConsultationTracking';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import type { BasePatientDetails } from '../shared/types';
import type {
  CbtiStatus,
  DCbti,
  DConsent,
  DCounselling,
  DCourse,
  DDriving,
  DMedical,
  DMedicines,
  DPatientDetails,
  DScreening,
  DSleep,
  DSummary,
  DSupply,
  DayName,
  HandoverRecipient,
  Nation,
  NhsOffer,
  OsaStatus,
  Phq9Q9,
  Referral,
  ScrStatus,
  Sex,
  StopEvent,
  Strength,
  UnsuitableCategory,
  VisitType,
  YesNo,
} from './lib/daridorexant-types';
import {
  CBTI_STATUS_LABEL,
  DARIDOREXANT_PGD_NAME,
  DARIDOREXANT_PGD_VERSION,
  DAYS,
  ISI_LICENSING_NOTE,
  LABEL_DIRECTIONS,
  LABEL_WARNING,
  NATION_LABEL,
  NHS_OFFER_LABEL,
  OSA_LABEL,
  PHQ9_Q9_LABEL,
  PRODUCTS,
  RECORD_WORDS,
  REFERRAL_LABEL,
  REFERRAL_OUTCOMES,
  SCR_LABEL,
  STOP_SAME_DAY_WORDING,
  STOP_WITHIN_WEEK_WORDING,
  TABLETS_PER_SUPPLY,
  UNSUITABLE_LABEL,
  VISIT_LABEL,
  initialCbti,
  initialConsent,
  initialCounselling,
  initialCourse,
  initialDriving,
  initialMedical,
  initialMedicines,
  initialPatient,
  initialScreening,
  initialSleep,
  initialSummary,
  initialSupply,
} from './lib/daridorexant-types';
import {
  COURSE_ENDED_CODES,
  RISK_CODES,
  STEP,
  STEP_LABELS,
  WITHIN_WEEK_CODES,
  ageAtFirstSupply,
  ageOn,
  hasSupply1Record,
  needsFullAssessment,
  sleepAidGapHours,
  sleepAidIsLongActing,
  stopRuleCodesFor,
  suppliesOnRecord,
  bmi,
  formatUk,
  getDaridorexantAlerts,
  gpLetterText,
  intervalDays,
  intervalMaxDays,
  intervalMinDays,
  isReviewVisit,
  isVisit1,
  isVisit2,
  isVisit3,
  nextVisitWindow,
  nightsWithoutTablets,
  nonStopEffects,
  responseTest,
  sameDayStopSymptoms,
  shortNights,
  shouldBlockConsultation,
  stopBang,
  stopBangApplies,
  stopsBlockStep,
  strengthToday,
  supplyNumber,
  weekStopSymptoms,
} from './lib/daridorexant-clinical-logic';
import {
  validateCbti,
  validateConsent,
  validateCounselling,
  validateCourse,
  validateDriving,
  validateExclusionOutcome,
  validateMedical,
  validateMedicines,
  validatePatient,
  validateScreening,
  validateSleep,
  validateSummary,
  validateSupply,
} from './lib/daridorexant-validation';
import DaridorexantSummaryReport from './components/DaridorexantSummaryReport';
import { carriedCourseFields, deriveCarriedCourse, describeCarried, fetchPreviousDaridorexantRecords, maxOverrideVisitNumber, sanitizeCarried } from './lib/daridorexant-carry-forward';

const YES_NO = (yesLabel = 'Yes', noLabel = 'No') => [
  { value: 'yes', label: yesLabel },
  { value: 'no', label: noLabel },
];

function TimeField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return <TextInput label={label} type="time" value={value} onChange={onChange} required={required} />;
}

function Note({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'amber' | 'red' | 'blue' }) {
  const cls =
    tone === 'amber'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : tone === 'red'
        ? 'border-red-300 bg-red-50 text-red-900'
        : tone === 'blue'
          ? 'border-blue-200 bg-blue-50 text-blue-900'
          : 'border-gray-200 bg-gray-50 text-gray-700';
  return <div className={`rounded-lg border p-3 text-xs ${cls}`}>{children}</div>;
}

function BoolBox<T>({
  state,
  set,
  field,
  label,
  description,
  required,
}: {
  state: T;
  set: React.Dispatch<React.SetStateAction<T>>;
  field: keyof T;
  label: string;
  description?: string;
  required?: boolean;
}) {
  return <Checkbox label={label} checked={Boolean(state[field])} onChange={(v) => set((prev) => ({ ...prev, [field]: v }))} description={description} required={required} />;
}

const intOrNull = (v: number | null) => (v === null ? null : Math.floor(v));

export function DaridorexantClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patient, setPatient] = useState<DPatientDetails>(initialPatient);
  const [consent, setConsent] = useState<DConsent>(initialConsent);
  const [course, setCourse] = useState<DCourse>(initialCourse);
  const [sleep, setSleep] = useState<DSleep>(initialSleep);
  const [cbti, setCbti] = useState<DCbti>(initialCbti);
  const [screening, setScreening] = useState<DScreening>(initialScreening);
  const [medical, setMedical] = useState<DMedical>(initialMedical);
  const [medicines, setMedicines] = useState<DMedicines>(initialMedicines);
  const [driving, setDriving] = useState<DDriving>(initialDriving);
  const [supply, setSupply] = useState<DSupply>(initialSupply);
  const [counselling, setCounselling] = useState<DCounselling>(initialCounselling);
  const [summary, setSummary] = useState<DSummary>(initialSummary());
  /** Every stop code raised during the consultation, with when it appeared and when (if ever) it cleared. */
  const [stopHistory, setStopHistory] = useState<StopEvent[]>([]);

  const formState = useMemo(
    () => ({ currentStep, patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply, counselling, summary, stopHistory }),
    [currentStep, patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply, counselling, summary, stopHistory]
  );

  const restoreState = useCallback((s: Partial<typeof formState>) => {
    if (s.currentStep !== undefined) setCurrentStep(s.currentStep);
    if (s.patient) {
      const p = { ...initialPatient, ...s.patient };
      setPatient({ ...p, age: ageOn(p.dateOfBirth) });
    }
    if (s.consent) setConsent({ ...initialConsent, ...s.consent });
    if (s.course) setCourse({ ...initialCourse, ...s.course, carried: sanitizeCarried((s.course as { carried?: unknown }).carried) });
    if (Array.isArray(s.stopHistory)) setStopHistory(s.stopHistory);
    if (s.sleep) setSleep({ ...initialSleep, ...s.sleep });
    if (s.cbti) setCbti({ ...initialCbti, ...s.cbti });
    if (s.screening) setScreening({ ...initialScreening, ...s.screening });
    if (s.medical) setMedical({ ...initialMedical, ...s.medical });
    if (s.medicines) setMedicines({ ...initialMedicines, ...s.medicines });
    if (s.driving) {
      // Malformed restored days (missing, null, or with a non-string time) are treated as empty.
      const rawDays = (s.driving as { days?: unknown }).days;
      const daysIn = rawDays && typeof rawDays === 'object' && !Array.isArray(rawDays) ? (rawDays as Record<string, unknown>) : {};
      const days = { ...initialDriving.days };
      for (const d of DAYS) {
        const v = daysIn[d];
        const o = v && typeof v === 'object' && !Array.isArray(v) ? (v as { time?: unknown; work?: unknown }) : {};
        days[d] = { time: typeof o.time === 'string' ? o.time : '', work: o.work === true };
      }
      setDriving({ ...initialDriving, ...s.driving, days });
    }
    if (s.supply) setSupply({ ...initialSupply, ...s.supply });
    if (s.counselling) setCounselling({ ...initialCounselling, ...s.counselling });
    if (s.summary) {
      const fresh = initialSummary();
      setSummary({ ...fresh, ...s.summary, consultationDate: fresh.consultationDate, consultationTime: fresh.consultationTime });
    }
  }, []);

  const { clearSaved } = useFormPersistence('epgd-daridorexant', formState, restoreState);

  // Pharmacists only: a technician profile blocks the tool on every step.
  const profile = usePharmacistProfile();
  const technicianProfile = profile?.practitionerRole === 'technician';
  const roleVerified = profile?.practitionerRole === 'pharmacist';
  const roleUnknown = !technicianProfile && !roleVerified;
  useEffect(() => {
    if (!profile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- profile arrives asynchronously from the shared hook; same pattern as every other ePGD tool
    setSummary((prev) => ({ ...prev, pharmacistName: profile.name, pharmacistGPhC: profile.gphcNumber, pharmacyName: profile.pharmacyName, pharmacyAddress: profile.pharmacyAddress }));
  }, [profile, summary.pharmacistName, summary.pharmacistGPhC]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('draftId');
    if (!id) return;
    fetch(`/api/consultation-drafts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { draftState?: Partial<typeof formState> } | null) => {
        if (data?.draftState) restoreState(data.draftState);
      })
      .catch(() => {
        /* draft missing or expired: ignore */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The look-up result belongs to one patient: a change of name or date of
  // birth clears it (and any hand-entered course history), so the previous
  // patient's course is never carried to the next.
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupKey, setLookupKey] = useState('');
  const clearLookup = useCallback(() => {
    setLookupKey('');
    setLookupLoading(false);
    setCourse((c) => ({ ...c, recordLookup: '', lookupFor: '', carried: null, manualOverride: false, manualOverrideReason: '', ...carriedCourseFields(null), visitType: '' }));
  }, []);

  const handlePatientChange = useCallback(
    (field: keyof DPatientDetails, value: DPatientDetails[keyof DPatientDetails]) => {
      setPatient((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === 'dateOfBirth') updated.age = ageOn(typeof value === 'string' ? value : '');
        return updated;
      });
      if (field === 'firstName' || field === 'lastName' || field === 'dateOfBirth') clearLookup();
    },
    [clearLookup]
  );

  // ─── Course history from the previous daridorexant records at this pharmacy ───
  // Looked up when a returning patient is picked on the Patient step, and on
  // entering the Visit and Course step. The visit, supply 1 date, previous
  // supply date and strength, and the baseline ISI come from the records; a
  // change needs the manual override with a reason (course unverified).

  const lookupPrevious = useCallback(
    async (p: { firstName?: string; lastName?: string; dateOfBirth?: string }, force = false) => {
      const firstName = (p.firstName ?? '').trim();
      const lastName = (p.lastName ?? '').trim();
      const dateOfBirth = (p.dateOfBirth ?? '').trim();
      if (!firstName || !lastName || !dateOfBirth) return;
      const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dateOfBirth}`;
      if (key === lookupKey && !force) return;
      await Promise.resolve();
      setLookupKey(key);
      setLookupLoading(true);
      // A different patient: the previous patient's result is cleared before the new look-up.
      setCourse((c) =>
        !c.lookupFor || c.lookupFor === key
          ? { ...c, recordLookup: '', lookupFor: key }
          : { ...c, recordLookup: '', lookupFor: key, carried: null, manualOverride: false, manualOverrideReason: '', ...carriedCourseFields(null), visitType: '' }
      );
      const records = await fetchPreviousDaridorexantRecords({ firstName, lastName, dateOfBirth });
      setLookupLoading(false);
      const carried = records ? deriveCarriedCourse(records) : null;
      const recordLookup = records === null ? 'error' : carried ? 'found' : 'none';
      // A result for a patient other than the one now selected is discarded.
      setCourse((c) =>
        c.lookupFor !== key
          ? c
          : {
              ...c,
              recordLookup,
              carried,
              ...(c.manualOverride ? {} : carriedCourseFields(carried)),
            }
      );
    },
    [lookupKey]
  );

  useEffect(() => {
    if (currentStep !== STEP.course) return;
    if (!patient.firstName || !patient.lastName || !patient.dateOfBirth) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the lookup is a fetch against the records API; state is set only after the network round trip, same pattern as oral minoxidil
    void lookupPrevious(patient);
  }, [currentStep, patient, lookupPrevious]);

  const clinicalAlerts = useMemo(
    () => getDaridorexantAlerts({ patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply }),
    [patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply]
  );
  const isBlocked = useMemo(() => shouldBlockConsultation(clinicalAlerts), [clinicalAlerts]);
  const stopCodes = useMemo(() => new Set(clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.code)), [clinicalAlerts]);
  const has = (codes: ReadonlySet<string> | string[]) => [...codes].some((c) => stopCodes.has(c));

  // Record every stop raised, even if a later answer clears it.
  useEffect(() => {
    const now = new Date().toISOString();
    const stops = clinicalAlerts.filter((a) => a.severity === 'stop');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- an audit trail of the stops derived from the answers; it only appends or timestamps, never feeds back into the alerts
    setStopHistory((prev) => {
      let changed = false;
      const next = prev.map((e) => {
        if (!e.clearedAt && !stops.some((a) => a.code === e.code)) {
          changed = true;
          return { ...e, clearedAt: now };
        }
        return e;
      });
      for (const a of stops) {
        if (!next.some((e) => e.code === a.code && !e.clearedAt)) {
          changed = true;
          next.push({ code: a.code, message: a.message, raisedAt: now, step: currentStep, clearedAt: '' });
        }
      }
      return changed ? next : prev;
    });
  }, [clinicalAlerts, currentStep]);

  const { saveRecord, reset: resetTracking } = useConsultationTracking('daridorexant', currentStep);
  const [stopSaveStatus, setStopSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [stopSaveAttempted, setStopSaveAttempted] = useState(false);

  // Derived
  const v1 = isVisit1(course);
  const v2 = isVisit2(course);
  const v3 = isVisit3(course);
  const review = isReviewVisit(course);
  const full = needsFullAssessment(course);
  const n = supplyNumber(course);
  const strength: Strength = strengthToday(course, medicines);
  const product = strength ? PRODUCTS[strength] : null;
  const sb = stopBang(screening, patient);
  const b = bmi(screening);
  const r = responseTest(course, screening, supply);
  const shorts = shortNights(driving);
  const visitWindow = nextVisitWindow(course);
  const isFemale = patient.sex === 'female';
  const age65 = (patient.age ?? 0) >= 65;
  const riskPresent = has(RISK_CODES) || (stopCodes.has('STOP_SAME_DAY') && course.sxSuicidal);
  const physicalSameDay = stopCodes.has('STOP_SAME_DAY') && (course.sxAllergy || course.sxDrivingNotAwake || course.sxActivityInjury);
  const sameDayPresent = riskPresent || physicalSameDay;
  const stopRule = has(stopRuleCodesFor(course));

  // Validation
  const errors = [
    validatePatient(patient),
    validateConsent(consent),
    validateCourse(course),
    validateSleep(sleep, course),
    validateCbti(cbti, course),
    validateScreening(screening, course),
    validateMedical(medical),
    validateMedicines(medicines, course),
    validateDriving(driving, course),
    validateSupply(supply, course, medicines),
    validateCounselling(counselling, { female: isFemale, age65, cpap: screening.osa === 'cpap-most-nights' }),
    validateSummary(summary, !!technicianProfile),
  ];
  const blockedByStep = STEP_LABELS.map((_, i) => stopsBlockStep(clinicalAlerts, i));
  const canProceedByStep = errors.map((e, i) => e === null && !blockedByStep[i] && !technicianProfile);
  // Save & Print on the Summary step validates every step, not only the summary.
  const firstIncomplete = errors.findIndex((e, i) => i < STEP.summary && e !== null);
  const summaryError = firstIncomplete >= 0 ? `${STEP_LABELS[firstIncomplete]} step: ${errors[firstIncomplete]}` : errors[STEP.summary];
  const summaryCanProceed = canProceedByStep[STEP.summary] && firstIncomplete < 0 && !isBlocked;
  const blockedHere = blockedByStep[currentStep] || !!technicianProfile;

  const handleNext = () => {
    if (!canProceedByStep[currentStep]) return;
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Exclusion outcome ───
  const referralOptions = useMemo<{ value: Referral; label: string }[]>(() => {
    const list: Referral[] = [];
    if (sameDayPresent) {
      // Same-day stops: only same-day or emergency referrals.
      if (riskPresent) list.push('emergency', 'same-day');
      if (physicalSameDay) list.push('emergency-physical', 'urgent-gp');
    } else if (has(WITHIN_WEEK_CODES)) {
      list.push('gp-week');
    } else {
      if (has(['PHQ9_10_OR_MORE', 'GAD7_10_OR_MORE', 'SERIOUS_MENTAL_ILLNESS', 'PTSD', 'SECONDARY_CARE_MH', 'MH_TREATMENT_CHANGED'])) list.push('talking-therapies');
      if (has(['CBTI_AVAILABLE_NOT_TRIED', 'CBTI_PREFERENCE', 'CBTI_TRIED_NOT_MET', 'CBTI_NHS_AVAILABLE', 'SLEEP_HYGIENE_NOT_FOLLOWED', 'ISI_BELOW_15', 'INADEQUATE_RESPONSE', 'EARLY_STOP_VISIT2'])) list.push('cbti-signpost');
      if (stopCodes.has('NO_SLEEP_DIARY')) list.push('diary-return');
      if (has(COURSE_ENDED_CODES) || has(['PREVIOUS_COURSE', 'OREXIN_ELSEWHERE'])) list.push('prescriber');
      if (has(['DRIVING_FIRST_4_NOT_POSSIBLE', 'DRIVING_CANNOT_KEEP_9_HOURS', 'EARLY_MORNING_WORK_DRIVER', 'DRIVING_9_HOURS_INCONSISTENT', 'GROUP2_DRIVER', 'SAFETY_CRITICAL_ROLE'])) list.push('occupational');
      list.push('gp-routine', 'advice-only', 'declined');
    }
    return [...new Set(list)].map((v) => ({ value: v, label: REFERRAL_LABEL[v] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCodes, sameDayPresent, riskPresent, physicalSameDay]);

  const effectiveSummary = useMemo<DSummary>(
    () => (referralOptions.some((o) => o.value === summary.referral) ? summary : { ...summary, referral: '' }),
    [summary, referralOptions]
  );

  const exclusionOutcomeError = useMemo(() => {
    const base = validateExclusionOutcome(effectiveSummary, riskPresent);
    if (base) return base;
    if (stopRule && (!counselling.adverseReaction || !counselling.adverseReactionDetails.trim()))
      return 'Stop rule: record the adverse reaction and the action taken';
    if (stopRule && !counselling.yellowCardSubmitted) return 'Stop rule: black triangle medicine, report via the Yellow Card scheme and tick once submitted';
    return null;
  }, [effectiveSummary, riskPresent, stopRule, counselling.adverseReaction, counselling.adverseReactionDetails, counselling.yellowCardSubmitted]);

  // ─── Consultation record ───
  const stopReasons = useMemo(() => clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message), [clinicalAlerts]);
  const supplied = !isBlocked && !!strength && !!n;
  const letterText = useMemo(() => {
    const adverseEffects = [...sameDayStopSymptoms(course), ...weekStopSymptoms(course), ...nonStopEffects(course), counselling.adverseReaction ? counselling.adverseReactionDetails : '']
      .filter(Boolean)
      .join('; ');
    return gpLetterText({
      patient,
      consent,
      course,
      sleep,
      cbti,
      screening,
      medical,
      medicines,
      driving,
      supply,
      pharmacistName: summary.pharmacistName,
      pharmacyName: summary.pharmacyName,
      strength,
      supplied,
      stopReasons,
      stopCodes: [...stopCodes],
      adverseEffects,
    });
  }, [patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply, summary.pharmacistName, summary.pharmacyName, strength, supplied, stopReasons, stopCodes, counselling.adverseReaction, counselling.adverseReactionDetails]);

  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    clearSaved();
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
        course,
        sleep: full ? sleep : null,
        cbti,
        screening,
        medical,
        medicines,
        driving,
        supply,
        counselling,
        summary,
        clinicalAlerts,
        /** Every stop raised during the consultation, with timestamps, including any later cleared by a changed answer. */
        stopHistory,
        /** Course history: from this pharmacy's records, or entered by hand (unverified) with the reason. */
        courseHistory: {
          source: course.manualOverride ? 'manual (unverified)' : course.recordLookup === 'found' ? 'pharmacy records' : course.recordLookup === 'error' ? 'records lookup failed' : 'no previous record',
          recordLookup: course.recordLookup,
          fromRecords: course.carried,
          manualOverride: course.manualOverride,
          manualOverrideReason: course.manualOverride ? course.manualOverrideReason : null,
          suppliesOnRecord: suppliesOnRecord(course),
          supply1RecordFound: hasSupply1Record(course),
          fullAssessmentApplied: full,
        },
        pgdVersion: DARIDOREXANT_PGD_VERSION,
        pgdName: DARIDOREXANT_PGD_NAME,
        recordWords: supplied ? RECORD_WORDS : null,
        blackTriangle: true,
        suppliedUnderPgd: supplied,
        practitionerRole: 'pharmacist',
        practitionerRoleVerified: roleVerified,
        practitionerRoleSource: roleVerified ? 'clinician record' : 'self-declaration only (role could not be verified)',
        registeredPharmacistConfirmed: summary.registeredPharmacistConfirmed,
        supplyNumber: n,
        supply1Date: v1 ? summary.consultationDate : course.supply1Date,
        ageAtFirstSupply: ageAtFirstSupply(patient, course),
        strength: supplied ? strength : null,
        product: supplied && product ? { name: product.name, maNumber: product.maNumber, maNumberFromPack: supply.maNumberFromPack, batch: supply.batchNumber, expiry: supply.expiryDate, tablets: TABLETS_PER_SUPPLY } : null,
        labelWording: supplied ? `${LABEL_DIRECTIONS}. ${LABEL_WARNING}` : null,
        nextVisitWindow: supplied && visitWindow && !visitWindow.impossible ? { from: visitWindow.from, to: visitWindow.to } : null,
        timing: review
          ? { daysSincePreviousSupply: intervalDays(course), minDays: intervalMinDays(course), maxDays: intervalMaxDays(course), nightsWithoutTablets: nightsWithoutTablets(course), withheldNights: course.withheldNights, withheldDetails: course.withheldDetails }
          : null,
        adherence: review ? { nightsTakenOfLast14Due: course.nightsTakenOf14 } : null,
        screens: {
          isi: screening.isi,
          isiBaseline: v1 ? screening.isi : course.baselineIsi,
          isiTodayAsBaselineCheck: full && !v1 ? screening.isi : null,
          isiChange: review && course.baselineIsi !== null && screening.isi !== null ? screening.isi - course.baselineIsi : null,
          phq9: screening.phq9,
          phq9Q9: screening.phq9Q9,
          gad2: screening.gad2,
          gad7: screening.gad7,
          epworth: full ? screening.epworth : null,
          stopBang: full && stopBangApplies(screening) ? { score: sb.score, stopItems: sb.stopItems, witnessedApnoea: screening.observed } : null,
          heightCm: full ? screening.heightCm : null,
          weightKg: full ? screening.weightKg : null,
          bmi: full ? b : null,
          neckCm: full ? screening.neckCm : null,
          isiLicensingNote: 'ISI total only, completed on the pharmacy\'s licensed form (Mapi Research Trust); item wording not reproduced',
        },
        cbtiGate: full ? { decision: cbti.status, reason: cbti.status === 'unsuitable' ? cbti.unsuitableReason : cbti.status === 'not-available' ? cbti.notAvailableNote : cbti.status === 'tried' ? `${cbti.triedProgramme}, ${cbti.triedDates}` : '' } : null,
        drivingPlan: { drives: driving.drives, bedtime: driving.bedtime, days: driving.days, drivesForWork: driving.drivesForWork, mustEarlyCannot9: driving.mustEarlyCannot9, nightsToSkip: shorts.map((s) => s.nightBefore), first4Plan: driving.drives === 'yes' && v1 ? driving.first4Plan : null },
        sleepAidGapHours: medicines.nonPrescribedSleepAid && sleepAidIsLongActing(medicines) ? sleepAidGapHours(medicines) : null,
        visit2: v2 ? { isiUnchangedOrWorse: course.baselineIsi !== null && screening.isi !== null ? screening.isi >= course.baselineIsi : null, wishesToContinue: supply.wishesToContinue, earlyStop: stopCodes.has('EARLY_STOP_VISIT2') } : null,
        responseTest: v3 ? { ...r, decision: r.adequate && supplied ? 'adequate: supply 3 and handover letter' : 'not adequate: stopped' } : null,
        handover: v3 && supplied ? { recipient: supply.handoverRecipient, other: supply.handoverOtherName, sentToday: supply.handoverSentToday, date: summary.consultationDate } : null,
        gpLetterText: letterText,
        gpNotification: { agreed: patient.gpNotificationAgreed === 'yes', method: summary.gpNotificationMethod },
        yellowCard: counselling.yellowCardSubmitted,
        adverseReaction: counselling.adverseReaction ? counselling.adverseReactionDetails : null,
        exclusion: isBlocked
          ? { reasons: stopReasons, adviceGiven: effectiveSummary.exclusionAdvice, referral: effectiveSummary.referral, riskActionRecord: effectiveSummary.riskActionRecord, stopRule }
          : null,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked ? (REFERRAL_OUTCOMES.has(effectiveSummary.referral) ? 'referred' : 'not_supplied') : 'completed',
      ...(supplied && product
        ? { medicine: { name: `${product.name}, ${product.maNumber}`, dose: product.doseLabel, duration: '30 nights', quantity: `${TABLETS_PER_SUPPLY} tablets (supply ${n} of 3)` } }
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
  }, [clearSaved, patient, consent, course, v1, v2, v3, review, full, stopHistory, sleep, cbti, screening, medical, medicines, driving, supply, counselling, summary, clinicalAlerts, supplied, roleVerified, n, strength, product, visitWindow, sb, b, shorts, stopCodes, r, letterText, isBlocked, stopReasons, effectiveSummary, stopRule]);

  const handleNewConsultation = useCallback(() => {
    clearSaved();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatient({ ...initialPatient });
    setConsent({ ...initialConsent });
    setCourse({ ...initialCourse });
    setSleep({ ...initialSleep });
    setCbti({ ...initialCbti });
    setScreening({ ...initialScreening });
    setMedical({ ...initialMedical });
    setMedicines({ ...initialMedicines });
    setDriving({ ...initialDriving });
    setSupply({ ...initialSupply });
    setCounselling({ ...initialCounselling });
    setSummary(initialSummary());
    setStopHistory([]);
    setLookupKey('');
    setStopSaveStatus('idle');
    setStopSaveAttempted(false);
  }, [clearSaved]);

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
    (data.clinicalData as Record<string, unknown>).stopReason = stopReasons.join('; ');
    const ok = await saveRecord(data);
    if (!ok) {
      setStopSaveStatus('error');
      return;
    }
    resetTracking();
    handleNewConsultation();
  }, [exclusionOutcomeError, getConsultationData, currentStep, stopReasons, saveRecord, resetTracking, handleNewConsultation]);

  const technicianBlock = technicianProfile ? (
    <div className="mb-6 rounded-lg border border-red-400 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">Pharmacists only: this PGD is not used by pharmacy technicians</p>
      <p className="mt-1 text-xs text-red-800">
        Your practitioner record is a pharmacy technician. The insomnia assessment, the screening questionnaires, the interaction and Summary Care Record checks, the brief CBT-I advice and the effectiveness assessment are not delegated to pharmacy technicians. This consultation cannot proceed or be saved under your login.
      </p>
    </div>
  ) : roleUnknown ? (
    <div className="mb-6 rounded-lg border border-amber-400 bg-amber-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-amber-900">Practitioner role could not be verified</p>
      <p className="mt-1 text-xs text-amber-900">
        Your login did not return a practitioner role. This PGD is for pharmacists only. The supply rests on your declaration on the Summary step, which is required, and the record says the role could not be verified. If you are a pharmacy technician, stop here.
      </p>
    </div>
  ) : null;

  const exclusionOutcomeBlock =
    isBlocked && !technicianProfile ? (
      <div className="mb-6 space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
        <p className="text-sm font-semibold text-red-800">
          {consent.patientDeclined ? 'Patient declines: record the advice given and the decision' : 'Not supplied under this PGD: record the reason, the advice given and the referral'}
        </p>
        <p className="text-xs text-red-800">
          Explain the reason, and give sleep hygiene advice and the CBT-I signposting in Appendix 3 in writing. Document the reason, the advice given and the referral made; inform the GP where a referral is made. To change an answer instead, go back to the step it was given on: the stop clears when the answer does.
        </p>
        {riskPresent && (
          <p className="text-xs font-semibold text-red-900">
            SUICIDE OR SELF-HARM RISK: do not leave it there. Ask about plans and intent. Immediate danger or a plan: call 999 or arrange accompanied attendance at A&amp;E. Otherwise: same-day contact with the GP, or NHS 111 (option 2 for mental health in England), and give the Samaritans number (116 123). Record what was done.
          </p>
        )}
        {physicalSameDay && (
          <p className="text-xs font-semibold text-red-900">
            STOP AND SEEK HELP THE SAME DAY: a serious allergic reaction (swelling of the face, lips or tongue, or difficulty breathing) is an emergency: call 999 or arrange A&amp;E. Driving or another activity while not fully awake: arrange an urgent same-day GP appointment (or NHS 111 where the GP cannot be reached the same day). No further supply under this PGD; Yellow Card; inform the GP.
          </p>
        )}
        {review && has(RISK_CODES) && (
          <p className="text-xs font-semibold text-red-900">At supply visits 2 and 3 suicide or self-harm risk is a same-day STOP RULE: no further supply under this PGD; record the adverse reaction; Yellow Card; inform the GP.</p>
        )}
        {stopCodes.has('STOP_WITHIN_WEEK') && (
          <p className="text-xs font-semibold text-red-900">STOP AND CONTACT THE PHARMACY OR GP WITHIN A WEEK: no further supply under this PGD; the patient is referred to the GP; Yellow Card. Never managed by reducing the dose.</p>
        )}
        {has(['EPWORTH_OVER_10', 'NARCOLEPSY_FEATURES']) && driving.drives !== 'no' && (
          <p className="text-xs font-semibold text-red-900">A patient who falls asleep unintentionally while driving, or with a high Epworth score who drives, is advised not to drive until assessed, and that DVLA rules may apply.</p>
        )}
        {has(['INADEQUATE_RESPONSE', 'EARLY_STOP_VISIT2', 'ADHERENCE_BELOW_10', 'NOT_WISHING_TO_CONTINUE', 'PATIENT_WISHES_TO_STOP']) && (
          <p className="text-xs font-semibold text-red-900">The patient stops the next night (no tapering is needed), is advised to re-engage with CBT-I, and the GP is informed.</p>
        )}
        {riskPresent && (
          <TextArea
            label="Plans and intent asked about; what was done"
            value={summary.riskActionRecord}
            onChange={(v) => setSummary({ ...summary, riskActionRecord: v })}
            placeholder="e.g. Asked about plans and intent: no plan. GP surgery called 11:20, same-day appointment 15:00. Samaritans 116 123 given."
            rows={3}
            required
          />
        )}
        {stopRule && (
          <>
            <Checkbox
              label="Adverse reaction recorded"
              checked={counselling.adverseReaction}
              onChange={(v) => setCounselling({ ...counselling, adverseReaction: v, ...(v ? {} : { adverseReactionDetails: '' }) })}
              description="Black triangle medicine: every suspected adverse reaction is reported"
              required
            />
            {counselling.adverseReaction && (
              <TextArea label="Adverse reaction and action taken" value={counselling.adverseReactionDetails} onChange={(v) => setCounselling({ ...counselling, adverseReactionDetails: v })} rows={2} required />
            )}
            <Checkbox label="Yellow Card report submitted (yellowcard.mhra.gov.uk)" checked={counselling.yellowCardSubmitted} onChange={(v) => setCounselling({ ...counselling, yellowCardSubmitted: v })} required />
          </>
        )}
        <TextArea
          label="Reason explained, advice given and decision reached"
          value={summary.exclusionAdvice}
          onChange={(v) => setSummary({ ...summary, exclusionAdvice: v })}
          placeholder="e.g. Sleepio free in Scotland: signposted, written sleep hygiene advice given, invited to return after 4 weeks of engagement"
          rows={3}
          required
        />
        <SelectInput label="Referral or next action" value={effectiveSummary.referral} onChange={(v) => setSummary({ ...summary, referral: v as Referral })} options={referralOptions} required />
        <TextInput label="How the GP will be informed" value={summary.gpNotificationMethod} onChange={(v) => setSummary({ ...summary, gpNotificationMethod: v })} placeholder="e.g. emailed to the practice on saving" />
        <details className="text-xs text-red-900">
          <summary className="cursor-pointer font-semibold">GP notification text</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded border border-red-200 bg-white p-2 text-[11px] text-navy-900">{letterText}</pre>
        </details>
        {stopSaveAttempted && exclusionOutcomeError && <p className="text-xs font-medium text-red-700">{exclusionOutcomeError}</p>}
        {stopSaveStatus === 'error' && <p className="text-xs font-medium text-red-700">Could not save the consultation record. Try again, or print this page as a backup.</p>}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSaveStopAndNew}
            disabled={stopSaveStatus === 'saving'}
            className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
          >
            {stopSaveStatus === 'saving' ? 'Saving...' : 'Record exclusion / not supplied and start a new consultation'}
          </button>
          <span className="text-xs text-red-800">Saved as {REFERRAL_OUTCOMES.has(effectiveSummary.referral) ? '"referred"' : '"not supplied"'}, then the form is cleared.</span>
        </div>
      </div>
    ) : null;

  const declineBlock =
    currentStep >= STEP.consent && currentStep <= STEP.counselling ? (
      <div className="mt-6 border-t pt-4 print:hidden">
        <Checkbox
          label="The patient declines"
          checked={consent.patientDeclined}
          onChange={(v) => setConsent({ ...consent, patientDeclined: v })}
          description="The tool stops here. Record the reason discussed, the advice given and the decision reached, then save the record"
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
    canProceed: i === STEP.summary ? summaryCanProceed : canProceedByStep[i],
    validationError: i === STEP.summary ? summaryError : errors[i],
    ...wrapperShared,
  });


  return (
    <>
      <div className="mb-3 flex justify-end">
        <SaveDraftButton pgdSlug="daridorexant" patientFirstName={patient.firstName} patientLastName={patient.lastName} patientDob={patient.dateOfBirth} getDraftState={() => formState} />
      </div>

      <div className="mb-6">
        <ProgressBar stepLabels={STEP_LABELS} currentStep={currentStep} onStepClick={(s) => s < currentStep && setCurrentStep(s)} completedSteps={completedSteps} hasErrors={isBlocked} />
      </div>

      {technicianBlock}
      {(currentStep >= STEP.course || isBlocked) && clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}
      {exclusionOutcomeBlock}

      {/* Step 0: Patient */}
      {currentStep === STEP.patient && (
        <StepWrapper {...stepProps(STEP.patient, 'Patient information; age is calculated from the date of birth')}>
          <p className="mb-4 text-xs text-gray-600">
            Adults aged 18 to 75 at the first supply (a patient who turns 76 during the course may complete it). Pharmacists only; face to face on the premises. {DARIDOREXANT_PGD_VERSION}.
          </p>
          <PatientDetailsStep patient={patient} onChange={handlePatientChange} requireAdult onReturningPatient={(p: Partial<BasePatientDetails>) => void lookupPrevious(p)} />
          {course.recordLookup === 'found' && course.carried && (
            <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
              <p className="font-semibold">Previous daridorexant records at this pharmacy ({course.carried.recordIds.length})</p>
              <p className="mt-1">{describeCarried(course.carried)}. The course history is carried forward to the Visit and Course step.</p>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <SelectInput
              label="Sex"
              value={patient.sex}
              onChange={(v) => handlePatientChange('sex', v as Sex)}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female (pregnancy and breastfeeding questions apply)' },
              ]}
              required
            />
            <SelectInput label="Is the patient registered with a GP?" value={patient.gpRegistered} onChange={(v) => handlePatientChange('gpRegistered', v as YesNo)} options={YES_NO('Yes', 'No (exclusion)')} required />
            <SelectInput
              label="Does the patient agree to the GP being informed of the supply, of any stop for a side effect and of the outcome of the effectiveness assessment?"
              value={patient.gpNotificationAgreed}
              onChange={(v) => handlePatientChange('gpNotificationAgreed', v as YesNo)}
              options={YES_NO('Yes', 'No (a patient who will not allow the GP to be told is not supplied)')}
              required
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 1: Consent */}
      {currentStep === STEP.consent && (
        <StepWrapper {...stepProps(STEP.consent, 'Face to face, capacity, consent, the private service and the 3-supply limit')}>
          <div className="mb-6 space-y-3 border-b pb-6">
            <SelectInput
              label="Is the consultation face to face on the pharmacy premises?"
              value={consent.faceToFace}
              onChange={(v) => setConsent({ ...consent, faceToFace: v as YesNo })}
              options={YES_NO('Yes', 'No: remote or telephone (not covered)')}
              required
            />
            <Checkbox label="The patient lacks capacity to consent (exclusion)" checked={consent.lacksCapacity} onChange={(v) => setConsent({ ...consent, lacksCapacity: v })} description="Mental Capacity Act 2005" />
          </div>
          <ConsentStep consent={consent} onChange={(field, value) => setConsent({ ...consent, [field]: value })} />
          <div className="mt-6 space-y-3 border-t pt-6">
            <Checkbox label="The patient understands that this is a private service and what it costs" checked={consent.understandsCost} onChange={(v) => setConsent({ ...consent, understandsCost: v })} required />
            <Checkbox
              label="Explained: this PGD covers at most three supplies; treatment stops if it has not helped enough at supply visit 3; any continuation is a prescriber's decision"
              checked={consent.threeSupplyLimitExplained}
              onChange={(v) => setConsent({ ...consent, threeSupplyLimitExplained: v })}
              required
            />
            <Checkbox
              label="Explained: the GP may decline to continue it, and a private prescriber is the alternative"
              checked={consent.gpMayDeclineExplained}
              onChange={(v) => setConsent({ ...consent, gpMayDeclineExplained: v })}
              required
            />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 2: Visit and course */}
      {currentStep === STEP.course && (
        <StepWrapper {...stepProps(STEP.course, 'The supply number, the timing rules, adherence and the stop symptoms since the last supply')}>
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
              <p className="text-sm font-semibold">Course history from this pharmacy&apos;s records</p>
              {lookupLoading || !course.recordLookup ? (
                <p>Looking up previous daridorexant records for this patient...</p>
              ) : course.recordLookup === 'error' ? (
                <div className="space-y-2 rounded border border-red-300 bg-red-50 p-2 text-red-900">
                  <p className="font-semibold">The pharmacy&apos;s previous daridorexant records could not be read. You cannot continue until the look-up succeeds.</p>
                  <p>Retry the look-up. Only if it still fails, enter the course history by hand below with the reason: the course is then UNVERIFIED (a caution stays on the record) and the supply 1 assessment applies in full.</p>
                  <button type="button" onClick={() => void lookupPrevious(patient, true)} className="rounded border border-red-400 bg-white px-3 py-1 text-xs font-semibold text-red-900 hover:bg-red-100">
                    Retry the look-up
                  </button>
                </div>
              ) : (
                <p>{describeCarried(course.carried)}.</p>
              )}
              {!course.manualOverride && course.visitType && <p className="text-sm font-semibold text-navy-900">Visit today: {VISIT_LABEL[course.visitType as Exclude<VisitType, ''>]}</p>}
              <Checkbox
                label="Enter the course history by hand instead (the course is then UNVERIFIED)"
                checked={course.manualOverride}
                onChange={(v) =>
                  setCourse((c) => ({
                    ...c,
                    manualOverride: v,
                    ...(v ? {} : { manualOverrideReason: '', ...carriedCourseFields(c.carried) }),
                  }))
                }
                description="Only where the records are wrong or incomplete: the reason is recorded and a caution stays on the record. Three supplies on record always block a fourth, and the supply 1 assessment applies in full whenever no supply 1 record is found"
              />
              {course.manualOverride && (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                  <TextInput label="Reason the records are not used" value={course.manualOverrideReason} onChange={(v) => setCourse({ ...course, manualOverrideReason: v })} placeholder="e.g. supply 1 record saved under a misspelt surname; checked against the PMR" required />
                  <SelectInput
                    label="Supply visit"
                    value={course.visitType}
                    onChange={(v) =>
                      setCourse((c) => ({
                        ...initialCourse,
                        recordLookup: c.recordLookup,
                        lookupFor: c.lookupFor,
                        carried: c.carried,
                        manualOverride: c.manualOverride,
                        manualOverrideReason: c.manualOverrideReason,
                        supply1Date: c.supply1Date,
                        previousSupplyDate: c.previousSupplyDate,
                        previousStrength: c.previousStrength,
                        baselineIsi: c.baselineIsi,
                        visitType: v as VisitType,
                      }))
                    }
                    options={(Object.keys(VISIT_LABEL) as Exclude<VisitType, ''>[])
                      .filter((k) => k === 'after3' || Number(k.replace('visit', '')) <= maxOverrideVisitNumber(course))
                      .map((k) => ({ value: k, label: VISIT_LABEL[k] }))}
                    required
                  />
                </div>
              )}
            </div>
            <Note>
              THREE SUPPLIES, NUMBERED, 30 TABLETS EACH, 25 TO 35 DAYS APART, counted by supply number from the first supply and never reset. Each supply visit is also no more than 7 days after the patient&apos;s last tablet: more than 7 nights without tablets ends the course, and the patient is referred to a prescriber. Nights withheld on this PGD&apos;s instruction because of an interacting medicine are recorded and are not counted as nights without tablets.
            </Note>
            {course.visitType && course.visitType !== 'after3' && (
              <SelectInput
                label="Is the patient already taking daridorexant or another orexin receptor antagonist on prescription or from any other source?"
                value={course.orexinElsewhere}
                onChange={(v) => setCourse({ ...course, orexinElsewhere: v as YesNo })}
                options={YES_NO('Yes (exclusion)', 'No')}
                required
              />
            )}
            {v1 && (
              <SelectInput
                label="Has a course under this PGD already been started or completed at any pharmacy, whatever its outcome? (patient's account and pharmacy records)"
                value={course.previousCourse}
                onChange={(v) => setCourse({ ...course, previousCourse: v as YesNo })}
                options={YES_NO('Yes (exclusion)', 'No')}
                required
              />
            )}
            {review && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">Course so far</p>
                {course.manualOverride ? (
                  <div className="grid gap-4 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:grid-cols-2">
                    <TextInput label="Date of supply 1 (unverified)" type="date" value={course.supply1Date} onChange={(v) => setCourse({ ...course, supply1Date: v, ...(v2 ? { previousSupplyDate: v } : {}) })} required />
                    {v3 && <TextInput label="Date of supply 2 (unverified)" type="date" value={course.previousSupplyDate} onChange={(v) => setCourse({ ...course, previousSupplyDate: v })} required />}
                    <SelectInput
                      label="Strength of the previous supply (unverified)"
                      value={course.previousStrength}
                      onChange={(v) => setCourse({ ...course, previousStrength: v as Strength })}
                      options={[
                        { value: '50', label: '50 mg' },
                        { value: '25', label: '25 mg (regular moderate CYP3A4 inhibitor)' },
                      ]}
                      required
                    />
                    <NumberInput label="Baseline ISI (supply 1, unverified)" value={course.baselineIsi} onChange={(v) => setCourse({ ...course, baselineIsi: intOrNull(v) })} min={0} max={28} required />
                  </div>
                ) : (
                  <div className="grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 sm:grid-cols-2">
                    <p>Supply 1: <span className="font-semibold">{course.supply1Date ? formatUk(course.supply1Date) : 'no supply 1 record'}</span></p>
                    <p>Previous supply: <span className="font-semibold">{course.previousSupplyDate ? formatUk(course.previousSupplyDate) : 'not on record'}</span></p>
                    <p>Previous strength: <span className="font-semibold">{course.previousStrength ? `${course.previousStrength} mg` : 'not on record'}</span></p>
                    <p>Baseline ISI: <span className="font-semibold">{course.baselineIsi ?? 'not on record'}</span></p>
                    <p className="sm:col-span-2 text-[11px]">From the records (read-only). To change, enter the course history by hand above with the reason.</p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Date of the last tablet" type="date" value={course.lastTabletDate} onChange={(v) => setCourse({ ...course, lastTabletDate: v })} required />
                  <NumberInput label="Of the nights since the last tablet, how many were withheld on this PGD's instruction?" value={course.withheldSinceLastTablet} onChange={(v) => setCourse({ ...course, withheldSinceLastTablet: intOrNull(v) })} min={0} required />
                  <NumberInput label="Nights withheld on this PGD's instruction since the previous supply (total)" value={course.withheldNights} onChange={(v) => setCourse({ ...course, withheldNights: intOrNull(v) })} min={0} required />
                  <NumberInput label="Nights taken out of the last 14 on which a dose was due" value={course.nightsTakenOf14} onChange={(v) => setCourse({ ...course, nightsTakenOf14: intOrNull(v) })} min={0} max={14} required />
                </div>
                {(course.withheldNights ?? 0) > 0 && (
                  <TextInput label="Withheld nights: the interacting medicine and the dates" value={course.withheldDetails} onChange={(v) => setCourse({ ...course, withheldDetails: v })} required placeholder="e.g. clarithromycin 3 to 9 Nov; daridorexant withheld 3 to 16 Nov" />
                )}
                <p className="text-xs text-gray-600">
                  Nights withheld on this PGD&apos;s instruction are not due, and the adherence count goes back past them. Today: {intervalDays(course) ?? '?'} days since the previous supply (allowed {intervalMinDays(course)} to {intervalMaxDays(course)}); {nightsWithoutTablets(course) ?? '?'} days since the last tablet, not counting withheld nights (no more than 7).
                </p>
                <SelectInput
                  label="At any point since the previous supply, were there more than 7 nights without tablets (not counting withheld nights)?"
                  value={course.gapOver7Nights}
                  onChange={(v) => setCourse({ ...course, gapOver7Nights: v as YesNo })}
                  options={YES_NO('Yes (the course ends)', 'No')}
                  required
                />
                {course.previousStrength === '50' && medicines.moderateInhibitorRegular && (
                  <Note tone="amber">The previous supply was 50 mg and a regular moderate CYP3A4 inhibitor is recorded on the Medicines step: answer &quot;yes&quot; below and record the full procedure before any 25 mg supply.</Note>
                )}
                <SelectInput
                  label="Was a moderate CYP3A4 inhibitor to be taken regularly started during the course (for example diltiazem or verapamil)?"
                  value={course.midCourseInhibitor}
                  onChange={(v) => setCourse({ ...course, midCourseInhibitor: v as YesNo })}
                  options={YES_NO()}
                  required
                />
                {course.midCourseInhibitor === 'yes' && (
                  <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-xs text-amber-900">
                      The patient stops daridorexant from the first dose of the inhibitor and returns within 7 days. The nights since stopping are recorded as withheld nights (above). The 50 mg tablets in hand are not taken and are returned for destruction. A further supply is made only at 25 mg, only once all of this is recorded and every criterion is met.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextInput label="Inhibitor started" value={course.midCourseInhibitorName} onChange={(v) => setCourse({ ...course, midCourseInhibitorName: v })} required />
                      <TextInput label="Date daridorexant was stopped" type="date" value={course.midCourseStoppedDate} onChange={(v) => setCourse({ ...course, midCourseStoppedDate: v })} required />
                    </div>
                    <SelectInput label="Did the patient return within 7 days of stopping?" value={course.midCourseReturnedWithin7} onChange={(v) => setCourse({ ...course, midCourseReturnedWithin7: v as YesNo })} options={YES_NO('Yes', 'No (the course ends; refer to the GP)')} required />
                    {course.previousStrength === '50' && <BoolBox state={course} set={setCourse} field="midCourse50Returned" label="The 50 mg tablets in hand were returned for destruction" required />}
                  </div>
                )}
                <div className="space-y-2 rounded-lg border border-red-200 p-3">
                  <p className="text-sm font-semibold text-red-900">Stop symptoms since the last supply</p>
                  <BoolBox state={course} set={setCourse} field="symptomsAsked" label="I asked about each stop symptom below" required />
                  <p className="text-xs font-semibold text-red-800">STOP AND SEEK HELP THE SAME DAY</p>
                  <BoolBox state={course} set={setCourse} field="sxSuicidal" label="Thoughts of suicide or self-harm" />
                  <BoolBox state={course} set={setCourse} field="sxAllergy" label="A serious allergic reaction (swelling of the face, lips or tongue, or difficulty breathing)" />
                  <BoolBox state={course} set={setCourse} field="sxDrivingNotAwake" label="Driving while not fully awake" />
                  <BoolBox state={course} set={setCourse} field="sxActivityInjury" label="Any other activity while not fully awake that caused an injury or could have done" />
                  <p className="pt-2 text-xs font-semibold text-red-800">STOP AND CONTACT THE PHARMACY OR GP WITHIN A WEEK</p>
                  <BoolBox state={course} set={setCourse} field="sxSleepParalysis" label="Sleep paralysis (being unable to move or speak for a while on falling asleep or waking)" />
                  <BoolBox state={course} set={setCourse} field="sxHallucinations" label="Seeing or hearing things that are not there on falling asleep or waking" />
                  <BoolBox state={course} set={setCourse} field="sxCataplexy" label="Sudden weakness of the legs, face or neck brought on by laughter or strong emotion" />
                  <BoolBox state={course} set={setCourse} field="sxSleepwalkingNoHarm" label="Sleepwalking or any other activity while not fully awake that is not remembered (for example eating or cooking) where no one was hurt or put at risk" />
                  <BoolBox state={course} set={setCourse} field="sxLowMoodAnxiety" label="New or worsening low mood or anxiety" />
                  <BoolBox state={course} set={setCourse} field="sxMorningSleepiness" label="Still feeling sleepy or slowed in the mornings after the first week" />
                  <BoolBox state={course} set={setCourse} field="sxFall" label="A fall" />
                  <BoolBox state={course} set={setCourse} field="sxRash" label="A rash" />
                  <p className="pt-2 text-xs font-semibold text-gray-700">Not stop symptoms on their own (record; Yellow Card)</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    <BoolBox state={course} set={setCourse} field="seHeadache" label="Headache" />
                    <BoolBox state={course} set={setCourse} field="seNausea" label="Nausea" />
                    <BoolBox state={course} set={setCourse} field="seDizziness" label="Dizziness" />
                    <BoolBox state={course} set={setCourse} field="seTiredness" label="Tiredness" />
                    <BoolBox state={course} set={setCourse} field="seDreams" label="Nightmares or vivid dreams" />
                  </div>
                  <TextInput label="Other side effect" value={course.seOther} onChange={(v) => setCourse({ ...course, seOther: v })} />
                </div>
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-navy-900">No new excluded condition since the last supply (refer if yes)</p>
                  <SelectInput label="New night or rotating shift work that includes nights?" value={course.reviewNewShiftWork} onChange={(v) => setCourse({ ...course, reviewNewShiftWork: v as YesNo })} options={YES_NO('Yes (refer to the GP)', 'No')} required />
                  <SelectInput label="New restless legs (an urge to move the legs in the evening or at rest, relieved by moving)?" value={course.reviewNewRestlessLegs} onChange={(v) => setCourse({ ...course, reviewNewRestlessLegs: v as YesNo })} options={YES_NO('Yes (refer to the GP)', 'No')} required />
                  <SelectInput
                    label="New loud snoring with witnessed pauses in breathing, choking or gasping in sleep, or new excessive daytime sleepiness (falling asleep unintentionally in the day)?"
                    value={course.reviewNewApnoeaOrSleepiness}
                    onChange={(v) => setCourse({ ...course, reviewNewApnoeaOrSleepiness: v as YesNo })}
                    options={YES_NO('Yes (refer to the GP)', 'No')}
                    required
                  />
                </div>
                <BoolBox state={course} set={setCourse} field="wishesToStop" label="The patient wishes to stop (they may stop at any time for any reason, without tapering)" />
              </div>
            )}
            {course.visitType && course.visitType !== 'after3' && (
              <BoolBox state={course} set={setCourse} field="earlyOrLostRequest" label="The patient requests an early supply or reports lost tablets (a reason to refer, not to supply)" />
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 3: Sleep history and diary */}
      {currentStep === STEP.sleep && (
        <StepWrapper {...stepProps(STEP.sleep, full ? 'Long-term insomnia, the sleep diary, sleep hygiene, other causes and other sleep disorders' : 'Assessed at supply 1')}>
          {!full ? (
            <Note>The sleep history, sleep diary and differential diagnosis are assessed before supply 1. At supply visit {n} the diary continues and is reviewed; new stop symptoms are recorded on the Visit and Course step. Continue.</Note>
          ) : (
            <div className="space-y-4">
              {review && <Note tone="amber">No supply 1 record was found at this pharmacy: the supply 1 assessment applies in full today.</Note>}
              <p className="text-sm font-semibold text-navy-900">Pattern (by the patient&apos;s account)</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <BoolBox state={sleep} set={setSleep} field="difficultyGettingToSleep" label="Difficulty getting to sleep" />
                <BoolBox state={sleep} set={setSleep} field="difficultyStayingAsleep" label="Difficulty staying asleep" />
                <BoolBox state={sleep} set={setSleep} field="wakingTooEarly" label="Waking too early" />
                <BoolBox state={sleep} set={setSleep} field="unrefreshingSleep" label="Unrefreshing sleep" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput label="Nights a week" value={sleep.nightsPerWeek} onChange={(v) => setSleep({ ...sleep, nightsPerWeek: intOrNull(v) })} min={0} max={7} required />
                <NumberInput label="Duration (months)" value={sleep.durationMonths} onChange={(v) => setSleep({ ...sleep, durationMonths: intOrNull(v) })} min={0} required />
                <TimeField label="Usual time of going to bed" value={sleep.usualBedTime} onChange={(v) => setSleep({ ...sleep, usualBedTime: v })} required />
                <TimeField label="Usual time of getting up" value={sleep.usualRiseTime} onChange={(v) => setSleep({ ...sleep, usualRiseTime: v })} required />
              </div>
              <SelectInput label="Despite adequate opportunity and circumstances for sleep?" value={sleep.adequateOpportunity} onChange={(v) => setSleep({ ...sleep, adequateOpportunity: v as YesNo })} options={YES_NO()} required />
              <TextArea label="Daytime effects, in the patient's own words" value={sleep.daytimeEffects} onChange={(v) => setSleep({ ...sleep, daytimeEffects: v })} placeholder="e.g. poor concentration or memory, mistakes at work, low mood or irritability, fatigue" rows={2} required />
              <SelectInput label="Is the effect on daytime functioning considerable?" value={sleep.daytimeConsiderable} onChange={(v) => setSleep({ ...sleep, daytimeConsiderable: v as YesNo })} options={YES_NO()} required />

              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-navy-900">Sleep diary (at least 7 and up to 14 consecutive nights before supply 1)</p>
                <SelectInput label="Has the patient kept a sleep diary?" value={sleep.diaryKept} onChange={(v) => setSleep({ ...sleep, diaryKept: v as YesNo })} options={YES_NO('Yes', 'No (give a diary; book supply 1 for when it is complete)')} required />
                {sleep.diaryKept === 'yes' && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberInput label="Consecutive nights covered (7 to 14)" value={sleep.diaryNights} onChange={(v) => setSleep({ ...sleep, diaryNights: intOrNull(v) })} min={1} max={14} required />
                      <SelectInput label="Consistent with the history?" value={sleep.diaryConsistent} onChange={(v) => setSleep({ ...sleep, diaryConsistent: v as YesNo })} options={YES_NO()} required />
                      <TextInput label="Usual time to fall asleep" value={sleep.diaryTimeToFallAsleep} onChange={(v) => setSleep({ ...sleep, diaryTimeToFallAsleep: v })} placeholder="e.g. 60 to 90 minutes" required />
                      <TextInput label="Time awake in the night" value={sleep.diaryTimeAwake} onChange={(v) => setSleep({ ...sleep, diaryTimeAwake: v })} placeholder="e.g. about 1 hour" required />
                      <TextInput label="Total sleep" value={sleep.diaryTotalSleep} onChange={(v) => setSleep({ ...sleep, diaryTotalSleep: v })} placeholder="e.g. 5 hours" required />
                    </div>
                  </>
                )}
              </div>

              <SelectInput
                label="Has sleep hygiene advice (Appendix 3) been followed for at least the last 4 weeks without adequate improvement?"
                value={sleep.hygieneFourWeeks}
                onChange={(v) => setSleep({ ...sleep, hygieneFourWeeks: v as YesNo })}
                options={YES_NO()}
                required
              />
              <BoolBox state={sleep} set={setSleep} field="hygieneWrittenGiven" label="Sleep hygiene advice given again in writing" required />

              <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-navy-900">Insomnia mainly caused by something untreated or not yet assessed (exclusion)</p>
                <BoolBox state={sleep} set={setSleep} field="causesAsked" label="I considered each of the causes below" required />
                <BoolBox state={sleep} set={setSleep} field="uncontrolledPain" label="Uncontrolled pain" />
                <BoolBox state={sleep} set={setSleep} field="breathlessLyingFlat" label="Breathlessness lying flat or at night" />
                <BoolBox state={sleep} set={setSleep} field="nocturiaNotInvestigated" label="Frequent night-time urination not yet investigated" />
                <BoolBox state={sleep} set={setSleep} field="menopausalNotDiscussed" label="Menopausal hot flushes and night sweats not yet discussed with a clinician" />
                <BoolBox state={sleep} set={setSleep} field="overactiveThyroid" label="Symptoms of an overactive thyroid" />
                <BoolBox state={sleep} set={setSleep} field="medicineBeforeInsomnia" label="A medicine started or changed in the 3 months before the insomnia began (for example a stimulant, corticosteroid, decongestant, beta-blocker or SSRI)" />
                <BoolBox state={sleep} set={setSleep} field="caffeineNotTried" label="Caffeine after mid-afternoon or energy drinks that the patient has not tried stopping" />
                <TextInput label="Other factors considered and excluded (record)" value={sleep.causesConsideredNote} onChange={(v) => setSleep({ ...sleep, causesConsideredNote: v })} placeholder="e.g. alcohol, depression, pain, menopause discussed: none contributing" />
              </div>

              <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-navy-900">Other sleep disorders and narcolepsy features (exclusion)</p>
                <BoolBox state={sleep} set={setSleep} field="disordersAsked" label="I asked about each of the following" required />
                <BoolBox state={sleep} set={setSleep} field="restlessLegs" label="Restless legs (an urge to move the legs in the evening or at rest, relieved by moving)" />
                <BoolBox state={sleep} set={setSleep} field="circadian" label="A circadian rhythm disorder (consistently unable to fall asleep until very late, or very early waking with early sleepiness, with normal sleep when allowed to keep those hours)" />
                <BoolBox state={sleep} set={setSleep} field="shiftWork" label="Night or rotating shift work that includes nights" />
                <BoolBox state={sleep} set={setSleep} field="complexSleepBehaviour" label="A history of sleepwalking, sleep-eating, sleep-driving or other complex behaviour in sleep" />
                <BoolBox state={sleep} set={setSleep} field="unintentionalDaytimeSleep" label="Falling asleep unintentionally during the day (while talking, eating, reading or watching television, as a passenger, or at any time while driving)" />
                <BoolBox state={sleep} set={setSleep} field="cataplexy" label="Sudden muscle weakness brought on by laughter or emotion (cataplexy)" />
                <BoolBox state={sleep} set={setSleep} field="paralysisHallucinationsBefore" label="Recurrent sleep paralysis or hallucinations on falling asleep or waking before any treatment" />
              </div>
            </div>
          )}
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 4: CBT-I */}
      {currentStep === STEP.cbti && (
        <StepWrapper {...stepProps(STEP.cbti, full ? 'CBT-I FIRST: tried and not worked, not available, or unsuitable, recorded with the reason' : 'Brief CBT-I reinforced')}>
          {review && (
            <div className="mb-6 space-y-4">
              <SelectInput label="Were brief CBT-I components given at supply 1 (CBT-I not available or unsuitable)?" value={cbti.briefGivenAtSupply1} onChange={(v) => setCbti({ ...cbti, briefGivenAtSupply1: v as YesNo })} options={YES_NO()} required />
              {cbti.briefGivenAtSupply1 === 'yes' && (
                <BoolBox state={cbti} set={setCbti} field="briefReinforced" label="Brief CBT-I reinforced today: stimulus control, the sleep window plan reviewed from the diary, the diary continued" required />
              )}
            </div>
          )}
          {full ? (
            <div className="space-y-4">
              <Note tone="blue">
                NICE TA922 recommends daridorexant only where CBT-I has been tried and has not worked, or is not available, or is unsuitable. &quot;Not available&quot; is judged by NHS access, not by willingness to pay. Free NHS digital CBT-I counts as available wherever it is offered to the patient. A preference not to try CBT-I is not unsuitability.
              </Note>
              <SelectInput
                label="CBT-I position"
                value={cbti.status}
                onChange={(v) => setCbti({ ...cbti, status: v as CbtiStatus })}
                options={(Object.keys(CBTI_STATUS_LABEL) as Exclude<CbtiStatus, ''>[]).map((k) => ({ value: k, label: CBTI_STATUS_LABEL[k] }))}
                required
              />
              {cbti.status === 'tried' && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <TextInput label="Programme (face to face, group, or digital such as Sleepio or SilverCloud Space for Sleep)" value={cbti.triedProgramme} onChange={(v) => setCbti({ ...cbti, triedProgramme: v })} required />
                  <TextInput label="Approximate dates" value={cbti.triedDates} onChange={(v) => setCbti({ ...cbti, triedDates: v })} required />
                  <TextInput label="How far the patient got" value={cbti.triedHowFar} onChange={(v) => setCbti({ ...cbti, triedHowFar: v })} required />
                  <SelectInput label="Completed, or engaged with for at least 4 weeks, without adequate improvement?" value={cbti.triedEngaged} onChange={(v) => setCbti({ ...cbti, triedEngaged: v as YesNo })} options={YES_NO()} required />
                  <SelectInput label="Within the last 2 years?" value={cbti.triedWithin2Years} onChange={(v) => setCbti({ ...cbti, triedWithin2Years: v as YesNo })} options={YES_NO()} required />
                  <TextInput label="Written evidence, where the patient has it (the patient's account is sufficient)" value={cbti.triedEvidence} onChange={(v) => setCbti({ ...cbti, triedEvidence: v })} />
                </div>
              )}
              {cbti.status === 'not-available' && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <SelectInput label="Where does the patient live?" value={cbti.nation} onChange={(v) => setCbti({ ...cbti, nation: v as Nation })} options={(Object.keys(NATION_LABEL) as Exclude<Nation, ''>[]).map((k) => ({ value: k, label: NATION_LABEL[k] }))} required />
                  <BoolBox state={cbti} set={setCbti} field="checkedTalkingTherapies" label="Checked the local NHS Talking Therapies offer" required />
                  <BoolBox state={cbti} set={setCbti} field="checkedLocalDigital" label="Checked any locally commissioned digital CBT-I" required />
                  <BoolBox state={cbti} set={setCbti} field="checkedNational" label="Checked the national offer (Appendix 3)" required />
                  <SelectInput label="NHS CBT-I offer found" value={cbti.nhsOffer} onChange={(v) => setCbti({ ...cbti, nhsOffer: v as NhsOffer })} options={(Object.keys(NHS_OFFER_LABEL) as Exclude<NhsOffer, ''>[]).map((k) => ({ value: k, label: NHS_OFFER_LABEL[k] }))} required />
                  <TextInput label="What was checked (record)" value={cbti.notAvailableNote} onChange={(v) => setCbti({ ...cbti, notAvailableNote: v })} placeholder="e.g. ICB website and Talking Therapies service checked 15 Oct: no insomnia pathway; Sleepio not commissioned" required />
                </div>
              )}
              {cbti.status === 'unsuitable' && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <SelectInput label="Why CBT-I cannot reasonably be delivered" value={cbti.unsuitableCategory} onChange={(v) => setCbti({ ...cbti, unsuitableCategory: v as UnsuitableCategory })} options={(Object.keys(UNSUITABLE_LABEL) as Exclude<UnsuitableCategory, ''>[]).map((k) => ({ value: k, label: UNSUITABLE_LABEL[k] }))} required />
                  <TextArea label="The specific reason" value={cbti.unsuitableReason} onChange={(v) => setCbti({ ...cbti, unsuitableReason: v })} rows={2} required />
                </div>
              )}
              {(cbti.status === 'tried' || cbti.status === 'not-available' || cbti.status === 'unsuitable') && (
                <div className="space-y-3">
                  <BoolBox state={cbti} set={setCbti} field="privateProgrammesTold" label="Told the patient that paid private and digital programmes exist (declining to pay does not affect eligibility, and neither does a decision to pay)" required />
                  <TextInput label="The patient's decision about paid private or digital CBT-I" value={cbti.privateDecision} onChange={(v) => setCbti({ ...cbti, privateDecision: v })} required />
                </div>
              )}
              {(cbti.status === 'not-available' || cbti.status === 'unsuitable') && (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-blue-900">Brief CBT-I components (Appendix 3), delivered today</p>
                  <BoolBox state={cbti} set={setCbti} field="briefStimulusControl" label="STIMULUS CONTROL: go to bed only when sleepy; use the bed for sleep and sex only; if not asleep within about 20 minutes, or awake in the night for that long, get up, do something quiet in low light, and go back when sleepy" required />
                  <BoolBox state={cbti} set={setCbti} field="briefSleepWindow" label="A SLEEP WINDOW PLAN: a fixed getting-up time every day and a usual bedtime, based on the sleep diary, so that time in bed is not much longer than the time actually spent asleep (formal sleep restriction therapy is not delivered)" required />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TimeField label="Usual bedtime in the plan" value={cbti.sleepWindowBedTime} onChange={(v) => setCbti({ ...cbti, sleepWindowBedTime: v })} required />
                    <TimeField label="Fixed getting-up time" value={cbti.sleepWindowRiseTime} onChange={(v) => setCbti({ ...cbti, sleepWindowRiseTime: v })} required />
                  </div>
                  <BoolBox state={cbti} set={setCbti} field="briefDiaryContinued" label="THE SLEEP DIARY, continued through the course" required />
                  <BoolBox state={cbti} set={setCbti} field="briefPlanInWriting" label="The plan given in writing" required />
                </div>
              )}
            </div>
          ) : !review ? (
            <Note>Select the supply visit first.</Note>
          ) : null}
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 5: Screening */}
      {currentStep === STEP.screening && (
        <StepWrapper {...stepProps(STEP.screening, full ? 'ISI, PHQ-9, GAD-2 or GAD-7, Epworth and STOP-Bang with measured height, weight and neck' : 'ISI, PHQ-9 and GAD-2 at every supply visit')}>
          <div className="space-y-4">
            <Note tone="amber">{ISI_LICENSING_NOTE} STOP-Bang is used under its published terms of use; the Epworth Sleepiness Scale under the terms set by its copyright holder; PHQ-9, GAD-2 and GAD-7 under their free-use terms. The pharmacy uses its own licensed or permitted copies of each questionnaire.</Note>
            <Checkbox label="The patient completed the ISI themselves on the pharmacy's licensed form" checked={screening.isiOnLicensedForm} onChange={(v) => setScreening({ ...screening, isiOnLicensedForm: v })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput label={`ISI total (0 to 28)${full ? ': 15 or more required at supply 1 (and with no supply 1 record)' : ''}`} value={screening.isi} onChange={(v) => setScreening({ ...screening, isi: intOrNull(v) })} min={0} max={28} required />
              <NumberInput label="PHQ-9 total (0 to 27): below 10 required" value={screening.phq9} onChange={(v) => setScreening({ ...screening, phq9: intOrNull(v) })} min={0} max={27} required />
            </div>
            <SelectInput label='PHQ-9 question 9 (thoughts of being better off dead or of self-harm): "not at all" required' value={screening.phq9Q9} onChange={(v) => setScreening({ ...screening, phq9Q9: v as Phq9Q9 })} options={(Object.keys(PHQ9_Q9_LABEL) as Exclude<Phq9Q9, ''>[]).map((k) => ({ value: k, label: PHQ9_Q9_LABEL[k] }))} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput label="GAD-2 (0 to 6)" value={screening.gad2} onChange={(v) => setScreening({ ...screening, gad2: intOrNull(v), ...(v !== null && v < 3 ? { gad7: null } : {}) })} min={0} max={6} required />
              {(screening.gad2 ?? 0) >= 3 && <NumberInput label="GAD-7 (0 to 21): below 10 required" value={screening.gad7} onChange={(v) => setScreening({ ...screening, gad7: intOrNull(v) })} min={0} max={21} required />}
            </div>
            {review && course.baselineIsi !== null && screening.isi !== null && (
              <p className="text-xs text-gray-700">
                ISI change from baseline: {screening.isi - course.baselineIsi} ({course.baselineIsi} to {screening.isi}).
              </p>
            )}
            {full && (
              <>
                <NumberInput label="Epworth Sleepiness Scale (0 to 24): 10 or below required" value={screening.epworth} onChange={(v) => setScreening({ ...screening, epworth: intOrNull(v) })} min={0} max={24} required />
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberInput label="Height (measured)" unit="cm" value={screening.heightCm} onChange={(v) => setScreening({ ...screening, heightCm: v })} required />
                  <NumberInput label="Weight (measured)" unit="kg" value={screening.weightKg} onChange={(v) => setScreening({ ...screening, weightKg: v })} required />
                  <NumberInput label="Neck circumference at the Adam's apple" unit="cm" value={screening.neckCm} onChange={(v) => setScreening({ ...screening, neckCm: v })} required />
                </div>
                <p className="text-xs text-gray-700">BMI: {b ?? 'not yet calculated'}</p>
                <SelectInput label="Obstructive sleep apnoea" value={screening.osa} onChange={(v) => setScreening({ ...screening, osa: v as OsaStatus })} options={(Object.keys(OSA_LABEL) as Exclude<OsaStatus, ''>[]).map((k) => ({ value: k, label: OSA_LABEL[k] }))} required />
                {stopBangApplies(screening) && (
                  <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-navy-900">STOP-Bang</p>
                    <Checkbox label="I asked each STOP item" checked={screening.stopBangAsked} onChange={(v) => setScreening({ ...screening, stopBangAsked: v })} required />
                    <Checkbox label="Snoring loudly" checked={screening.snoring} onChange={(v) => setScreening({ ...screening, snoring: v })} />
                    <Checkbox label="Tired, fatigued or sleepy in the daytime" checked={screening.tired} onChange={(v) => setScreening({ ...screening, tired: v })} />
                    <SelectInput label="Observed to stop breathing, choke or gasp in sleep" value={screening.observed} onChange={(v) => setScreening({ ...screening, observed: v as YesNo })} options={YES_NO('Yes (refer at any score)', 'No')} required />
                    <Checkbox label="High blood pressure, treated or not" checked={screening.pressure} onChange={(v) => setScreening({ ...screening, pressure: v })} />
                    <p className="text-xs text-gray-700">
                      Bang (calculated): BMI over 35 {sb.bmiOver35 ? 'yes' : 'no'}; age over 50 {sb.ageOver50 ? 'yes' : 'no'}; neck over 40 cm {sb.neckOver40 ? 'yes' : 'no'}; male {sb.male ? 'yes' : 'no'}. Score {sb.score}; STOP items {sb.stopItems}. Refer if 5 or more; OR 2 or more STOP items with male sex, BMI over 35 or neck over 40 cm; OR a &quot;yes&quot; to Observed at any score.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 6: Medical and mental health */}
      {currentStep === STEP.medical && (
        <StepWrapper {...stepProps(STEP.medical, review ? 'No new excluded condition since the last supply' : 'Exclusions, mental health and substances')}>
          <div className="space-y-4">
            <TextInput label="Allergies and previous adverse reactions" value={medical.allergies} onChange={(v) => setMedical({ ...medical, allergies: v })} placeholder='e.g. penicillin (rash); or "none known"' required />
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              <BoolBox state={medical} set={setMedical} field="questionsAsked" label="I asked about each of the following" required />
              <BoolBox state={medical} set={setMedical} field="hypersensitivity" label="Hypersensitivity to daridorexant or to any excipient" />
              <BoolBox state={medical} set={setMedical} field="narcolepsy" label="Narcolepsy (contraindicated)" />
              <BoolBox state={medical} set={setMedical} field="liverDisease" label="Any known chronic liver disease, including cirrhosis or hepatic impairment of any degree" />
              <BoolBox state={medical} set={setMedical} field="severeCopd" label="Severe COPD (FEV1 below 40 per cent of predicted where known, home oxygen, or a hospital admission for COPD in the last 12 months)" />
              <BoolBox state={medical} set={setMedical} field="respiratoryFailure" label="Chronic respiratory failure" />
              <BoolBox state={medical} set={setMedical} field="obesityHypoventilation" label="Obesity hypoventilation" />
              <BoolBox state={medical} set={setMedical} field="neuromuscularBreathing" label="A neuromuscular condition affecting breathing" />
              <BoolBox state={medical} set={setMedical} field="mildModerateCopd" label="Mild or moderate COPD (not excluded; asthma is not excluded)" />
              {isFemale && (
                <>
                  <BoolBox state={medical} set={setMedical} field="pregnant" label="Pregnant" />
                  <BoolBox state={medical} set={setMedical} field="planningPregnancy" label="Planning a pregnancy during the course" />
                  <BoolBox state={medical} set={setMedical} field="breastfeeding" label="Breastfeeding" />
                </>
              )}
              <BoolBox state={medical} set={setMedical} field="soleNightCarer" label="The sole night-time carer of an infant or of a dependent adult who may need them during the night" />
              {age65 && (
                <>
                  <BoolBox state={medical} set={setMedical} field="fallLast12Months" label="Aged 65 or over: a fall in the last 12 months" />
                  <BoolBox state={medical} set={setMedical} field="walkingAid" label="Aged 65 or over: using a walking aid" />
                  <BoolBox state={medical} set={setMedical} field="nocturia2Plus" label="Aged 65 or over: getting up at night to the toilet 2 or more times on most nights" />
                </>
              )}
              <BoolBox state={medical} set={setMedical} field="dementiaMemory" label="Dementia or any condition affecting memory" />
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-semibold text-navy-900">Mental health and substances</p>
              <BoolBox state={medical} set={setMedical} field="mentalAsked" label="I asked about each of the following" required />
              <BoolBox state={medical} set={setMedical} field="currentSuicidalThoughts" label="Any current thoughts of suicide or self-harm (same-day assessment)" />
              <BoolBox state={medical} set={setMedical} field="selfHarm2Years" label="Self-harm or a suicide attempt in the last 2 years (same-day assessment)" />
              <BoolBox state={medical} set={setMedical} field="bipolarPsychosis" label="Diagnosed bipolar disorder, psychosis or schizophrenia" />
              <BoolBox state={medical} set={setMedical} field="eatingDisorder" label="An eating disorder" />
              <BoolBox state={medical} set={setMedical} field="ptsd" label="Post-traumatic stress disorder under active treatment, or with nightmares" />
              <BoolBox state={medical} set={setMedical} field="secondaryCareMh" label="Current care under a secondary care mental health team" />
              <BoolBox state={medical} set={setMedical} field="mhTreatmentChanged3Months" label="Depression or anxiety whose treatment has started or changed in the last 3 months" />
              <BoolBox state={medical} set={setMedical} field="stableTreatedDepAnx" label="Stable, treated depression or anxiety on unchanged treatment for at least 3 months (caution)" />
              <BoolBox state={medical} set={setMedical} field="substanceMisuse" label="Current or past misuse of, or dependence on, alcohol, prescribed medicines or recreational drugs" />
              <BoolBox state={medical} set={setMedical} field="alcoholOver14" label="Drinking more than 14 units of alcohol a week" />
              <BoolBox state={medical} set={setMedical} field="cannabisRegular" label="Regular use of cannabis or cannabis-based products" />
            </div>
            <TextInput label="Other conditions (recorded)" value={medical.otherConditions} onChange={(v) => setMedical({ ...medical, otherConditions: v })} />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 7: Medicines and SCR */}
      {currentStep === STEP.medicines && (
        <StepWrapper {...stepProps(STEP.medicines, 'Appendix 4 interactions, sleep aids and the Summary Care Record check')}>
          <div className="space-y-4">
            <TextArea label="Current medicines, including over the counter, herbal and recreational products" value={medicines.currentMedicines} onChange={(v) => setMedicines({ ...medicines, currentMedicines: v })} rows={2} required />
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              <BoolBox state={medicines} set={setMedicines} field="questionsAsked" label="Checked against the SmPC, the BNF interactions checker and Appendix 4" required />
              <BoolBox state={medicines} set={setMedicines} field="strongInhibitor" label="STRONG CYP3A4 INHIBITOR (excluded): itraconazole, ketoconazole, posaconazole, voriconazole, clarithromycin, ritonavir, cobicistat, Paxlovid, idelalisib" description={review ? 'At a review visit, a short course started during the course is handled below instead' : undefined} />
              <BoolBox state={medicines} set={setMedicines} field="inducer" label="CYP3A4 INDUCER, moderate or strong (excluded): carbamazepine, phenytoin, phenobarbital, primidone, rifampicin, rifabutin, efavirenz, etravirine, enzalutamide, apalutamide, mitotane, modafinil, bosentan, St John's wort" />
              <BoolBox state={medicines} set={setMedicines} field="ntiSubstrate" label="NARROW THERAPEUTIC INDEX (excluded): tacrolimus, sirolimus, everolimus, ciclosporin, digoxin, dabigatran, colchicine taken regularly, simvastatin 80 mg" />
              <BoolBox state={medicines} set={setMedicines}
                field="cnsDepressantPrescribed"
                label="CNS DEPRESSANT taken regularly and continuing (excluded): benzodiazepine; zopiclone, zolpidem; melatonin from any source; mirtazapine, trazodone, any tricyclic; antipsychotic; gabapentin, pregabalin; opioid incl. codeine, dihydrocodeine, tramadol; antiepileptic; sedating antihistamine most nights; baclofen, tizanidine"
                description="A prescribed medicine is never stopped to allow supply. A non-prescribed sleep aid the patient agrees to stop is recorded below instead"
              />
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
              <BoolBox state={medicines} set={setMedicines} field="moderateInhibitorRegular" label="MODERATE CYP3A4 INHIBITOR taken regularly: diltiazem, verapamil, erythromycin, ciprofloxacin, fluconazole, isavuconazole, fluvoxamine, dronedarone, aprepitant, imatinib, crizotinib, letermovir" />
              {medicines.moderateInhibitorRegular && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput label="Medicine" value={medicines.moderateInhibitorName} onChange={(v) => setMedicines({ ...medicines, moderateInhibitorName: v })} required />
                  <SelectInput label="At a stable dose?" value={medicines.moderateStable} onChange={(v) => setMedicines({ ...medicines, moderateStable: v as YesNo })} options={YES_NO()} required />
                  <SelectInput label="Expected to continue for the rest of the course?" value={medicines.moderateContinue} onChange={(v) => setMedicines({ ...medicines, moderateContinue: v as YesNo })} options={YES_NO()} required />
                </div>
              )}
              <BoolBox state={medicines} set={setMedicines} field="shortCourseInhibitor" label={v1 ? 'A short course of a moderate CYP3A4 inhibitor now (for example erythromycin, ciprofloxacin, fluconazole)' : 'A short course of a moderate or strong CYP3A4 inhibitor started during the course (for example erythromycin, ciprofloxacin, fluconazole, clarithromycin, Paxlovid)'} />
              {medicines.shortCourseInhibitor && <TextInput label="Medicine and dates" value={medicines.shortCourseDetails} onChange={(v) => setMedicines({ ...medicines, shortCourseDetails: v })} required />}
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
              <BoolBox state={medicines} set={setMedicines} field="nonPrescribedSleepAid" label="A sleep aid that was not prescribed (a bought sedating antihistamine, melatonin bought or imported, a herbal sedative such as valerian)" />
              {medicines.nonPrescribedSleepAid && (
                <div className="space-y-3">
                  <TextInput label="Sleep aid" value={medicines.sleepAidName} onChange={(v) => setMedicines({ ...medicines, sleepAidName: v })} required />
                  <SelectInput label="Does the patient agree to stop it before the course and not use it during it?" value={medicines.sleepAidAgreesStop} onChange={(v) => setMedicines({ ...medicines, sleepAidAgreesStop: v as YesNo })} options={YES_NO('Yes', 'No (exclusion)')} required />
                  <BoolBox state={medicines} set={setMedicines} field="sleepAidLongActing" label="A long-acting sedating antihistamine such as promethazine (first dose at least 48 hours after its last dose)" />
                  {medicines.sleepAidAgreesStop === 'yes' && <TextInput label="Date of the last dose" type="date" value={medicines.sleepAidLastDose} onChange={(v) => setMedicines({ ...medicines, sleepAidLastDose: v })} required />}
                  {medicines.sleepAidAgreesStop === 'yes' && sleepAidIsLongActing(medicines) && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <TimeField label="Time of the last dose" value={medicines.sleepAidLastDoseTime} onChange={(v) => setMedicines({ ...medicines, sleepAidLastDoseTime: v })} required />
                      <TextInput label="Planned first (or next) daridorexant dose: date" type="date" value={medicines.plannedFirstDoseDate} onChange={(v) => setMedicines({ ...medicines, plannedFirstDoseDate: v })} required />
                      <TimeField label="Planned dose: time" value={medicines.plannedFirstDoseTime} onChange={(v) => setMedicines({ ...medicines, plannedFirstDoseTime: v })} required />
                      <p className="text-xs text-gray-700 sm:col-span-3">
                        Gap (London time): {sleepAidGapHours(medicines) ?? '?'} hours; at least 48 needed. Under 48 hours is a stop until the gap is met.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <BoolBox state={medicines} set={setMedicines} field="otherSubstrate" label="Another CYP3A4 or P-gp substrate not excluded (for example simvastatin up to 40 mg, atorvastatin)" />
              <BoolBox state={medicines} set={setMedicines} field="occasionalSedating" label="An occasional single dose of another sedating medicine taken for a different reason (for example chlorphenamine for hay fever or a codeine-containing painkiller)" />
              <p className="text-xs text-gray-600">No adjustment needed (SmPC): hormonal contraceptives, warfarin, rosuvastatin, citalopram, acid-reducing medicines.</p>
            </div>
            <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Summary Care Record (mandatory where a record exists){review ? ': rechecked' : ''}</p>
              <SelectInput label="Summary Care Record check" value={medicines.scrStatus} onChange={(v) => setMedicines({ ...medicines, scrStatus: v as ScrStatus })} options={(Object.keys(SCR_LABEL) as Exclude<ScrStatus, ''>[]).map((k) => ({ value: k, label: SCR_LABEL[k] }))} required />
              <TextInput
                label={medicines.scrStatus === 'checked' ? 'Findings (optional)' : 'Why the record was not checked'}
                value={medicines.scrNote}
                onChange={(v) => setMedicines({ ...medicines, scrNote: v })}
                required={medicines.scrStatus === 'no-record' || medicines.scrStatus === 'cannot-access'}
              />
            </div>
            <p className="text-xs text-gray-700">Strength today: {strength ? `${strength} mg` : 'not determined'}.</p>
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 8: Driving */}
      {currentStep === STEP.driving && (
        <StepWrapper {...stepProps(STEP.driving, v1 ? 'A workable driving plan is agreed before supply 1' : 'The driving plan and the 9-hour rule reconfirmed')}>
          <div className="space-y-4">
            <Note tone="amber">
              No driving the morning after the first dose. The first 4 doses are taken only on nights before a day with no driving. After that, at least 9 hours between a dose and driving, and only when fully alert (SmPC 4.7). Skip the dose on any night when 9 hours is not possible. Anyone who must drive or do safety-critical work in the morning and cannot keep 9 hours is not supplied.
            </Note>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label="Does the patient drive?" value={driving.drives} onChange={(v) => setDriving({ ...driving, drives: v as YesNo })} options={YES_NO()} required />
              <TimeField label="Usual bedtime" value={driving.bedtime} onChange={(v) => setDriving({ ...driving, bedtime: v })} required />
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-semibold text-navy-900">Usual earliest time of driving or other activity needing full alertness, each day</p>
              {DAYS.map((d: DayName) => (
                <div key={d} className="grid grid-cols-3 items-end gap-3">
                  <p className="pb-3 text-sm text-navy-900">{d}</p>
                  <TimeField label="Earliest time (blank if none)" value={driving.days[d]?.time ?? ''} onChange={(v) => setDriving({ ...driving, days: { ...driving.days, [d]: { ...driving.days[d], time: v } } })} />
                  <Checkbox label="For work" checked={driving.days[d]?.work === true} onChange={(v) => setDriving({ ...driving, days: { ...driving.days, [d]: { ...driving.days[d], work: v } } })} />
                </div>
              ))}
              {shorts.length >= 3 && (
                <p className="text-xs font-semibold text-red-800">{shorts.length} nights a week would need the dose skipped: answer the 9-hour question below explicitly; it must fit this schedule.</p>
              )}
              {shorts.length > 0 && (
                <p className="text-xs text-amber-800">Less than 9 hours after the usual bedtime: {shorts.map((s) => `${s.day} (${s.hours} hours; skip the ${s.nightBefore} night dose)`).join('; ')}.</p>
              )}
            </div>
            <SelectInput label="Does the patient drive for work?" value={driving.drivesForWork} onChange={(v) => setDriving({ ...driving, drivesForWork: v as YesNo })} options={YES_NO()} required />
            <Checkbox label="A Group 2 (lorry or bus) licence holder who drives for work (exclusion)" checked={driving.group2ForWork} onChange={(v) => setDriving({ ...driving, group2ForWork: v })} />
            <Checkbox label="A safety-critical role with its own fitness rules: pilot, air traffic controller, train driver, or on-call work needing full alertness within 9 hours of bedtime (exclusion)" checked={driving.safetyCriticalRole} onChange={(v) => setDriving({ ...driving, safetyCriticalRole: v })} />
            <SelectInput
              label="Must the patient drive, or do other work needing full alertness, early in the morning such that they cannot reliably keep at least 9 hours between a dose and starting?"
              value={driving.mustEarlyCannot9}
              onChange={(v) => setDriving({ ...driving, mustEarlyCannot9: v as YesNo })}
              options={YES_NO('Yes (exclusion, whatever their licence)', 'No')}
              required
            />
            {v1 && (
              <>
                {driving.drives === 'yes' && (
                  <SelectInput label="Can the patient arrange the first 4 doses only on nights before a day with no driving?" value={driving.first4Arranged} onChange={(v) => setDriving({ ...driving, first4Arranged: v as YesNo })} options={YES_NO('Yes', 'No (exclusion)')} required />
                )}
                {driving.drives === 'yes' && driving.first4Arranged === 'yes' && <TextInput label="Agreed nights for the first 4 doses" value={driving.first4Plan} onChange={(v) => setDriving({ ...driving, first4Plan: v })} placeholder="e.g. Fri 17 to Mon 20 Oct; no driving until Tue 21 Oct" required />}
                <Checkbox
                  label={
                    driving.drives === 'yes'
                      ? 'A workable plan is agreed: no driving the morning after the first dose; the first 4 doses before non-driving days; then at least 9 hours and only when fully alert; the dose skipped on any night that is not possible'
                      : 'A workable plan is agreed: at least 9 hours between a dose and any activity needing full alertness, and the dose skipped on any night that is not possible'
                  } checked={driving.planAgreed} onChange={(v) => setDriving({ ...driving, planAgreed: v })} required />
              </>
            )}
            {review && <Checkbox label="The driving plan and the 9-hour rule reconfirmed today" checked={driving.reconfirmed} onChange={(v) => setDriving({ ...driving, reconfirmed: v })} required />}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 9: Review and supply */}
      {currentStep === STEP.supply && (
        <StepWrapper {...stepProps(STEP.supply, v3 ? 'NICE TA922 effectiveness assessment, supply 3 and the handover letter' : v2 ? 'Early safety review and supply 2' : 'Supply 1')}>
          <div className="space-y-4">
            {v2 && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-navy-900">Supply visit 2: early safety review</p>
                <p className="text-xs text-gray-700">
                  ISI {screening.isi ?? '?'} today against a baseline of {course.baselineIsi ?? '?'}
                  {course.baselineIsi !== null && screening.isi !== null && screening.isi >= course.baselineIsi ? ': unchanged or worse. The patient may stop here (early stop); otherwise supply 2 is made when the criteria are met.' : '.'}
                </p>
                <SelectInput label="Does the patient wish to continue?" value={supply.wishesToContinue} onChange={(v) => setSupply({ ...supply, wishesToContinue: v as YesNo })} options={YES_NO()} required />
              </div>
            )}
            {v3 && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-navy-900">Supply visit 3: effectiveness assessment</p>
                <p className="text-xs text-gray-700">Adherence: {course.nightsTakenOf14 ?? '?'} of the last 14 nights on which a dose was due (at least 10 needed for the response to be judged).</p>
                <SelectInput label="(c) Does the patient report that their daytime functioning is better?" value={supply.daytimeBetter} onChange={(v) => setSupply({ ...supply, daytimeBetter: v as YesNo })} options={YES_NO()} required />
                <SelectInput label="(d) Does the patient wish to continue?" value={supply.wishesToContinue} onChange={(v) => setSupply({ ...supply, wishesToContinue: v as YesNo })} options={YES_NO()} required />
                <ul className="text-xs text-gray-800">
                  <li>(a) ISI fall of 6 or more from supply 1: {r.fall ?? '?'} {r.fallOk ? 'met' : 'not met'}</li>
                  <li>(b) Current ISI 14 or below: {screening.isi ?? '?'} {r.currentOk ? 'met' : 'not met'}</li>
                  <li>(c) Daytime functioning better: {r.daytimeOk ? 'met' : 'not met'}</li>
                  <li>(d) Wishes to continue: {r.wishesOk ? 'met' : 'not met'}</li>
                  <li className="font-semibold">{r.complete ? (r.adequate ? 'ADEQUATE RESPONSE: supply 3 and the handover letter the same day' : 'NOT ADEQUATE: stop, no supply 3') : 'Complete all four parts'}</li>
                </ul>
                <p className="text-[11px] text-gray-500">Source of the threshold: the Medical Director&apos;s decision, informed by SMC2611 Table 2.2. It is not a responder definition published by NICE or SMC.</p>
              </div>
            )}
            <div className="space-y-1 rounded-lg border-2 border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 p-4 text-sm">
              <p className="font-semibold text-navy-900">Supply today</p>
              <p>Product: {product ? `${product.name}, ${product.maNumber}` : 'not determined'}</p>
              <p>Dose: {product ? product.doseLabel : 'not determined'}. Maximum one tablet in 24 hours; not as and when; a dose forgotten at bedtime is not taken during the night.</p>
              <p>Quantity: {TABLETS_PER_SUPPLY} tablets (one original pack). Supply number: {n ?? '?'} of 3{v3 ? ' (the last under this PGD)' : ''}.</p>
              <p>Next supply visit: {visitWindow ? (visitWindow.impossible ? 'none possible: visit 3 cannot fall within 13 weeks of supply 1 (refer to a prescriber)' : `${formatUk(visitWindow.from)} to ${formatUk(visitWindow.to)}, in person, in the last few days before running out, and no more than 7 days after the last tablet`) : v3 ? 'none under this PGD: handover to a prescriber' : 'not determined'}.</p>
              {product && <p className="text-xs text-gray-600">{product.description} BLACK TRIANGLE: subject to additional monitoring.</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput label="Batch number" value={supply.batchNumber} onChange={(v) => setSupply({ ...supply, batchNumber: v })} required />
              <TextInput label="Expiry date" type="date" value={supply.expiryDate} onChange={(v) => setSupply({ ...supply, expiryDate: v })} required />
              <TextInput label="Marketing authorisation number on the pack" value={supply.maNumberFromPack} onChange={(v) => setSupply({ ...supply, maNumberFromPack: v })} placeholder={product?.maNumber ?? 'PLGB'} required />
            </div>
            <Checkbox
              label={`Labelled as a dispensed medicine with the patient's name, "${LABEL_DIRECTIONS}", the date and the pharmacy`}
              checked={supply.labelled}
              onChange={(v) => setSupply({ ...supply, labelled: v })}
              description={`And add: "${LABEL_WARNING}"`}
              required
            />
            <Checkbox label="Manufacturer's patient information leaflet supplied" checked={supply.pilSupplied} onChange={(v) => setSupply({ ...supply, pilSupplied: v })} required />
            <Checkbox label="Written record given: the dose, the stop rules, the driving plan, the sleep hygiene advice and brief CBT-I plan or CBT-I signposting, and the date window for the next supply visit" checked={supply.writtenRecordGiven} onChange={(v) => setSupply({ ...supply, writtenRecordGiven: v })} required />
            {v3 && (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-semibold text-blue-900">Handover letter (sent the same day)</p>
                <SelectInput label="To" value={supply.handoverRecipient} onChange={(v) => setSupply({ ...supply, handoverRecipient: v as HandoverRecipient })} options={[{ value: 'gp', label: "The patient's GP" }, { value: 'other', label: 'Another prescriber the patient chooses' }]} required />
                {supply.handoverRecipient === 'other' && <TextInput label="Prescriber" value={supply.handoverOtherName} onChange={(v) => setSupply({ ...supply, handoverOtherName: v })} required />}
                <pre className="whitespace-pre-wrap rounded border border-blue-200 bg-white p-2 text-[11px] text-navy-900">{letterText}</pre>
                <Checkbox label="Handover letter sent today" checked={supply.handoverSentToday} onChange={(v) => setSupply({ ...supply, handoverSentToday: v })} required />
              </div>
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 10: Counselling */}
      {currentStep === STEP.counselling && (
        <StepWrapper {...stepProps(STEP.counselling, 'Every point; the stop rules and the driving plan in writing')}>
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-900">
              <p>{STOP_SAME_DAY_WORDING}</p>
              <p className="mt-2">{STOP_WITHIN_WEEK_WORDING}</p>
            </div>
            <BoolBox state={counselling} set={setCounselling} field="everyNight" label="Take one tablet every night, within 30 minutes before you go to bed. Do not take it if you forget at bedtime and wake in the night. Do not take more than one in a night" required />
            <BoolBox state={counselling} set={setCounselling} field="modestEffect" label="It helps some people fall asleep sooner and stay asleep longer, but on average the difference is modest. Keep going with your sleep routine, your sleep diary and CBT-I; they work alongside it" required />
            <BoolBox state={counselling} set={setCounselling} field="drivingAdvice" label="DRIVING: no driving the morning after your first tablet; first 4 tablets only on nights before a day you will not drive; then at least 9 hours before driving, cycling or using machines, and only if fully alert; if you cannot leave 9 hours, skip that night's tablet. It is against the law to drive if a medicine affects your driving" required />
            <BoolBox state={counselling} set={setCounselling} field="alcoholGrapefruit" label="No alcohol on the evenings you take it, and no grapefruit or grapefruit juice in the evening" required />
            <BoolBox state={counselling} set={setCounselling} field="noOtherSleepAids" label="Do not use other sleep aids, including melatonin and sleeping tablets bought in a shop. Do not take it on a night when you have taken another medicine that makes you drowsy" required />
            <BoolBox state={counselling} set={setCounselling} field="newMedicines" label="Before any new medicine (including antibiotics, antifungals and St John's wort) tell the pharmacist or doctor; some mean no daridorexant for the course and 7 days after (tell us); if a doctor starts a regular medicine such as diltiazem or verapamil, stop daridorexant and come back within 7 days" required />
            <BoolBox state={counselling} set={setCounselling} field="stopRulesWritten" label="The stop rules above given in writing" required />
            <BoolBox state={counselling} set={setCounselling} field="commonEffects" label="Headache, feeling sick, dizziness, tiredness and vivid dreams can happen and usually settle" required />
            <BoolBox state={counselling} set={setCounselling} field="stopAnyTime" label="You can stop at any time; you do not need to cut down first" required />
            <BoolBox state={counselling} set={setCounselling} field="blackTriangle" label="This is a new medicine being closely monitored: tell us about any side effect, however small; we report it to the MHRA, and you can too on the Yellow Card website" required />
            <BoolBox state={counselling} set={setCounselling} field="nextVisitWindow" label={`Come back between 25 and 35 days after this supply, in the last few days before you run out${visitWindow && !visitWindow.impossible ? ` (${formatUk(visitWindow.from)} to ${formatUk(visitWindow.to)})` : ''}. More than 7 nights without tablets and we cannot continue`} required />
            <BoolBox state={counselling} set={setCounselling} field="gpMayDecline" label="At your second visit you can stop if it has not helped. At your third visit we check whether it has helped enough; if so, one more month and we write to your GP or another prescriber; your GP may decide not to continue it, and a private prescriber is the alternative. At most three supplies" required />
            {isFemale && <BoolBox state={counselling} set={setCounselling} field="pregnancy" label="If you become pregnant, stop and tell your GP" required />}
            {age65 && <BoolBox state={counselling} set={setCounselling} field="fallsAdvice" label="A night light, a clear path to the toilet, and getting up slowly" required />}
            {screening.osa === 'cpap-most-nights' && <BoolBox state={counselling} set={setCounselling} field="cpapAdvice" label="Continue using your CPAP" required />}
            <BoolBox state={counselling} set={setCounselling} field="keepSafe" label="Keep the tablets safe and do not share them" required />
            <BoolBox state={counselling} set={setCounselling} field="adverseReaction" label="Adverse reaction reported or observed" />
            {counselling.adverseReaction && (
              <>
                <TextArea label="Adverse reaction and action taken" value={counselling.adverseReactionDetails} onChange={(v) => setCounselling({ ...counselling, adverseReactionDetails: v })} rows={2} required />
                <BoolBox state={counselling} set={setCounselling} field="yellowCardSubmitted" label="Yellow Card report submitted (every suspected adverse reaction, however minor)" required />
              </>
            )}
            <BoolBox state={counselling} set={setCounselling} field="allComplete" label="All counselling completed and documented" required />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 11: Summary */}
      {currentStep === STEP.summary && (
        <StepWrapper {...stepProps(STEP.summary, 'Pharmacist declaration and the consultation record')}>
          <div className="space-y-4 print:hidden">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">Pharmacists only. This PGD is not used by pharmacy technicians.</p>
              {roleUnknown && <p className="mt-1 text-xs text-amber-900">Your practitioner role could not be verified; the record relies on the declaration below.</p>}
              <Checkbox
                label="I am a pharmacist registered and practising with the GPhC, named and authorised under this PGD, and I have completed the training for it"
                checked={summary.registeredPharmacistConfirmed}
                onChange={(v) => setSummary({ ...summary, registeredPharmacistConfirmed: v })}
                required
              />
            </div>
            <TextInput label="Name of the supplying pharmacist" value={summary.pharmacistName} onChange={(v) => setSummary({ ...summary, pharmacistName: v })} required />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary({ ...summary, pharmacistGPhC: v })} required />
            <TextInput label="Pharmacy name" value={summary.pharmacyName} onChange={(v) => setSummary({ ...summary, pharmacyName: v })} />
            <TextInput label="Pharmacy address" value={summary.pharmacyAddress} onChange={(v) => setSummary({ ...summary, pharmacyAddress: v })} />
            <TextInput
              label={v1 ? 'How the GP will be informed (within 7 days of supply 1)' : v3 ? 'How the handover letter was sent' : 'How the GP will be informed'}
              value={summary.gpNotificationMethod}
              onChange={(v) => setSummary({ ...summary, gpNotificationMethod: v })}
              placeholder="e.g. emailed to the practice on saving"
              required
            />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary({ ...summary, clinicalNotes: v })} rows={3} />
            <p className="text-xs text-gray-500">
              {RECORD_WORDS}. Records signed, dated, legible and contemporaneous, kept for 8 years.
            </p>
          </div>
          <div className="mt-6">
            <DaridorexantSummaryReport
              patient={patient}
              consent={consent}
              course={course}
              sleep={sleep}
              cbti={cbti}
              screening={screening}
              medical={medical}
              medicines={medicines}
              driving={driving}
              supply={supply}
              counselling={counselling}
              summary={effectiveSummary}
              clinicalAlerts={clinicalAlerts}
              isBlocked={isBlocked}
              stopHistory={stopHistory}
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default DaridorexantClient;
