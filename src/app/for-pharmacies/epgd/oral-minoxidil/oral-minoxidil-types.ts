import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

/** Pattern Hair Loss (Low-Dose Oral Minoxidil) PGD, version 001, issued 28 September 2026. */
export const ORAL_MINOXIDIL_PGD_VERSION = 'PGD version 001, issued 28 September 2026';
export const ORAL_MINOXIDIL_PGD_NAME = 'Pattern Hair Loss (Low-Dose Oral Minoxidil)';

/** The words the document requires on every record ("Records to be kept"). */
export const OFF_LABEL_RECORD_WORDS =
  'off-label supply under Get Real Health PGD Pattern Hair Loss (Low-Dose Oral Minoxidil), version 001';

/** The only product supplied under this PGD ("The medicine"). */
export const PRODUCT = {
  name: 'Minoxidil 2.5 mg tablets (Loniten, Pfizer Limited)',
  shortName: 'Loniten 2.5 mg tablets',
  plNumber: 'PL 00057/1006',
  description:
    'Round white to light tan biconvex tablets, scored, which can be divided into equal halves. Blister packs of 60 and bottles of 100. The 5 mg and 10 mg tablets are NOT used under this PGD.',
  storage: 'Store below 25 C in the original package to protect from moisture. Bottles tightly closed.',
} as const;

/** The stop-and-seek-help wording to be added to the label ("Labelling"). */
export const LABEL_STOP_WORDING =
  'Stop and seek medical help the same day for chest pain, breathlessness, palpitations, fainting or swelling of the face; stop and contact the pharmacy or GP within a week for ankle swelling, dizziness or a weight gain of 2 kg or more.';

/** The off-label consent script, verbatim from the document ("Counselling"). */
export const OFF_LABEL_CONSENT_SCRIPT =
  'Minoxidil tablets are licensed in the UK to treat severe high blood pressure, at higher doses than this and alongside other heart medicines. Using a low dose on its own for hair loss is not covered by the licence and no UK guideline recommends it yet. Skin specialists use it this way; an international expert group published guidance on it in 2024, and a study of 1,400 patients found it generally well tolerated, with extra body hair the commonest side effect. Because it lowers blood pressure, we check your blood pressure, pulse and weight at every visit, there are heart symptoms you must stop for, and after six supplies (about eleven months) a doctor must review you before we can continue. The licensed alternatives are minoxidil lotion or foam on the scalp and, for men, finasteride tablets. Are you happy to go ahead on that basis?';

/** The consent statement the patient signs, verbatim from Appendix 3, printed above the signature line on the record. */
export const PATIENT_CONSENT_STATEMENT =
  'I have been told that minoxidil tablets are licensed in the UK for severe high blood pressure and not for hair loss, that this supply is off-label, why it is being used, what the alternatives are, that my blood pressure, pulse and weight will be checked at every supply, the symptoms for which I must stop and seek help, that extra body or facial hair is the commonest side effect, that a doctor must review me after six supplies, and (women) that I must not become pregnant while taking it. I consent to treatment on that basis and to my GP being informed.';

/** The stop-and-seek-help advice, in the patient's words ("Counselling"). */
export const STOP_AND_SEEK_HELP_ADVICE =
  'STOP THE TABLETS AND SEEK MEDICAL HELP THE SAME DAY for chest pain, breathlessness, a racing or irregular heartbeat, fainting, or swelling of the face. STOP AND CONTACT US OR YOUR GP WITHIN A WEEK for swollen ankles, dizziness or faintness, or if you put on 2 kg or more. If you stop for any of these, a doctor must see you before we can supply again.';

/** The definition of the baseline systolic used for the 10 mmHg rule ("The numbers", "Dose and frequency"). */
export const BASELINE_SYSTOLIC_DEFINITION =
  'the lower seated systolic recorded at the first supply, or at the most recent restart';

/** Every supply is 8 weeks (56 days). */
export const SUPPLY_DAYS = 56;
/** Maximum supplies between prescriber reviews, counted by supply number and not reset by a gap or restart. */
export const MAX_SUPPLIES = 6;
/** A gap of more than 4 weeks without tablets is a restart. */
export const RESTART_GAP_DAYS = 28;
/** A gap caused only by waiting for the prescriber review after supply 6 is not a restart provided the patient has been off tablets for no more than 8 weeks. */
export const AWAITING_REVIEW_MAX_GAP_DAYS = 56;
/** The dose increase is permitted at or after the fourth supply visit; the same rule applies to resuming the higher dose after a restart, counted from the restart. */
export const DOSE_INCREASE_MIN_SUPPLY_NUMBER = 4;
/** Full reviews with repeat photographs and a response assessment at supply visits 4 and 6. */
export const REPEAT_PHOTO_SUPPLY_NUMBERS: ReadonlySet<number> = new Set([4, 6]);
/** The prescriber review is sought at supply visit 6 so that it is complete before a seventh supply. */
export const PRESCRIBER_REVIEW_SOUGHT_SUPPLY_NUMBER = 6;
/** Shedding in the first 12 weeks of treatment is expected; heavy shedding persisting beyond 12 weeks at a review is a stop. */
export const SHEDDING_SETTLES_BY_WEEKS = 12;

