import type { BasePatientDetails, BaseConsent, BaseSummary } from '../../shared/types';

// ─── PGD identity ───

/** Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, issued 15 October 2026. */
export const MELATONIN_PGD_VERSION = 'PGD version 001, issued 15 October 2026';
export const MELATONIN_PGD_NAME = 'Melatonin 5 mg for Adults: Insomnia and Jet Lag';
export const MELATONIN_PGD_SHORT = 'Melatonin 5 mg for adults PGD v001, issued 15 October 2026';

/** The words the document requires on every arm A record ("Records to be kept"). */
export const OFF_LABEL_RECORD_WORDS =
  'off-label supply under Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, arm A';

/** Arm B record: "that the supply was under this PGD, arm B". */
export const ARM_B_RECORD_WORDS = 'supply under Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, arm B';

// ─── Arms and roles ───

export type Arm = '' | 'A' | 'B';
export type PractitionerRole = '' | 'pharmacist' | 'technician';
export type YesNo = '' | 'yes' | 'no';
export type Sex = '' | 'male' | 'female';

export const ARM_LABEL: Record<Exclude<Arm, ''>, string> = {
  A: 'Arm A: insomnia in adults aged 18 and over (OFF-LABEL, pharmacists only)',
  B: 'Arm B: jet lag in adults aged 18 and over (licensed; pharmacists or pharmacy technicians)',
};

// ─── Products ───

export type ProductKey = '' | 'adaflex-3' | 'adaflex-5' | 'colonis-3';

export const PRODUCTS: Record<Exclude<ProductKey, ''>, { name: string; plNumber: string; strengthMg: 3 | 5; lactose: boolean; storage: string }> = {
  'adaflex-3': {
    name: 'Adaflex 3 mg tablets (melatonin, AGB-Pharma AB)',
    plNumber: 'PL 52497/0003',
    strengthMg: 3,
    lactose: false,
    storage: 'Do not store above 25 C. Store in the original package to protect from light.',
  },
  'adaflex-5': {
    name: 'Adaflex 5 mg tablets (melatonin, AGB-Pharma AB)',
    plNumber: 'PL 52497/0005',
    strengthMg: 5,
    lactose: false,
    storage: 'Do not store above 25 C. Store in the original package to protect from light.',
  },
  'colonis-3': {
    name: 'Melatonin 3 mg film-coated tablets (Colonis Pharma)',
    plNumber: 'PL 41344/0053',
    strengthMg: 3,
    lactose: true,
    storage: 'Store below 25°C (SmPC section 6.4). Keep in the labelled container supplied.',
  },
};

// ─── Arm A course constants ───

export const ARM_A_TABLETS_PER_SUPPLY = 30;
export const ARM_A_MAX_SUPPLIES = 3;
export const REVIEW_WINDOW_START = 21;
export const REVIEW_WINDOW_END = 30;
export const REVIEW_ACCEPTED_UNTIL = 37;
/** The last tablet of supply 3 is taken no later than day 103 after supply 1. */
export const COURSE_LAST_DAY = 103;
export const MONTHS_BETWEEN_COURSES = 6;
/** After two courses in total, a further course only after a documented GP review. */
export const COURSES_BEFORE_GP_REVIEW = 2;
export const ARM_B_MAX_SUPPLIES_12_MONTHS = 4;

// ─── Verbatim document text ───

export const OFF_LABEL_CONSENT_SCRIPT =
  '"This medicine, Adaflex, is melatonin. It is licensed in the UK for jet lag in adults and for sleep problems in children with ADHD, but not for insomnia in adults, so using it for you is outside its licence. It is a properly licensed medicine, not a supplement. The evidence that it helps adults with insomnia is limited, and national guidance does not recommend it, so it may not work for you. Its side effects are usually mild, mainly headache and drowsiness. The treatment that works best for poor sleep is cognitive behavioural therapy for insomnia, which we have told you how to get. If you would still like to try it, it is one tablet a night, we will review you in person before each further supply, we will stop it if your sleep has not improved, the whole course is no more than 90 nights, and we will tell your GP. Are you happy to go ahead on that basis?"';

