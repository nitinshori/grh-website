'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from '../shared/components/FormInputs';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { SaveDraftButton } from '../shared/components/SaveDraftButton';
import { AlertBanner } from '../shared/components/AlertBanner';
import { useConsultationTracking } from '../shared/hooks/useConsultationTracking';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { usePharmacistProfile } from '../shared/hooks/usePharmacistProfile';
import { useFormPersistence } from '../shared/hooks/useFormPersistence';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { calculateAge } from '../shared/types';
import type { BasePatientDetails, ClinicalAlert } from '../shared/types';
import type {
  Arm,
  Dose,
  MelConsent,
  MelCounselling,
  MelHistory,
  MelIndication,
  MelMedical,
  MelMedicines,
  MelPatientDetails,
  MelScreens,
  MelSummary,
  MelSupply,
  PractitionerRole,
  ProductKey,
  Referral,
  SupplyNumber,
  YesNo,
} from './lib/melatonin-types';
import {
  ARM_A_LABEL_WORDING,
  ARM_B_LABEL_WORDING,
  ARM_B_RECORD_WORDS,
  ARM_LABEL,
  EPWORTH_LICENSING_NOTE,
  MELATONIN_PGD_NAME,
  MELATONIN_PGD_SHORT,
  MELATONIN_PGD_VERSION,
  OFF_LABEL_CONSENT_SCRIPT,
  OFF_LABEL_RECORD_WORDS,
  PATIENT_CONSENT_STATEMENT,
  PRODUCTS,
  REFERRAL_LABEL,
  REFERRAL_OUTCOMES,
  UNLICENSED_WARNING,
  initialMelConsent,
  initialMelCounselling,
  initialMelHistory,
  initialMelIndication,
  initialMelMedical,
  initialMelMedicines,
  initialMelPatient,
  initialMelScreens,
  initialMelSummary,
  initialMelSupply,
} from './lib/melatonin-types';
import {
  BAND_LABEL,
  STEP,
  addDays,
  formatLocalDate,
  parseLocalDate,
  STEP_LABELS,
  armADoseDecision,
  armB5mgBlockedReason,
  courseDay,
  courseEndLimit,
  courseStatus,
  courseVerified,
  isRestartOverRecordedCourse,
  isUnverifiedReview,
  medicineListOestrogenMatches,
  supply1GatesApply,
  OUTSIDE_WINDOW_TEXT,
  counsellingItems,
  emergencyReferral,
  epworthTotal,
  formatUkDate,
  gadTotal,
  getMelatoninAlerts,
  gpNotificationText,
  isArmAReview,
  nightsWithoutTablets,
  phqTotal,
  productsForDose,
  ratingBand,
  ratingChange,
  reviewDay,
  reviewWindowFromToday,
  sameDayReferral,
  shouldBlockConsultation,
  stopBangTotal,
  stopsBlockStep,
  tabletsToday,
  threeMgCapReasons,
  totalPreviousCourses,
} from './lib/melatonin-clinical-logic';
import type { MelAlert } from './lib/melatonin-clinical-logic';
import {
  validateMelConsentStep,
  validateMelCounsellingStep,
  validateMelExclusionOutcome,
  validateMelHistoryStep,
  validateMelIndicationStep,
  validateMelMedicalStep,
  validateMelMedicinesStep,
  validateMelPatientStep,
  validateMelScreensStep,
  validateMelSummaryStep,
  validateMelSupplyStep,
} from './lib/melatonin-validation';
import MelatoninSummaryReport from './components/MelatoninSummaryReport';
import { applyCarryForward, deriveCarryForward, describeCarryForward, fetchPreviousMelatoninRecords } from './lib/melatonin-carry-forward';

// ─── Small inputs ───

function YesNoSelect({ label, value, onChange, yes = 'Yes', no = 'No', required = true }: { label: string; value: YesNo; onChange: (v: YesNo) => void; yes?: string; no?: string; required?: boolean }) {
  return <SelectInput label={label} value={value} onChange={(v) => onChange(v as YesNo)} options={[{ value: 'yes', label: yes }, { value: 'no', label: no }]} required={required} />;
}

const SCORE_LABELS = ['0 (not at all)', '1 (several days)', '2 (more than half the days)', '3 (nearly every day)'];

/** A restored Epworth value: a whole-number total 0 to 24; a legacy item array is summed where complete; anything else is empty. */
function restoredEpworth(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= 24 ? v : null;
  if (Array.isArray(v) && v.length === 8 && v.every((x) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 3)) return (v as number[]).reduce((a, b) => a + b, 0);
  return null;
}

function ScoreSelect({ label, value, onChange, labels = SCORE_LABELS }: { label: string; value: number | null; onChange: (v: number | null) => void; labels?: string[] }) {
  return (
    <SelectInput
      label={label}
      value={value === null ? '' : String(value)}
      onChange={(v) => onChange(v === '' ? null : Number(v))}
      options={labels.map((l, i) => ({ value: String(i), label: l }))}
      required
    />
  );
}

function RatingSelect({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <SelectInput
      label={label}
      value={value === null ? '' : String(value)}
      onChange={(v) => onChange(v === '' ? null : Number(v))}
      options={Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: i === 0 ? '0 (worst possible sleep)' : i === 10 ? '10 (best possible sleep)' : String(i) }))}
      required
    />
  );
}

function DateField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return <TextInput type="date" label={label} value={value} onChange={onChange} required={required} />;
}

function toBannerAlerts(alerts: MelAlert[]): ClinicalAlert[] {
  return alerts.filter((a) => a.severity !== 'info').map((a) => ({ severity: a.severity as 'stop' | 'caution', code: a.code, message: a.message, detail: a.detail }));
}