// ─── Dose ───

export type Dose = '' | '1.25' | '2.5' | '5';

export const DOSE_INFO: Record<Exclude<Dose, ''>, { label: string; tablets: number; labelWords: string; tabletsPerDay: string }> = {
  '1.25': { label: '1.25 mg once daily (half a 2.5 mg tablet)', tablets: 28, labelWords: 'HALF a tablet once a day', tabletsPerDay: 'half a tablet' },
  '2.5': { label: '2.5 mg once daily (one tablet)', tablets: 56, labelWords: 'ONE tablet once a day', tabletsPerDay: 'one tablet' },
  '5': { label: '5 mg once daily (two tablets)', tablets: 112, labelWords: 'TWO tablets once a day', tabletsPerDay: 'two tablets' },
};

export type Sex = '' | 'male' | 'female';

// ─── Patient ───

export interface OMPatientDetails extends BasePatientDetails {
  sex: Sex;
  /** The patient is registered with a GP (a condition of supply). */
  gpRegistered: '' | 'yes' | 'no';
  /** The patient agrees to the GP being informed of the supply, any dose change and any stop, within 7 days. */
  gpNotificationAgreed: '' | 'yes' | 'no';
}

// ─── Consent ───

export interface OMConsent extends BaseConsent {
  understandsCost: boolean;
  /** The off-label consent script was given in substance. */
  offLabelScriptGiven: boolean;
  /** The patient accepts off-label treatment after the explanation. "no" is an exclusion. */
  acceptsOffLabel: '' | 'yes' | 'no';
  /** The patient signed the consent statement on the consultation record. */
  consentStatementSigned: boolean;
  /** Told what the licence is for, why it is being used, and the alternatives. */
  toldLicenceAndAlternatives: boolean;
  /** The patient lacks capacity to consent (exclusion). */
  lacksCapacity: boolean;
  /** The patient declines treatment after counselling. */
  patientDeclined: boolean;
  /** Face to face on the premises (remote or telephone consultation is outside this PGD). */
  faceToFace: boolean;
}

// ─── Supply type and treatment history ───

export type SupplyType = '' | 'first' | 'continuation' | 'restart';

export const SUPPLY_TYPE_LABEL: Record<Exclude<SupplyType, ''>, string> = {
  first: 'First supply',
  continuation: 'Continuation (no gap of more than 4 weeks without tablets, or no more than 8 weeks while awaiting the prescriber review after supply 6)',
  restart: 'Restart after a gap of more than 4 weeks without tablets (starting dose again, new baseline blood pressure; the count is not reset)',
};

/** How the routine six-supply prescriber review was held: face to face or video are both acceptable. */
export type PrescriberReviewType = '' | 'gp' | 'grh-face-to-face' | 'grh-video';

export const PRESCRIBER_REVIEW_TYPE_LABEL: Record<Exclude<PrescriberReviewType, ''>, string> = {
  gp: "The patient's GP",
  'grh-face-to-face': 'Get Real Health prescriber, face to face',
  'grh-video': 'Get Real Health prescriber, by video consultation',
};

/** How the review before a restart after a cardiovascular stop was held: it must be face to face. */
export type CvStopReviewType = '' | 'gp-face-to-face' | 'grh-face-to-face' | 'video' | 'other-remote';

export const CV_STOP_REVIEW_TYPE_LABEL: Record<Exclude<CvStopReviewType, ''>, string> = {
  'gp-face-to-face': "The patient's GP, face to face",
  'grh-face-to-face': 'Get Real Health prescriber, in person',
  video: 'Video consultation (NOT acceptable after a cardiovascular stop)',
  'other-remote': 'Telephone or other remote review (NOT acceptable after a cardiovascular stop)',
};

export const FACE_TO_FACE_CV_REVIEW_TYPES: ReadonlySet<CvStopReviewType> = new Set<CvStopReviewType>(['gp-face-to-face', 'grh-face-to-face']);