/** Appendix 4, printed above the patient's signature on the record. */
export const PATIENT_CONSENT_STATEMENT =
  'I have been told that Adaflex (melatonin) is a licensed medicine in the UK for jet lag in adults and for sleep problems in children with ADHD, and that using it for my insomnia is outside its licence. I have been told that the evidence that it helps adults with insomnia is limited and that national guidance does not recommend it, what its side effects are, that cognitive behavioural therapy for insomnia is the recommended treatment and how to get it, that the course is no more than 90 nights with an in-person review before each further supply, that it will be stopped if my sleep does not improve, and that my GP will be informed. I consent to treatment on that basis.';

export const ARM_A_LABEL_WORDING =
  '"Take ONE tablet at night, 1 to 2 hours before bedtime. Do not eat for 2 hours before or 2 hours after taking." Add BNF cautionary label 2 (may cause drowsiness; if affected do not drive or operate machinery; avoid alcoholic drink).';

export const ARM_B_LABEL_WORDING =
  '"Take ONE tablet at bedtime at your destination, for up to 5 nights after each flight. Not before 8pm or after 4am local time. Do not eat for 2 hours before or 2 hours after." Add BNF cautionary label 2 (may cause drowsiness; if affected do not drive or operate machinery; avoid alcoholic drink).';

export const UNLICENSED_WARNING =
  'Unlicensed melatonin cannot be supplied under a PGD. Do not supply, recommend or endorse melatonin sold as a food supplement or bought online; tell the patient it is unregulated in the UK and that the dose on the label may not be what is in the product.';

// ─── Patient ───

export interface MelPatientDetails extends BasePatientDetails {
  sex: Sex;
  occupation: string;
}

// ─── Arm, role and consent ───

export interface MelConsent extends BaseConsent {
  arm: Arm;
  /** The person conducting the consultation. A technician profile is locked to technician. */
  practitionerRole: PractitionerRole;
  /** Seen face to face on the premises (remote or telephone consultations are outside this PGD). 'no' is a stop (NOT_PRESENT). */
  presentInPerson: YesNo;
  /** The request is made by a relative or carer on an adult's behalf. */
  requestByCarerOrRelative: boolean;
  /** The patient lives in a care home. */
  livesInCareHome: boolean;
  lacksCapacity: boolean;
  patientDeclined: boolean;
  /** Arm A: registered with a GP, and agrees to the GP being informed within 7 days of supply 1 and at the end of the course. */
  gpRegistered: YesNo;
  gpNotificationAgreed: YesNo;
  /** Arm A: the off-label consent script was given in substance. */
  offLabelScriptGiven: boolean;
  /** Arm A: told what the licence covers, why it is used, that benefit is uncertain and national guidance does not recommend it, and the alternatives. */
  toldLicenceEvidenceAlternatives: boolean;
  acceptsOffLabel: YesNo;
  /** Arm A: the patient signed the consent statement in Appendix 4. */
  consentStatementSigned: boolean;
}

// ─── Supply history ───

export type SupplyNumber = '' | '1' | '2' | '3';
export type Dose = '' | '3' | '5';

/**
 * What the patient's previous melatonin records at this pharmacy show
 * (looked up by name and date of birth, as the oral minoxidil tool does).
 * The supply number, supply 1 date, last supply date, previous dose and
 * baseline rating are derived from them, never self-declared, where found.
 */
export interface MelCarryForward {
  /** The record the open course was derived from (the most recent arm A supply). */
  recordId: string;
  /** Date of that record. */
  consultationDate: string;
  /** The supply number the records say today is (1 where no course is open). */
  expectedSupply: Exclude<SupplyNumber, ''>;
  supply1Date: string;
  lastSupplyDate: string;
  previousDose: Dose;
  baselineRating: number | null;
  /** Arm A courses (supply 1 made) found at this pharmacy. */
  coursesFound: number;
  /**
   * Date the most recent course found at this pharmacy ended, where the records
   * show it. A course whose last supply had no further supply or review by day 37
   * is treated as ended on day 37 after that supply.
   */
  lastCourseEndDate: string;
  /**
   * The most recent arm A course on record: 'open' (supply 1 or 2 made, not
   * ended, still within day 37 of the last supply), 'lapsed' (no supply or
   * review by day 37 after the last supply, so it ended on that day), or 'none'.
   */
  latestCourseState: 'none' | 'open' | 'lapsed';
  /** Last supply date of the open or lapsed course. */
  latestCourseLastSupplyDate: string;
  /** A previous record shows a stop under stopping rule 2 (next-day drowsiness or a fall). */
  stopRule2Found: boolean;
  /** Number of melatonin records read. */
  recordsRead: number;
}

