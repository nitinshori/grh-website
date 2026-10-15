import type { BasePatientDetails, BaseConsent, BaseSummary } from '../../shared/types';

/** Patient Group Direction for daridorexant (QUVIVIQ) in long-term insomnia, version 001, issued 15 October 2026. */
export const DARIDOREXANT_PGD_VERSION = 'PGD version 001, issued 15 October 2026';
export const DARIDOREXANT_PGD_NAME = 'Long-Term Insomnia (Daridorexant)';

/** The words the document requires on every record ("Records to be kept"). */
export const RECORD_WORDS = 'supply under Get Real Health PGD Long-Term Insomnia (Daridorexant), version 001';

/** The two products ("Name, form and strength"). */
export const PRODUCTS = {
  '50': {
    name: 'QUVIVIQ 50 mg film-coated tablets (daridorexant), black triangle ▼',
    maNumber: 'PLGB 48711/0003',
    description: 'Light orange arc-triangle shaped film-coated tablets, debossed "50" on one side and "i" on the other.',
    doseLabel: '50 mg (one tablet) once nightly, within 30 minutes before going to bed',
  },
  '25': {
    name: 'QUVIVIQ 25 mg film-coated tablets (daridorexant), black triangle ▼',
    maNumber: 'PLGB 48711/0002',
    description:
      'Light purple arc-triangle shaped film-coated tablets, debossed "25" on one side and "i" on the other. For a patient who regularly takes a moderate CYP3A4 inhibitor only.',
    doseLabel: '25 mg (one tablet) once nightly, within 30 minutes before going to bed',
  },
} as const;

export type Strength = '' | '50' | '25';

export const TABLETS_PER_SUPPLY = 30;
export const MAX_SUPPLIES = 3;
/** Supply visits 2 and 3: 25 to 35 days after the previous supply. */
export const INTERVAL_MIN_DAYS = 25;
export const INTERVAL_MAX_DAYS = 35;
/** No more than 7 days after the last tablet; more than 7 nights without tablets ends the course. */
export const MAX_NIGHTS_WITHOUT_TABLETS = 7;
/** Supply visit 3 always falls within 13 weeks of supply 1. */
export const VISIT3_WITHIN_DAYS_OF_SUPPLY1 = 91;
/** Adherence at supply visit 3: at least 10 of the last 14 nights on which a dose was due. */
export const ADHERENCE_MIN_NIGHTS = 10;
export const ADHERENCE_WINDOW_NIGHTS = 14;

/** Label wording ("Labelling"). */
export const LABEL_DIRECTIONS = 'Take ONE tablet within 30 minutes before going to bed';
export const LABEL_WARNING =
  'This medicine makes you sleepy. Do not drive the morning after your first dose. Take your first 4 doses only on nights before a day you will not drive. After that, allow at least 9 hours before driving and only drive if you feel fully alert. Do not drink alcohol.';

/** Stop rules, verbatim ("Dose and frequency", "Counselling"). */
export const STOP_SAME_DAY_WORDING =
  'STOP AND SEEK HELP THE SAME DAY (your GP, NHS 111, or 999 in an emergency) if you have thoughts of suicide or self-harm; a serious allergic reaction (swelling of the face, lips or tongue, or difficulty breathing); driving while not fully awake; or any other activity while not fully awake that caused an injury or could have done.';
export const STOP_WITHIN_WEEK_WORDING =
  'STOP AND CONTACT US OR YOUR GP WITHIN A WEEK if you have sleep paralysis (being unable to move or speak for a while on falling asleep or waking), seeing or hearing things that are not there on falling asleep or waking, sudden weakness of the legs, face or neck brought on by laughter or strong emotion, sleepwalking or any other activity while not fully awake that you do not remember (for example eating or cooking) where no one was hurt or put at risk, new or worsening low mood or anxiety, still feeling sleepy or slowed in the mornings after the first week, a fall, or a rash.';

