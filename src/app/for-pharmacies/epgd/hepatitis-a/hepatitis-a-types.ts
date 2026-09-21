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
  /** Months after the first dose within which this product's SmPC allows it
   *  to be given as the second dose without restarting. The document applies
   *  the window of the product being given today: Havrix Monodose 5 years,
   *  Havrix Junior Monodose 3 years, Avaxim 6 to 36 months, Avaxim Junior 6
   *  months to 15 years. */
  secondDoseWindowMonths: number;
  windowLabel: string;
}

export const PRODUCTS: Record<Exclude<HepatitisAProduct, ''>, ProductInfo> = {
  'havrix-monodose': {
    label: 'Havrix Monodose (GSK), hepatitis A vaccine 1440 ELISA units in 1.0 mL, pre-filled syringe or vial',
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
    windowLabel: '6 to 36 months after the first dose',
  },
  'havrix-junior': {
    label: 'Havrix Junior Monodose (GSK), hepatitis A vaccine 720 ELISA units in 0.5 mL, pre-filled syringe or vial',
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
    windowLabel: '6 months to 15 years after the first dose',
  },
};

/** Product of the first dose where a second dose is given today: any
 *  inactivated hepatitis A-containing vaccine (monovalent, ViATIM, Twinrix or
 *  Ambirix), or "not known". Where the product is not known the second dose
 *  is off-label (document: "Dose and frequency"). A completed Twinrix or
 *  Ambirix course is a completed course, not a first dose. */
export type FirstDoseProduct =
  | ''
  | 'havrix-monodose'
  | 'havrix-junior'
  | 'avaxim'
  | 'avaxim-junior'
  | 'viatim'
  | 'twinrix'
  | 'ambirix'
  | 'not-known';

export const FIRST_DOSE_PRODUCT_LABEL: Record<Exclude<FirstDoseProduct, ''>, string> = {
  'havrix-monodose': 'Havrix Monodose (adult, 1440 ELISA units, 1.0 mL)',
  'havrix-junior': 'Havrix Junior Monodose (720 ELISA units, 0.5 mL)',
  avaxim: 'Avaxim (adult, 160 units, 0.5 mL)',
  'avaxim-junior': 'Avaxim Junior (80 units, 0.5 mL)',
  viatim: 'ViATIM (combined hepatitis A and typhoid)',
  twinrix: 'Twinrix (combined hepatitis A and B), one dose only',
  ambirix: 'Ambirix (combined hepatitis A and B), one dose only',
  'not-known': 'Not known (the second dose is off-label)',
};

/** The words the document requires on the record for an off-label second dose. */
export const OFF_LABEL_BASIS = 'off-label, Green Book chapter 17';

export const OFF_LABEL_BASIS_TEXT =
  'Off-label use is authorised under this PGD on the basis of Green Book chapter 17: successful boosting occurs even when the second dose is delayed for several years and the course does not need restarting.';

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

/** The document's occupational list is closed to the Green Book groups.
 *  "other-request" (food handler, day-care, healthcare or similar) is not an
 *  indication unless the request comes from occupational health or the
 *  Health Protection Team. */
export type OccupationalGroup =
  | ''
  | 'laboratory'
  | 'residential-institution'
  | 'sewage'
  | 'primates'
  | 'other-request';

export const OCCUPATIONAL_GROUP_LABEL: Record<Exclude<OccupationalGroup, ''>, string> = {
  laboratory: 'Laboratory work with possible exposure to the virus',
  'residential-institution': 'Staff or resident of a large residential institution where the Green Book applies',
  sewage: 'Work with repeated exposure to raw sewage',
  primates: 'Work with susceptible primates',
  'other-request': 'Other occupational request (food handler, day-care, healthcare or similar)',
};

/** Where the patient also needs hepatitis B. "monovalent-now": hepatitis A
 *  under this PGD now, hepatitis B arranged separately. "use-combined-pgd":
 *  seen under the Hepatitis A and B (Travel) PGD instead (a stop here). */
export type HepBDecision = '' | 'monovalent-now' | 'use-combined-pgd';

