import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../shared/types';

export interface DengueScreening {
  destinationCountry: string;
  endemicArea: boolean;
  departureDate: string;
  travelDuration: string;
  previousDengueInfection: boolean;
  dengueInfectionDetails: string;
  currentIllness: boolean;
  illnessDetails: string;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  temperature: number | null;
}

export interface DengueContraindications {
  severeAllergy: boolean;
  immunosuppressed: boolean;
  pregnancy: boolean;
  acuteFebrileIllness: boolean;
  ageAppropriate: boolean;
}

export interface DengueVaccineAdministration {
  vaccineName: string;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  doseNumber: '1st' | '2nd' | '';
  administeredBy: string;
  timeAdministered: string;
  nextDueDate: string;
}

export interface DenguePostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface DengueAdvice {
  twoDozeSchedule: boolean;
  commonReactions: boolean;
  seriousReactions: boolean;
  mosquitoPrevention: boolean;
  dengueSymptomsWarning: boolean;
  noOtherLiveVaccines: boolean;
  returnIfConcerned: boolean;
}

export interface DengueConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  screening: DengueScreening;
  contraindications: DengueContraindications;
  administration: DengueVaccineAdministration;
  postVaccineObs: DenguePostVaccineObs;
  advice: DengueAdvice;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  step: number;
}

export const initialDengueScreening = (): DengueScreening => ({
  destinationCountry: '',
  endemicArea: false,
  departureDate: '',
  travelDuration: '',
  previousDengueInfection: false,
  dengueInfectionDetails: '',
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  temperature: null,
});

export const initialDengueContraindications = (): DengueContraindications => ({
  severeAllergy: false,
  immunosuppressed: false,
  pregnancy: false,
  acuteFebrileIllness: false,
  ageAppropriate: false,
});

export const initialDengueVaccineAdministration = (): DengueVaccineAdministration => ({
  vaccineName: 'Qdenga (TAK-003)',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  doseNumber: '',
  administeredBy: '',
  timeAdministered: '',
  nextDueDate: '',
});

export const initialDenguePostVaccineObs = (): DenguePostVaccineObs => ({
  observationPeriod: '',
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialDengueAdvice = (): DengueAdvice => ({
  twoDozeSchedule: false,
  commonReactions: false,
  seriousReactions: false,
  mosquitoPrevention: false,
  dengueSymptomsWarning: false,
  noOtherLiveVaccines: false,
  returnIfConcerned: false,
});