export function MelatoninClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [patient, setPatient] = useState<MelPatientDetails>(initialMelPatient);
  const [consent, setConsent] = useState<MelConsent>(initialMelConsent);
  const [history, setHistory] = useState<MelHistory>(initialMelHistory);
  const [indication, setIndication] = useState<MelIndication>(initialMelIndication);
  const [screens, setScreens] = useState<MelScreens>(initialMelScreens);
  const [medical, setMedical] = useState<MelMedical>(initialMelMedical);
  const [medicines, setMedicines] = useState<MelMedicines>(initialMelMedicines);
  const [supply, setSupply] = useState<MelSupply>(initialMelSupply);
  const [counselling, setCounselling] = useState<MelCounselling>(initialMelCounselling);
  const [summary, setSummary] = useState<MelSummary>(initialMelSummary());

  const formState = useMemo(
    () => ({ currentStep, patient, consent, history, indication, screens, medical, medicines, supply, counselling, summary }),
    [currentStep, patient, consent, history, indication, screens, medical, medicines, supply, counselling, summary]
  );

  const restoreState = useCallback((s: Partial<typeof formState>) => {
    if (s.currentStep !== undefined) setCurrentStep(s.currentStep);
    if (s.patient) {
      const p = { ...initialMelPatient, ...s.patient };
      setPatient({ ...p, age: calculateAge(p.dateOfBirth) });
    }
    if (s.consent) {
      // Drafts saved before presence became a yes/no question stored a boolean.
      const pres = (s.consent as { presentInPerson?: unknown }).presentInPerson;
      setConsent({ ...initialMelConsent, ...s.consent, presentInPerson: pres === true ? 'yes' : pres === 'yes' || pres === 'no' ? pres : '' });
    }
    if (s.history) setHistory({ ...initialMelHistory, ...s.history });
    if (s.indication) {
      const w = (s.indication as { wishesShortCourse?: unknown }).wishesShortCourse;
      setIndication({ ...initialMelIndication, ...s.indication, wishesShortCourse: w === true ? 'yes' : w === 'yes' || w === 'no' ? w : '' });
    }
    if (s.screens) {
      const raw = s.screens as Partial<MelScreens> & { epworth?: unknown };
      setScreens({ ...initialMelScreens, ...s.screens, epworth: restoredEpworth(raw.epworth), epworthOnLicensedForm: raw.epworthOnLicensedForm === true });
    }
    if (s.medical) setMedical({ ...initialMelMedical, ...s.medical });
    if (s.medicines) setMedicines({ ...initialMelMedicines, ...s.medicines });
    if (s.supply) {
      const ack = (s.supply as { acknowledgedCautions?: unknown }).acknowledgedCautions;
      setSupply({ ...initialMelSupply, ...s.supply, acknowledgedCautions: Array.isArray(ack) ? ack.filter((x): x is string => typeof x === 'string') : [] });
    }
    if (s.counselling) setCounselling({ ...initialMelCounselling, ...s.counselling });
    if (s.summary) {
      const fresh = initialMelSummary();
      setSummary({ ...fresh, ...s.summary, consultationDate: fresh.consultationDate, consultationTime: fresh.consultationTime });
    }
  }, []);

  const { clearSaved } = useFormPersistence('epgd-melatonin', formState, restoreState);

  // ─── Practitioner profile ───
  // Arm A is pharmacist only; arm B may be supplied by a pharmacy technician.
  // A profile whose clinician record says technician is locked to technician.
  const profile = usePharmacistProfile();
  const technicianProfile = profile?.practitionerRole === 'technician';
  const roleVerified = !!profile?.practitionerRole;
  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- profile arrives asynchronously from the shared hook; same pattern as every other ePGD tool
    setSummary((prev) =>
      prev.pharmacistName || prev.pharmacistGPhC
        ? prev
        : { ...prev, pharmacistName: profile.name, pharmacistGPhC: profile.gphcNumber, pharmacyName: profile.pharmacyName, pharmacyAddress: profile.pharmacyAddress }
    );
    if (profile.practitionerRole) {
      const role = profile.practitionerRole;
      setConsent((prev) => (prev.practitionerRole && !(role === 'technician' && prev.practitionerRole !== 'technician') ? prev : { ...prev, practitionerRole: role }));
    }
  }, [profile]);

  // Re-apply the technician lock whenever the role changes, including after a
  // draft or saved form is restored: a technician profile is always recorded
  // as a technician, so arm A raises ARM_A_TECHNICIAN and can never be supplied.
  useEffect(() => {
    if (!technicianProfile || consent.practitionerRole === 'technician') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a draft can overwrite the role set from the profile; the lock is re-applied here
    setConsent((prev) => ({ ...prev, practitionerRole: 'technician' }));
  }, [technicianProfile, consent.practitionerRole]);

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

  const handlePatientChange = useCallback((field: keyof MelPatientDetails, value: MelPatientDetails[keyof MelPatientDetails]) => {
    setPatient((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'dateOfBirth') updated.age = calculateAge(typeof value === 'string' ? value : '');
      return updated;
    });
  }, []);

  // ─── Carry-forward from the previous melatonin records at this pharmacy ───
  // Looked up when a returning patient is picked from the search box, and on
  // entering the Supply History step (same pattern as oral minoxidil).
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupKey, setLookupKey] = useState('');
  const lookupPrevious = useCallback(
    async (p: { firstName?: string; lastName?: string; dateOfBirth?: string }) => {
      const firstName = (p.firstName ?? '').trim();
      const lastName = (p.lastName ?? '').trim();
      const dateOfBirth = (p.dateOfBirth ?? '').trim();
      if (!firstName || !lastName || !dateOfBirth) return;
      const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dateOfBirth}`;
      if (key === lookupKey) return;
      await Promise.resolve();
      setLookupKey(key);
      setLookupLoading(true);
      const records = await fetchPreviousMelatoninRecords({ firstName, lastName, dateOfBirth });
      setLookupLoading(false);
      if (records === null) {
        setHistory((h) => ({ ...h, recordLookup: 'error', carriedForward: null }));
        return;
      }
      const cf = deriveCarryForward(records);
      setHistory((h) => applyCarryForward(h, cf, cf ? 'found' : 'none'));
    },
    [lookupKey]
  );
  useEffect(() => {
    if (currentStep !== STEP.history) return;
    if (!patient.firstName || !patient.lastName || !patient.dateOfBirth) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the lookup is a fetch against the records API; state is set only after the network round trip
    void lookupPrevious(patient);
  }, [currentStep, patient, lookupPrevious]);

  // ─── Derived ───
  const arm = consent.arm;
  const armA = arm === 'A';
  const armB = arm === 'B';
  const tech = consent.practitionerRole === 'technician';
  const supply1 = armA && history.supplyNumber === '1';
  const review = isArmAReview(consent, history);
  const verified = courseVerified(history);
  const unverified = isUnverifiedReview(consent, history);
  const gates = supply1GatesApply(consent, history);
  const restart = isRestartOverRecordedCourse(consent, history);
  const cf = history.carriedForward;
  const listOestrogen = medicineListOestrogenMatches(medicines);
  const isWoman = patient.sex === 'female';
  const isMan = patient.sex === 'male';

  const alerts = useMemo(
    () => getMelatoninAlerts(patient, consent, history, indication, screens, medical, medicines, supply),
    [patient, consent, history, indication, screens, medical, medicines, supply]
  );
  const bannerAlerts = useMemo(() => toBannerAlerts(alerts), [alerts]);
  const infoAlerts = alerts.filter((a) => a.severity === 'info');
  const cautions = alerts.filter((a) => a.severity === 'caution');
  const isBlocked = useMemo(() => shouldBlockConsultation(alerts), [alerts]);

  const doseDecision = useMemo(() => (armA ? armADoseDecision(patient, history, indication, medicines) : null), [armA, patient, history, indication, medicines]);
  const b5Blocked = armB ? armB5mgBlockedReason(patient, indication, medicines) : null;
  const doseOptions: Exclude<Dose, ''>[] = armA ? (doseDecision?.options ?? []) : armB ? (indication.wants5mg && !b5Blocked ? ['3', '5'] : ['3']) : [];
  const productOptions = productsForDose(supply.dose, arm).filter((p) => !(p === 'colonis-3' && medical.lactoseIntolerance));
  const tablets = tabletsToday(consent, indication);
  const product = supply.product ? PRODUCTS[supply.product] : null;
  const capReasons = threeMgCapReasons(patient, medicines);
  const band = ratingBand(history, indication);
  const change = ratingChange(history, indication);
  const rDay = reviewDay(history);
  const cDay = courseDay(history);
  const nightsWithout = nightsWithoutTablets(history);
  const reviewWin = reviewWindowFromToday();
  const courseLimit = armA && history.supplyNumber ? courseEndLimit(history, history.supplyNumber) : null;
  const previousCourses = totalPreviousCourses(history);
  const maleColonisPlanning = isMan && supply.product === 'colonis-3' && medical.manPlanningPregnancy === 'yes';
  const counsellingOpts = { maleColonisPlanning, supplyNumber: history.supplyNumber };
  const supplied = !isBlocked && !!supply.dose && !!supply.product;
  const course = useMemo(() => courseStatus(consent, history, alerts, supplied), [consent, history, alerts, supplied]);

  const { saveRecord, reset: resetTracking } = useConsultationTracking('melatonin', currentStep);
  const [stopSaveStatus, setStopSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [stopSaveAttempted, setStopSaveAttempted] = useState(false);

  // ─── Validation ───
  const errors = [
    validateMelPatientStep(patient),
    validateMelConsentStep(consent),
    validateMelHistoryStep(history, consent, patient),
    validateMelIndicationStep(indication, consent, history),
    validateMelScreensStep(screens, consent, history),
    validateMelMedicalStep(medical, consent, patient),
    validateMelMedicinesStep(medicines, consent, medical),
    validateMelSupplyStep(supply, consent, history, indication, patient, medical, medicines, alerts),
    validateMelCounsellingStep(counselling, consent, counsellingOpts),
    validateMelSummaryStep(summary, consent, history, course),
  ];
  const blockedByStep = STEP_LABELS.map((_, i) => stopsBlockStep(alerts, i));
  const canProceedByStep = errors.map((e, i) => e === null && !blockedByStep[i]);
  // Final Save & Print runs every step's validation, not only the summary's.
  const firstErrorStep = errors.findIndex((e) => e !== null);
  const finalError = firstErrorStep === -1 ? null : firstErrorStep === STEP.summary ? errors[STEP.summary] : `${STEP_LABELS[firstErrorStep]}: ${errors[firstErrorStep]}`;

  const handleNext = () => {
    if (!canProceedByStep[currentStep]) return;
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep + 1 === STEP.supply) {
      // Pre-select the dose and product where the rules allow only one.
      setSupply((prev) => {
        const dose = prev.dose && doseOptions.includes(prev.dose as Exclude<Dose, ''>) ? prev.dose : doseOptions.length === 1 ? doseOptions[0] : '';
        const prods = productsForDose(dose, arm).filter((p) => !(p === 'colonis-3' && medical.lactoseIntolerance));
        const prod: ProductKey = prev.product && prods.includes(prev.product as Exclude<ProductKey, ''>) ? prev.product : prods.length === 1 ? prods[0] : '';
        return { ...prev, dose, product: prod, packType: armB ? 'part-pack' : prev.packType };
      });
    }
    setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Exclusion outcome ───
  const has = (...codes: string[]) => alerts.some((a) => a.severity === 'stop' && codes.includes(a.code));
  const sameDay = sameDayReferral(alerts, screens, indication);
  const emergency = emergencyReferral(alerts, indication) || screens.immediateRisk;

  const referralOptions = useMemo<{ value: Referral; label: string }[]>(() => {
    const o: { value: Referral; label: string }[] = [];
    const push = (v: Referral) => {
      if (!o.some((x) => x.value === v)) o.push({ value: v, label: REFERRAL_LABEL[v] });
    };
    if (emergency) push('emergency-999');
    if (sameDay) push('gp-same-day');
    if (has('RED_FLAG_SAFEGUARDING', 'SAFEGUARDING_CARER_REQUEST', 'SAFEGUARDING_CARE_HOME', 'LACKS_CAPACITY')) push('safeguarding');
    if (has('PRESCRIBED_MELATONIN', 'ARM_B_FOUR_SUPPLIES')) push('prescriber');
    if (has('RED_FLAG_NARCOLEPSY_PARASOMNIA')) push('sleep-service-via-gp');
    if (has('RED_FLAG_RECREATIONAL_DRUGS', 'RED_FLAG_ALCOHOL')) push('drug-alcohol-service');
    if (has('JET_LAG_SAFETY_CRITICAL_TRIP')) push('aviation-medical');
    if (tech || has('JET_LAG_INSOMNIA_AT_HOME')) push('pharmacist');
    push('gp-routine');
    push('advice-only');
    push('declined');
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, emergency, sameDay, tech]);

  const effectiveSummary = useMemo<MelSummary>(
    () => (referralOptions.some((o) => o.value === summary.referral) ? summary : { ...summary, referral: '' }),
    [summary, referralOptions]
  );
  const exclusionOutcomeError = validateMelExclusionOutcome(effectiveSummary, consent, course);

  const gpText = useMemo(
    () =>
      armA
        ? gpNotificationText({
            patient,
            history,
            supply,
            screens,
            alerts,
            supplied,
            pharmacyName: summary.pharmacyName,
            pharmacistName: summary.pharmacistName,
            course,
          })
        : '',
    [armA, patient, history, supply, screens, alerts, supplied, summary.pharmacyName, summary.pharmacistName, course]
  );

  // ─── Consultation record ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    clearSaved();
    const stops = alerts.filter((a) => a.severity === 'stop');
    const items = counsellingItems(arm, counselling, counsellingOpts);
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
        indication,
        screens,
        medical,
        medicines,
        supply,
        counselling,
        summary: effectiveSummary,
        clinicalAlerts: alerts,
        pgdName: MELATONIN_PGD_NAME,
        pgdVersion: MELATONIN_PGD_VERSION,
        arm,
        recordWords: armA ? OFF_LABEL_RECORD_WORDS : armB ? ARM_B_RECORD_WORDS : null,
        practitionerRole: consent.practitionerRole,
        practitionerRoleVerified: roleVerified,
        ageConfirmed18OrOver: patient.age !== null && patient.age >= 18,
        offLabel: armA
          ? {
              statement: 'OFF-LABEL by indication: Adaflex is licensed for adult jet lag and for ADHD insomnia in children aged 6 to 17, not for insomnia in adults.',
              scriptGiven: consent.offLabelScriptGiven,
              toldLicenceEvidenceAlternatives: consent.toldLicenceEvidenceAlternatives,
              accepted: consent.acceptsOffLabel,
              consentStatement: PATIENT_CONSENT_STATEMENT,
              consentStatementSigned: consent.consentStatementSigned,
            }
          : null,
        screenScores: { phq2: phqTotal(screens), gad2: gadTotal(screens), stopBang: armA ? stopBangTotal(screens, patient) : null, epworth: armA ? epworthTotal(screens) : null },
        course: armA
          ? {
              supplyNumber: history.supplyNumber,
              verification: {
                recordLookup: history.recordLookup,
                verifiedFromRecords: verified,
                carriedForward: history.carriedForward,
                unverifiedReason: unverified ? history.unverifiedReason : null,
                supply1RecordRef: unverified ? history.supply1RecordRef : null,
                restartOverRecordedCourse: restart ? { recordedState: history.carriedForward?.latestCourseState ?? null, reason: history.restartReason } : null,
              },
              previousCourseEndedStopRule2: gates ? history.previousStopRule2 : null,
              supply1Date: supply1 ? summary.consultationDate : history.supply1Date,
              previousCoursesThisPgd: history.previousCoursesThisPgd,
              previousCoursesCircadin: history.previousCoursesCircadin,
              previousCoursesTotal: previousCourses,
              previousCourseEnded: history.previousCourseEndDate || null,
              gpReviewBeforeFurtherCourse: history.gpReviewDocumented === 'yes' ? { source: history.gpReviewSource, date: history.gpReviewDate } : null,
              route55: patient.age !== null && patient.age >= 55 ? history.route55Reason : null,
              reviewDayAfterLastSupply: review ? rDay : null,
              courseDay: review ? cDay : null,
              nightsWithoutTablets: review ? nightsWithout : null,
              baselineRating: history.baselineRating,
              reviewRating: review ? indication.reviewRating : null,
              ratingChange: review ? change : null,
              ratingBand: review && band ? BAND_LABEL[band] : null,
              reviewDecision: doseDecision?.text ?? null,
              tabletsInCourseIncludingToday: supplied && history.supplyNumber ? Number(history.supplyNumber) * 30 : null,
              lastTabletNoLaterThan: courseLimit,
              nextReviewWindow: supplied && history.supplyNumber !== '3' ? reviewWin : null,
              courseEnded: course.ended,
              endOfCourse: course.ended,
              endOfCourseReason: course.ended ? course.reason : null,
              outsideReviewWindow: course.outsideWindow ? OUTSIDE_WINDOW_TEXT : null,
              secondaryCausesAskedToday: { shiftWork: indication.shiftWork, delayedSleepPattern: indication.delayedSleepPattern, caffeineUnaddressed: indication.caffeineUnaddressed },
            }
          : null,
        journey: armB
          ? {
              destination: indication.destination,
              outwardDate: indication.outwardDate,
              returnDate: indication.returnDate,
              timeZones: indication.timeZones,
              direction: indication.direction,
              covers: indication.covers,
              importAdviceGiven: indication.importAdviceGiven,
              suppliesLast12MonthsIncludingToday: history.armBSuppliesLast12Months !== null ? history.armBSuppliesLast12Months + (supplied ? 1 : 0) : null,
              fiveMg: indication.wants5mg ? { blockedReason: b5Blocked, evidence: indication.prev3mgEvidence, product: indication.prev3mgProduct, whyInadequate: indication.prev3mgWhyInadequate } : null,
            }
          : null,
        threeMgCap: capReasons,
        suppliedUnderPgd: supplied,
        product: supplied && product ? { name: product.name, plNumber: product.plNumber, strengthMg: product.strengthMg, batch: supply.batchNumber, expiry: supply.expiryDate, packType: supply.packType, quantity: tablets } : null,
        labelWording: supplied ? (armA ? ARM_A_LABEL_WORDING : ARM_B_LABEL_WORDING) : null,
        counsellingGiven: items.map(([, label, v]) => ({ item: label, given: v })),
        gpNotification: armA
          ? {
              agreed: consent.gpNotificationAgreed === 'yes',
              method: effectiveSummary.gpNotificationMethod,
              text: gpText,
              supply1Letter:
                supply1 && supplied
                  ? {
                      sent: effectiveSummary.gpLetterSent,
                      sentDate: effectiveSummary.gpLetterSent === 'yes' ? effectiveSummary.gpLetterSentDate : null,
                      dueBy: parseLocalDate(summary.consultationDate) ? formatLocalDate(addDays(parseLocalDate(summary.consultationDate) as Date, 7)) : null,
                    }
                  : null,
              endOfCourse: course.ended ? { reason: course.reason, gpInformed: effectiveSummary.endOfCourseGpInformed, method: effectiveSummary.gpNotificationMethod } : null,
              notSuppliedLetter: !supplied && !course.ended && !course.outsideWindow,
            }
          : null,
        adverseReaction: counselling.adverseReaction ? counselling.adverseReactionDetails : null,
        exclusion: isBlocked
          ? {
              reasons: stops.map((a) => `${a.code}: ${a.message}`),
              adviceGiven: effectiveSummary.exclusionAdvice,
              referral: effectiveSummary.referral,
              referralLabel: REFERRAL_LABEL[effectiveSummary.referral],
              sameDay,
              emergency,
              sleepHygieneGiven: armA ? effectiveSummary.exclusionSleepHygieneGiven : null,
              jetLagAdviceGiven: armB ? effectiveSummary.exclusionJetLagAdviceGiven : null,
              courseEnded: armA ? course.ended : null,
              endOfCourseGpInformed: course.ended ? effectiveSummary.endOfCourseGpInformed : null,
              outsideReviewWindow: course.outsideWindow ? OUTSIDE_WINDOW_TEXT : null,
            }
          : null,
      } as unknown as Record<string, unknown>,
      outcome: isBlocked ? (REFERRAL_OUTCOMES.has(effectiveSummary.referral) ? 'referred' : 'not_supplied') : 'completed',
      ...(supplied && product
        ? {
            medicine: {
              name: `${product.name}, ${product.plNumber}${armA ? ' (OFF-LABEL, insomnia)' : ' (jet lag)'}`,
              dose: armA ? `${supply.dose} mg once nightly, 1 to 2 hours before bedtime` : `${supply.dose} mg once at destination bedtime, up to 5 nights per journey`,
              duration: armA ? '30 nights' : indication.covers === 'both' ? 'Up to 5 nights after each of two journeys' : 'Up to 5 nights',
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
      consent: { notifyGp: armA ? consent.gpNotificationAgreed === 'yes' : !!consent.notifyGp },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSaved, alerts, arm, counselling, patient, consent, history, indication, screens, medical, medicines, supply, effectiveSummary, roleVerified, supply1, summary, previousCourses, review, rDay, cDay, nightsWithout, change, band, doseDecision, supplied, courseLimit, reviewWin, b5Blocked, capReasons, product, tablets, gpText, isBlocked, sameDay, emergency, verified, unverified, gates, course]);

  const handleNewConsultation = useCallback(() => {
    clearSaved();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setPatient({ ...initialMelPatient });
    setConsent({ ...initialMelConsent, practitionerRole: profile?.practitionerRole ?? '' });
    setHistory({ ...initialMelHistory });
    setIndication({ ...initialMelIndication });
    setScreens({ ...initialMelScreens });
    setMedical({ ...initialMelMedical });
    setMedicines({ ...initialMelMedicines });
    setSupply({ ...initialMelSupply, acknowledgedCautions: [] });
    setCounselling({ ...initialMelCounselling });
    setSummary(initialMelSummary());
    setStopSaveStatus('idle');
    setStopSaveAttempted(false);
    setLookupKey('');
  }, [clearSaved, profile]);

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
    (data.clinicalData as Record<string, unknown>).stopReason = alerts.filter((a) => a.severity === 'stop').map((a) => a.message).join('; ');
    const ok = await saveRecord(data);
    if (!ok) {
      setStopSaveStatus('error');
      return;
    }
    resetTracking();
    handleNewConsultation();
  }, [exclusionOutcomeError, getConsultationData, currentStep, alerts, saveRecord, resetTracking, handleNewConsultation]);

  // While a stop is on screen the record is saved through the exclusion
  // block below, which insists on the advice and referral the PGD requires.
  const stepProps = (i: number, description: string) => ({
    title: STEP_LABELS[i],
    description,
    currentStep,
    totalSteps: STEP_LABELS.length,
    onNext: handleNext,
    onPrev: handlePrev,
    canProceed: i === STEP.summary ? finalError === null && !blockedByStep[i] : canProceedByStep[i],
    validationError: i === STEP.summary ? finalError : errors[i],
    isBlocked: blockedByStep[i],
    getConsultationData: isBlocked ? undefined : getConsultationData,
    onNewConsultation: handleNewConsultation,
  });

  const exclusionOutcomeBlock = isBlocked ? (
    <div className="mb-6 space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        {consent.patientDeclined ? 'The patient declines: record the advice given and the decision' : 'Not supplied under this PGD: record the exclusion, the advice given and the referral'}
      </p>
      <p className="text-xs text-red-800">
        Explain why and what to do instead. {armA ? 'Where the exclusion is a possible secondary cause or a red flag, name it and make the referral concrete: snoring with daytime sleepiness needs a sleep apnoea assessment; low mood needs a mood assessment, the same day if there are thoughts of self-harm. Give the sleep hygiene advice in Appendix 1 in every case, and signpost CBT-I. Document the reason, the advice and the referral. Inform the GP with the patient\'s consent.' : 'Give the non-drug jet lag advice in Appendix 3, and refer where the exclusion is clinical. Document the reason and the advice.'} To change an answer instead, go back to the step it was given on: the stop clears when the answer does.
      </p>
      {(sameDay || emergency) && (
        <p className="text-xs font-semibold text-red-900">
          {emergency ? 'EMERGENCY: call 999. ' : ''}Same-day referral: thoughts of self-harm or suicide (GP the same day, NHS 111, or 999 where there is immediate risk); a fall with injury; an adult safeguarding concern (the pharmacy&apos;s safeguarding procedure and the local authority adult safeguarding team). Do not leave a person at immediate risk alone.
        </p>
      )}
      {armB && tech && <p className="text-xs font-semibold text-red-900">Pharmacy technician: refer any red flag to the pharmacist, who makes the referral.</p>}
      {armA && (
        <Checkbox label="Sleep hygiene advice (Appendix 1) given, in writing as well as in conversation, and CBT-I signposted" checked={summary.exclusionSleepHygieneGiven} onChange={(v) => setSummary({ ...summary, exclusionSleepHygieneGiven: v })} required />
      )}
      {armB && <Checkbox label="Non-drug jet lag advice (Appendix 3) given" checked={summary.exclusionJetLagAdviceGiven} onChange={(v) => setSummary({ ...summary, exclusionJetLagAdviceGiven: v })} required />}
      {course.ended && (
        <>
          <p className="text-xs font-semibold text-red-900">END OF COURSE: {course.reason}.</p>
          <Checkbox label="END OF COURSE: the GP is informed (outcome and the reason the course ended)" checked={summary.endOfCourseGpInformed} onChange={(v) => setSummary({ ...summary, endOfCourseGpInformed: v })} required />
          <TextInput label="How the GP is informed" value={summary.gpNotificationMethod} onChange={(v) => setSummary({ ...summary, gpNotificationMethod: v })} placeholder="e.g. secure email to the practice today" required />
        </>
      )}
      {course.outsideWindow && <p className="text-xs font-semibold text-red-900">The course has not ended. Record: {OUTSIDE_WINDOW_TEXT}. No end-of-course letter to the GP.</p>}
      {armA && !review && <p className="text-xs text-red-800">Supply 1 not made: no course has begun. Any letter to the GP says &quot;not supplied&quot;.</p>}
      <TextArea label="Reason, advice given and decision reached" value={summary.exclusionAdvice} onChange={(v) => setSummary({ ...summary, exclusionAdvice: v })} rows={3} required placeholder="e.g. STOP-Bang 6 with witnessed pauses: explained possible sleep apnoea; GP letter; sleep hygiene leaflet given" />
      <SelectInput label="Referral or next action" value={effectiveSummary.referral} onChange={(v) => setSummary({ ...summary, referral: v as Referral })} options={referralOptions} required />
      {armA && gpText && (
        <details className="text-xs text-red-900">
          <summary className="cursor-pointer font-medium">Letter to the GP (copy into the referral)</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded border border-red-200 bg-white p-2 font-sans">{gpText}</pre>
        </details>
      )}
      {stopSaveAttempted && exclusionOutcomeError && <p className="text-xs font-medium text-red-700">{exclusionOutcomeError}</p>}
      {stopSaveStatus === 'error' && <p className="text-xs font-medium text-red-700">Could not save the consultation record. Try again, or print this page as a backup.</p>}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSaveStopAndNew}
          disabled={stopSaveStatus === 'saving'}
          className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
        >
          {stopSaveStatus === 'saving' ? 'Saving...' : 'Record exclusion (not supplied) and start a new consultation'}
        </button>
        <span className="text-xs text-red-800">Saved as {REFERRAL_OUTCOMES.has(effectiveSummary.referral) ? '"referred"' : '"not supplied"'}, then the form is cleared for the next patient.</span>
      </div>
    </div>
  ) : null;

  const declineBlock =
    currentStep >= STEP.consent && currentStep <= STEP.counselling ? (
      <div className="mt-6 border-t pt-4 print:hidden">
        <Checkbox label="The patient declines" checked={consent.patientDeclined} onChange={(v) => setConsent({ ...consent, patientDeclined: v })} description="The tool stops here. Record the reason, the advice given and the decision, then save the record" />
      </div>
    ) : null;

  // A total of 0 previous courses clears the stored course-end date and the GP review.
  const setCourseCounts = (thisPgd: number | null, circadin: number | null) => {
    const total = thisPgd !== null && circadin !== null ? thisPgd + circadin : null;
    setHistory({
      ...history,
      previousCoursesThisPgd: thisPgd,
      previousCoursesCircadin: circadin,
      ...((thisPgd ?? 0) + (circadin ?? 0) === 0 && !history.carriedForward?.lastCourseEndDate ? { previousCourseEndDate: '' } : {}),
      ...(total !== null && total < 2 ? { gpReviewDocumented: '' as YesNo, gpReviewSource: '' as MelHistory['gpReviewSource'], gpReviewDate: '', gpReviewAdvisesAgainst: false } : {}),
    });
  };

  const yn = <K extends keyof MelIndication>(k: K) => ({ value: indication[k] as YesNo, onChange: (v: YesNo) => setIndication({ ...indication, [k]: v }) });

  const stopRulesBlock = (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-semibold text-navy-900">Stopping rules (2) to (5), asked at every review or contact</p>
      <YesNoSelect label="Drowsiness the next day that affects daily activities?" {...yn('nextDayDrowsiness')} />
      <YesNoSelect label="Any fall while taking melatonin?" {...yn('fallWhileTaking')} />
      {indication.fallWhileTaking === 'yes' && <Checkbox label="The fall was with injury (same-day referral)" checked={indication.fallWhileTakingInjury} onChange={(v) => setIndication({ ...indication, fallWhileTakingInjury: v })} />}
      <YesNoSelect label="New or worse low mood or anxiety?" {...yn('newWorseMood')} />
      <YesNoSelect label="Rash, swelling of the face, lips or tongue, or difficulty breathing?" {...yn('allergySymptoms')} />
      {indication.allergySymptoms === 'yes' && <Checkbox label="Difficulty breathing or swelling of the lips or tongue NOW (emergency, 999)" checked={indication.allergyEmergency} onChange={(v) => setIndication({ ...indication, allergyEmergency: v })} />}
      <YesNoSelect label="Any other side effect the patient finds unacceptable?" {...yn('unacceptableSideEffect')} />
      <TextInput label="Side effects reported (optional)" value={indication.sideEffectsDetail} onChange={(v) => setIndication({ ...indication, sideEffectsDetail: v })} placeholder="e.g. mild headache on night 1, settled" />
      <Checkbox label="Each stopping rule question was asked" checked={indication.stopRulesAsked} onChange={(v) => setIndication({ ...indication, stopRulesAsked: v })} description="None of the problems in rules (2) to (5) is managed by changing the dose" required />
    </div>
  );

  const sb = stopBangTotal(screens, patient);
  const ep = epworthTotal(screens);
  const phq = phqTotal(screens);
  const gad = gadTotal(screens);

  return (
    <>
      <div className="mb-3 flex justify-end">
        <SaveDraftButton pgdSlug="melatonin" patientFirstName={patient.firstName} patientLastName={patient.lastName} patientDob={patient.dateOfBirth} getDraftState={() => formState} />
      </div>

      <div className="mb-6">
        <ProgressBar stepLabels={STEP_LABELS} currentStep={currentStep} onStepClick={(step) => step < currentStep && setCurrentStep(step)} completedSteps={completedSteps} hasErrors={isBlocked} />
      </div>

      {(currentStep >= STEP.consent || isBlocked) && bannerAlerts.length > 0 && <AlertBanner alerts={bannerAlerts} />}
      {currentStep >= STEP.consent && infoAlerts.length > 0 && (
        <div className="mb-6 space-y-2 print:hidden">
          {infoAlerts.map((a) => (
            <div key={a.code} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-800">Information</p>
              <p className="text-sm font-semibold text-blue-900">{a.message}</p>
              <p className="mt-1 text-xs text-blue-800">{a.detail}</p>
            </div>
          ))}
        </div>
      )}
      {exclusionOutcomeBlock}

      {/* Step 0: Patient */}
      {currentStep === STEP.patient && (
        <StepWrapper {...stepProps(STEP.patient, 'Adults aged 18 and over only. Age is calculated from the date of birth and confirmed as 18 or over on the day of supply')}>
          <p className="mb-4 text-xs text-gray-600">
            {MELATONIN_PGD_SHORT}. Face to face on the premises only. No children: anyone under 18 is referred to their GP. Never more than 5 mg in 24 hours from all sources; one dose a night.
          </p>
          <PatientDetailsStep patient={patient} onChange={handlePatientChange} requireAdult onReturningPatient={(p: Partial<BasePatientDetails>) => void lookupPrevious(p)} />
          {history.recordLookup === 'found' && cf && (
            <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
              <p className="font-semibold">Previous melatonin records for this patient at this pharmacy</p>
              <p className="mt-1">{describeCarryForward(cf)}. The course position is carried forward to the Supply History step.</p>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <SelectInput label="Sex" value={patient.sex} onChange={(v) => handlePatientChange('sex', v as MelPatientDetails['sex'])} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} required />
            <TextInput label="Occupation" value={patient.occupation} onChange={(v) => handlePatientChange('occupation', v)} placeholder="e.g. teacher; retired; taxi driver" required />
          </div>
        </StepWrapper>
      )}

      {/* Step 1: Arm, role and consent */}
      {currentStep === STEP.consent && (
        <StepWrapper {...stepProps(STEP.consent, 'Which arm, who is supplying, presence, capacity and consent')}>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              Adult with difficulty sleeping at home, and no secondary cause: arm A (pharmacist only). Adult travelling by air across 5 or more time zones: arm B. Anyone who fits neither arm is referred and given the relevant advice. Circadin or any prolonged-release melatonin is not covered: patients aged 55 and over may instead be eligible under the separate Get Real Health Circadin PGD.
            </div>
            <SelectInput
              label="I am completing this consultation as a"
              value={consent.practitionerRole}
              onChange={(v) => setConsent({ ...consent, practitionerRole: v as PractitionerRole })}
              options={[
                ...(technicianProfile ? [] : [{ value: 'pharmacist', label: 'Pharmacist registered and practising with the GPhC' }]),
                { value: 'technician', label: 'Pharmacy technician registered and practising with the GPhC (arm B only)' },
              ]}
              required
            />
            {technicianProfile && <p className="text-xs text-amber-800">Your clinician record says pharmacy technician: arm A is not available to you.</p>}
            <SelectInput
              label="Arm"
              value={arm}
              onChange={(v) => setConsent({ ...consent, arm: v as Arm })}
              options={[
                ...(tech ? [] : [{ value: 'A', label: ARM_LABEL.A }]),
                { value: 'B', label: ARM_LABEL.B },
                ...(tech && arm === 'A' ? [{ value: 'A', label: `${ARM_LABEL.A} (not available to a technician)` }] : []),
              ]}
              required
            />
            <YesNoSelect label="Is the patient present, seen face to face on the premises?" value={consent.presentInPerson} onChange={(v) => setConsent({ ...consent, presentInPerson: v })} no="No (remote or telephone: not covered, do not supply)" />
            <Checkbox label="The request is made by a relative or carer on the adult's behalf" checked={consent.requestByCarerOrRelative} onChange={(v) => setConsent({ ...consent, requestByCarerOrRelative: v })} description="A relative or carer cannot request or consent on an adult's behalf (adult safeguarding)" />
            <Checkbox label="The patient lives in a care home" checked={consent.livesInCareHome} onChange={(v) => setConsent({ ...consent, livesInCareHome: v })} />
            <Checkbox label="The patient lacks capacity to consent to this treatment" checked={consent.lacksCapacity} onChange={(v) => setConsent({ ...consent, lacksCapacity: v })} />
            <Checkbox label="Valid informed consent given" checked={consent.informedConsentGiven} onChange={(v) => setConsent({ ...consent, informedConsentGiven: v })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Checkbox label="ID verified" checked={consent.idVerified} onChange={(v) => setConsent({ ...consent, idVerified: v })} required />
              <TextInput label="ID type (optional)" value={consent.idType} onChange={(v) => setConsent({ ...consent, idType: v })} placeholder="e.g. driving licence" />
            </div>
            <Checkbox label="The patient understands this is a private service" checked={consent.patientAwarePrivateService} onChange={(v) => setConsent({ ...consent, patientAwarePrivateService: v })} required />

            {armA && (
              <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">ARM A IS OFF-LABEL. Pharmacists only. The patient is told that the supply is outside the licence, why, and what the alternatives are, and consents on that basis. The GP is told of every course.</p>
                <YesNoSelect label="Registered with a GP?" value={consent.gpRegistered} onChange={(v) => setConsent({ ...consent, gpRegistered: v })} />
                <YesNoSelect label="Agrees to the GP being informed within 7 days of supply 1 and at the end of the course?" value={consent.gpNotificationAgreed} onChange={(v) => setConsent({ ...consent, gpNotificationAgreed: v })} no="No (a patient who will not allow the GP to be told is not supplied)" />
                <div className="rounded border border-amber-200 bg-white p-3 text-xs text-gray-800">
                  <p className="mb-1 font-semibold">Off-label consent script (give in substance and record)</p>
                  <p>{OFF_LABEL_CONSENT_SCRIPT}</p>
                </div>
                <Checkbox label="Off-label consent script given in substance" checked={consent.offLabelScriptGiven} onChange={(v) => setConsent({ ...consent, offLabelScriptGiven: v })} required />
                <Checkbox label="Told the supply is off-label, what the licence covers, why it is used, that benefit is uncertain and national guidance does not recommend it, and the alternatives (CBT-I, sleep hygiene)" checked={consent.toldLicenceEvidenceAlternatives} onChange={(v) => setConsent({ ...consent, toldLicenceEvidenceAlternatives: v })} required />
                <YesNoSelect label="Does the patient consent to off-label treatment on that basis?" value={consent.acceptsOffLabel} onChange={(v) => setConsent({ ...consent, acceptsOffLabel: v })} />
                {consent.acceptsOffLabel === 'yes' && (
                  <>
                    <div className="rounded border border-amber-200 bg-white p-3 text-xs text-gray-800">
                      <p className="mb-1 font-semibold">Consent statement (Appendix 4), printed above the patient&apos;s signature on the record</p>
                      <p>&quot;{PATIENT_CONSENT_STATEMENT}&quot;</p>
                    </div>
                    <Checkbox label="The patient has signed the consent statement" checked={consent.consentStatementSigned} onChange={(v) => setConsent({ ...consent, consentStatementSigned: v })} required />
                  </>
                )}
              </div>
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 2: Supply history */}
      {currentStep === STEP.history && (
        <StepWrapper {...stepProps(STEP.history, armA ? 'Supply number in the course, previous courses (including Circadin), and the review window' : 'Arm B supplies in the last 12 months and any current course')}>
          {armA && (
            <div className="space-y-4">
              {lookupLoading && <p className="text-xs text-gray-500">Looking up the patient&apos;s previous melatonin records at this pharmacy...</p>}
              {!lookupLoading && !history.recordLookup && <p className="text-xs text-amber-800">The previous-record look-up has not run: check the name and date of birth on the Patient step.</p>}
              {history.recordLookup === 'found' && cf && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <p className="font-semibold">From the pharmacy records: today is supply {cf.expectedSupply}</p>
                  <p className="mt-1">{describeCarryForward(cf)}. The supply number, dates, previous dose and baseline rating come from the records and are not self-declared.</p>
                </div>
              )}
              {(history.recordLookup === 'none' || history.recordLookup === 'error') && (
                <p className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
                  {history.recordLookup === 'none' ? 'No previous melatonin record for this patient at this pharmacy.' : 'The previous-record look-up failed.'} Supply 1 is the expected supply. Supply 2 or 3 needs a recorded reason and the supply 1 record, is shown as unverified, and every supply 1 gate that depends on the course history still applies.
                </p>
              )}
              <SelectInput
                label="Supply number in this insomnia course"
                value={history.supplyNumber}
                onChange={(v) => setHistory(applyCarryForward({ ...history, supplyNumber: v as SupplyNumber }, cf, history.recordLookup))}
                options={[
                  { value: '1', label: 'Supply 1 (a new course)' },
                  { value: '2', label: 'Supply 2 (after review 1)' },
                  { value: '3', label: 'Supply 3 (after review 2; the last supply of the course)' },
                ]}
                required
              />
              {restart && (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    {cf?.latestCourseState === 'open'
                      ? `CAUTION: the pharmacy records show an arm A course still open (last supply ${formatUkDate(cf.latestCourseLastSupplyDate)}), so today would be supply ${cf.expectedSupply}. A course is not restarted.`
                      : `CAUTION: the pharmacy records show an arm A course that lapsed (no supply or review by day 37 after ${formatUkDate(cf?.latestCourseLastSupplyDate ?? '')}); it ended on day 37, and supply 1 of a new course needs at least 6 months from that date.`}
                  </p>
                  <TextArea label="Reason supply 1 of a new course is chosen (or why the records are wrong)" value={history.restartReason} onChange={(v) => setHistory({ ...history, restartReason: v })} rows={2} required placeholder="e.g. the record is for a different patient with the same name and date of birth" />
                </div>
              )}
              {unverified && (
                <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">CAUTION: supply {history.supplyNumber} is not verified by the pharmacy records. The course is unverified.</p>
                  <TextArea label="Reason supply 1 is not on this pharmacy's records (or why the records are wrong)" value={history.unverifiedReason} onChange={(v) => setHistory({ ...history, unverifiedReason: v })} rows={2} required placeholder="e.g. supply 1 made at our other branch; record seen" />
                  <TextInput label="Supply 1 record reference and date (the record seen)" value={history.supply1RecordRef} onChange={(v) => setHistory({ ...history, supply1RecordRef: v })} required placeholder="e.g. PMR entry 12345, 1 September 2026" />
                </div>
              )}
              <p className="text-xs text-gray-600">A course is up to three supplies of 30 tablets: no more than 90 tablets and 90 nights, ending by day 103 after supply 1. A supply is never made without a consultation; this PGD never supplies on a repeat prescription basis.</p>
              {gates && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">Counting courses (this PGD and the Get Real Health Circadin PGD){unverified ? ': applied because the course is unverified' : ''}</p>
                  <YesNoSelect label="Did a previous melatonin course end because of next-day drowsiness or a fall (stopping rule 2)?" value={history.previousStopRule2} onChange={(v) => setHistory({ ...history, previousStopRule2: v })} yes="Yes (no further supply under this PGD)" />
                  {cf?.stopRule2Found && <p className="text-xs font-semibold text-red-700">The pharmacy records show a stopping rule 2 stop.</p>}
                  <p className="text-xs text-gray-600">A course counts once supply 1 has been made, however it ended. Identified from the patient&apos;s account and the pharmacy&apos;s records; self-report is sufficient, no proof is required, and the answer is recorded.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberInput label="Previous courses under this PGD" value={history.previousCoursesThisPgd} onChange={(v) => setCourseCounts(v, history.previousCoursesCircadin)} min={cf?.coursesFound ?? 0} required />
                    <NumberInput label="Previous courses under the Circadin PGD" value={history.previousCoursesCircadin} onChange={(v) => setCourseCounts(history.previousCoursesThisPgd, v)} min={0} required />
                  </div>
                  <Checkbox label="Pharmacy record checked, and the patient asked specifically about supplies elsewhere and under the Circadin PGD" checked={history.coursesAskedSpecifically} onChange={(v) => setHistory({ ...history, coursesAskedSpecifically: v })} required />
                  {((previousCourses ?? 0) > 0 || !!cf?.lastCourseEndDate) && <DateField label="Date the most recent course ended" value={history.previousCourseEndDate} onChange={(v) => setHistory({ ...history, previousCourseEndDate: v })} required />}
                  {cf?.lastCourseEndDate && <p className="text-xs text-gray-600">From the pharmacy records: the most recent course ended {formatUkDate(cf.lastCourseEndDate)}{cf.latestCourseState === 'lapsed' ? ' (no supply or review by day 37 after the last supply, so it ended on day 37)' : ''}. The date cannot be earlier than this.</p>}
                  {(previousCourses ?? 0) >= 2 && (
                    <div className="space-y-3 rounded border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs text-amber-900">Two or more previous courses: a GP review since the end of the most recent course must be documented (a letter, a record in the NHS App or Summary Care Record, or the GP&apos;s reply to the pharmacy) and must not advise against further melatonin.</p>
                      <YesNoSelect label="GP review documented since the end of the most recent course?" value={history.gpReviewDocumented} onChange={(v) => setHistory({ ...history, gpReviewDocumented: v })} />
                      {history.gpReviewDocumented === 'yes' && (
                        <>
                          <SelectInput
                            label="How it is documented"
                            value={history.gpReviewSource}
                            onChange={(v) => setHistory({ ...history, gpReviewSource: v as MelHistory['gpReviewSource'] })}
                            options={[
                              { value: 'letter', label: 'A letter' },
                              { value: 'nhs-app-scr', label: 'A record in the NHS App or Summary Care Record' },
                              { value: 'gp-reply', label: "The GP's reply to the pharmacy" },
                            ]}
                            required
                          />
                          <DateField label="Date of the GP review (not in the future)" value={history.gpReviewDate} onChange={(v) => setHistory({ ...history, gpReviewDate: v })} required />
                          <Checkbox label="The GP review advises against further melatonin" checked={history.gpReviewAdvisesAgainst} onChange={(v) => setHistory({ ...history, gpReviewAdvisesAgainst: v })} />
                        </>
                      )}
                    </div>
                  )}
                  <YesNoSelect label="Currently in a course under the Get Real Health Circadin PGD?" value={history.inCircadinCourse} onChange={(v) => setHistory({ ...history, inCircadinCourse: v })} />
                  {patient.age !== null && patient.age >= 55 && (
                    <TextArea label="Aged 55 or over: why this route (arm A of this PGD) rather than the Circadin PGD for this course" value={history.route55Reason} onChange={(v) => setHistory({ ...history, route55Reason: v })} rows={2} required placeholder="One route per course; no switching within a course" />
                  )}
                </div>
              )}
              {review && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">Review {history.supplyNumber === '2' ? '1 (before supply 2)' : '2 (before supply 3)'}</p>
                  {verified && cf ? (
                    <p className="rounded bg-emerald-50 p-2 text-xs text-emerald-900">
                      From the pharmacy records: supply 1 on {formatUkDate(history.supply1Date)}; last supply (supply {Number(history.supplyNumber) - 1}) on {formatUkDate(history.lastSupplyDate)}
                      {cf.previousDose ? ` at ${cf.previousDose} mg` : ''}{cf.baselineRating !== null ? `; baseline rating ${cf.baselineRating}` : ''}.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DateField label="Date of supply 1" value={history.supply1Date} onChange={(v) => setHistory({ ...history, supply1Date: v })} required />
                      <DateField label={`Date of the last supply (supply ${Number(history.supplyNumber) - 1})`} value={history.lastSupplyDate} onChange={(v) => setHistory({ ...history, lastSupplyDate: v })} required />
                    </div>
                  )}
                  {rDay !== null && (
                    <p className="text-xs text-gray-700">
                      Today is day {rDay} after the last supply (review window day 21 to day 30, accepted up to day 37){nightsWithout > 0 ? `; ${nightsWithout} night(s) without tablets, recorded, and the course is not restarted` : ''}. Day {cDay ?? '?'} after supply 1.
                    </p>
                  )}
                  <YesNoSelect label="Reviewed in person by a pharmacist today?" value={history.reviewInPerson} onChange={(v) => setHistory({ ...history, reviewInPerson: v })} />
                  {!(verified && cf?.previousDose) && (
                    <SelectInput label="Dose of the last supply" value={history.previousDose} onChange={(v) => setHistory({ ...history, previousDose: v as Dose })} options={[{ value: '3', label: '3 mg (Adaflex 3 mg)' }, { value: '5', label: '5 mg (Adaflex 5 mg)' }]} required />
                  )}
                  {!(verified && cf && cf.baselineRating !== null) && (
                    <RatingSelect label="Baseline 0 to 10 sleep quality rating recorded at supply 1" value={history.baselineRating} onChange={(v) => setHistory({ ...history, baselineRating: v })} />
                  )}
                </div>
              )}
            </div>
          )}
          {armB && (
            <div className="space-y-4">
              <NumberInput label="Supplies under arm B in the 12 months before today" value={history.armBSuppliesLast12Months} onChange={(v) => setHistory({ ...history, armBSuppliesLast12Months: v })} min={0} required />
              <Checkbox label="Pharmacy record checked and the patient asked about supplies elsewhere" checked={history.armBCountAskedSpecifically} onChange={(v) => setHistory({ ...history, armBCountAskedSpecifically: v })} description="No more than four supplies under this arm in any 12 months (the licensed maximum is 16 treatment cycles a year)" required />
              <YesNoSelect label="In the middle of an arm A (insomnia) course?" value={history.midArmACourse} onChange={(v) => setHistory({ ...history, midArmACourse: v })} />
              <YesNoSelect label="In the middle of a Circadin course?" value={history.midCircadinCourse} onChange={(v) => setHistory({ ...history, midCircadinCourse: v })} />
              <YesNoSelect label="Has the patient had a previous jet lag supply under this arm?" value={history.previousJetLagSupply} onChange={(v) => setHistory({ ...history, previousJetLagSupply: v })} yes="Yes (ask about side effects; apply the stopping rules)" />
              <YesNoSelect label="Did a previous melatonin course end because of next-day drowsiness or a fall (stopping rule 2)?" value={history.previousStopRule2} onChange={(v) => setHistory({ ...history, previousStopRule2: v })} yes="Yes (no further supply under this PGD)" />
              {cf?.stopRule2Found && <p className="text-xs font-semibold text-red-700">The pharmacy records show a stopping rule 2 stop.</p>}
              {cf?.latestCourseState === 'open' && <p className="text-xs font-semibold text-red-700">STOP: the pharmacy records show an arm A course open (last supply {formatUkDate(cf.latestCourseLastSupplyDate)}). A patient in the middle of an arm A course is not supplied under arm B.</p>}
            </div>
          )}
          {!arm && <p className="text-sm text-gray-600">Choose the arm on the previous step.</p>}
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 3: Sleep or journey assessment */}
      {currentStep === STEP.indication && (
        <StepWrapper {...stepProps(STEP.indication, armA ? (supply1 ? 'Primary insomnia, its duration and effect, sleep hygiene first, CBT-I offered, and secondary causes' : 'Review: sleep rating band, side effects and the stopping rules') : 'The journey, safety-critical duty, and the 5 mg criteria')}>
          {supply1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-navy-900">Pattern</p>
              <Checkbox label="Difficulty getting to sleep" checked={indication.difficultyGettingToSleep} onChange={(v) => setIndication({ ...indication, difficultyGettingToSleep: v })} />
              <Checkbox label="Difficulty staying asleep" checked={indication.difficultyStayingAsleep} onChange={(v) => setIndication({ ...indication, difficultyStayingAsleep: v })} />
              <Checkbox label="Waking early and not getting back to sleep" checked={indication.wakingEarly} onChange={(v) => setIndication({ ...indication, wakingEarly: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput label="Nights a week affected" value={indication.nightsPerWeek} onChange={(v) => setIndication({ ...indication, nightsPerWeek: v })} min={0} max={7} required />
                <NumberInput label="Weeks present" value={indication.durationWeeks} onChange={(v) => setIndication({ ...indication, durationWeeks: v })} min={0} unit="weeks" required />
              </div>
              <YesNoSelect label="Does it affect daytime functioning?" {...yn('daytimeImpact')} />
              {indication.daytimeImpact === 'yes' && <TextInput label="Effect on daytime functioning" value={indication.daytimeImpactDetail} onChange={(v) => setIndication({ ...indication, daytimeImpactDetail: v })} required />}
              <RatingSelect label="Baseline: the patient's own 0 to 10 rating of their sleep quality today" value={history.baselineRating} onChange={(v) => setHistory({ ...history, baselineRating: v })} />
              <SelectInput
                label="Sleep hygiene first"
                value={indication.sleepHygieneRoute}
                onChange={(v) => setIndication({ ...indication, sleepHygieneRoute: v as MelIndication['sleepHygieneRoute'] })}
                options={[
                  { value: 'tried', label: 'Appendix 1 advice followed for at least 2 weeks without sufficient benefit' },
                  { value: 'severe-impairment', label: 'Severe daytime impairment documented (sleep hygiene starts today alongside the course)' },
                  { value: 'neither', label: 'Neither (give the advice; not supplied today)' },
                ]}
                required
              />
              {indication.sleepHygieneRoute === 'tried' && <NumberInput label="How long sleep hygiene had been followed" value={indication.sleepHygieneWeeks} onChange={(v) => setIndication({ ...indication, sleepHygieneWeeks: v })} min={0} unit="weeks" required />}
              {indication.sleepHygieneRoute === 'severe-impairment' && (
                <>
                  <TextInput label="What the severe daytime impairment is" value={indication.severeImpairmentWhat} onChange={(v) => setIndication({ ...indication, severeImpairmentWhat: v })} placeholder="e.g. unable to work or to care for dependants safely" required />
                  <TextInput label="Why waiting 2 weeks is not reasonable" value={indication.severeImpairmentWhyNotWait} onChange={(v) => setIndication({ ...indication, severeImpairmentWhyNotWait: v })} required />
                </>
              )}
              <Checkbox label="CBT-I offered and signposted (NHS Talking Therapies self-referral, or a digital CBT-I programme recommended by NICE)" checked={indication.cbtiSignposted} onChange={(v) => setIndication({ ...indication, cbtiSignposted: v })} required />
              <YesNoSelect label="Having been offered CBT-I, does the patient wish to take a short course of medicine?" {...yn('wishesShortCourse')} no="No (not supplied: sleep hygiene advice and CBT-I)" />
            </div>
          )}
          {armA && history.supplyNumber && (
            <div className="mt-4 space-y-4">
              <p className="text-sm font-semibold text-navy-900">Secondary causes (exclusions, asked at every supply)</p>
              <YesNoSelect label="Shift work of any pattern?" {...yn('shiftWork')} />
              <YesNoSelect label="Delayed sleep pattern (falling asleep very late and sleeping late when free to do so)?" {...yn('delayedSleepPattern')} />
              <YesNoSelect label="Caffeine late in the day or in high total amounts, not yet addressed?" {...yn('caffeineUnaddressed')} />
            </div>
          )}
          {review && (
            <div className="space-y-4">
              <RatingSelect label="Today: the patient's own 0 to 10 rating of their sleep quality" value={indication.reviewRating} onChange={(v) => setIndication({ ...indication, reviewRating: v })} />
              {band && (
                <p className="rounded bg-blue-50 p-2 text-xs text-blue-900">
                  Baseline {history.baselineRating}, today {indication.reviewRating}, change {change !== null && change > 0 ? `+${change}` : change}: {BAND_LABEL[band]}.
                </p>
              )}
              <NumberInput label="Nights a week affected" value={indication.nightsAffectedPerWeek} onChange={(v) => setIndication({ ...indication, nightsAffectedPerWeek: v })} min={0} max={7} required />
              <YesNoSelect label="Adherent to the timing (1 to 2 hours before bed) and no-food rules?" {...yn('adherenceTimingFood')} />
              <Checkbox label="A caution makes a higher dose unsafe (the patient cannot have 5 mg)" checked={indication.higherDoseUnsafe} onChange={(v) => setIndication({ ...indication, higherDoseUnsafe: v })} />
              {indication.higherDoseUnsafe && <TextInput label="Which caution" value={indication.higherDoseUnsafeReason} onChange={(v) => setIndication({ ...indication, higherDoseUnsafeReason: v })} required />}
              {stopRulesBlock}
              <p className="text-xs text-gray-600">Falls, mood (PHQ-2 and GAD-2 repeated), other melatonin and new medicines are asked on the following steps.</p>
            </div>
          )}
          {armB && (
            <div className="space-y-4">
              <YesNoSelect label="Is the journey by air?" {...yn('byAir')} />
              <TextInput label="Destination" value={indication.destination} onChange={(v) => setIndication({ ...indication, destination: v })} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField label="Outward date" value={indication.outwardDate} onChange={(v) => setIndication({ ...indication, outwardDate: v })} required />
                <DateField label="Return date" value={indication.returnDate} onChange={(v) => setIndication({ ...indication, returnDate: v })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput label="Time zones crossed (time difference)" value={indication.timeZones} onChange={(v) => setIndication({ ...indication, timeZones: v })} min={0} max={14} unit="hours" required />
                <SelectInput label="Direction" value={indication.direction} onChange={(v) => setIndication({ ...indication, direction: v as MelIndication['direction'] })} options={[{ value: 'east', label: 'Eastward (benefit is greater)' }, { value: 'west', label: 'Westward' }]} required />
              </div>
              <SelectInput
                label="The supply covers"
                value={indication.covers}
                onChange={(v) => setIndication({ ...indication, covers: v as MelIndication['covers'] })}
                options={[
                  { value: 'outward', label: 'The outward journey (5 tablets)' },
                  { value: 'return', label: 'The return journey (5 tablets)' },
                  { value: 'both', label: 'Both journeys (10 tablets)' },
                ]}
                required
              />
              {indication.covers === 'both' && <Checkbox label="The return journey also crosses 5 or more time zones" checked={indication.returnAlsoFiveZones} onChange={(v) => setIndication({ ...indication, returnAlsoFiveZones: v })} required />}
              <YesNoSelect label="Is this insomnia at home rather than jet lag?" {...yn('insomniaAtHome')} />
              <YesNoSelect label="Pilot, aircrew, air traffic controller, or on safety-critical duty during the trip?" {...yn('safetyCriticalDuringTrip')} />
              <Checkbox label="Advised to check the import rules of the destination country before travel, and to carry the tablets in the labelled container in hand luggage with the pharmacy record" checked={indication.importAdviceGiven} onChange={(v) => setIndication({ ...indication, importAdviceGiven: v })} required />
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <Checkbox label="The patient asks for 5 mg (Adaflex 5 mg)" checked={indication.wants5mg} onChange={(v) => setIndication({ ...indication, wants5mg: v })} description="Only where the 5 mg criteria are met; otherwise 3 mg" />
                {indication.wants5mg && (
                  <>
                    <Checkbox label="Has taken melatonin 3 mg for jet lag before" checked={indication.prev3mgJetLag} onChange={(v) => setIndication({ ...indication, prev3mgJetLag: v })} />
                    <Checkbox label="It was tolerated" checked={indication.prev3mgTolerated} onChange={(v) => setIndication({ ...indication, prev3mgTolerated: v })} />
                    <Checkbox label="It did not adequately relieve symptoms" checked={indication.prev3mgInadequate} onChange={(v) => setIndication({ ...indication, prev3mgInadequate: v })} />
                    {indication.prev3mgJetLag && (
                      <>
                        <SelectInput
                          label="The previous 3 mg use"
                          value={indication.prev3mgEvidence}
                          onChange={(v) => setIndication({ ...indication, prev3mgEvidence: v as MelIndication['prev3mgEvidence'] })}
                          options={[
                            { value: 'recorded', label: "Recorded (this pharmacy's records or another supply record I have seen)" },
                            { value: 'named-licensed', label: 'A licensed product the patient can name, obtained on prescription or from a pharmacy' },
                            { value: 'supplement', label: 'A supplement or unlicensed melatonin (does not count)' },
                            { value: 'none', label: 'Neither (does not count)' },
                          ]}
                          required
                        />
                        <TextInput label="Product and where it came from (or the record seen)" value={indication.prev3mgProduct} onChange={(v) => setIndication({ ...indication, prev3mgProduct: v })} />
                        <TextInput label="Why it was inadequate" value={indication.prev3mgWhyInadequate} onChange={(v) => setIndication({ ...indication, prev3mgWhyInadequate: v })} />
                      </>
                    )}
                    <p className={`text-xs ${b5Blocked ? 'text-red-700' : 'text-green-700'}`}>
                      {b5Blocked
                        ? `5 mg not permitted: ${b5Blocked}. Supply 3 mg.`
                        : !medicines.oestrogen
                          ? 'PROVISIONAL: the 5 mg criteria recorded so far are met, but 5 mg also depends on the oestrogen question (Medicines step) and the age (65 or over: 3 mg maximum). It is confirmed on the Dose and Supply step.'
                          : '5 mg criteria met: Adaflex 5 mg may be supplied.'}
                    </p>
                  </>
                )}
              </div>
              {history.previousJetLagSupply === 'yes' && stopRulesBlock}
            </div>
          )}
          {armA && !history.supplyNumber && <p className="text-sm text-gray-600">Record the supply number on the previous step.</p>}
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 4: Red flags and screens */}
      {currentStep === STEP.screens && (
        <StepWrapper {...stepProps(STEP.screens, armA ? 'Each red flag is a referral, not a supply. Arm A: complete the screens in Appendix 2' : 'Each red flag is a referral, not a supply. Arm B: ask about them as symptoms; the scored screens are not required')}>
          <div className="space-y-5">
            {armB && tech && <p className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">Pharmacy technician: refer any red flag to the pharmacist, who makes the referral.</p>}
            {armA && (
              <>
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">PHQ-2 (depression): over the last 2 weeks, how often have you been bothered by</p>
                  <ScoreSelect label="(1) Little interest or pleasure in doing things" value={screens.phq1} onChange={(v) => setScreens({ ...screens, phq1: v })} />
                  <ScoreSelect label="(2) Feeling down, depressed or hopeless" value={screens.phq2} onChange={(v) => setScreens({ ...screens, phq2: v })} />
                  <p className="text-xs text-gray-700">PHQ-2 total: {phq ?? 'incomplete'} (3 or more is positive: do not supply; refer to the GP)</p>
                </div>
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">GAD-2 (anxiety): over the last 2 weeks, how often have you been bothered by</p>
                  <ScoreSelect label="(1) Feeling nervous, anxious or on edge" value={screens.gad1} onChange={(v) => setScreens({ ...screens, gad1: v })} />
                  <ScoreSelect label="(2) Not being able to stop or control worrying" value={screens.gad2} onChange={(v) => setScreens({ ...screens, gad2: v })} />
                  <p className="text-xs text-gray-700">GAD-2 total: {gad ?? 'incomplete'} (3 or more is positive)</p>
                </div>
              </>
            )}
            {armB && <Checkbox label="Low mood or anxiety described" checked={screens.moodAnxietySymptom} onChange={(v) => setScreens({ ...screens, moodAnxietySymptom: v })} />}
            <Checkbox label="Anxiety or low mood that the patient says drives the sleep problem" checked={screens.moodDrivesSleep} onChange={(v) => setScreens({ ...screens, moodDrivesSleep: v })} />
            {(armA || screens.moodAnxietySymptom) && (
              <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <Checkbox label="Asked directly about thoughts of self-harm or suicide (whatever the score)" checked={screens.selfHarmAsked} onChange={(v) => setScreens({ ...screens, selfHarmAsked: v })} required />
                <YesNoSelect label="Any thoughts of self-harm or suicide?" value={screens.selfHarmThoughts} onChange={(v) => setScreens({ ...screens, selfHarmThoughts: v, immediateRisk: v === 'yes' ? screens.immediateRisk : false })} />
                {screens.selfHarmThoughts === 'yes' && <Checkbox label="Immediate risk (999; do not leave the person alone)" checked={screens.immediateRisk} onChange={(v) => setScreens({ ...screens, immediateRisk: v })} />}
              </div>
            )}
            {armA ? (
              <>
                <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">STOP-Bang (sleep apnoea): one point each</p>
                  <Checkbox label="Snoring loudly" checked={screens.sbSnoring} onChange={(v) => setScreens({ ...screens, sbSnoring: v })} />
                  <Checkbox label="Tired, fatigued or sleepy in the daytime" checked={screens.sbTired} onChange={(v) => setScreens({ ...screens, sbTired: v })} />
                  <Checkbox label="Observed to stop breathing, choke or gasp in sleep (positive at any score)" checked={screens.sbObserved} onChange={(v) => setScreens({ ...screens, sbObserved: v })} />
                  <Checkbox label="High blood pressure, treated or not" checked={screens.sbPressure} onChange={(v) => setScreens({ ...screens, sbPressure: v })} />
                  <Checkbox label="BMI over 35" checked={screens.sbBmi35} onChange={(v) => setScreens({ ...screens, sbBmi35: v })} />
                  <Checkbox label="Neck circumference over 40 cm" checked={screens.sbNeck40} onChange={(v) => setScreens({ ...screens, sbNeck40: v })} />
                  <p className="text-xs text-gray-700">Age over 50: {patient.age !== null && patient.age > 50 ? 'yes' : 'no'}; gender male: {isMan ? 'yes' : 'no'} (from the patient details). STOP-Bang total: {sb} of 8 (5 or more is positive)</p>
                </div>
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-navy-900">Epworth Sleepiness Scale (daytime sleepiness)</p>
                  <p className="text-xs text-amber-800">{EPWORTH_LICENSING_NOTE}</p>
                  <Checkbox label="The patient completed the Epworth Sleepiness Scale on the pharmacy's licensed form" checked={screens.epworthOnLicensedForm} onChange={(v) => setScreens({ ...screens, epworthOnLicensedForm: v })} required={supply1} />
                  <NumberInput
                    label={`Epworth total (0 to 24): above 10 is excessive daytime sleepiness${!supply1 ? ' (optional at a review)' : ''}`}
                    value={screens.epworth}
                    onChange={(v) => setScreens({ ...screens, epworth: v })}
                    min={0}
                    max={24}
                    required={supply1}
                  />
                  <p className="text-xs text-gray-700">Epworth total: {ep ?? 'not recorded'} of 24</p>
                </div>
              </>
            ) : (
              <>
                <Checkbox label="Snoring with daytime sleepiness" checked={screens.apnoeaSymptom} onChange={(v) => setScreens({ ...screens, apnoeaSymptom: v })} />
                <Checkbox label="Witnessed pauses in breathing, choking or gasping in sleep" checked={screens.sbObserved} onChange={(v) => setScreens({ ...screens, sbObserved: v })} />
              </>
            )}
            <div className="space-y-1 rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-navy-900">Other red flags</p>
              <Checkbox label="Palpitations, tremor, heat intolerance, sweating, or weight loss without trying (possible overactive thyroid)" checked={screens.thyroid} onChange={(v) => setScreens({ ...screens, thyroid: v })} />
              <Checkbox label="Night sweats or hot flushes that wake the patient (menopausal symptoms)" checked={screens.menopausal} onChange={(v) => setScreens({ ...screens, menopausal: v })} />
              <Checkbox label="Restless legs (an urge to move the legs at night relieved by movement)" checked={screens.restlessLegs} onChange={(v) => setScreens({ ...screens, restlessLegs: v })} />
              <Checkbox label="Pain that prevents sleep or wakes the patient" checked={screens.pain} onChange={(v) => setScreens({ ...screens, pain: v })} />
              <Checkbox label="Waking repeatedly to pass urine" checked={screens.nocturia} onChange={(v) => setScreens({ ...screens, nocturia: v })} />
              <Checkbox label="Breathlessness when lying flat" checked={screens.orthopnoea} onChange={(v) => setScreens({ ...screens, orthopnoea: v })} />
              <Checkbox label="A new neurological symptom" checked={screens.newNeuro} onChange={(v) => setScreens({ ...screens, newNeuro: v })} />
              <Checkbox label="Current use of recreational drugs" checked={screens.recreationalDrugs} onChange={(v) => setScreens({ ...screens, recreationalDrugs: v })} />
              <Checkbox label="Insomnia during withdrawal from cannabis, alcohol or another substance" checked={screens.withdrawal} onChange={(v) => setScreens({ ...screens, withdrawal: v })} />
              <Checkbox label="Alcohol used to get to sleep" checked={screens.alcoholToSleep} onChange={(v) => setScreens({ ...screens, alcoholToSleep: v })} />
              <Checkbox label="A harmful drinking pattern" checked={screens.harmfulDrinking} onChange={(v) => setScreens({ ...screens, harmfulDrinking: v })} />
              <Checkbox label="Falling asleep suddenly in the day, collapse with emotion (cataplexy), acting out dreams, or sleepwalking with injury" checked={screens.narcolepsyParasomnia} onChange={(v) => setScreens({ ...screens, narcolepsyParasomnia: v })} />
              <Checkbox label="New confusion or memory problems, or a diagnosis of dementia" checked={screens.cognition} onChange={(v) => setScreens({ ...screens, cognition: v })} />
              <Checkbox label="Any concern of abuse, neglect, coercion or exploitation (including someone asking for melatonin to sedate another adult)" checked={screens.safeguardingConcern} onChange={(v) => setScreens({ ...screens, safeguardingConcern: v })} />
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-navy-900">Falls: one definition for the whole PGD</p>
              <YesNoSelect label="Any fall in the last 12 months (including any fall with injury)?" value={screens.fallLast12Months} onChange={(v) => setScreens({ ...screens, fallLast12Months: v, fallWithInjury: v === 'yes' ? screens.fallWithInjury : false })} />
              {screens.fallLast12Months === 'yes' && <Checkbox label="With injury" checked={screens.fallWithInjury} onChange={(v) => setScreens({ ...screens, fallWithInjury: v })} />}
            </div>
            <Checkbox label="Every red flag on this step was asked about" checked={screens.redFlagsAsked} onChange={(v) => setScreens({ ...screens, redFlagsAsked: v })} required />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 5: Medical history */}
      {currentStep === STEP.medical && (
        <StepWrapper {...stepProps(STEP.medical, 'Exclusions and cautions from the SmPCs; pregnancy and contraception')}>
          <div className="space-y-2">
            <Checkbox label="Hypersensitivity to melatonin or to any excipient of the product to be supplied" checked={medical.hypersensitivity} onChange={(v) => setMedical({ ...medical, hypersensitivity: v })} />
            <Checkbox label="Hepatic impairment of any degree, cirrhosis or chronic liver disease" checked={medical.hepatic} onChange={(v) => setMedical({ ...medical, hepatic: v })} />
            <Checkbox label="Severe renal impairment (known eGFR below 30 ml/min/1.73m2) or dialysis" checked={medical.renalSevere} onChange={(v) => setMedical({ ...medical, renalSevere: v })} />
            <Checkbox label="Known renal impairment short of severe" checked={medical.renalLesser} onChange={(v) => setMedical({ ...medical, renalLesser: v, renalMildStable: v ? medical.renalMildStable : '' })} />
            {medical.renalLesser && !medical.renalSevere && !(armB && tech) && <YesNoSelect label="Pharmacist satisfied it is mild and stable?" value={medical.renalMildStable} onChange={(v) => setMedical({ ...medical, renalMildStable: v })} />}
            <Checkbox label="Autoimmune disease, active or quiescent (for example rheumatoid arthritis, SLE, multiple sclerosis, inflammatory bowel disease, psoriasis or psoriatic arthritis, type 1 diabetes, coeliac disease, autoimmune thyroid disease)" checked={medical.autoimmune} onChange={(v) => setMedical({ ...medical, autoimmune: v })} />
            <Checkbox label="Epilepsy or any history of seizures" checked={medical.epilepsy} onChange={(v) => setMedical({ ...medical, epilepsy: v })} />
            <Checkbox label="Diabetes or impaired glucose tolerance" checked={medical.diabetes} onChange={(v) => setMedical({ ...medical, diabetes: v })} />
            {armB && <Checkbox label="Rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption" checked={medical.lactoseIntolerance} onChange={(v) => setMedical({ ...medical, lactoseIntolerance: v })} description="The Colonis tablet contains lactose; Adaflex contains none" />}
            {isWoman && (
              <div className="mt-3 space-y-3 rounded-lg border border-gray-200 p-4">
                <YesNoSelect label="Of childbearing potential?" value={medical.childbearingPotential} onChange={(v) => setMedical({ ...medical, childbearingPotential: v })} />
                <YesNoSelect label="Pregnant or possibly pregnant?" value={medical.pregnant} onChange={(v) => setMedical({ ...medical, pregnant: v })} />
                <Checkbox label="Breastfeeding" checked={medical.breastfeeding} onChange={(v) => setMedical({ ...medical, breastfeeding: v })} />
                <Checkbox label="Planning a pregnancy" checked={medical.planningPregnancy} onChange={(v) => setMedical({ ...medical, planningPregnancy: v })} />
                {medical.childbearingPotential === 'yes' && (
                  <>
                    <YesNoSelect label="Using contraception?" value={medical.usingContraception} onChange={(v) => setMedical({ ...medical, usingContraception: v })} />
                    {medical.usingContraception === 'yes' && <TextInput label="Contraceptive method" value={medical.contraceptiveMethod} onChange={(v) => setMedical({ ...medical, contraceptiveMethod: v })} required placeholder="Record the method (combined hormonal methods contain an oestrogen: 3 mg maximum)" />}
                  </>
                )}
              </div>
            )}
            {isMan && armB && <YesNoSelect label="Are he and his partner planning a pregnancy? (asked where the Colonis tablet may be supplied)" value={medical.manPlanningPregnancy} onChange={(v) => setMedical({ ...medical, manPlanningPregnancy: v })} required={false} />}
            <div className="pt-2">
              <Checkbox label="Every question on this step was asked" checked={medical.questionsAsked} onChange={(v) => setMedical({ ...medical, questionsAsked: v })} required />
            </div>
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 6: Medicines and occupation */}
      {currentStep === STEP.medicines && (
        <StepWrapper {...stepProps(STEP.medicines, 'The full medicine list, including decongestants, oestrogens and any melatonin from any source; occupation')}>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-navy-900">Exclusions</p>
              <Checkbox label="Fluvoxamine" checked={medicines.fluvoxamine} onChange={(v) => setMedicines({ ...medicines, fluvoxamine: v })} />
              <Checkbox label="Any benzodiazepine, z-drug (zopiclone, zolpidem, zaleplon), daridorexant or other prescribed hypnotic" checked={medicines.hypnotic} onChange={(v) => setMedicines({ ...medicines, hypnotic: v })} />
              <Checkbox label="Warfarin or another vitamin K antagonist" checked={medicines.vka} onChange={(v) => setMedicines({ ...medicines, vka: v })} />
              <Checkbox label="5-methoxypsoralen or 8-methoxypsoralen" checked={medicines.psoralen} onChange={(v) => setMedicines({ ...medicines, psoralen: v })} />
            </div>
            <YesNoSelect label="Already prescribed melatonin by a doctor or other prescriber, for any reason?" value={medicines.prescribedMelatonin} onChange={(v) => setMedicines({ ...medicines, prescribedMelatonin: v })} yes="Yes (refer back to the prescriber)" />
            <YesNoSelect label="Taking melatonin from any other source (bought abroad, online, or sold as a supplement)?" value={medicines.otherSourceMelatonin} onChange={(v) => setMedicines({ ...medicines, otherSourceMelatonin: v })} />
            {medicines.otherSourceMelatonin === 'yes' && (
              <>
                <p className="text-xs text-amber-800">{UNLICENSED_WARNING}</p>
                <YesNoSelect label="Willing to stop it?" value={medicines.otherMelatoninWillingStop} onChange={(v) => setMedicines({ ...medicines, otherMelatoninWillingStop: v })} />
                {medicines.otherMelatoninWillingStop === 'yes' && <TextInput label="The product the patient agrees to stop" value={medicines.otherMelatoninProduct} onChange={(v) => setMedicines({ ...medicines, otherMelatoninProduct: v })} required />}
              </>
            )}
            <YesNoSelect label="Asked of every patient: any medicine containing an oestrogen (combined hormonal contraception as a pill, patch or ring, or HRT in any form, including gels, patches, sprays and vaginal oestrogen)?" value={medicines.oestrogen} onChange={(v) => setMedicines({ ...medicines, oestrogen: v })} yes="Yes (3 mg maximum; never 5 mg)" />
            {listOestrogen.length > 0 && medicines.oestrogen !== 'yes' && <p className="text-xs font-semibold text-red-700">The medicine list names an oestrogen-containing product ({listOestrogen.join(', ')}): the answer must be yes (3 mg maximum).</p>}
            {medicines.oestrogen === 'yes' && <TextInput label="Which" value={medicines.oestrogenDetail} onChange={(v) => setMedicines({ ...medicines, oestrogenDetail: v })} required />}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-navy-900">Medicines that raise melatonin levels</p>
              <Checkbox label="Cimetidine" checked={medicines.cimetidine} onChange={(v) => setMedicines({ ...medicines, cimetidine: v })} />
              <Checkbox label="Ciprofloxacin" checked={medicines.ciprofloxacin} onChange={(v) => setMedicines({ ...medicines, ciprofloxacin: v })} />
              <Checkbox label="Norfloxacin" checked={medicines.norfloxacin} onChange={(v) => setMedicines({ ...medicines, norfloxacin: v })} />
              <Checkbox label="Verapamil" checked={medicines.verapamil} onChange={(v) => setMedicines({ ...medicines, verapamil: v })} />
              <Checkbox label="Another sedating medicine (an opioid, a gabapentinoid, a sedating antihistamine, a tricyclic antidepressant, an antipsychotic, or any other medicine that causes drowsiness)" checked={medicines.sedating} onChange={(v) => setMedicines({ ...medicines, sedating: v })} />
              {medicines.sedating && <TextInput label="Which sedating medicine" value={medicines.sedatingDetail} onChange={(v) => setMedicines({ ...medicines, sedatingDetail: v })} required />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-navy-900">Medicines that lower melatonin levels (not an exclusion)</p>
              <Checkbox label="Carbamazepine" checked={medicines.carbamazepine} onChange={(v) => setMedicines({ ...medicines, carbamazepine: v })} />
              <Checkbox label="Phenytoin" checked={medicines.phenytoin} onChange={(v) => setMedicines({ ...medicines, phenytoin: v })} />
              <Checkbox label="Rifampicin" checked={medicines.rifampicin} onChange={(v) => setMedicines({ ...medicines, rifampicin: v })} />
              <Checkbox label="Omeprazole" checked={medicines.omeprazole} onChange={(v) => setMedicines({ ...medicines, omeprazole: v })} />
              <Checkbox label="Smokes (smoking halves exposure; starting or stopping smoking changes the effect)" checked={medicines.smoker} onChange={(v) => setMedicines({ ...medicines, smoker: v })} />
            </div>
            <Checkbox label="Nifedipine or another calcium channel blocker" checked={medicines.ccb} onChange={(v) => setMedicines({ ...medicines, ccb: v })} />
            {armA && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-navy-900">A medicine that could be causing the insomnia (exclusion, arm A)</p>
                <Checkbox label="A decongestant (pseudoephedrine, phenylephrine)" checked={medicines.decongestant} onChange={(v) => setMedicines({ ...medicines, decongestant: v })} />
                <Checkbox label="A corticosteroid" checked={medicines.corticosteroid} onChange={(v) => setMedicines({ ...medicines, corticosteroid: v })} />
                <Checkbox label="A beta-agonist" checked={medicines.betaAgonist} onChange={(v) => setMedicines({ ...medicines, betaAgonist: v })} />
                <Checkbox label="An SSRI or SNRI started or changed before the insomnia began" checked={medicines.ssriSnriChanged} onChange={(v) => setMedicines({ ...medicines, ssriSnriChanged: v })} />
                <Checkbox label="A stimulant" checked={medicines.stimulant} onChange={(v) => setMedicines({ ...medicines, stimulant: v })} />
                <Checkbox label="Levothyroxine recently started or increased" checked={medicines.levothyroxineRecent} onChange={(v) => setMedicines({ ...medicines, levothyroxineRecent: v })} />
                <Checkbox label="A diuretic taken in the evening" checked={medicines.eveningDiuretic} onChange={(v) => setMedicines({ ...medicines, eveningDiuretic: v })} />
              </div>
            )}
            <TextArea label="Full medicine list (prescribed, over the counter, supplements)" value={medicines.fullMedicineList} onChange={(v) => setMedicines({ ...medicines, fullMedicineList: v })} rows={2} required placeholder='Write "none" if none' />
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-navy-900">Occupation: {patient.occupation || 'not recorded'}</p>
              {armA && (
                <YesNoSelect
                  label="Professional driver or safety-critical worker (drives for a living, pilot or aircrew, train driver, air traffic controller, operator of dangerous machinery, works at height, or any role where next-day drowsiness is a safety risk)?"
                  value={medicines.safetyCriticalWork}
                  onChange={(v) => setMedicines({ ...medicines, safetyCriticalWork: v })}
                />
              )}
              <Checkbox label="Must be alert at night (for example a carer, or a parent of an infant)" checked={medicines.alertAtNight} onChange={(v) => setMedicines({ ...medicines, alertAtNight: v })} />
              {medicines.alertAtNight && <TextInput label="Specific advice given" value={medicines.alertAtNightAdvice} onChange={(v) => setMedicines({ ...medicines, alertAtNightAdvice: v })} required />}
            </div>
            <Checkbox label="Every question on this step was asked" checked={medicines.questionsAsked} onChange={(v) => setMedicines({ ...medicines, questionsAsked: v })} required />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 7: Dose and supply */}
      {currentStep === STEP.supply && (
        <StepWrapper {...stepProps(STEP.supply, 'The dose the rules allow, the product, batch, expiry, label and pack')}>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              THE CEILING: one dose of melatonin a night, never more than 5 mg in 24 hours, counting every melatonin product from any source. 3 mg is the maximum at 65 or over and with any oestrogen. Only Adaflex 5 mg tablets are supplied at 5 mg. One product and strength per supply.
              {capReasons.length > 0 && <span className="font-semibold"> 3 MG MAXIMUM applies: {capReasons.join('; ')}.</span>}
            </div>
            {armA && doseDecision && <p className="rounded bg-blue-50 p-2 text-xs text-blue-900">{doseDecision.text}</p>}
            <SelectInput
              label="Dose"
              value={supply.dose}
              onChange={(v) => {
                const prods = productsForDose(v as Dose, arm).filter((p) => !(p === 'colonis-3' && medical.lactoseIntolerance));
                setSupply({ ...supply, dose: v as Dose, product: prods.length === 1 ? prods[0] : '' });
              }}
              options={doseOptions.map((d) => ({ value: d, label: d === '3' ? '3 mg once nightly' : '5 mg once nightly (Adaflex 5 mg)' }))}
              required
            />
            <SelectInput
              label="Product"
              value={supply.product}
              onChange={(v) => setSupply({ ...supply, product: v as ProductKey })}
              options={productOptions.map((p) => ({ value: p, label: `${PRODUCTS[p].name}, ${PRODUCTS[p].plNumber}${PRODUCTS[p].lactose ? ' (contains lactose)' : ', lactose free'}` }))}
              required
            />
            {isMan && supply.product === 'colonis-3' && !medical.manPlanningPregnancy && (
              <YesNoSelect label="Are he and his partner planning a pregnancy?" value={medical.manPlanningPregnancy} onChange={(v) => setMedical({ ...medical, manPlanningPregnancy: v })} />
            )}
            <div className="space-y-1 rounded-lg border-2 border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 p-4 text-sm">
              <p className="font-semibold text-navy-900">Supply today</p>
              <p>Product: {product ? `${product.name}, ${product.plNumber}` : 'not chosen'}</p>
              <p>Quantity: {tablets ?? '?'} tablets{armA ? ' (30 nights)' : indication.covers === 'both' ? ' (two journeys, 5 nights each)' : ' (one journey, up to 5 nights)'}</p>
              {armA && history.supplyNumber && (
                <>
                  <p>Supply {history.supplyNumber} of 3; {Number(history.supplyNumber) * 30} tablets in the course including today; the last tablet of the course no later than {courseLimit ? formatUkDate(courseLimit) : '?'} (day 103 after supply 1).</p>
                  {history.supplyNumber !== '3' ? (
                    <p>Next review window: {formatUkDate(reviewWin.start)} to {formatUkDate(reviewWin.end)} (day 21 to day 30), accepted up to {formatUkDate(reviewWin.acceptedUntil)} (day 37).</p>
                  ) : (
                    <p>This is the last supply of the course. END OF COURSE after supply 3: the GP is informed. No further melatonin under this PGD for 6 months; after two courses in total, none until a GP review is documented.</p>
                  )}
                </>
              )}
              {armB && <p>Arm B supplies in 12 months including today: {history.armBSuppliesLast12Months !== null ? history.armBSuppliesLast12Months + 1 : '?'} of 4.</p>}
              {product && <p className="text-xs text-gray-600">{product.storage}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Batch number" value={supply.batchNumber} onChange={(v) => setSupply({ ...supply, batchNumber: v })} required />
              <DateField label="Expiry date" value={supply.expiryDate} onChange={(v) => setSupply({ ...supply, expiryDate: v })} required />
            </div>
            <SelectInput
              label="Pack"
              value={supply.packType}
              onChange={(v) => setSupply({ ...supply, packType: v as MelSupply['packType'] })}
              options={[
                ...(armA ? [{ value: 'full-pack', label: 'Original pack of 30 with its leaflet' }] : []),
                { value: 'part-pack', label: armA ? 'Part pack: 30 tablets from the 100-tablet pack, with a copy of the leaflet (Appendix 5)' : 'Part pack in a suitably labelled container, with a copy of the leaflet (Appendix 5)' },
              ]}
              required
            />
            <Checkbox label="Labelled as a dispensed medicine with the wording below and BNF cautionary label 2" checked={supply.labelled} onChange={(v) => setSupply({ ...supply, labelled: v })} description={armA ? ARM_A_LABEL_WORDING : ARM_B_LABEL_WORDING} required />
            <Checkbox label="Patient information leaflet supplied (a copy with a part pack)" checked={supply.pilSupplied} onChange={(v) => setSupply({ ...supply, pilSupplied: v })} required />
            {armA && history.supplyNumber !== '3' && <Checkbox label="Review window booked or written down for the patient (in person, by a pharmacist)" checked={supply.reviewBooked} onChange={(v) => setSupply({ ...supply, reviewBooked: v })} required />}
            {cautions.length > 0 && (
              <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Cautions: acknowledge each one (the advice is given and recorded)</p>
                {cautions.map((a) => (
                  <Checkbox
                    key={a.code}
                    label={a.message}
                    description={a.detail}
                    checked={supply.acknowledgedCautions.includes(a.code)}
                    onChange={(v) => setSupply({ ...supply, acknowledgedCautions: v ? [...supply.acknowledgedCautions, a.code] : supply.acknowledgedCautions.filter((c) => c !== a.code) })}
                    required
                  />
                ))}
              </div>
            )}
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 8: Counselling */}
      {currentStep === STEP.counselling && (
        <StepWrapper {...stepProps(STEP.counselling, armA ? 'Every point, every supply; sleep hygiene and CBT-I whether or not anything is supplied' : 'Timing, food, alcohol, caffeine, driving and destination import rules')}>
          <div className="space-y-2">
            {counsellingItems(arm, counselling, counsellingOpts).map(([key, label, value]) => (
              <Checkbox key={key} label={label} checked={value} onChange={(v) => setCounselling({ ...counselling, [key]: v })} required />
            ))}
            <div className="pt-2">
              <Checkbox label="Adverse reaction reported or observed" checked={counselling.adverseReaction} onChange={(v) => setCounselling({ ...counselling, adverseReaction: v, ...(v ? {} : { adverseReactionDetails: '' }) })} description={armA ? 'Because this is off-label use, report every suspected adverse reaction via yellowcard.mhra.gov.uk and inform the GP' : 'Report suspected adverse reactions via yellowcard.mhra.gov.uk'} />
              {counselling.adverseReaction && <TextArea label="Adverse reaction and action taken" value={counselling.adverseReactionDetails} onChange={(v) => setCounselling({ ...counselling, adverseReactionDetails: v })} rows={2} required />}
            </div>
            <Checkbox label="All counselling completed and documented" checked={counselling.allCounsellingComplete} onChange={(v) => setCounselling({ ...counselling, allCounsellingComplete: v })} required />
          </div>
          {declineBlock}
        </StepWrapper>
      )}

      {/* Step 9: Summary */}
      {currentStep === STEP.summary && (
        <StepWrapper {...stepProps(STEP.summary, 'Declaration, GP notification and the consultation record')}>
          <div className="space-y-4 print:hidden">
            <Checkbox
              label={
                tech
                  ? 'I am a pharmacy technician registered and practising with the GPhC, named and authorised under this PGD (arm B), and I have completed the training for it'
                  : 'I am a pharmacist registered and practising with the GPhC, named and authorised under this PGD, and I have completed the training for it'
              }
              checked={summary.declarationConfirmed}
              onChange={(v) => setSummary({ ...summary, declarationConfirmed: v })}
              required
            />
            {!roleVerified && <p className="text-xs text-amber-800">Your practitioner role could not be verified from your clinician record; the record relies on this declaration.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={tech ? 'Name of the pharmacy technician' : 'Name of the pharmacist'} value={summary.pharmacistName} onChange={(v) => setSummary({ ...summary, pharmacistName: v })} required />
              <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary({ ...summary, pharmacistGPhC: v })} required />
              <TextInput label="Pharmacy name" value={summary.pharmacyName} onChange={(v) => setSummary({ ...summary, pharmacyName: v })} />
              <TextInput label="Pharmacy address" value={summary.pharmacyAddress} onChange={(v) => setSummary({ ...summary, pharmacyAddress: v })} />
            </div>
            {armA && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-navy-900">GP notification (within 7 days of supply 1, and at the end of the course)</p>
                <pre className="whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 font-sans text-xs text-gray-800">{gpText}</pre>
                <TextInput label="How the GP is informed" value={summary.gpNotificationMethod} onChange={(v) => setSummary({ ...summary, gpNotificationMethod: v })} placeholder="e.g. secure email to the practice today; letter posted" required />
                {supply1 && (
                  <>
                    <YesNoSelect label="Has the GP letter been sent? (it must be sent within 7 days of supply 1)" value={summary.gpLetterSent} onChange={(v) => setSummary({ ...summary, gpLetterSent: v, gpLetterSentDate: v === 'yes' ? summary.gpLetterSentDate : '' })} no="No, not yet (record it when sent; within 7 days)" />
                    {summary.gpLetterSent === 'yes' && <DateField label="Date the GP letter was sent" value={summary.gpLetterSentDate} onChange={(v) => setSummary({ ...summary, gpLetterSentDate: v })} required />}
                  </>
                )}
                {course.ended && (
                  <Checkbox label={`END OF COURSE (${course.reason}): the GP is informed of the end of the course`} checked={summary.endOfCourseGpInformed} onChange={(v) => setSummary({ ...summary, endOfCourseGpInformed: v })} required />
                )}
              </div>
            )}
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary({ ...summary, clinicalNotes: v })} rows={3} />
          </div>
          <div className="mt-6">
            <MelatoninSummaryReport
              patient={patient}
              consent={consent}
              history={history}
              indication={indication}
              screens={screens}
              medical={medical}
              medicines={medicines}
              supply={supply}
              counselling={counselling}
              summary={effectiveSummary}
              alerts={alerts}
              isBlocked={isBlocked}
              gpText={gpText}
            />
          </div>
        </StepWrapper>
      )}
    </>
  );
}

export default MelatoninClient;