/** Fields of the course history that can be carried forward from the patient's previous oral minoxidil record at this pharmacy. */
export type PrefillableField =
  | 'firstSupplyDate'
  | 'suppliesSoFar'
  | 'prescriberReviewHeld'
  | 'suppliesSinceReview'
  | 'currentDose'
  | 'doseIncreasedBefore'
  | 'restartedBefore'
  | 'suppliesSinceRestart'
  | 'baselineSystolic'
  | 'previousWeightKg'
  | 'previousCvStop'
  | 'previousNonCvStop'
  | 'nonCvStopRetriedBefore'
  | 'returnVisitUsedBefore';

/**
 * What was carried forward from the previous record. Prefilled fields are
 * shown read-only; the pharmacist may override one, but only with a reason,
 * and the record stores the prefilled value, the override and the reason.
 */
export interface OMPrefill {
  /** The consultation record the values came from. */
  recordId: string;
  consultationDate: string;
  /** Whether that record was a supply under the PGD, and what it supplied. */
  previousSupplied: boolean;
  previousSupplyType: SupplyType;
  previousSupplyNumber: number | null;
  previousDoseLabel: string | null;
  /** The date the previous 8 week supply is expected to run out (56 days from that supply), where it was supplied. */
  expectedRunOutDate: string | null;
  /** The previous record was a cardiovascular stop. */
  previousWasCvStop: boolean;
  /** The fields prefilled, with the value each was set to. */
  fields: PrefillableField[];
  values: Partial<Record<PrefillableField, string | number | boolean | null>>;
  /** Field to reason: a field the pharmacist has unlocked and may change. The reason is required. */
  overrides: Partial<Record<PrefillableField, string>>;
}

export interface OMSupplyHistory {
  supplyType: SupplyType;
  /** Continuation or restart: the date of the first supply under this PGD. */
  firstSupplyDate: string;
  /** Supplies so far under this PGD, counted by supply number from the first supply and not reset by a gap or restart. */
  suppliesSoFar: number | null;
  /** A documented prescriber review has been held since the first supply, with written confirmation that treatment may continue. */
  prescriberReviewHeld: boolean;
  prescriberReviewDate: string;
  prescriberReviewBy: string;
  /** Face to face or video: both are acceptable for the routine six-supply review. */
  prescriberReviewType: PrescriberReviewType;
  /** Supplies since that prescriber review (the count that is compared with six). */
  suppliesSinceReview: number | null;
  /** The dose the patient has been taking (continuation), or was taking before the gap (restart). */
  currentDose: Dose;
  /** The dose increase has already been used at some point in the patient's whole course (it never resets; nobody has two increases). */
  doseIncreasedBefore: boolean;
  /** The course has been restarted at the starting dose after a gap at some point since the first supply. */
  restartedBefore: boolean;
  /** Continuation after a restart: supplies since the most recent restart, counting the restart supply itself as 1. */
  suppliesSinceRestart: number | null;
  /** Date the last tablet was taken, to measure the gap. */
  lastTabletDate: string;
  /** Continuation with a gap of more than 4 weeks: the gap was caused only by waiting for the prescriber review after supply 6. */
  gapAwaitingReview: boolean;
  /** Weight recorded at the previous supply (kg), for the 2 kg rule. */
  previousWeightKg: number | null;
  /** Continuation: the baseline systolic (the lower seated systolic at the first supply, or at the most recent restart), for the 10 mmHg rule. At a restart a new baseline is recorded today. */
  baselineSystolic: number | null;
  /** A course under this PGD was previously stopped for a cardiovascular stop. */
  previousCvStop: '' | 'no' | 'yes';
  /** A prescriber has since reviewed the patient face to face and confirmed in writing that treatment may restart. */
  cvStopReviewHeld: boolean;
  cvStopReviewDate: string;
  cvStopReviewBy: string;
  /** The review must be face to face: the GP, or a Get Real Health prescriber in person. */
  cvStopReviewType: CvStopReviewType;
  /** The written confirmation says the symptom has resolved off treatment. */
  cvStopSymptomResolvedConfirmed: boolean;
  /** The face to face review included examination for oedema. */
  cvStopReviewOedemaExamined: boolean;
  /** The face to face review included a repeat blood pressure. */
  cvStopReviewRepeatBp: boolean;
  /** A course under this PGD was previously stopped because the starting dose was not tolerated (a non-cardiovascular stop). */
  previousNonCvStop: '' | 'no' | 'yes';
  /** After that stop, the starting dose was tried once more and not tolerated again; the PGD no longer applies. */
  nonCvStopRetriedBefore: boolean;
  /** First supply: the one permitted return visit after a reading outside the limits on repeat has already been used (carried from the previous record). */
  returnVisitUsedBefore: boolean;
  /** Values carried forward from the previous oral minoxidil record, where one exists. */
  prefill: OMPrefill | null;
  /** Stop symptoms since the last visit (continuation only; a restart starts the comparison afresh from today's values). Asked at the top of the Measurements step. */
  /** Attestation that each of the stop symptoms since the last visit was asked about. */
  sxQuestionsAsked: boolean;
  sxWeightGainReported: boolean;
  sxAnkleSwelling: boolean;
  sxFacialSwelling: boolean;
  sxPalpitations: boolean;
  sxChestPain: boolean;
  sxBreathlessness: boolean;
  sxDizzinessFaintness: boolean;
  sxFainting: boolean;
  /** Non-cardiovascular side effects since the last visit. */
  seHypertrichosis: boolean;
  seHypertrichosisMinds: boolean;
  seHeadache: boolean;
  seInsomnia: boolean;
  seGiUpset: boolean;
  seOther: string;
  /** The patient finds a non-cardiovascular side effect unacceptable. */
  seUnacceptable: boolean;
  adherenceNote: string;
  /** Concurrent treatments (permitted, recorded). */
  onFinasteride: boolean;
  finasterideSource: string;
  onTopicalMinoxidil: boolean;
  topicalMinoxidilSource: string;
  /** Already taking oral minoxidil from another source (exclusion). */
  oralMinoxidilElsewhere: boolean;
  /** Continuation: the contraceptive method was stopped or changed since the last supply. */
  contraceptionChanged: boolean;
  contraceptionReplacementConfirmed: boolean;
}