/** The questionnaire licensing note (Appendix 2). The ISI item wording is deliberately not reproduced. */
export const ISI_LICENSING_NOTE =
  'The Insomnia Severity Index is used under a licence obtained through the Mapi Research Trust. The patient completes the pharmacy\'s own licensed copy; this tool records the total score only and does not reproduce the item wording. Seven items about the last 2 weeks, each 0 to 4, total 0 to 28: 0 to 7 no clinically significant insomnia; 8 to 14 subthreshold; 15 to 21 moderate; 22 to 28 severe.';

export type YesNo = '' | 'yes' | 'no';
export type Sex = '' | 'male' | 'female';

// ─── Patient ───

export interface DPatientDetails extends BasePatientDetails {
  sex: Sex;
  gpRegistered: YesNo;
  /** Agrees to the GP being informed of the supply, of any stop for a side effect and of the outcome of the effectiveness assessment. */
  gpNotificationAgreed: YesNo;
}

// ─── Consent ───

export interface DConsent extends BaseConsent {
  faceToFace: YesNo;
  understandsCost: boolean;
  lacksCapacity: boolean;
  patientDeclined: boolean;
  /** Explained (and recorded) that the PGD covers at most three supplies, that treatment stops if it has not helped enough at supply visit 3, that any continuation is a prescriber's decision, that the GP may decline, and that a private prescriber is the alternative. */
  threeSupplyLimitExplained: boolean;
  gpMayDeclineExplained: boolean;
}

// ─── Visit and course ───

export type VisitType = '' | 'visit1' | 'visit2' | 'visit3' | 'after3';

export const VISIT_LABEL: Record<Exclude<VisitType, ''>, string> = {
  visit1: 'Supply visit 1 (first supply, after the full assessment and a 1 to 2 week sleep diary)',
  visit2: 'Supply visit 2 (early safety review; supply 2)',
  visit3: 'Supply visit 3 (NICE TA922 effectiveness assessment; supply 3, the last under this PGD)',
  after3: 'The patient has already had three supplies under this PGD (a request for a fourth)',
};

/** The course history found in this pharmacy's previous daridorexant records for the patient. */
export interface CarriedCourse {
  /** Records read, oldest first. */
  recordIds: string[];
  latestRecordDate: string;
  /** Supplies under this PGD on record (never reset). */
  suppliesOnRecord: number;
  /** Date of the supply 1 record ('' where no supply 1 record was found). */
  supply1Date: string;
  previousSupplyDate: string;
  previousStrength: Strength;
  baselineIsi: number | null;
  /** The visit today, derived from the supplies on record. */
  visitType: VisitType;
  /** A record after the last supply that stopped the course (stop rule, risk, or a course-ending reason): its date and reasons, '' where none. */
  courseStoppedOnRecord: string;
}

export type RecordLookup = '' | 'found' | 'none' | 'error';