export interface HepatitisAIndication {
  indicationType: IndicationType;
  travelDestination: string;
  departureDate: string;
  /** NaTHNaC TravelHealthPro recommends hepatitis A for this destination and
   *  itinerary (document inclusion criterion). */
  travelHealthProRecommends: boolean;
  /** Departing within 2 weeks: the dose is given, and the patient has been
   *  told full protection comes after about 2 weeks. */
  shortNoticeAdvised: boolean;
  chronicLiverDisease: boolean;
  haemophiliaClottingFactors: boolean;
  injectsDrugs: boolean;
  msm: boolean;
  occupationalRisk: boolean;
  occupationalGroup: OccupationalGroup;
  /** "other-request" only: the request comes from occupational health or the
   *  Health Protection Team. Without it, and with no other indication, the
   *  patient is referred. */
  occupationalOhRequest: boolean;
  occupationalRiskDetail: string;
  /** Post-exposure situation: contact of a case or exposure in an outbreak. A
   *  "yes" is a stop with same-day referral. */
  postExposure: '' | 'no' | 'yes';
  hepBAlsoNeeded: '' | 'no' | 'yes';
  /** Rapid hepatitis A protection is needed: with departure within about a
   *  month, the trigger for the monovalent-now recommendation. */
  rapidHepAProtectionNeeded: boolean;
  hepBDecision: HepBDecision;
  /** The patient asks for proof of immunity. Serology is not provided under
   *  this PGD; vaccination may still proceed; refer for serology if needed. */
  serologyRequested: boolean;
}

// ─── Course ───

export type CourseStatus = '' | 'none' | 'one-dose' | 'completed';

/** The dose given today, derived from the course status. A completed course
 *  is a stop: no reinforcing dose is authorised. */
export type DoseNumber = '' | 'first' | 'second';

export const DOSE_NUMBER_LABEL: Record<Exclude<DoseNumber, ''>, string> = {
  first: 'First dose',
  second: 'Second dose (completes the course)',
};

export type FirstDoseApproxInterval = '' | 'under-1' | '1-2' | '2-3' | '3-5' | 'over-5' | 'cannot-say';

/** Upper bound of each reported band, in months, for the window check. */
export const FIRST_DOSE_APPROX_MONTHS: Record<Exclude<FirstDoseApproxInterval, '' | 'cannot-say'>, number> = {
  'under-1': 12,
  '1-2': 24,
  '2-3': 36,
  '3-5': 60,
  'over-5': 72,
};

export const FIRST_DOSE_APPROX_LABEL: Record<Exclude<FirstDoseApproxInterval, ''>, string> = {
  'under-1': '6 to 12 months ago',
  '1-2': '1 to 2 years ago',
  '2-3': '2 to 3 years ago',
  '3-5': '3 to 5 years ago',
  'over-5': 'more than 5 years ago',
  'cannot-say': 'cannot say (the dose is then off-label)',
};

export interface HepatitisACourse {
  courseStatus: CourseStatus;
  firstDoseProduct: FirstDoseProduct;
  firstDoseDateKnown: '' | 'known' | 'not-known';
  firstDoseDate: string;
  firstDoseDateNote: string;
  /** Date not known: the first dose was 6 months or more ago, as reliably
   *  reported by the patient. Stands in for the date (document inclusion
   *  criterion: "the date known or reliably reported"). */
  firstDoseSixMonthsConfirmed: boolean;
  /** Date not known: the approximate interval the patient reports, so the
   *  licensed window of the product given today can still be applied. The
   *  upper bound of the band is used, so a band that straddles the window
   *  counts as outside it. "Cannot say" makes the dose off-label. */
  firstDoseApproxInterval: FirstDoseApproxInterval;
  /** Off-label second dose (outside the licensed window of the product given,
   *  or first-dose product not known): the patient was told it is off-label
   *  and why, and consented on that basis. */
  offLabelConsent: boolean;
}

// ─── Medical history ───