// ─── Diagnosis ───

export type Onset = '' | 'gradual' | 'sudden';
export type Pattern = '' | 'male' | 'female' | 'other';

export interface OMDiagnosis {
  onset: Onset;
  /** The pattern and duration of hair loss, in words. */
  durationText: string;
  pattern: Pattern;
  /** Scalp examined on the premises with the hair parted. */
  scalpExamined: boolean;
  /** Attestation that each scalp feature below was examined or asked about. */
  scalpFeaturesAsked: boolean;
  redness: boolean;
  scale: boolean;
  pustules: boolean;
  scarring: boolean;
  pain: boolean;
  itch: boolean;
  patchesCompleteLoss: boolean;
  lossFollicularOpenings: boolean;
  brokenHairs: boolean;
  /** In a woman: receding frontal or temporal hairline. */
  womanHairlineRecession: boolean;
  /** In a woman: loss of the eyebrows (frontal fibrosing alopecia). */
  eyebrowLoss: boolean;
  /** Hairs released by a gentle pull on a bundle of about 50 to 60 hairs (first supply and restart). */
  pullTestCount: number | null;
  heavyDiffuseShedding: boolean;
  /** At a review: the heavy shedding has persisted beyond 12 weeks of treatment (a stop; refer for diagnosis). */
  sheddingBeyond12Weeks: boolean;
  /** Hair loss began or worsened within 12 months of childbirth, serious illness, major surgery, rapid weight loss or a new medicine known to cause hair loss. */
  trigger12Months: boolean;
  trigger12MonthsDetail: string;
  /** Women: signs of hyperandrogenism. Attestation that each was examined or asked about. */
  hyperandrogenismAsked: boolean;
  hirsutism: boolean;
  newAcne: boolean;
  irregularPeriods: boolean;
  deepeningVoice: boolean;
  pcosDiagnosis: boolean;
  /** Baseline photographs (first supply). */
  photoConsent: boolean;
  photoCrownTaken: boolean;
  photoFrontalTaken: boolean;
  photosStored: boolean;
  /** Supply visits 4 and 6: repeat photographs taken in the same way. */
  repeatPhotosTaken: boolean;
  /** Response recorded against the baseline photographs. */
  response: '' | 'adequate' | 'inadequate' | 'not-assessed';
  responseNote: string;
}

// ─── Women: blood tests and pregnancy ───

export type TestSource = '' | 'nhs-app' | 'gp-letter' | 'private-lab';

export const TEST_SOURCE_LABEL: Record<Exclude<TestSource, ''>, string> = {
  'nhs-app': 'NHS App',
  'gp-letter': 'GP letter',
  'private-lab': 'Private laboratory report',
};

export type ContraceptionMethod =
  | ''
  | 'combined-hormonal'
  | 'progestogen-only'
  | 'iud-ius'
  | 'sterilisation'
  | 'vasectomised-partner'
  | 'condoms'
  | 'fertility-awareness'
  | 'withdrawal'
  | 'none';