export interface DCourse {
  /** Previous daridorexant records at this pharmacy: '' not yet looked up; 'found'; 'none'; 'error' (lookup failed). */
  recordLookup: RecordLookup;
  /** The patient (first name, last name, date of birth) the look-up result belongs to; a result for anyone else is discarded. */
  lookupFor: string;
  carried: CarriedCourse | null;
  /** The course history entered by hand instead of from the records (unverified): needs a recorded reason. */
  manualOverride: boolean;
  manualOverrideReason: string;
  visitType: VisitType;
  /** A course under this PGD already started or completed at any pharmacy, whatever its outcome (visit 1). */
  previousCourse: YesNo;
  /** Already taking daridorexant or another orexin receptor antagonist on prescription or from any other source. */
  orexinElsewhere: YesNo;
  /** Supply visits 2 and 3. */
  supply1Date: string;
  /** The date of the previous supply (supply 1 at visit 2; supply 2 at visit 3). */
  previousSupplyDate: string;
  previousStrength: Strength;
  /** The supply 1 (baseline) ISI from the record. */
  baselineIsi: number | null;
  lastTabletDate: string;
  /** Of the nights since the last tablet, how many were withheld on this PGD's instruction (an interacting short course, or waiting to return after starting a regular moderate CYP3A4 inhibitor). */
  withheldSinceLastTablet: number | null;
  /** Nights withheld on this PGD's instruction because of an interacting medicine, since the previous supply. */
  withheldNights: number | null;
  withheldDetails: string;
  /** More than 7 nights without tablets at any point since the previous supply, not counting withheld nights. */
  gapOver7Nights: YesNo;
  /** Nights taken out of the last 14 on which a dose was due (withheld nights are not due; the count goes back past them). */
  nightsTakenOf14: number | null;
  /** A request for an early supply or a report of lost tablets. */
  earlyOrLostRequest: boolean;
  /** A regular moderate CYP3A4 inhibitor started during the course. */
  midCourseInhibitor: YesNo;
  midCourseInhibitorName: string;
  midCourseStoppedDate: string;
  midCourseReturnedWithin7: YesNo;
  midCourse50Returned: boolean;
  /** Stop symptoms since the last supply: attestation each was asked about. */
  symptomsAsked: boolean;
  sxSuicidal: boolean;
  sxAllergy: boolean;
  sxDrivingNotAwake: boolean;
  sxActivityInjury: boolean;
  sxSleepParalysis: boolean;
  sxHallucinations: boolean;
  sxCataplexy: boolean;
  sxSleepwalkingNoHarm: boolean;
  sxLowMoodAnxiety: boolean;
  sxMorningSleepiness: boolean;
  sxFall: boolean;
  sxRash: boolean;
  /** Not stop symptoms on their own (recorded, Yellow Card). */
  seHeadache: boolean;
  seNausea: boolean;
  seDizziness: boolean;
  seTiredness: boolean;
  seDreams: boolean;
  seOther: string;
  /** The patient wishes to stop (they may stop at any time for any reason). */
  wishesToStop: boolean;
  /**
   * Supply visits 2 and 3: "no new excluded medicine or condition". A brief
   * yes/no screen for the other sleep disorders excluded at supply 1 (the
   * Epworth and STOP-Bang are not repeated at these visits).
   */
  reviewNewShiftWork: YesNo;
  reviewNewRestlessLegs: YesNo;
  reviewNewApnoeaOrSleepiness: YesNo;
}

// ─── Sleep history and diary ───

export interface DSleep {
  difficultyGettingToSleep: boolean;
  difficultyStayingAsleep: boolean;
  wakingTooEarly: boolean;
  unrefreshingSleep: boolean;
  nightsPerWeek: number | null;
  durationMonths: number | null;
  usualBedTime: string;
  usualRiseTime: string;
  adequateOpportunity: YesNo;
  daytimeEffects: string;
  daytimeConsiderable: YesNo;
  diaryKept: YesNo;
  diaryNights: number | null;
  diaryConsistent: YesNo;
  diaryTimeToFallAsleep: string;
  diaryTimeAwake: string;
  diaryTotalSleep: string;
  hygieneFourWeeks: YesNo;
  hygieneWrittenGiven: boolean;
  /** Causes: attestation each was asked about. */
  causesAsked: boolean;
  uncontrolledPain: boolean;
  breathlessLyingFlat: boolean;
  nocturiaNotInvestigated: boolean;
  menopausalNotDiscussed: boolean;
  overactiveThyroid: boolean;
  medicineBeforeInsomnia: boolean;
  caffeineNotTried: boolean;
  causesConsideredNote: string;
  /** Other sleep disorders: attestation each was asked about. */
  disordersAsked: boolean;
  restlessLegs: boolean;
  circadian: boolean;
  shiftWork: boolean;
  complexSleepBehaviour: boolean;
  unintentionalDaytimeSleep: boolean;
  cataplexy: boolean;
  paralysisHallucinationsBefore: boolean;
}

// ─── CBT-I ───

export type CbtiStatus = '' | 'tried' | 'not-available' | 'unsuitable' | 'available-not-tried' | 'preference';

export const CBTI_STATUS_LABEL: Record<Exclude<CbtiStatus, ''>, string> = {
  tried: 'TRIED AND NOT WORKED',
  'not-available': 'NOT AVAILABLE (judged by NHS access, not willingness to pay)',
  unsuitable: 'UNSUITABLE (CBT-I cannot reasonably be delivered to this patient)',
  'available-not-tried': 'NHS CBT-I is available and suitable and has not been tried',
  preference: 'The patient would prefer not to try CBT-I',
};

