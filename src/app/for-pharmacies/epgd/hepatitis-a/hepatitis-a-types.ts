import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

/** Hepatitis A Vaccination PGD v001, issued 20 September 2026. */
export const HEPATITIS_A_PGD_VERSION = 'Hepatitis A Vaccination PGD v001, issued 20 September 2026';

// ─── Products ───
// Four products, two strengths by age. Havrix Monodose is 1.0 mL; every
// other product is 0.5 mL (document: "The medicine").

export type HepatitisAProduct = '' | 'havrix-monodose' | 'avaxim' | 'havrix-junior' | 'avaxim-junior';

export type AgeBand = 'adult' | 'junior';

export interface ProductInfo {
  /** Label used on screen, on the printed record and as the saved medicine name. */
  label: string;
  /** Short name for the second-dose window text. */
  shortName: string;
  volume: '1.0 mL' | '0.5 mL';
  ageBand: AgeBand;
  /** Months after the first dose within which the SmPC allows the second
   *  dose without restarting: Havrix Monodose 5 years, Havrix Junior
   *  Monodose 3 years, Avaxim 36 months, Avaxim Junior 15 years. */
  secondDoseWindowMonths: number;
  windowLabel: string;
}

export const PRODUCTS: Record<Exclude<HepatitisAProduct, ''>, ProductInfo> = {
  'havrix-monodose': {
    label: 'Havrix Monodose (GSK), hepatitis A vaccine 1440 ELISA units in 1.0 mL, pre-filled syringe',
    shortName: 'Havrix Monodose',
    volume: '1.0 mL',
    ageBand: 'adult',
    secondDoseWindowMonths: 60,
    windowLabel: 'up to 5 years after the first dose',
  },
  avaxim: {
    label: 'Avaxim (Sanofi), hepatitis A vaccine 160 units in 0.5 mL, pre-filled syringe',
    shortName: 'Avaxim',
    volume: '0.5 mL',
    ageBand: 'adult',
    secondDoseWindowMonths: 36,
    windowLabel: 'up to 36 months after the first dose',
  },
  'havrix-junior': {
    label: 'Havrix Junior Monodose (GSK), hepatitis A vaccine 720 ELISA units in 0.5 mL, pre-filled syringe',
    shortName: 'Havrix Junior Monodose',
    volume: '0.5 mL',
    ageBand: 'junior',
    secondDoseWindowMonths: 36,
    windowLabel: 'up to 3 years after the first dose',
  },
  'avaxim-junior': {
    label: 'Avaxim Junior (Sanofi), hepatitis A vaccine 80 units in 0.5 mL, pre-filled syringe',
    shortName: 'Avaxim Junior',
    volume: '0.5 mL',
    ageBand: 'junior',
    secondDoseWindowMonths: 180,
    windowLabel: 'between 6 months and 15 years after the first dose',
  },
};

/** Product of the first dose where a second dose is given today. The
 *  document's inclusion criterion is "a first dose of an inactivated
 *  hepatitis A vaccine", so a brand outside the four is allowed and recorded. */
export type FirstDoseProduct = HepatitisAProduct | 'other';

export const FIRST_DOSE_PRODUCT_LABEL: Record<Exclude<FirstDoseProduct, ''>, string> = {
  'havrix-monodose': 'Havrix Monodose (adult, 1440 ELISA units, 1.0 mL)',
  avaxim: 'Avaxim (adult, 160 units, 0.5 mL)',
  'havrix-junior': 'Havrix Junior Monodose (720 ELISA units, 0.5 mL)',
  'avaxim-junior': 'Avaxim Junior (80 units, 0.5 mL)',
  other: 'Another inactivated hepatitis A vaccine (record the brand)',
};

// ─── Consent ───

/** Under 16: a person with parental responsibility, or the young person
 *  assessed as Gillick competent; 16 and over: the patient. "unobtainable"
 *  is the document's exclusion: under 16 and valid consent cannot be
 *  obtained from a person with parental responsibility, and the young
 *  person is not assessed as Gillick competent. */
export type HepatitisAConsentBasis = 'parental' | 'gillick' | 'self' | 'unobtainable' | '';

export interface HepatitisAPatientDetails extends BasePatientDetails {
  consentBasis: HepatitisAConsentBasis;
  consentDetail: string;
}

export interface HepatitisAConsent extends BaseConsent {
  /** The patient understands this is a private service and what it costs. */
  understandsCost: boolean;
  /** The patient (or the person consenting for a child) declines vaccination
   *  after counselling. The document's "Actions if the patient is excluded or
   *  declines" then apply: discuss, give food and water hygiene advice, refer
   *  or inform the GP as appropriate, and document the advice and decision. */
  patientDeclined: boolean;
}

// ─── Indication ───

export type IndicationType = '' | 'travel' | 'non-travel' | 'both' | 'none';