export const CONTRACEPTION_LABEL: Record<Exclude<ContraceptionMethod, ''>, string> = {
  'combined-hormonal': 'Combined hormonal contraception (combined pill, patch or vaginal ring)',
  'progestogen-only': 'Progestogen-only method (progestogen-only pill, injection or implant)',
  'iud-ius': 'Intrauterine device or system',
  sterilisation: 'Sterilisation',
  'vasectomised-partner': 'Vasectomised partner',
  condoms: 'Consistent condom use (where she declines another method)',
  'fertility-awareness': 'Fertility awareness alone (NOT accepted)',
  withdrawal: 'Withdrawal alone (NOT accepted)',
  none: 'No contraception (NOT accepted)',
};

export const ACCEPTED_CONTRACEPTION: ReadonlySet<ContraceptionMethod> = new Set<ContraceptionMethod>([
  'combined-hormonal',
  'progestogen-only',
  'iud-ius',
  'sterilisation',
  'vasectomised-partner',
  'condoms',
]);

export interface OMWomen {
  /** Attestation that each question on the Women step was put to the patient. */
  questionsAsked: boolean;
  /** Ferritin and thyroid results seen by the pharmacist. */
  resultsAvailable: '' | 'yes' | 'no';
  ferritinValue: number | null;
  ferritinDate: string;
  tshValue: string;
  tshWithinRange: '' | 'yes' | 'no';
  tshDate: string;
  testSource: TestSource;
  /** A thyroid or iron problem under investigation or not yet stable on treatment. */
  thyroidOrIronUnstable: boolean;
  /** Childbearing potential per the document definition. */
  childbearingPotential: '' | 'yes' | 'no';
  notPotentialReason: '' | 'post-menopausal' | 'sterilised';
  pregnant: '' | 'no' | 'yes';
  lmpDate: string;
  /** Asked of every woman whatever the childbearing-potential answer: a sterilised woman can breastfeed. */
  breastfeeding: boolean;
  planningPregnancy: boolean;
  contraceptionMethod: ContraceptionMethod;
  /** She agrees to continue the method and to tell the pharmacy if she stops. */
  agreesToContinue: boolean;
  /** Combined hormonal contraception with migraine with aura, ticked by the pharmacist. The rule is also triggered automatically where the method is combined hormonal contraception and migraine with aura is recorded on the Medical step. First supply: not supplied until her prescriber has reviewed the method and she attends with the outcome. Continuation: may continue on the existing method provided she is seen about it within 4 weeks and the referral is recorded. */
  cocWithMigraineAura: boolean;
  /** First supply: her prescriber has reviewed the method and she attends today with the outcome. */
  cocPrescriberReviewed: boolean;
  cocReviewOutcome: string;
  /** Continuation: she has been referred to be seen about the method within 4 weeks and the referral is recorded. */
  cocReferralRecorded: boolean;
}

// ─── Cardiovascular and medical history ───

export interface OMMedicalHistory {
  hypersensitivity: boolean;
  hereditaryGalactose: boolean;
  ischaemicHeartDisease: boolean;
  previousMI: boolean;
  heartFailure: boolean;
  arrhythmia: boolean;
  valvularDisease: boolean;
  cardiomyopathy: boolean;
  congenitalHeartDisease: boolean;
  strokeTia: boolean;
  peripheralArterialDisease: boolean;
  pulmonaryHypertension: boolean;
  pots: boolean;
  pericarditisOrEffusion: boolean;
  pleuralEffusion: boolean;
  hypertension: boolean;
  hypotensionOrOrthostatic: boolean;
  unexplainedSyncope: boolean;
  syncopeLast12Months: boolean;
  phaeochromocytoma: boolean;
  renalImpairment: boolean;
  hepaticImpairment: boolean;
  untreatedAnaemia: boolean;
  unstableThyroid: boolean;
  eatingDisorder: boolean;
  /** Migraine with aura: not an exclusion in itself, but with combined hormonal contraception it triggers the contraception rule under Cautions. */
  migraineWithAura: boolean;
  /** Recorded, not exclusions in themselves. */
  otherConditions: string;
  /** Attestation that every exclusion question on this step was put to the patient. */
  questionsAsked: boolean;
  /** The pharmacist has clinical doubt about suitability: refer where in doubt (a stop, not supplied). */
  pharmacistDoubt: boolean;
  pharmacistDoubtReason: string;
}

// ─── Medicines ───

