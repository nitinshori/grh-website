import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../../shared/types';

// Aligned to the seasonal influenza vaccines PGD (IIVc, aIIV, IIVr, IIVe), 2026/27 season,
// version 004, issued 11 September 2026.

export const FLU_SEASON = '2026/27';

export type EggAllergySeverity = 'none' | 'mild' | 'severe' | '';

/** Vaccine types covered by PGD v004. */
export type FluVaccineType = '' | 'iivc' | 'aiiv' | 'iivr' | 'iive';

export const FLU_VACCINES: Record<
  Exclude<FluVaccineType, ''>,
  { label: string; minAge: number; maxAge: number | null; eggFree: boolean; notes: string }
> = {
  iivc: {
    label: 'Cell-based Trivalent Influenza Vaccine Seqirus (IIVc), egg-free',
    minAge: 2,
    maxAge: null,
    eggFree: true,
    notes:
      'Egg-free, no ovalbumin. The only vaccine in this PGD that may be given under 18 years. Licensed from 6 months, restricted to 2 years and over under this PGD.',
  },
  aiiv: {
    label: 'Adjuvanted Trivalent Influenza Vaccine Seqirus (aIIV), egg-cultured',
    minAge: 50,
    maxAge: null,
    eggFree: false,
    notes:
      'Preferred for older adults. Egg-cultured, ovalbumin at or below 1 microgram per 0.5 ml dose. Not suitable where egg allergy requires an egg-free vaccine.',
  },
  iivr: {
    label: 'Supemtek TIVr (IIVr), recombinant, egg-free',
    minAge: 18,
    maxAge: null,
    eggFree: true,
    notes: 'Egg-free, contains no ovalbumin. Suitable for adults with egg allergy.',
  },
  iive: {
    label: 'Egg-cultured inactivated vaccine (IIVe), e.g. Vaxigrip or Influenza vaccine TIV MYL',
    minAge: 18,
    maxAge: 64,
    eggFree: false,
    notes:
      'Egg-cultured, ovalbumin at or below 0.05 micrograms (Vaxigrip) or 0.1 micrograms (TIV MYL) per 0.5 ml dose. Licensed from 6 months, restricted to 18 to 64 years under this PGD.',
  },
};

export interface FluScreening {
  previousFluVaccine: boolean;
  previousReaction: boolean;
  /** Confirmed anaphylaxis to a previous dose of any influenza vaccine is an exclusion; any other reaction is a caution. */
  previousReactionType: '' | 'anaphylaxis' | 'other';
  reactionDetails: string;
  /** Exclusion: already received an influenza vaccine for the 2026/27 season (other than a child under 9 attending for dose 2). */
  receivedThisSeason: boolean;
  /**
   * Child under 9: the only previous influenza vaccine was dose 1 of this
   * season's two-dose first course. Asked separately from "ever had a flu
   * vaccine" so that dose 2 can be recorded truthfully (adversarial review,
   * 11 Sep 2026). Dose number and the dose 1 date are derived from it.
   */
  firstDoseThisSeason: boolean;
  firstDoseThisSeasonDate: string;
  /** Exclusion: known hypersensitivity to the active substances or any excipient or residue in the SPC. */
  hypersensitivityToComponent: boolean;
  eggAllergy: boolean;
  eggAllergySeverity: EggAllergySeverity;
  currentIllness: boolean;
  illnessDetails: string;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  aspirinTherapy: boolean;
  bleedingDisorder: boolean;
  /** Bleeding disorder: intramuscular injection assessed as safe by a clinician familiar with the bleeding risk. */
  bleedingDisorderAssessedSafe: boolean;
  /** Caution: stable anticoagulation (23 gauge or finer needle, firm pressure 2 minutes). */
  anticoagulated: boolean;
  previousGBS: boolean;
  temperature: number | null;
  /** PGD v004 inclusion: NHS entitlement. */
  nhsStatus: '' | 'not-eligible' | 'eligible-prefers-private';
}