export type Nation = '' | 'england' | 'scotland' | 'wales' | 'northern-ireland';
export const NATION_LABEL: Record<Exclude<Nation, ''>, string> = {
  england: 'England',
  scotland: 'Scotland (Sleepio is free to anyone living in Scotland)',
  wales: 'Wales (SilverCloud Space for Sleep is free by self-referral for people aged 16 and over living in Wales)',
  'northern-ireland': 'Northern Ireland',
};

export type NhsOffer = '' | 'none' | 'f2f-wait-over-3-months' | 'f2f-within-3-months' | 'digital-offered';
export const NHS_OFFER_LABEL: Record<Exclude<NhsOffer, ''>, string> = {
  none: 'No NHS CBT-I (face to face, group or digital) is offered to the patient where they live',
  'f2f-wait-over-3-months': 'The only NHS option is face to face with a waiting time of more than 3 months, and no NHS digital option is offered',
  'f2f-within-3-months': 'NHS face to face or group CBT-I is offered with a wait of 3 months or less',
  'digital-offered': 'Free NHS digital CBT-I is offered to the patient (counts as AVAILABLE)',
};

export type UnsuitableCategory = '' | 'barrier' | 'no-digital' | 'clinician';
export const UNSUITABLE_LABEL: Record<Exclude<UnsuitableCategory, ''>, string> = {
  barrier: 'A cognitive, sensory or language barrier for which no adapted programme is available',
  'no-digital': 'No access to or ability to use a digital programme, where no face to face option exists',
  clinician: "A reason the patient's GP or a sleep or mental health clinician has recorded",
};

export interface DCbti {
  status: CbtiStatus;
  triedProgramme: string;
  triedDates: string;
  triedHowFar: string;
  /** Completed, or engaged with for at least 4 weeks. */
  triedEngaged: YesNo;
  triedWithin2Years: YesNo;
  triedEvidence: string;
  nation: Nation;
  checkedTalkingTherapies: boolean;
  checkedLocalDigital: boolean;
  checkedNational: boolean;
  nhsOffer: NhsOffer;
  notAvailableNote: string;
  unsuitableCategory: UnsuitableCategory;
  unsuitableReason: string;
  privateProgrammesTold: boolean;
  privateDecision: string;
  /** Brief CBT-I components (Appendix 3) delivered at supply 1 where CBT-I is not available or unsuitable. */
  briefStimulusControl: boolean;
  briefSleepWindow: boolean;
  briefDiaryContinued: boolean;
  briefPlanInWriting: boolean;
  sleepWindowRiseTime: string;
  sleepWindowBedTime: string;
  /** Visits 2 and 3: brief CBT-I reinforced where it was given at supply 1. */
  briefGivenAtSupply1: YesNo;
  briefReinforced: boolean;
}

// ─── Screening ───

export type Phq9Q9 = '' | 'not-at-all' | 'several-days' | 'more-than-half' | 'nearly-every-day';
export const PHQ9_Q9_LABEL: Record<Exclude<Phq9Q9, ''>, string> = {
  'not-at-all': 'Not at all (0)',
  'several-days': 'Several days (1)',
  'more-than-half': 'More than half the days (2)',
  'nearly-every-day': 'Nearly every day (3)',
};

export type OsaStatus = '' | 'none' | 'cpap-most-nights' | 'not-treated';
export const OSA_LABEL: Record<Exclude<OsaStatus, ''>, string> = {
  none: 'No diagnosed obstructive sleep apnoea (STOP-Bang applies)',
  'cpap-most-nights': 'Diagnosed OSA treated with CPAP used most nights (STOP-Bang not used; assessed under Cautions)',
  'not-treated': 'Diagnosed sleep apnoea not being treated, or CPAP not used most nights',
};