export interface OMMedicines {
  antihypertensive: boolean;
  betaBlocker: boolean;
  calciumChannelBlocker: boolean;
  diuretic: boolean;
  alphaBlocker: boolean;
  nitrate: boolean;
  sacubitrilValsartan: boolean;
  centrallyActing: boolean;
  dailyPde5: boolean;
  sglt2: boolean;
  stimulant: boolean;
  regularDecongestant: boolean;
  nonPrescribedStimulant: boolean;
  systemicCorticosteroid: boolean;
  /** On-demand PDE5 inhibitor (caution). */
  pde5OnDemand: boolean;
  /** Man under 40 using a PDE5 inhibitor: exercise tolerance and chest symptoms asked about. */
  edVascularAsked: boolean;
  /** Any doubt about vascular disease: refer before supplying. */
  edVascularDoubt: boolean;
  /** Cautions: medicines that can lower blood pressure or cause fluid retention and are not in the exclusion list. */
  dailyNsaid: boolean;
  tricyclic: boolean;
  phenothiazine: boolean;
  pregabalinGabapentin: boolean;
  /** Where any caution medicine is ticked: the pharmacist is satisfied to supply after considering blood pressure and fluid retention. "no" is a stop (refer where in doubt). */
  cautionSatisfied: '' | 'yes' | 'no';
  /** Weight loss treatment (GLP-1 agonist, orlistat, dieting): caution. */
  weightLossTreatment: boolean;
  currentMedicines: string;
  questionsAsked: boolean;
}

// ─── Measurements ───

export interface OMMeasurements {
  seated1Systolic: number | null;
  seated1Diastolic: number | null;
  seated2Systolic: number | null;
  seated2Diastolic: number | null;
  /** Third reading after a further 5 minutes seated ("on repeat"). */
  repeatTaken: boolean;
  repeatSystolic: number | null;
  repeatDiastolic: number | null;
  /** Dizziness or faintness today. At a first supply or a restart the hypotension rule applies: systolic 90 to 99 is acceptable only without it (otherwise a caution). At a continuation it is a cardiovascular stop symptom in its own right. */
  dizzinessOrFaintness: boolean;
  standingSystolic: number | null;
  standingDiastolic: number | null;
  standingSymptoms: boolean;
  pulse: number | null;
  pulseRepeatTaken: boolean;
  pulseRepeat: number | null;
  weightKg: number | null;
  heightCm: number | null;
  /** First visit: this is the one permitted return visit after a blood pressure or pulse reading outside the limits on repeat (hypertension or hypotension). */
  returnVisitForBp: '' | 'no' | 'yes';
  /** Weight loss treatment: asked specifically about ankle swelling, tight shoes or rings and breathlessness. */
  fluidSymptomsAsked: boolean;
}

// ─── Dose decision and supply ───

/** 'increase' is the once-only step up; 'resume' is a patient who had already used it returning to the higher dose after a restart at the starting dose. */
export type DoseDecision = '' | 'unchanged' | 'increase' | 'resume' | 'reduce' | 'stop-non-cv';

export interface OMSupply {
  /** Continuation only. */
  doseDecision: DoseDecision;
  reductionReason: string;
  /** Where the dose was changed: the patient was told. */
  doseChangeToldPatient: boolean;
  batchNumber: string;
  expiryDate: string;
  nextReviewDate: string;
  tabletSplitterSupplied: boolean;
  /** Label as a dispensed medicine with the dose in plain words and the stop wording. */
  labelledAsDirected: boolean;
  pilSupplied: boolean;
  pilLicensedUseExplained: boolean;
  /** Alternatives offered (recorded whether or not supplied). */
  alternativesOffered: '' | 'topical' | 'finasteride' | 'both' | 'none';
}

// ─── Counselling ───

export interface OMCounselling {
  oneDoseDaily: boolean;
  sheddingExpected: boolean;
  /** Hypertrichosis warning, including that the colour of the hair can change, in writing. */
  hypertrichosisWarningWritten: boolean;
  /** Stop and seek advice for a rash or blistering of the skin or mouth. */
  rashBlisteringAdvice: boolean;
  stopSeekHelpWritten: boolean;
  pde5Advice: boolean;
  standSlowlyAlcoholDriving: boolean;
  pregnancyAdvice: boolean;
  tellDoctors: boolean;
  /** Review date, the 4 week gap, and that after six supplies (about eleven months) a doctor must review before continuing. */
  reviewDateAndGap: boolean;
  /** Keep the last week of tablets until the prescriber review is confirmed. */
  keepLastWeekTablets: boolean;
  toldNextReviewDate: boolean;
  writtenRecordGiven: boolean;
  gpToBeInformed: boolean;
  topicalSameDrugExplained: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
  allCounsellingComplete: boolean;
}

// ─── Summary ───

export type ExclusionReferral =
  | ''
  | 'gp-routine'
  | 'gp-same-day'
  | 'gp-bp'
  | 'return-with-results'
  | 'return-with-outcome'
  | 'return-bp'
  | 'prescriber-review'
  | 'advice-only'
  | 'declined';