export interface FluContraindications {
  anaphylaxisToPreviousDose: boolean;
  /** Egg allergy: an egg-free vaccine (IIVc or IIVr) must be used. Not a stop in itself. */
  severeEggAllergy: boolean;
  acuteFebrileIllness: boolean;
  ageAppropriate: boolean;
  hypersensitivityToComponent: boolean;
  alreadyVaccinatedThisSeason: boolean;
  bleedingDisorderUnassessed: boolean;
}

/** PGD v004 consent block: under 16, who consented. */
export interface FluChildConsent {
  basis: '' | 'parental' | 'gillick';
  parentName: string;
  parentRelationship: string;
  gillickBasis: string;
}

export interface FluVaccineAdministration {
  /** Vaccine type given (IIVc, aIIV, IIVr or IIVe). */
  vaccineName: FluVaccineType;
  /** Brand name as on the pack (PGD v004 records row: name and brand, and the vaccine type). */
  brandName: string;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  route: 'intramuscular' | '';
  doseVolume: string;
  administeredBy: string;
  timeAdministered: string;
  /** Child under 9 receiving influenza vaccine for the first time: dose 1 or 2 of 2. */
  doseNumber: '' | '1' | '2';
  previousDoseDate: string;
  nextDoseDue: string;
  /** Adrenaline 1 in 1,000 and a telephone immediately available (PGD v004 caution). */
  adrenalineAvailable: boolean;
  /** Other vaccine given at the same visit and its site. */
  coAdministeredVaccine: string;
}

export interface FluPostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface FluAdvice {
  commonReactions: boolean;
  seriousReactions: boolean;
  paracetamolAdvice: boolean;
  returnIfConcerned: boolean;
  annualRevaccination: boolean;
  /** Vaccine cannot cause influenza, does not protect against other respiratory infections, not 100% protection. */
  cannotCauseFlu: boolean;
  /** PIL and written record of the vaccine given (date, brand, type, batch) offered. */
  pilAndRecordGiven: boolean;
  /** Child under 9, dose 1 of 2: written confirmation of the date the second dose is due. */
  secondDoseDateGiven: boolean;
}

export interface FluConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  childConsent: FluChildConsent;
  screening: FluScreening;
  contraindications: FluContraindications;
  administration: FluVaccineAdministration;
  postVaccineObs: FluPostVaccineObs;
  advice: FluAdvice;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  step: number;
}

export const initialFluScreening = (): FluScreening => ({
  previousFluVaccine: false,
  previousReaction: false,
  previousReactionType: '',
  reactionDetails: '',
  receivedThisSeason: false,
  firstDoseThisSeason: false,
  firstDoseThisSeasonDate: '',
  hypersensitivityToComponent: false,
  eggAllergy: false,
  eggAllergySeverity: '',
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  aspirinTherapy: false,
  bleedingDisorder: false,
  bleedingDisorderAssessedSafe: false,
  anticoagulated: false,
  previousGBS: false,
  temperature: null,
  nhsStatus: '',
});

export const initialFluContraindications = (): FluContraindications => ({
  anaphylaxisToPreviousDose: false,
  severeEggAllergy: false,
  acuteFebrileIllness: false,
  ageAppropriate: false,
  hypersensitivityToComponent: false,
  alreadyVaccinatedThisSeason: false,
  bleedingDisorderUnassessed: false,
});

export const initialFluChildConsent = (): FluChildConsent => ({
  basis: '',
  parentName: '',
  parentRelationship: '',
  gillickBasis: '',
});

export const initialFluVaccineAdministration = (): FluVaccineAdministration => ({
  vaccineName: '',
  brandName: '',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  route: 'intramuscular',
  doseVolume: '0.5 ml',
  administeredBy: '',
  timeAdministered: '',
  doseNumber: '',
  previousDoseDate: '',
  nextDoseDue: '',
  adrenalineAvailable: false,
  coAdministeredVaccine: '',
});

export const initialFluPostVaccineObs = (): FluPostVaccineObs => ({
  observationPeriod: '',
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialFluAdvice = (): FluAdvice => ({
  commonReactions: false,
  seriousReactions: false,
  paracetamolAdvice: false,
  returnIfConcerned: false,
  annualRevaccination: false,
  cannotCauseFlu: false,
  pilAndRecordGiven: false,
  secondDoseDateGiven: false,
});