export interface DScreening {
  isiOnLicensedForm: boolean;
  isi: number | null;
  phq9: number | null;
  phq9Q9: Phq9Q9;
  gad2: number | null;
  gad7: number | null;
  /** Supply 1 only. */
  epworth: number | null;
  osa: OsaStatus;
  stopBangAsked: boolean;
  snoring: boolean;
  tired: boolean;
  observed: YesNo;
  pressure: boolean;
  heightCm: number | null;
  weightKg: number | null;
  neckCm: number | null;
}

// ─── Medical history, mental health and substances ───

export interface DMedical {
  questionsAsked: boolean;
  allergies: string;
  hypersensitivity: boolean;
  narcolepsy: boolean;
  liverDisease: boolean;
  severeCopd: boolean;
  respiratoryFailure: boolean;
  obesityHypoventilation: boolean;
  neuromuscularBreathing: boolean;
  mildModerateCopd: boolean;
  pregnant: boolean;
  planningPregnancy: boolean;
  breastfeeding: boolean;
  soleNightCarer: boolean;
  fallLast12Months: boolean;
  walkingAid: boolean;
  nocturia2Plus: boolean;
  dementiaMemory: boolean;
  /** Mental health: attestation. */
  mentalAsked: boolean;
  currentSuicidalThoughts: boolean;
  selfHarm2Years: boolean;
  bipolarPsychosis: boolean;
  eatingDisorder: boolean;
  ptsd: boolean;
  secondaryCareMh: boolean;
  mhTreatmentChanged3Months: boolean;
  stableTreatedDepAnx: boolean;
  /** Substances. */
  substanceMisuse: boolean;
  alcoholOver14: boolean;
  cannabisRegular: boolean;
  otherConditions: string;
}

// ─── Medicines and Summary Care Record ───

export type ScrStatus = '' | 'checked' | 'no-record' | 'cannot-access' | 'refused';
export const SCR_LABEL: Record<Exclude<ScrStatus, ''>, string> = {
  checked: 'Summary Care Record (or equivalent national record) checked with the patient\'s consent',
  'no-record': 'No record exists (record why)',
  'cannot-access': 'The record cannot be accessed (record why)',
  refused: 'The patient refuses consent to the check (exclusion)',
};

export interface DMedicines {
  questionsAsked: boolean;
  /** Including over the counter, herbal and recreational products. */
  currentMedicines: string;
  strongInhibitor: boolean;
  inducer: boolean;
  ntiSubstrate: boolean;
  cnsDepressantPrescribed: boolean;
  moderateInhibitorRegular: boolean;
  moderateInhibitorName: string;
  moderateStable: YesNo;
  moderateContinue: YesNo;
  shortCourseInhibitor: boolean;
  shortCourseDetails: string;
  nonPrescribedSleepAid: boolean;
  sleepAidName: string;
  sleepAidAgreesStop: YesNo;
  sleepAidLongActing: boolean;
  sleepAidLastDose: string;
  /** Long-acting sedating antihistamine: time of the last dose and the planned first (or next) daridorexant dose, for the 48-hour gap. */
  sleepAidLastDoseTime: string;
  plannedFirstDoseDate: string;
  plannedFirstDoseTime: string;
  otherSubstrate: boolean;
  occasionalSedating: boolean;
  scrStatus: ScrStatus;
  scrNote: string;
}

// ─── Driving plan ───

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type DayName = (typeof DAYS)[number];

export interface DayPlan {
  /** Earliest time of driving or other activity needing full alertness (HH:MM), blank where none. */
  time: string;
  work: boolean;
}

export interface DDriving {
  drives: YesNo;
  bedtime: string;
  days: Record<DayName, DayPlan>;
  drivesForWork: YesNo;
  group2ForWork: boolean;
  safetyCriticalRole: boolean;
  /** Must drive or do other work needing full alertness early in the morning and cannot reliably keep 9 hours. */
  mustEarlyCannot9: YesNo;
  first4Arranged: YesNo;
  first4Plan: string;
  planAgreed: boolean;
  /** Visits 2 and 3: the plan reconfirmed. */
  reconfirmed: boolean;
}