export const REFERRAL_LABEL: Record<ExclusionReferral, string> = {
  '': 'Not recorded',
  'gp-routine': 'Referred to the GP, routine (within a week)',
  'gp-same-day': 'Referred to the GP the same day',
  'gp-bp': 'Referred to the GP for blood pressure assessment',
  'return-with-results': 'Advised to obtain ferritin and thyroid results (GP or private test) and return with them',
  'return-with-outcome': "Return with the prescriber's outcome / results",
  'return-bp': 'Blood pressure outside the limits on repeat: may return once on another day',
  'prescriber-review': 'Prescriber review required before any further supply',
  'advice-only': 'No referral needed: advice given and the decision recorded',
  declined: 'Patient declined referral; advice given',
};

export const REFERRAL_OUTCOMES: ReadonlySet<ExclusionReferral> = new Set<ExclusionReferral>([
  'gp-routine',
  'gp-same-day',
  'gp-bp',
  'prescriber-review',
]);

export interface OMSummary extends BaseSummary {
  /** Advice given when excluded or declining, and the decision reached. */
  exclusionAdvice: string;
  referral: ExclusionReferral;
  /** Pharmacists only: the supplier confirms they are a registered pharmacist. */
  registeredPharmacistConfirmed: boolean;
  /** GP to be informed within 7 days: how. */
  gpNotificationMethod: string;
}

// ─── Initial state ───

export const initialOMPatientDetails: OMPatientDetails = {
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
  sex: '',
  gpRegistered: '',
  gpNotificationAgreed: '',
};

export const initialOMConsent: OMConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understandsCost: false,
  offLabelScriptGiven: false,
  acceptsOffLabel: '',
  consentStatementSigned: false,
  toldLicenceAndAlternatives: false,
  lacksCapacity: false,
  patientDeclined: false,
  faceToFace: false,
};

export const initialOMSupplyHistory: OMSupplyHistory = {
  supplyType: '',
  firstSupplyDate: '',
  suppliesSoFar: null,
  prescriberReviewHeld: false,
  prescriberReviewDate: '',
  prescriberReviewBy: '',
  prescriberReviewType: '',
  suppliesSinceReview: null,
  currentDose: '',
  doseIncreasedBefore: false,
  restartedBefore: false,
  suppliesSinceRestart: null,
  lastTabletDate: '',
  gapAwaitingReview: false,
  previousWeightKg: null,
  baselineSystolic: null,
  previousCvStop: '',
  cvStopReviewHeld: false,
  cvStopReviewDate: '',
  cvStopReviewBy: '',
  cvStopReviewType: '',
  cvStopSymptomResolvedConfirmed: false,
  cvStopReviewOedemaExamined: false,
  cvStopReviewRepeatBp: false,
  previousNonCvStop: '',
  nonCvStopRetriedBefore: false,
  returnVisitUsedBefore: false,
  prefill: null,
  sxQuestionsAsked: false,
  sxWeightGainReported: false,
  sxAnkleSwelling: false,
  sxFacialSwelling: false,
  sxPalpitations: false,
  sxChestPain: false,
  sxBreathlessness: false,
  sxDizzinessFaintness: false,
  sxFainting: false,
  seHypertrichosis: false,
  seHypertrichosisMinds: false,
  seHeadache: false,
  seInsomnia: false,
  seGiUpset: false,
  seOther: '',
  seUnacceptable: false,
  adherenceNote: '',
  onFinasteride: false,
  finasterideSource: '',
  onTopicalMinoxidil: false,
  topicalMinoxidilSource: '',
  oralMinoxidilElsewhere: false,
  contraceptionChanged: false,
  contraceptionReplacementConfirmed: false,
};

export const initialOMDiagnosis: OMDiagnosis = {
  onset: '',
  durationText: '',
  pattern: '',
  scalpExamined: false,
  scalpFeaturesAsked: false,
  redness: false,
  scale: false,
  pustules: false,
  scarring: false,
  pain: false,
  itch: false,
  patchesCompleteLoss: false,
  lossFollicularOpenings: false,
  brokenHairs: false,
  womanHairlineRecession: false,
  eyebrowLoss: false,
  pullTestCount: null,
  heavyDiffuseShedding: false,
  sheddingBeyond12Weeks: false,
  trigger12Months: false,
  trigger12MonthsDetail: '',
  hyperandrogenismAsked: false,
  hirsutism: false,
  newAcne: false,
  irregularPeriods: false,
  deepeningVoice: false,
  pcosDiagnosis: false,
  photoConsent: false,
  photoCrownTaken: false,
  photoFrontalTaken: false,
  photosStored: false,
  repeatPhotosTaken: false,
  response: '',
  responseNote: '',
};