export interface MelHistory {
  /** Result of the previous-record lookup at this pharmacy. */
  recordLookup: '' | 'found' | 'none' | 'error';
  carriedForward: MelCarryForward | null;
  /** Supply 2 or 3 not verified by the records (none found, or a different supply number chosen): the reason. */
  unverifiedReason: string;
  /** Supply 2 or 3 not verified by the records: the supply 1 record reference and date (where it was seen). */
  supply1RecordRef: string;
  /** Supply 1 chosen while the records show an open (or recently lapsed) arm A course: the reason. */
  restartReason: string;
  /** Supply 1 (arm A) and arm B: a previous melatonin course ended because of next-day drowsiness or a fall (stopping rule 2). */
  previousStopRule2: YesNo;
  // Arm A
  supplyNumber: SupplyNumber;
  /** Previous insomnia courses under THIS PGD (a course counts once supply 1 has been made, however it ended). */
  previousCoursesThisPgd: number | null;
  /** Previous courses under the Get Real Health Circadin PGD (counted for this PGD's limits). */
  previousCoursesCircadin: number | null;
  /** Asked specifically about supplies elsewhere and under the Circadin PGD; pharmacy record checked. */
  coursesAskedSpecifically: boolean;
  /** Date the most recent course (either PGD) ended. */
  previousCourseEndDate: string;
  /** Two or more previous courses: a GP review since the end of the most recent course is documented. */
  gpReviewDocumented: YesNo;
  gpReviewSource: '' | 'letter' | 'nhs-app-scr' | 'gp-reply';
  gpReviewDate: string;
  gpReviewAdvisesAgainst: boolean;
  /** Currently in a course under the Get Real Health Circadin PGD. */
  inCircadinCourse: YesNo;
  /** Aged 55 and over: the route chosen for this course and why. */
  route55Reason: string;
  // Arm A, supply 2 or 3
  supply1Date: string;
  lastSupplyDate: string;
  /** Reviewed in person by a pharmacist. */
  reviewInPerson: YesNo;
  previousDose: Dose;
  /** Baseline 0 to 10 sleep quality rating recorded at supply 1. */
  baselineRating: number | null;
  // Arm B
  armBSuppliesLast12Months: number | null;
  armBCountAskedSpecifically: boolean;
  midArmACourse: YesNo;
  midCircadinCourse: YesNo;
  /** The traveller has had a previous arm B supply (side effects asked; stopping rules applied). */
  previousJetLagSupply: YesNo;
}

// ─── Indication: arm A sleep assessment / review; arm B journey ───