// ─── Review and supply ───

export type HandoverRecipient = '' | 'gp' | 'other';

export interface DSupply {
  /** Visits 2 and 3. */
  wishesToContinue: YesNo;
  /** Visit 3: daytime functioning better, by the patient's account. */
  daytimeBetter: YesNo;
  batchNumber: string;
  expiryDate: string;
  maNumberFromPack: string;
  labelled: boolean;
  pilSupplied: boolean;
  writtenRecordGiven: boolean;
  handoverRecipient: HandoverRecipient;
  handoverOtherName: string;
  handoverSentToday: boolean;
}

// ─── Counselling ───

export interface DCounselling {
  everyNight: boolean;
  modestEffect: boolean;
  drivingAdvice: boolean;
  alcoholGrapefruit: boolean;
  noOtherSleepAids: boolean;
  newMedicines: boolean;
  stopRulesWritten: boolean;
  commonEffects: boolean;
  stopAnyTime: boolean;
  blackTriangle: boolean;
  nextVisitWindow: boolean;
  gpMayDecline: boolean;
  pregnancy: boolean;
  keepSafe: boolean;
  fallsAdvice: boolean;
  cpapAdvice: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
  yellowCardSubmitted: boolean;
  allComplete: boolean;
}

// ─── Summary ───

export type Referral =
  | ''
  | 'emergency'
  | 'same-day'
  | 'emergency-physical'
  | 'urgent-gp'
  | 'gp-week'
  | 'gp-routine'
  | 'talking-therapies'
  | 'cbti-signpost'
  | 'diary-return'
  | 'prescriber'
  | 'occupational'
  | 'advice-only'
  | 'declined';

export const REFERRAL_LABEL: Record<Referral, string> = {
  '': 'Not recorded',
  emergency: 'Suicide or self-harm risk with immediate danger or a plan: 999 called, or accompanied attendance at A&E arranged',
  'same-day': 'Suicide or self-harm risk: same-day contact with the GP, or NHS 111 (option 2 for mental health in England) arranged; Samaritans number (116 123) given',
  'emergency-physical': 'Serious allergic reaction or other emergency: 999 called, or A&E attendance arranged',
  'urgent-gp': 'Same-day stop symptom: urgent same-day GP appointment arranged (or NHS 111 where the GP cannot be reached the same day)',
  'gp-week': 'Referred to the GP within a week (stop rule); no further supply under this PGD',
  'gp-routine': 'Referred to the GP routinely, explaining why',
  'talking-therapies': 'Advised self-referral to NHS Talking Therapies',
  'cbti-signpost': 'Signposted to NHS CBT-I; invited to return if it has not worked after at least 4 weeks of engagement',
  'diary-return': 'Given a sleep diary; supply 1 booked for when it is complete',
  prescriber: 'Referred to a prescriber (course ended, or continuation is for a prescriber)',
  occupational: 'Referred to the GP or occupational health (driving or safety-critical work)',
  'advice-only': 'No referral needed: advice given and the decision recorded',
  declined: 'Patient declined referral; advice given',
};

export const REFERRAL_OUTCOMES: ReadonlySet<Referral> = new Set<Referral>([
  'emergency',
  'same-day',
  'emergency-physical',
  'urgent-gp',
  'gp-week',
  'gp-routine',
  'talking-therapies',
  'prescriber',
  'occupational',
]);

export interface DSummary extends BaseSummary {
  exclusionAdvice: string;
  referral: Referral;
  /** Suicide or self-harm risk: plans and intent asked, and what was done. */
  riskActionRecord: string;
  registeredPharmacistConfirmed: boolean;
  gpNotificationMethod: string;
}

// ─── Initial state ───

export const initialPatient: DPatientDetails = {
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

export const initialConsent: DConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  faceToFace: '',
  understandsCost: false,
  lacksCapacity: false,
  patientDeclined: false,
  threeSupplyLimitExplained: false,
  gpMayDeclineExplained: false,
};

