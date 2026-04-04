import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../shared/types';

export interface JapaneseEncephalitisScreening {
  destinationCountry: string;
  riskArea: string;
  seasonOfTravel: string;
  outdoorActivities: boolean;
  activitiesDetails: string;
  departureDate: string;
  travelDuration: string;
  continuedRisk: boolean;
  currentIllness: boolean;
  illnessDetails: string;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  severeFebrileIllness: boolean;
  temperature: number | null;
}

export interface JapaneseEncephalitisContraindications {
  severeFebrileIllness: boolean;
  severeAllergy: boolean;
  ageAppropriate: boolean;
}

export interface JapaneseEncephalitisVaccineAdministration {
  vaccineName: string;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  doseNumber: '1st' | '2nd' | 'booster' | '';
  schedule: 'standard' | 'accelerated' | '';
  administeredBy: string;
  timeAdministered: string;
  nextDueDate: string;
}

export interface JapaneseEncephalitisPostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface JapaneseEncephalitisAdvice {
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
  seasonOfTravel: '',
  outdoorActivities: false,
  activitiesDetails: '',
  departureDate: '',
  travelDuration: '',
  continuedRisk: false,
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  severeFebrileIllness: false,
  temperature: null,
});

export const initialJapaneseEncephalitisContraindications = (): JapaneseEncephalitisContraindications => ({
  severeFebrileIllness: false,
  severeAllergy: false,
  ageAppropriate: false,
});

export const initialJapaneseEncephalitisVaccineAdministration = (): JapaneseEncephalitisVaccineAdministration => ({
  vaccineName: 'Ixiaro',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  doseNumber: '',
  schedule: '',
  administeredBy: '',
  timeAdministered: '',
  nextDueDate: '',
});

export const initialJapaneseEncephalitisPostVaccineObs = (): JapaneseEncephalitisPostVaccineObs => ({
  observationPeriod: '',
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialJapaneseEncephalitisAdvice = (): JapaneseEncephalitisAdvice => ({
  twoDozeSchedule: false,
  scheduleExplained: false,
  commonReactions: false,
  seriousReactions: false,
  mosquitoBitePrevention: false,
  duskDawnBiting: false,
  boosterInformation: false,
  returnIfConcerned: false,
});