export interface HepatitisAMedicalHistory {
  /** Confirmed anaphylaxis or other severe hypersensitivity to a previous
   *  dose of any hepatitis A-containing vaccine or to any component,
   *  including neomycin. Contact dermatitis to topical neomycin is not a
   *  contraindication. */
  severeHypersensitivity: boolean;
  acuteSevereFebrileIllness: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  breastfeedingDecision: string;
  /** Immunosuppression, including HIV, immunosuppressive treatment and haemodialysis. */
  immunosuppressed: boolean;
  immunosuppressionDetail: string;
  /** Told that serology and further doses may be needed and that the GP or
   *  specialist will be written to. */
  immunosuppressionCounselled: boolean;
  /** Immunosuppressed and the patient refuses GP notification: recorded. */
  gpNotificationRefusedNote: string;
  /** Stable anticoagulation: warfarin with INR testing up to date and the
   *  latest INR below the upper limit of the range, or a DOAC as prescribed.
   *  Intramuscular with a 23 gauge or finer needle and firm pressure. */
  stableAnticoagulation: boolean;
  /** Haemophilia or other bleeding disorder, or thrombocytopenia: deep
   *  subcutaneous, or intramuscular only on a doctor's advice. */
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
  /** Anticoagulation or a bleeding disorder with the intramuscular route: 23
   *  gauge or finer needle, firm pressure without rubbing for at least 2
   *  minutes. */
  bleedingPrecautionsConfirmed: boolean;
  /** Bleeding disorder with the intramuscular route: a doctor familiar with
   *  the patient's bleeding risk has advised the intramuscular route is safe. */
  imAdvisedByDoctor: boolean;
  /** Who advised the intramuscular route. */
  imAdvisedBy: string;
  administrationTime: string;
  adrenalineAvailable: boolean;
  coAdministered: boolean;
  coAdministeredDetails: string;
  /** For a first dose: the date the second dose is due, 6 to 12 months from today. */
  secondDoseDue: string;
  /** Pregnancy with Avaxim or Avaxim Junior: the recorded risk-benefit assessment. */
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
  | 'gp-reinforcing-dose'
  | 'travel-clinic-reinforcing-dose'
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
  'gp-reinforcing-dose': 'Referred to the GP for a reinforcing dose outside this PGD (ongoing risk, 25 years or more since the course)',
  'travel-clinic-reinforcing-dose': 'Referred to a travel clinic for a reinforcing dose outside this PGD (ongoing risk, 25 years or more since the course)',
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
  'gp-reinforcing-dose',
  'travel-clinic-reinforcing-dose',
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
  travelHealthProRecommends: false,
  shortNoticeAdvised: false,
  chronicLiverDisease: false,
  haemophiliaClottingFactors: false,
  injectsDrugs: false,
  msm: false,
  occupationalRisk: false,
  occupationalGroup: '',
  occupationalOhRequest: false,
  occupationalRiskDetail: '',
  postExposure: '',
  hepBAlsoNeeded: '',
  rapidHepAProtectionNeeded: false,
  hepBDecision: '',
  serologyRequested: false,
};

export const initialHepatitisACourse: HepatitisACourse = {
  courseStatus: '',
  firstDoseProduct: '',
  firstDoseDateKnown: '',
  firstDoseDate: '',
  firstDoseDateNote: '',
  firstDoseSixMonthsConfirmed: false,
  firstDoseApproxInterval: '',
  offLabelConsent: false,
};

export const initialHepatitisAMedicalHistory: HepatitisAMedicalHistory = {
  severeHypersensitivity: false,
  acuteSevereFebrileIllness: false,
  pregnant: false,
  breastfeeding: false,
  breastfeedingDecision: '',
  immunosuppressed: false,
  immunosuppressionDetail: '',
  immunosuppressionCounselled: false,
  gpNotificationRefusedNote: '',
  stableAnticoagulation: false,
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
    imAdvisedByDoctor: false,
    imAdvisedBy: '',
    administrationTime: '',
    adrenalineAvailable: false,
    coAdministered: false,
    coAdministeredDetails: '',
    secondDoseDue: '',
    pregnancyRiskBenefitNote: '',
    latexPresentationChecked: false,
  };
}