export interface HepatitisAIndication {
  indicationType: IndicationType;
  travelDestination: string;
  departureDate: string;
  /** Destination is an area of moderate or high endemicity (anywhere outside
   *  northern and western Europe, North America, Australia and New Zealand;
   *  TravelHealthPro checked where in doubt). */
  endemicityConfirmed: boolean;
  /** Departing within 2 weeks: the dose is given, and the patient has been
   *  told full protection comes after about 2 weeks. */
  shortNoticeAdvised: boolean;
  chronicLiverDisease: boolean;
  haemophiliaClottingFactors: boolean;
  injectsDrugs: boolean;
  msm: boolean;
  occupationalRisk: boolean;
  occupationalRiskDetail: string;
  /** Post-exposure situation: contact of a case or exposure in an outbreak. A
   *  "yes" is a stop with same-day referral. */
  postExposure: '' | 'no' | 'yes';
  hepBAlsoNeeded: '' | 'no' | 'yes';
  hepBDecision: '' | 'continue-hep-a-only' | 'use-combined-pgd';
  /** The patient requires proof of immunity: serology is out of scope. */
  proofOfImmunityRequired: boolean;
}

// ─── Course ───

export type CourseStatus = '' | 'none' | 'one-dose' | 'completed';

/** The dose given today, derived from the course status. */
export type DoseNumber = '' | 'first' | 'second' | 'booster-25-years';

export const DOSE_NUMBER_LABEL: Record<Exclude<DoseNumber, ''>, string> = {
  first: 'First dose',
  second: 'Second dose (completes the course)',
  'booster-25-years': 'Booster after a completed course: ongoing risk, 25 years or more since the course',
};

export interface HepatitisACourse {
  courseStatus: CourseStatus;
  firstDoseProduct: FirstDoseProduct;
  firstDoseProductOther: string;
  firstDoseDateKnown: '' | 'known' | 'not-known';
  firstDoseDate: string;
  firstDoseDateNote: string;
  /** Date not known: the first dose was 6 months or more ago, as reliably
   *  reported by the patient (document inclusion criterion). */
  firstDoseSixMonthsConfirmed: boolean;
  /** Completed course exception: ongoing risk and 25 years have passed. */
  completedCourseOngoingRisk25Years: boolean;
  completedCourseNote: string;
  /** Second dose beyond the licensed window: an informed off-label decision,
   *  explained to the patient and recorded (document: "record that as an
   *  informed off-label decision rather than declining"). */
  offLabelDecisionRecorded: boolean;
}

// ─── Medical history ───

export interface HepatitisAMedicalHistory {
  anaphylaxisHepAVaccineOrComponent: boolean;
  neomycinHypersensitivity: boolean;
  previousHypersensitivityReaction: boolean;
  acuteSevereFebrileIllness: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  breastfeedingDecision: string;
  immunosuppressed: boolean;
  immunosuppressionCounselling: string;
  bleedingDisorder: boolean;
  phenylketonuria: boolean;
  latexSensitivity: boolean;
  knownAllergies: string;
}

// ─── Administration and summary ───

export type AdministrationSite = '' | 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh';

export const SITE_LABEL: Record<Exclude<AdministrationSite, ''>, string> = {
  'left-deltoid': 'Left deltoid',
  'right-deltoid': 'Right deltoid',
  'left-thigh': 'Left anterolateral thigh',
  'right-thigh': 'Right anterolateral thigh',
};

export type AdministrationRoute = '' | 'intramuscular' | 'subcutaneous';

export interface HepatitisASummary extends BaseSummary {
  product: HepatitisAProduct;
  batchNumber: string;
  expiryDate: string;
  administrationSite: AdministrationSite;
  route: AdministrationRoute;
  /** Bleeding disorder, thrombocytopenia or anticoagulation with the
   *  intramuscular route: 23 gauge or finer needle, firm pressure without
   *  rubbing for at least 2 minutes. */
  bleedingPrecautionsConfirmed: boolean;
  administrationTime: string;
  adrenalineAvailable: boolean;
  coAdministered: boolean;
  coAdministeredDetails: string;
  /** For a first dose: the date the second dose is due, 6 to 12 months from today. */
  secondDoseDue: string;
  /** Pregnancy with Avaxim: the recorded risk-benefit assessment. */
  pregnancyRiskBenefitNote: string;
  /** Latex sensitivity with adult Avaxim: the presentation in hand was checked. */
  latexPresentationChecked: boolean;
}

export interface HepatitisAPostVaccineAdvice {
  observationCompleted: boolean;
  counselledOneDoseProtection: boolean;
  counselledSecondDose: boolean;
  counselledMissedDose: boolean;
  counselledFoodWater: boolean;
  counselledReactions: boolean;
  counselledHepBNotCovered: boolean;
  counselledFollowUp: boolean;
  pilSupplied: boolean;
  writtenRecordGiven: boolean;
  toldSecondDoseDate: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
  patientAdvised: boolean;
}