export const initialCourse: DCourse = {
  recordLookup: '',
  lookupFor: '',
  carried: null,
  manualOverride: false,
  manualOverrideReason: '',
  visitType: '',
  previousCourse: '',
  orexinElsewhere: '',
  supply1Date: '',
  previousSupplyDate: '',
  previousStrength: '',
  baselineIsi: null,
  lastTabletDate: '',
  withheldSinceLastTablet: null,
  withheldNights: null,
  withheldDetails: '',
  gapOver7Nights: '',
  nightsTakenOf14: null,
  earlyOrLostRequest: false,
  midCourseInhibitor: '',
  midCourseInhibitorName: '',
  midCourseStoppedDate: '',
  midCourseReturnedWithin7: '',
  midCourse50Returned: false,
  symptomsAsked: false,
  sxSuicidal: false,
  sxAllergy: false,
  sxDrivingNotAwake: false,
  sxActivityInjury: false,
  sxSleepParalysis: false,
  sxHallucinations: false,
  sxCataplexy: false,
  sxSleepwalkingNoHarm: false,
  sxLowMoodAnxiety: false,
  sxMorningSleepiness: false,
  sxFall: false,
  sxRash: false,
  seHeadache: false,
  seNausea: false,
  seDizziness: false,
  seTiredness: false,
  seDreams: false,
  seOther: '',
  wishesToStop: false,
  reviewNewShiftWork: '',
  reviewNewRestlessLegs: '',
  reviewNewApnoeaOrSleepiness: '',
};

export const initialSleep: DSleep = {
  difficultyGettingToSleep: false,
  difficultyStayingAsleep: false,
  wakingTooEarly: false,
  unrefreshingSleep: false,
  nightsPerWeek: null,
  durationMonths: null,
  usualBedTime: '',
  usualRiseTime: '',
  adequateOpportunity: '',
  daytimeEffects: '',
  daytimeConsiderable: '',
  diaryKept: '',
  diaryNights: null,
  diaryConsistent: '',
  diaryTimeToFallAsleep: '',
  diaryTimeAwake: '',
  diaryTotalSleep: '',
  hygieneFourWeeks: '',
  hygieneWrittenGiven: false,
  causesAsked: false,
  uncontrolledPain: false,
  breathlessLyingFlat: false,
  nocturiaNotInvestigated: false,
  menopausalNotDiscussed: false,
  overactiveThyroid: false,
  medicineBeforeInsomnia: false,
  caffeineNotTried: false,
  causesConsideredNote: '',
  disordersAsked: false,
  restlessLegs: false,
  circadian: false,
  shiftWork: false,
  complexSleepBehaviour: false,
  unintentionalDaytimeSleep: false,
  cataplexy: false,
  paralysisHallucinationsBefore: false,
};

export const initialCbti: DCbti = {
  status: '',
  triedProgramme: '',
  triedDates: '',
  triedHowFar: '',
  triedEngaged: '',
  triedWithin2Years: '',
  triedEvidence: '',
  nation: '',
  checkedTalkingTherapies: false,
  checkedLocalDigital: false,
  checkedNational: false,
  nhsOffer: '',
  notAvailableNote: '',
  unsuitableCategory: '',
  unsuitableReason: '',
  privateProgrammesTold: false,
  privateDecision: '',
  briefStimulusControl: false,
  briefSleepWindow: false,
  briefDiaryContinued: false,
  briefPlanInWriting: false,
  sleepWindowRiseTime: '',
  sleepWindowBedTime: '',
  briefGivenAtSupply1: '',
  briefReinforced: false,
};

export const initialScreening: DScreening = {
  isiOnLicensedForm: false,
  isi: null,
  phq9: null,
  phq9Q9: '',
  gad2: null,
  gad7: null,
  epworth: null,
  osa: '',
  stopBangAsked: false,
  snoring: false,
  tired: false,
  observed: '',
  pressure: false,
  heightCm: null,
  weightKg: null,
  neckCm: null,
};

