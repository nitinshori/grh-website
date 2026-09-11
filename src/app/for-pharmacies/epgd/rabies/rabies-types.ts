import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../shared/types';

/** Indication categories carried by the PGD inclusion criteria. */
export type RabiesIndication =
  | 'travel-enzootic-area'
  | 'occupational-abroad'
  | 'occupational-uk'
  | '';

export interface RabiesScreening {
  indication: RabiesIndication;
  destinationCountry: string;
  highRiskActivities: string[];
  otherActivities: string;
  departureDate: string;
  sufficientTimeBeforeTravel: boolean;
  /** Any actual or possible exposure that has already occurred: post-exposure, same-day referral. */
  priorExposure: boolean;
  accessToPEP: boolean;
  pepAccessDetails: string;
  currentIllness: boolean;
  illnessDetails: string;
  /** Acutely unwell with fever or systemic upset (postpone). Minor illness without fever is not a reason to defer. */
  acuteFebrileIllness: boolean;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  pregnancyRiskAssessment: string;
  breastfeeding: boolean;
  breastfeedingRiskAssessment: string;
  /** Confirmed anaphylactic reaction to a previous dose of rabies vaccine or to any component. */
  anaphylaxisToVaccineOrComponent: boolean;
  eggAllergy: boolean;
  eggAllergySeverity: string;
  /** Hypersensitivity to polymyxin B, streptomycin or neomycin, or any antibiotic of the same class (Verorab). */
  antibioticHypersensitivity: boolean;
  /** Bleeding disorder, thrombocytopenia or anticoagulation: deep subcutaneous route. */
  bleedingDisorder: boolean;
  temperature: number | null;
  /** Under 16 only: who gave consent (PGD consent in children block). */
  consentBasis: 'parental' | 'gillick' | '';
  consentGiverDetails: string;
}

export interface RabiesContraindications {
  priorExposure: boolean;
  anaphylaxisHistory: boolean;
  /** Rabipur is excluded; Verorab may be a suitable alternative. */
  severeEggAllergy: boolean;
  /** Verorab is excluded; Rabipur may be used. */
  antibioticHypersensitivity: boolean;
  acuteFebrileIllness: boolean;
  ageAppropriate: boolean;
}

export interface RabiesVaccineAdministration {
  vaccineName: string;
  product: 'rabipur' | 'verorab' | '';
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  route: 'intramuscular' | 'deep-subcutaneous' | '';
  doseNumber: '1st' | '2nd' | '3rd' | 'one-year-dose' | 'booster' | '';
  schedule: 'standard' | 'accelerated' | '';
  /** Where accelerated: the reason the conventional course was not possible. */
  scheduleReason: string;
  /** Where accelerated: consent to off-label use recorded, naming the schedule. */
  offLabelConsent: boolean;
  administeredBy: string;
  timeAdministered: string;
  nextDueDates: string;
}

export interface RabiesPostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  observationCompleted: boolean;
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface RabiesAdvice {
  writtenRecordGiven: boolean;
  threeDozeSchedule: boolean;
  scheduleExplained: boolean;
  pEPSimplification: boolean;
  woundCleaning: boolean;
  stillNeedPEP: boolean;
  exposureWarning: boolean;
  avoidAnimals: boolean;
  returnIfConcerned: boolean;
  boosterInformation: boolean;
}

export interface RabiesConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  screening: RabiesScreening;
  contraindications: RabiesContraindications;
  administration: RabiesVaccineAdministration;
  postVaccineObs: RabiesPostVaccineObs;
  advice: RabiesAdvice;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  step: number;
}

export const initialRabiesScreening = (): RabiesScreening => ({
  indication: '',
  destinationCountry: '',
  highRiskActivities: [],
  otherActivities: '',
  departureDate: '',
  sufficientTimeBeforeTravel: false,
  priorExposure: false,
  accessToPEP: false,
  pepAccessDetails: '',
  currentIllness: false,
  illnessDetails: '',
  acuteFebrileIllness: false,
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  pregnancyRiskAssessment: '',
  breastfeeding: false,
  breastfeedingRiskAssessment: '',
  anaphylaxisToVaccineOrComponent: false,
  eggAllergy: false,
  eggAllergySeverity: '',
  antibioticHypersensitivity: false,
  bleedingDisorder: false,
  temperature: null,
  consentBasis: '',
  consentGiverDetails: '',
});

export const initialRabiesContraindications = (): RabiesContraindications => ({
  priorExposure: false,
  anaphylaxisHistory: false,
  severeEggAllergy: false,
  antibioticHypersensitivity: false,
  acuteFebrileIllness: false,
  ageAppropriate: false,
});

export const initialRabiesVaccineAdministration = (): RabiesVaccineAdministration => ({
  vaccineName: 'Rabies vaccine (Rabipur or Verorab), intramuscular',
  product: '',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  route: '',
  doseNumber: '',
  schedule: '',
  scheduleReason: '',
  offLabelConsent: false,
  administeredBy: '',
  timeAdministered: '',
  nextDueDates: '',
});

export const initialRabiesPostVaccineObs = (): RabiesPostVaccineObs => ({
  observationPeriod: '',
  observationCompleted: false,
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialRabiesAdvice = (): RabiesAdvice => ({
  writtenRecordGiven: false,
  threeDozeSchedule: false,
  scheduleExplained: false,
  pEPSimplification: false,
  woundCleaning: false,
  stillNeedPEP: false,
  exposureWarning: false,
  avoidAnimals: false,
  returnIfConcerned: false,
  boosterInformation: false,
});