export interface MelIndication {
  // Arm A, supply 1
  difficultyGettingToSleep: boolean;
  difficultyStayingAsleep: boolean;
  wakingEarly: boolean;
  nightsPerWeek: number | null;
  durationWeeks: number | null;
  daytimeImpact: YesNo;
  daytimeImpactDetail: string;
  sleepHygieneRoute: '' | 'tried' | 'severe-impairment' | 'neither';
  sleepHygieneWeeks: number | null;
  severeImpairmentWhat: string;
  severeImpairmentWhyNotWait: string;
  cbtiSignposted: boolean;
  /** Having been offered CBT-I, wishes to take a short course of medicine ('no' is a stop: NOT_WISHING_MEDICINE). */
  wishesShortCourse: YesNo;
  /** Asked at every arm A supply (1, 2 and 3). */
  shiftWork: YesNo;
  delayedSleepPattern: YesNo;
  caffeineUnaddressed: YesNo;
  caffeineDetail: string;
  // Arm A, supply 2 or 3 (review)
  reviewRating: number | null;
  nightsAffectedPerWeek: number | null;
  adherenceTimingFood: YesNo;
  /** A caution makes a higher dose unsafe (pharmacist judgement under the review rules). */
  higherDoseUnsafe: boolean;
  higherDoseUnsafeReason: string;
  // Stopping rules (2) to (5): arm A review, or arm B traveller reporting on a previous supply
  stopRulesAsked: boolean;
  nextDayDrowsiness: YesNo;
  fallWhileTaking: YesNo;
  fallWhileTakingInjury: boolean;
  newWorseMood: YesNo;
  allergySymptoms: YesNo;
  allergyEmergency: boolean;
  unacceptableSideEffect: YesNo;
  sideEffectsDetail: string;
  // Arm B, journey
  byAir: YesNo;
  destination: string;
  outwardDate: string;
  returnDate: string;
  timeZones: number | null;
  direction: '' | 'east' | 'west';
  covers: '' | 'outward' | 'return' | 'both';
  returnAlsoFiveZones: boolean;
  insomniaAtHome: YesNo;
  safetyCriticalDuringTrip: YesNo;
  importAdviceGiven: boolean;
  // Arm B, 5 mg criteria
  wants5mg: boolean;
  prev3mgJetLag: boolean;
  prev3mgTolerated: boolean;
  prev3mgInadequate: boolean;
  prev3mgEvidence: '' | 'recorded' | 'named-licensed' | 'supplement' | 'none';
  prev3mgProduct: string;
  prev3mgWhyInadequate: string;
}

// ─── Red flags and screens ───

export interface MelScreens {
  phq1: number | null;
  phq2: number | null;
  gad1: number | null;
  gad2: number | null;
  selfHarmAsked: boolean;
  selfHarmThoughts: YesNo;
  immediateRisk: boolean;
  sbSnoring: boolean;
  sbTired: boolean;
  sbObserved: boolean;
  sbPressure: boolean;
  sbBmi35: boolean;
  sbNeck40: boolean;
  /**
   * Epworth Sleepiness Scale total (0 to 24), completed on the pharmacy's own
   * licensed form. The item wording is not reproduced in this tool.
   */
  epworth: number | null;
  /** The patient completed the Epworth on the pharmacy's licensed form. */
  epworthOnLicensedForm: boolean;
  /** Arm B: low mood or anxiety described as a symptom. */
  moodAnxietySymptom: boolean;
  /** Arm B: snoring with daytime sleepiness described as a symptom. */
  apnoeaSymptom: boolean;
  moodDrivesSleep: boolean;
  thyroid: boolean;
  menopausal: boolean;
  restlessLegs: boolean;
  pain: boolean;
  nocturia: boolean;
  orthopnoea: boolean;
  newNeuro: boolean;
  recreationalDrugs: boolean;
  withdrawal: boolean;
  alcoholToSleep: boolean;
  harmfulDrinking: boolean;
  narcolepsyParasomnia: boolean;
  cognition: boolean;
  safeguardingConcern: boolean;
  fallLast12Months: YesNo;
  fallWithInjury: boolean;
  redFlagsAsked: boolean;
}

export const EPWORTH_LICENSING_NOTE =
  'The Epworth Sleepiness Scale is used under the terms set by its copyright holder. The patient completes the pharmacy\'s own licensed copy; this tool records the total score only and does not reproduce the item wording. Eight situations, each 0 to 3, total 0 to 24; a total above 10 is excessive daytime sleepiness.';

// ─── Medical history ───

export interface MelMedical {
  hypersensitivity: boolean;
  hepatic: boolean;
  renalSevere: boolean;
  renalLesser: boolean;
  /** Arm A or a pharmacist in arm B: satisfied the renal impairment is mild and stable. */
  renalMildStable: YesNo;
  autoimmune: boolean;
  epilepsy: boolean;
  diabetes: boolean;
  lactoseIntolerance: boolean;
  childbearingPotential: YesNo;
  pregnant: YesNo;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  usingContraception: YesNo;
  contraceptiveMethod: string;
  /** Man: he and his partner are planning a pregnancy (asked where the Colonis tablet is to be supplied). */
  manPlanningPregnancy: YesNo;
  questionsAsked: boolean;
}

// ─── Medicines and occupation ───

