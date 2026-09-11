import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../shared/types';

/** Green Book decision framework categories carried by the PGD inclusion and exclusion criteria. */
export type JapaneseEncephalitisRiskCategory =
  | 'recommended-residence'
  | 'recommended-long-stay'
  | 'recommended-frequent-travel'
  | 'recommended-laboratory'
  | 'consider-higher-risk-itinerary'
  | 'consider-uncertain-itinerary'
  | 'not-recommended-urban-short-stay'
  | '';

export interface JapaneseEncephalitisScreening {
  destinationCountry: string;
  riskArea: string;
  riskCategory: JapaneseEncephalitisRiskCategory;
  seasonOfTravel: string;
  outdoorActivities: boolean;
  activitiesDetails: string;
  departureDate: string;
  travelDuration: string;
  sufficientTimeBeforeTravel: boolean;
  /** Late presenter (under 14 days to departure): the course cannot be completed before travel. Replaces the
   *  sufficient-time tick so the record never asserts something the tool knows is false. */
  insufficientTimeAcknowledged: boolean;
  continuedRisk: boolean;
  currentIllness: boolean;
  illnessDetails: string;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  breastfeedingRiskAssessment: string;
  severeFebrileIllness: boolean;
  temperature: number | null;
  /** Confirmed anaphylactic or serious systemic reaction to a previous dose of Ixiaro or any component. */
  anaphylaxisToVaccineOrComponent: boolean;
  /** Hypersensitivity reaction following the first dose (do not give the second dose; refer). */
  hypersensitivityAfterFirstDose: boolean;
  /** Bleeding disorder, thrombocytopenia or anticoagulation: deep subcutaneous route. */
  bleedingDisorder: boolean;
  /** Under 16 only: who gave consent (PGD consent in children block). */
  consentBasis: 'parental' | 'gillick' | '';
  consentGiverDetails: string;
  /** Exclusion outcome: the document requires the reason, the advice given and the decision to be recorded. */
  exclusionAdvice: string;
  exclusionReferral: '' | 'gp' | 'travel-clinic' | 'specialist' | 'urgent' | 'declined';
}

export interface JapaneseEncephalitisContraindications {
  severeFebrileIllness: boolean;
  severeAllergy: boolean;
  hypersensitivityAfterFirstDose: boolean;
  pregnancy: boolean;
  lowRiskItinerary: boolean;
  ageAppropriate: boolean;
}

export interface JapaneseEncephalitisVaccineAdministration {
  vaccineName: string;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  route: 'intramuscular' | 'deep-subcutaneous' | '';
  doseNumber: '1st' | '2nd' | 'booster' | 'second-booster' | '';
  schedule: 'standard' | 'accelerated' | '';
  /** Required when the rapid (day 0, day 7) schedule is used outside adults aged 18 to 64. */
  offLabelRapidConsent: boolean;
  administeredBy: string;
  timeAdministered: string;
  /** Computed from the schedule and dose number ("" when no further dose is scheduled). */
  nextDueDate: string;
  /** Adrenaline 1:1000 and a written anaphylaxis protocol confirmed BEFORE the vaccine is given. */
  anaphylaxisKitChecked: boolean;
}

export interface JapaneseEncephalitisPostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  observationCompleted: boolean;
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface JapaneseEncephalitisAdvice {
  leafletGiven: boolean;
  twoDozeSchedule: boolean;
  scheduleExplained: boolean;
  commonReactions: boolean;
  seriousReactions: boolean;
  mosquitoBitePrevention: boolean;
  duskDawnBiting: boolean;
  boosterInformation: boolean;
  returnIfConcerned: boolean;
}

export interface JapaneseEncephalitisConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  screening: JapaneseEncephalitisScreening;
  contraindications: JapaneseEncephalitisContraindications;
  administration: JapaneseEncephalitisVaccineAdministration;
  postVaccineObs: JapaneseEncephalitisPostVaccineObs;
  advice: JapaneseEncephalitisAdvice;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  step: number;
}

export const initialJapaneseEncephalitisScreening = (): JapaneseEncephalitisScreening => ({
  destinationCountry: '',
  riskArea: '',
  riskCategory: '',
  seasonOfTravel: '',
  outdoorActivities: false,
  activitiesDetails: '',
  departureDate: '',
  travelDuration: '',
  sufficientTimeBeforeTravel: false,
  insufficientTimeAcknowledged: false,
  continuedRisk: false,
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  breastfeedingRiskAssessment: '',
  severeFebrileIllness: false,
  temperature: null,
  anaphylaxisToVaccineOrComponent: false,
  hypersensitivityAfterFirstDose: false,
  bleedingDisorder: false,
  consentBasis: '',
  consentGiverDetails: '',
  exclusionAdvice: '',
  exclusionReferral: '',
});

export const initialJapaneseEncephalitisContraindications = (): JapaneseEncephalitisContraindications => ({
  severeFebrileIllness: false,
  severeAllergy: false,
  hypersensitivityAfterFirstDose: false,
  pregnancy: false,
  lowRiskItinerary: false,
  ageAppropriate: false,
});

export const initialJapaneseEncephalitisVaccineAdministration = (): JapaneseEncephalitisVaccineAdministration => ({
  vaccineName: 'Ixiaro (Valneva) suspension for injection, pre-filled syringe',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  route: '',
  doseNumber: '',
  schedule: '',
  offLabelRapidConsent: false,
  administeredBy: '',
  timeAdministered: '',
  nextDueDate: '',
  anaphylaxisKitChecked: false,
});

export const initialJapaneseEncephalitisPostVaccineObs = (): JapaneseEncephalitisPostVaccineObs => ({
  observationPeriod: '',
  observationCompleted: false,
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialJapaneseEncephalitisAdvice = (): JapaneseEncephalitisAdvice => ({
  leafletGiven: false,
  twoDozeSchedule: false,
  scheduleExplained: false,
  commonReactions: false,
  seriousReactions: false,
  mosquitoBitePrevention: false,
  duskDawnBiting: false,
  boosterInformation: false,
  returnIfConcerned: false,
});