export type ExclusionReferral =
  | ''
  | 'gp'
  | 'travel-clinic'
  | 'hpt-same-day'
  | 'gp-same-day'
  | 'hep-ab-pgd'
  | 'postpone'
  | 'rebook'
  | 'advice-only'
  | 'declined'
  | 'declined-vaccination';

export const REFERRAL_LABEL: Record<ExclusionReferral, string> = {
  '': 'Not recorded',
  gp: 'Referred to GP',
  'travel-clinic': 'Referred to a travel clinic',
  'hpt-same-day': 'Referred to the Health Protection Team the same day (post-exposure)',
  'gp-same-day': 'Referred to the GP the same day (post-exposure)',
  'hep-ab-pgd': 'Seen under the Hepatitis A and B (Travel) PGD instead',
  postpone: 'Postponed: return when recovered',
  rebook: 'Rebooked: second dose within the 6 to 12 month window',
  'advice-only': 'No referral needed: advice given and the decision recorded',
  declined: 'Patient declined referral; advice given',
  'declined-vaccination': 'Patient declined vaccination after counselling; advice given and the decision recorded',
};

/** Referrals that make the saved outcome "referred" rather than "not_supplied". */
export const REFERRAL_OUTCOMES: ReadonlySet<ExclusionReferral> = new Set<ExclusionReferral>([
  'gp',
  'travel-clinic',
  'hpt-same-day',
  'gp-same-day',
]);

export interface HepatitisAExclusionOutcome {
  adviceGiven: string;
  foodWaterAdviceGiven: boolean;
  referral: ExclusionReferral;
}

// ─── Initial state ───

export const initialHepatitisAPatientDetails: HepatitisAPatientDetails = {
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
  consentBasis: '',
  consentDetail: '',
};

export const initialHepatitisAConsent: HepatitisAConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understandsCost: false,
  patientDeclined: false,
};

export const initialHepatitisAIndication: HepatitisAIndication = {
  indicationType: '',
  travelDestination: '',
  departureDate: '',
  endemicityConfirmed: false,
  shortNoticeAdvised: false,
  chronicLiverDisease: false,
  haemophiliaClottingFactors: false,
  injectsDrugs: false,
  msm: false,
  occupationalRisk: false,
  occupationalRiskDetail: '',
  postExposure: '',
  hepBAlsoNeeded: '',
  hepBDecision: '',
  proofOfImmunityRequired: false,
};

export const initialHepatitisACourse: HepatitisACourse = {
  courseStatus: '',
  firstDoseProduct: '',
  firstDoseProductOther: '',
  firstDoseDateKnown: '',
  firstDoseDate: '',
  firstDoseDateNote: '',
  firstDoseSixMonthsConfirmed: false,
  completedCourseOngoingRisk25Years: false,
  completedCourseNote: '',
  offLabelDecisionRecorded: false,
};

export const initialHepatitisAMedicalHistory: HepatitisAMedicalHistory = {
  anaphylaxisHepAVaccineOrComponent: false,
  neomycinHypersensitivity: false,
  previousHypersensitivityReaction: false,
  acuteSevereFebrileIllness: false,
  pregnant: false,
  breastfeeding: false,
  breastfeedingDecision: '',
  immunosuppressed: false,
  immunosuppressionCounselling: '',
  bleedingDisorder: false,
  phenylketonuria: false,
  latexSensitivity: false,
  knownAllergies: '',
};

export const initialHepatitisAPostVaccineAdvice: HepatitisAPostVaccineAdvice = {
  observationCompleted: false,
  counselledOneDoseProtection: false,
  counselledSecondDose: false,
  counselledMissedDose: false,
  counselledFoodWater: false,
  counselledReactions: false,
  counselledHepBNotCovered: false,
  counselledFollowUp: false,
  pilSupplied: false,
  writtenRecordGiven: false,
  toldSecondDoseDate: false,
  adverseReaction: false,
  adverseReactionDetails: '',
  patientAdvised: false,
};

export const initialHepatitisAExclusionOutcome: HepatitisAExclusionOutcome = {
  adviceGiven: '',
  foodWaterAdviceGiven: false,
  referral: '',
};

export function initialHepatitisASummary(): HepatitisASummary {
  const d = new Date();
  return {
    pharmacistName: '',
    pharmacistGPhC: '',
    pharmacyName: '',
    pharmacyAddress: '',
    consultationDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    consultationTime: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    clinicalNotes: '',
    product: '',
    batchNumber: '',
    expiryDate: '',
    administrationSite: '',
    route: 'intramuscular',
    bleedingPrecautionsConfirmed: false,
    administrationTime: '',
    adrenalineAvailable: false,
    coAdministered: false,
    coAdministeredDetails: '',
    secondDoseDue: '',
    pregnancyRiskBenefitNote: '',
    latexPresentationChecked: false,
  };
}