export interface MelMedicines {
  fluvoxamine: boolean;
  hypnotic: boolean;
  vka: boolean;
  psoralen: boolean;
  prescribedMelatonin: YesNo;
  otherSourceMelatonin: YesNo;
  otherMelatoninWillingStop: YesNo;
  otherMelatoninProduct: string;
  oestrogen: YesNo;
  oestrogenDetail: string;
  cimetidine: boolean;
  ciprofloxacin: boolean;
  norfloxacin: boolean;
  verapamil: boolean;
  sedating: boolean;
  sedatingDetail: string;
  carbamazepine: boolean;
  phenytoin: boolean;
  rifampicin: boolean;
  omeprazole: boolean;
  smoker: boolean;
  ccb: boolean;
  decongestant: boolean;
  corticosteroid: boolean;
  betaAgonist: boolean;
  ssriSnriChanged: boolean;
  stimulant: boolean;
  levothyroxineRecent: boolean;
  eveningDiuretic: boolean;
  fullMedicineList: string;
  questionsAsked: boolean;
  /** Arm A: professional driver or safety-critical worker. */
  safetyCriticalWork: YesNo;
  /** Must be alert at night (carer, parent of an infant): counselled specifically. */
  alertAtNight: boolean;
  alertAtNightAdvice: string;
}

// ─── Supply ───

export interface MelSupply {
  dose: Dose;
  product: ProductKey;
  batchNumber: string;
  expiryDate: string;
  packType: '' | 'full-pack' | 'part-pack';
  labelled: boolean;
  pilSupplied: boolean;
  /** Arm A, supply 1 or 2: the review window was booked or written down for the patient. */
  reviewBooked: boolean;
  /** Every caution on screen has been read and acted on (codes). */
  acknowledgedCautions: string[];
}

// ─── Counselling ───

export interface MelCounselling {
  // Arm A
  sleepHygieneWritten: boolean;
  cbtiSignpostedRecorded: boolean;
  oneTabletTiming: boolean;
  drowsinessDriving: boolean;
  gettingUpAtNight: boolean;
  reviewWindowTold: boolean;
  stopRulesTold: boolean;
  noOtherMelatonin: boolean;
  writtenInfoGiven: boolean;
  missedDose: boolean;
  // Arm B
  jlTiming: boolean;
  jlFoodAlcohol: boolean;
  jlCaffeine: boolean;
  jlDrowsinessDriving: boolean;
  jlImportRules: boolean;
  jlAppendix3: boolean;
  jlStopRash: boolean;
  jlReportSideEffects: boolean;
  // Both
  unlicensedWarning: boolean;
  menPregnancyColonisAdvice: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
  allCounsellingComplete: boolean;
}

// ─── Summary ───

export type Referral =
  | ''
  | 'gp-routine'
  | 'gp-same-day'
  | 'emergency-999'
  | 'prescriber'
  | 'safeguarding'
  | 'sleep-service-via-gp'
  | 'drug-alcohol-service'
  | 'pharmacist'
  | 'aviation-medical'
  | 'advice-only'
  | 'declined';

export const REFERRAL_LABEL: Record<Referral, string> = {
  '': 'Not recorded',
  'gp-routine': 'Referred to the GP in writing (routine); patient told to book a GP appointment',
  'gp-same-day': 'Same-day referral (GP the same day, NHS 111, or 999 where there is immediate risk)',
  'emergency-999': 'Emergency (999)',
  prescriber: 'Referred back to the prescriber',
  safeguarding: "Pharmacy's adult safeguarding procedure followed the same day (local authority adult safeguarding team where there is risk of harm)",
  'sleep-service-via-gp': 'Referred to the GP for a sleep service',
  'drug-alcohol-service': 'Referred to the GP or a local drug and alcohol service',
  pharmacist: 'Referred to the pharmacist (pharmacy technician, arm B)',
  'aviation-medical': 'Referred to their aviation medical examiner or occupational health service',
  'advice-only': 'No referral needed: advice given and the decision recorded',
  declined: 'Patient declined; advice given',
};