export const initialOMWomen: OMWomen = {
  questionsAsked: false,
  resultsAvailable: '',
  ferritinValue: null,
  ferritinDate: '',
  tshValue: '',
  tshWithinRange: '',
  tshDate: '',
  testSource: '',
  thyroidOrIronUnstable: false,
  childbearingPotential: '',
  notPotentialReason: '',
  pregnant: '',
  lmpDate: '',
  breastfeeding: false,
  planningPregnancy: false,
  contraceptionMethod: '',
  agreesToContinue: false,
  cocWithMigraineAura: false,
  cocPrescriberReviewed: false,
  cocReviewOutcome: '',
  cocReferralRecorded: false,
};

export const initialOMMedicalHistory: OMMedicalHistory = {
  hypersensitivity: false,
  hereditaryGalactose: false,
  ischaemicHeartDisease: false,
  previousMI: false,
  heartFailure: false,
  arrhythmia: false,
  valvularDisease: false,
  cardiomyopathy: false,
  congenitalHeartDisease: false,
  strokeTia: false,
  peripheralArterialDisease: false,
  pulmonaryHypertension: false,
  pots: false,
  pericarditisOrEffusion: false,
  pleuralEffusion: false,
  hypertension: false,
  hypotensionOrOrthostatic: false,
  unexplainedSyncope: false,
  syncopeLast12Months: false,
  phaeochromocytoma: false,
  renalImpairment: false,
  hepaticImpairment: false,
  untreatedAnaemia: false,
  unstableThyroid: false,
  eatingDisorder: false,
  migraineWithAura: false,
  otherConditions: '',
  questionsAsked: false,
  pharmacistDoubt: false,
  pharmacistDoubtReason: '',
};

export const initialOMMedicines: OMMedicines = {
  antihypertensive: false,
  betaBlocker: false,
  calciumChannelBlocker: false,
  diuretic: false,
  alphaBlocker: false,
  nitrate: false,
  sacubitrilValsartan: false,
  centrallyActing: false,
  dailyPde5: false,
  sglt2: false,
  stimulant: false,
  regularDecongestant: false,
  nonPrescribedStimulant: false,
  systemicCorticosteroid: false,
  pde5OnDemand: false,
  edVascularAsked: false,
  edVascularDoubt: false,
  dailyNsaid: false,
  tricyclic: false,
  phenothiazine: false,
  pregabalinGabapentin: false,
  cautionSatisfied: '',
  weightLossTreatment: false,
  currentMedicines: '',
  questionsAsked: false,
};

export const initialOMMeasurements: OMMeasurements = {
  seated1Systolic: null,
  seated1Diastolic: null,
  seated2Systolic: null,
  seated2Diastolic: null,
  repeatTaken: false,
  repeatSystolic: null,
  repeatDiastolic: null,
  dizzinessOrFaintness: false,
  standingSystolic: null,
  standingDiastolic: null,
  standingSymptoms: false,
  pulse: null,
  pulseRepeatTaken: false,
  pulseRepeat: null,
  weightKg: null,
  heightCm: null,
  returnVisitForBp: '',
  fluidSymptomsAsked: false,
};

export const initialOMSupply: OMSupply = {
  doseDecision: '',
  reductionReason: '',
  doseChangeToldPatient: false,
  batchNumber: '',
  expiryDate: '',
  nextReviewDate: '',
  tabletSplitterSupplied: false,
  labelledAsDirected: false,
  pilSupplied: false,
  pilLicensedUseExplained: false,
  alternativesOffered: '',
};

export const initialOMCounselling: OMCounselling = {
  oneDoseDaily: false,
  sheddingExpected: false,
  hypertrichosisWarningWritten: false,
  rashBlisteringAdvice: false,
  stopSeekHelpWritten: false,
  pde5Advice: false,
  standSlowlyAlcoholDriving: false,
  pregnancyAdvice: false,
  tellDoctors: false,
  reviewDateAndGap: false,
  keepLastWeekTablets: false,
  toldNextReviewDate: false,
  writtenRecordGiven: false,
  gpToBeInformed: false,
  topicalSameDrugExplained: false,
  adverseReaction: false,
  adverseReactionDetails: '',
  allCounsellingComplete: false,
};

export function initialOMSummary(): OMSummary {
  const d = new Date();
  return {
    pharmacistName: '',
    pharmacistGPhC: '',
    pharmacyName: '',
    pharmacyAddress: '',
    consultationDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    consultationTime: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    clinicalNotes: '',
    exclusionAdvice: '',
    referral: '',
    registeredPharmacistConfirmed: false,
    gpNotificationMethod: '',
  };
}
