import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../shared/types';

export interface RabiesScreening {
  destinationCountry: string;
  highRiskActivities: string[];
  otherActivities: string;
  departureDate: string;
  accessToPEP: boolean;
  pepAccessDetails: string;
  currentIllness: boolean;
  illnessDetails: string;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  eggAllergy: boolean;
  eggAllergySeverity: string;
  temperature: number | null;
}

export interface RabiesContraindications {
  anaphylaxisHistory: boolean;
  severeEggAllergy: boolean;
  acuteFebrileIllness: boolean;
  ageAppropriate: boolean;
}

export interface RabiesVaccineAdministration {
  vaccineName: string;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  doseNumber: '1st' | '2nd' | '3rd' | '';
  schedule: 'standard' | 'accelerated' | '';
  administeredBy: string;
  timeAdministered: string;
  nextDueDates: string;
}

export interface RabiesPostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface RabiesAdvice {
  threeDozeSchedule: boolean;
  scheduleExplained: boolean;
  pEPSimplification: boolean;
  woundCleaning: boolean;
  stillNeedPEP: boolean;
  exposureWarning: boolean;
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
  destinationCountry: '',
  highRiskActivities: [],
  otherActivities: '',
  departureDate: '',
  accessToPEP: false,
  pepAccessDetails: '',
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  eggAllergy: false,
  eggAllergySeverity: '',
  temperature: null,
});

export const initialRabiesContraindications = (): RabiesContraindications => ({
  anaphylaxisHistory: false,
  severeEggAllergy: false,
  acuteFebrileIllness: false,
  ageAppropriate: false,
});

export const initialRabiesVaccineAdministration = (): RabiesVaccineAdministration => ({
  vaccineName: 'Rabies vaccine (Rabipur or RabAvert)',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  doseNumber: '',
  schedule: '',
  administeredBy: '',
  timeAdministered: '',
  nextDueDates: '',
});

export const initialRabiesPostVaccineObs = (): RabiesPostVaccineObs => ({
  observationPeriod: '',
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialRabiesAdvice = (): RabiesAdvice => ({
  threeDozeSchedule: false,
  scheduleExplained: false,
  pEPSimplification: false,
  woundCleaning: false,
  stillNeedPEP: false,
  exposureWarning: false,
  returnIfConcerned: false,
  boosterInformation: false,
});
