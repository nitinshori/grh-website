import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../shared/types';

export interface DengueScreening {
  destinationCountry: string;
  endemicArea: boolean; // PGD v005 inclusion: travel to or residence in a dengue-endemic area
  departureDate: string;
  travelDuration: string;
  /** PGD v005 inclusion: willing to receive two doses, 3 months apart. */
  willingTwoDoses: boolean;
  previousDengueInfection: boolean;
  dengueInfectionDetails: string;
  currentIllness: boolean; // PGD v005 exclusion: acute fever or significant intercurrent illness
  illnessDetails: string;
  immunosuppressed: boolean; // PGD v005 exclusion: any congenital or acquired immune deficiency
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  temperature: number | null;
  /** PGD v005 exclusion: known hypersensitivity to any component of the vaccine. */
  vaccineComponentAllergy: boolean;
  /** PGD v005 exclusion: another live vaccine planned within 4 weeks before or after Qdenga. */
  liveVaccineWithin4Weeks: boolean;
  /** PGD v005 exclusion: history of Guillain-Barre syndrome following prior dengue vaccination. */
  gbsAfterDengueVaccine: boolean;
  /** PGD v005 caution: anticoagulant therapy, assess bleeding risk. */
  anticoagulantTherapy: boolean;
}

export interface DengueContraindications {
  severeAllergy: boolean;
  immunosuppressed: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  acuteFebrileIllness: boolean;
  liveVaccineInterval: boolean;
  gbsHistory: boolean;
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
  /** PGD v005: record that the seated observation period was completed. */
  observationCompleted: boolean;
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
  /** PGD v005: avoid pregnancy for at least 4 weeks after each dose. */
  avoidPregnancy4Weeks: boolean;
  /** PGD v005: keep a record of vaccination dates and bring documentation when travelling. */
  keepVaccinationRecord: boolean;
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
  willingTwoDoses: false,
  previousDengueInfection: false,
  dengueInfectionDetails: '',
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  temperature: null,
  vaccineComponentAllergy: false,
  liveVaccineWithin4Weeks: false,
  gbsAfterDengueVaccine: false,
  anticoagulantTherapy: false,
});

export const initialDengueContraindications = (): DengueContraindications => ({
  severeAllergy: false,
  immunosuppressed: false,
  pregnancy: false,
  breastfeeding: false,
  acuteFebrileIllness: false,
  liveVaccineInterval: false,
  gbsHistory: false,
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
  observationCompleted: false,
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
  avoidPregnancy4Weeks: false,
  keepVaccinationRecord: false,
});