export const REFERRAL_OUTCOMES: ReadonlySet<Referral> = new Set<Referral>([
  'gp-routine',
  'gp-same-day',
  'emergency-999',
  'prescriber',
  'safeguarding',
  'sleep-service-via-gp',
  'drug-alcohol-service',
  'pharmacist',
  'aviation-medical',
]);

export interface MelSummary extends BaseSummary {
  exclusionAdvice: string;
  referral: Referral;
  /** Exclusion, arm A: the sleep hygiene advice (Appendix 1) was given and CBT-I signposted. */
  exclusionSleepHygieneGiven: boolean;
  /** Exclusion, arm B: the non-drug jet lag advice (Appendix 3) was given. */
  exclusionJetLagAdviceGiven: boolean;
  /** Arm A, the course has ended (stopping rules 1 to 5, review after day 37, past day 103, or supply 3): the GP is informed of the end of the course. */
  endOfCourseGpInformed: boolean;
  gpNotificationMethod: string;
  /** Arm A supply 1 supplied: has the GP letter been sent (it must be within 7 days of supply 1)? */
  gpLetterSent: YesNo;
  gpLetterSentDate: string;
  /** The practitioner's declaration of registration and authorisation. */
  declarationConfirmed: boolean;
}

// ─── Initial state ───

export const initialMelPatient: MelPatientDetails = {
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
  occupation: '',
};

export const initialMelConsent: MelConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  arm: '',
  practitionerRole: '',
  presentInPerson: '',
  requestByCarerOrRelative: false,
  livesInCareHome: false,
  lacksCapacity: false,
  patientDeclined: false,
  gpRegistered: '',
  gpNotificationAgreed: '',
  offLabelScriptGiven: false,
  toldLicenceEvidenceAlternatives: false,
  acceptsOffLabel: '',
  consentStatementSigned: false,
};

export const initialMelHistory: MelHistory = {
  recordLookup: '',
  carriedForward: null,
  unverifiedReason: '',
  supply1RecordRef: '',
  restartReason: '',
  previousStopRule2: '',
  supplyNumber: '',
  previousCoursesThisPgd: null,
  previousCoursesCircadin: null,
  coursesAskedSpecifically: false,
  previousCourseEndDate: '',
  gpReviewDocumented: '',
  gpReviewSource: '',
  gpReviewDate: '',
  gpReviewAdvisesAgainst: false,
  inCircadinCourse: '',
  route55Reason: '',
  supply1Date: '',
  lastSupplyDate: '',
  reviewInPerson: '',
  previousDose: '',
  baselineRating: null,
  armBSuppliesLast12Months: null,
  armBCountAskedSpecifically: false,
  midArmACourse: '',
  midCircadinCourse: '',
  previousJetLagSupply: '',
};

export const initialMelIndication: MelIndication = {
  difficultyGettingToSleep: false,
  difficultyStayingAsleep: false,
  wakingEarly: false,
  nightsPerWeek: null,
  durationWeeks: null,
  daytimeImpact: '',
  daytimeImpactDetail: '',
  sleepHygieneRoute: '',
  sleepHygieneWeeks: null,
  severeImpairmentWhat: '',
  severeImpairmentWhyNotWait: '',
  cbtiSignposted: false,
  wishesShortCourse: '',
  shiftWork: '',
  delayedSleepPattern: '',
  caffeineUnaddressed: '',
  caffeineDetail: '',
  reviewRating: null,
  nightsAffectedPerWeek: null,
  adherenceTimingFood: '',
  higherDoseUnsafe: false,
  higherDoseUnsafeReason: '',
  stopRulesAsked: false,
  nextDayDrowsiness: '',
  fallWhileTaking: '',
  fallWhileTakingInjury: false,
  newWorseMood: '',
  allergySymptoms: '',
  allergyEmergency: false,
  unacceptableSideEffect: '',
  sideEffectsDetail: '',
  byAir: '',
  destination: '',
  outwardDate: '',
  returnDate: '',
  timeZones: null,
  direction: '',
  covers: '',
  returnAlsoFiveZones: false,
  insomniaAtHome: '',
  safetyCriticalDuringTrip: '',
  importAdviceGiven: false,
  wants5mg: false,
  prev3mgJetLag: false,
  prev3mgTolerated: false,
  prev3mgInadequate: false,
  prev3mgEvidence: '',
  prev3mgProduct: '',
  prev3mgWhyInadequate: '',
};