export const initialMedical: DMedical = {
  questionsAsked: false,
  allergies: '',
  hypersensitivity: false,
  narcolepsy: false,
  liverDisease: false,
  severeCopd: false,
  respiratoryFailure: false,
  obesityHypoventilation: false,
  neuromuscularBreathing: false,
  mildModerateCopd: false,
  pregnant: false,
  planningPregnancy: false,
  breastfeeding: false,
  soleNightCarer: false,
  fallLast12Months: false,
  walkingAid: false,
  nocturia2Plus: false,
  dementiaMemory: false,
  mentalAsked: false,
  currentSuicidalThoughts: false,
  selfHarm2Years: false,
  bipolarPsychosis: false,
  eatingDisorder: false,
  ptsd: false,
  secondaryCareMh: false,
  mhTreatmentChanged3Months: false,
  stableTreatedDepAnx: false,
  substanceMisuse: false,
  alcoholOver14: false,
  cannabisRegular: false,
  otherConditions: '',
};

export const initialMedicines: DMedicines = {
  questionsAsked: false,
  currentMedicines: '',
  strongInhibitor: false,
  inducer: false,
  ntiSubstrate: false,
  cnsDepressantPrescribed: false,
  moderateInhibitorRegular: false,
  moderateInhibitorName: '',
  moderateStable: '',
  moderateContinue: '',
  shortCourseInhibitor: false,
  shortCourseDetails: '',
  nonPrescribedSleepAid: false,
  sleepAidName: '',
  sleepAidAgreesStop: '',
  sleepAidLongActing: false,
  sleepAidLastDose: '',
  sleepAidLastDoseTime: '',
  plannedFirstDoseDate: '',
  plannedFirstDoseTime: '',
  otherSubstrate: false,
  occasionalSedating: false,
  scrStatus: '',
  scrNote: '',
};

const emptyDays = (): Record<DayName, DayPlan> =>
  DAYS.reduce((acc, d) => ({ ...acc, [d]: { time: '', work: false } }), {} as Record<DayName, DayPlan>);

export const initialDriving: DDriving = {
  drives: '',
  bedtime: '',
  days: emptyDays(),
  drivesForWork: '',
  group2ForWork: false,
  safetyCriticalRole: false,
  mustEarlyCannot9: '',
  first4Arranged: '',
  first4Plan: '',
  planAgreed: false,
  reconfirmed: false,
};

export const initialSupply: DSupply = {
  wishesToContinue: '',
  daytimeBetter: '',
  batchNumber: '',
  expiryDate: '',
  maNumberFromPack: '',
  labelled: false,
  pilSupplied: false,
  writtenRecordGiven: false,
  handoverRecipient: '',
  handoverOtherName: '',
  handoverSentToday: false,
};

export const initialCounselling: DCounselling = {
  everyNight: false,
  modestEffect: false,
  drivingAdvice: false,
  alcoholGrapefruit: false,
  noOtherSleepAids: false,
  newMedicines: false,
  stopRulesWritten: false,
  commonEffects: false,
  stopAnyTime: false,
  blackTriangle: false,
  nextVisitWindow: false,
  gpMayDecline: false,
  pregnancy: false,
  keepSafe: false,
  fallsAdvice: false,
  cpapAdvice: false,
  adverseReaction: false,
  adverseReactionDetails: '',
  yellowCardSubmitted: false,
  allComplete: false,
};

/** A stop code raised during the consultation, kept even if a later answer clears it. */
export interface StopEvent {
  code: string;
  message: string;
  /** ISO timestamp when the stop appeared. */
  raisedAt: string;
  /** The step on screen when it appeared. */
  step: number;
  /** ISO timestamp when a changed answer cleared it, '' while it stands. */
  clearedAt: string;
}

const londonDateFormat = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' });

export function initialSummary(): DSummary {
  const d = new Date();
  return {
    pharmacistName: '',
    pharmacistGPhC: '',
    pharmacyName: '',
    pharmacyAddress: '',
    consultationDate: londonDateFormat().format(d),
    consultationTime: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }),
    clinicalNotes: '',
    exclusionAdvice: '',
    referral: '',
    riskActionRecord: '',
    registeredPharmacistConfirmed: false,
    gpNotificationMethod: '',
  };
}