export const initialMelScreens: MelScreens = {
  phq1: null,
  phq2: null,
  gad1: null,
  gad2: null,
  selfHarmAsked: false,
  selfHarmThoughts: '',
  immediateRisk: false,
  sbSnoring: false,
  sbTired: false,
  sbObserved: false,
  sbPressure: false,
  sbBmi35: false,
  sbNeck40: false,
  epworth: null,
  epworthOnLicensedForm: false,
  moodAnxietySymptom: false,
  apnoeaSymptom: false,
  moodDrivesSleep: false,
  thyroid: false,
  menopausal: false,
  restlessLegs: false,
  pain: false,
  nocturia: false,
  orthopnoea: false,
  newNeuro: false,
  recreationalDrugs: false,
  withdrawal: false,
  alcoholToSleep: false,
  harmfulDrinking: false,
  narcolepsyParasomnia: false,
  cognition: false,
  safeguardingConcern: false,
  fallLast12Months: '',
  fallWithInjury: false,
  redFlagsAsked: false,
};

export const initialMelMedical: MelMedical = {
  hypersensitivity: false,
  hepatic: false,
  renalSevere: false,
  renalLesser: false,
  renalMildStable: '',
  autoimmune: false,
  epilepsy: false,
  diabetes: false,
  lactoseIntolerance: false,
  childbearingPotential: '',
  pregnant: '',
  breastfeeding: false,
  planningPregnancy: false,
  usingContraception: '',
  contraceptiveMethod: '',
  manPlanningPregnancy: '',
  questionsAsked: false,
};

export const initialMelMedicines: MelMedicines = {
  fluvoxamine: false,
  hypnotic: false,
  vka: false,
  psoralen: false,
  prescribedMelatonin: '',
  otherSourceMelatonin: '',
  otherMelatoninWillingStop: '',
  otherMelatoninProduct: '',
  oestrogen: '',
  oestrogenDetail: '',
  cimetidine: false,
  ciprofloxacin: false,
  norfloxacin: false,
  verapamil: false,
  sedating: false,
  sedatingDetail: '',
  carbamazepine: false,
  phenytoin: false,
  rifampicin: false,
  omeprazole: false,
  smoker: false,
  ccb: false,
  decongestant: false,
  corticosteroid: false,
  betaAgonist: false,
  ssriSnriChanged: false,
  stimulant: false,
  levothyroxineRecent: false,
  eveningDiuretic: false,
  fullMedicineList: '',
  questionsAsked: false,
  safetyCriticalWork: '',
  alertAtNight: false,
  alertAtNightAdvice: '',
};

export const initialMelSupply: MelSupply = {
  dose: '',
  product: '',
  batchNumber: '',
  expiryDate: '',
  packType: '',
  labelled: false,
  pilSupplied: false,
  reviewBooked: false,
  acknowledgedCautions: [],
};

export const initialMelCounselling: MelCounselling = {
  sleepHygieneWritten: false,
  cbtiSignpostedRecorded: false,
  oneTabletTiming: false,
  drowsinessDriving: false,
  gettingUpAtNight: false,
  reviewWindowTold: false,
  stopRulesTold: false,
  noOtherMelatonin: false,
  writtenInfoGiven: false,
  missedDose: false,
  jlTiming: false,
  jlFoodAlcohol: false,
  jlCaffeine: false,
  jlDrowsinessDriving: false,
  jlImportRules: false,
  jlAppendix3: false,
  jlStopRash: false,
  jlReportSideEffects: false,
  unlicensedWarning: false,
  menPregnancyColonisAdvice: false,
  adverseReaction: false,
  adverseReactionDetails: '',
  allCounsellingComplete: false,
};

export function initialMelSummary(): MelSummary {
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
    exclusionSleepHygieneGiven: false,
    exclusionJetLagAdviceGiven: false,
    endOfCourseGpInformed: false,
    gpNotificationMethod: '',
    gpLetterSent: '',
    gpLetterSentDate: '',
    declarationConfirmed: false,
  };
}
